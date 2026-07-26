'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export interface CallState {
  isActive: boolean;
  isIncoming: boolean;
  isVideo: boolean;
  targetUserId: string | null;
  targetUsername: string | null;
  chatId: string | null;
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  isAudioMuted: boolean;
  isVideoMuted: boolean;
}

export function useWebRTC() {
  const socket = useSocket();
  const { user } = useAuthStore();

  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    isIncoming: false,
    isVideo: false,
    targetUserId: null,
    targetUsername: null,
    chatId: null,
    status: 'idle',
    isAudioMuted: false,
    isVideoMuted: false,
  });

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

  // Cleanup helper
  const endCall = useCallback((notifyPeer = true) => {
    if (notifyPeer && socket && callState.targetUserId) {
      socket.emit('call:end', { targetUserId: callState.targetUserId });
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    setRemoteStream(null);
    pendingCandidates.current = [];

    setCallState({
      isActive: false,
      isIncoming: false,
      isVideo: false,
      targetUserId: null,
      targetUsername: null,
      chatId: null,
      status: 'idle',
      isAudioMuted: false,
      isVideoMuted: false,
    });
  }, [socket, callState.targetUserId, localStream]);

  // Create PeerConnection instance
  const createPeerConnection = useCallback((targetUserId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:ice-candidate', {
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        const stream = new MediaStream([event.track]);
        setRemoteStream(stream);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState((prev) => ({ ...prev, status: 'connected' }));
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed' || pc.connectionState === 'disconnected') {
        endCall(false);
      }
    };

    return pc;
  }, [socket, endCall]);

  // Start Call (Outgoing)
  const startCall = async (targetUserId: string, targetUsername: string, chatId: string, isVideo: boolean) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      setCallState({
        isActive: true,
        isIncoming: false,
        isVideo,
        targetUserId,
        targetUsername,
        chatId,
        status: 'calling',
        isAudioMuted: false,
        isVideoMuted: false,
      });

      const pc = createPeerConnection(targetUserId);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socket) {
        socket.emit('call:offer', {
          targetUserId,
          callerUsername: user?.profile?.username || 'Gamer',
          offer,
          isVideo,
          chatId,
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not access camera/microphone');
      endCall(false);
    }
  };

  // Answer Incoming Call
  const answerCall = async () => {
    if (!callState.targetUserId) return;

    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callState.isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      const pc = createPeerConnection(callState.targetUserId);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Flush pending ICE candidates
      if (pendingCandidates.current.length > 0) {
        for (const candidate of pendingCandidates.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidates.current = [];
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (socket) {
        socket.emit('call:answer', {
          targetUserId: callState.targetUserId,
          answer,
        });
      }

      setCallState((prev) => ({ ...prev, status: 'connected', isIncoming: false }));
    } catch (err: any) {
      toast.error(err.message || 'Could not access media devices');
      endCall(true);
    }
  };

  // Reject Call
  const rejectCall = () => {
    endCall(true);
  };

  // Toggle Audio Mute
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState((prev) => ({ ...prev, isAudioMuted: !audioTrack.enabled }));
      }
    }
  };

  // Toggle Video Mute
  const toggleVideo = () => {
    if (localStream && callState.isVideo) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState((prev) => ({ ...prev, isVideoMuted: !videoTrack.enabled }));
      }
    }
  };

  // Socket Event Listeners for Call Signaling
  useEffect(() => {
    if (!socket) return;

    const handleIncomingOffer = async (data: { callerId: string; callerUsername: string; offer: RTCSessionDescriptionInit; isVideo: boolean; chatId: string }) => {
      setCallState({
        isActive: true,
        isIncoming: true,
        isVideo: data.isVideo,
        targetUserId: data.callerId,
        targetUsername: data.callerUsername,
        chatId: data.chatId,
        status: 'ringing',
        isAudioMuted: false,
        isVideoMuted: false,
      });

      const pc = pcRef.current || new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    };

    const handleCallAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        setCallState((prev) => ({ ...prev, status: 'connected' }));
      }
    };

    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      if (pcRef.current && pcRef.current.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.warn('Error adding ICE candidate:', err);
        }
      } else {
        pendingCandidates.current.push(data.candidate);
      }
    };

    const handleCallEnd = () => {
      toast('Call ended', { icon: '📞' });
      endCall(false);
    };

    socket.on('call:offer', handleIncomingOffer);
    socket.on('call:answer', handleCallAnswer);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:end', handleCallEnd);

    return () => {
      socket.off('call:offer', handleIncomingOffer);
      socket.off('call:answer', handleCallAnswer);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:end', handleCallEnd);
    };
  }, [socket, endCall]);

  return {
    callState,
    localStream,
    remoteStream,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
  };
}
