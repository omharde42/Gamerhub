'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneOff, PhoneCall, Video, VideoOff, Mic, MicOff,
  Volume2, VolumeX, Camera, RefreshCw, Loader2, Shield
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getInitials, getMediaUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CallModalProps {
  socket: any;
  user: any;
  callState: {
    active: boolean;
    mode: 'incoming' | 'outgoing' | 'connected';
    type: 'audio' | 'video';
    toUser?: any;
    fromUser?: any;
    chatId?: string;
  } | null;
  onEndCall: () => void;
  onAcceptCall: () => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
};

export function CallModal({ socket, user, callState, onEndCall, onAcceptCall }: CallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<string>('Initializing...');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);

  const targetUser = callState?.mode === 'incoming' ? callState.fromUser : callState?.toUser;

  const ringtoneIntervalRef = useRef<any>(null);

  const startRingtone = () => {
    stopRingtone();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playBeep = () => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 tone
          osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.3); // E5 tone
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.8);
        } catch {}
      };
      playBeep();
      ringtoneIntervalRef.current = setInterval(playBeep, 2400);
    } catch {}
  };

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  };

  // Initialize WebRTC Media, Ringtone & Socket Listeners
  useEffect(() => {
    if (!callState || !callState.active) {
      stopRingtone();
      cleanUpCall();
      return;
    }

    if (callState.mode === 'incoming' || callState.mode === 'outgoing') {
      startRingtone();
    } else if (callState.mode === 'connected') {
      stopRingtone();
      startTimer();
    }

    return () => {
      stopRingtone();
      stopTimer();
    };
  }, [callState?.active, callState?.mode]);

  const startTimer = () => {
    stopTimer();
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Socket signaling events listener
  useEffect(() => {
    if (!socket || !callState?.active) return;

    const handleOffer = async (data: { fromUserId: string; sdp: any }) => {
      try {
        if (!peerConnectionRef.current && targetUser?.id) {
          await createPeerConnection(targetUser.id);
        }
        const pc = peerConnectionRef.current;
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('call:answer', { toUserId: data.fromUserId, chatId: callState.chatId, sdp: answer });
          setConnectionStatus('Connected');
        }
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    };

    const handleAnswer = async (data: { fromUserId: string; sdp: any }) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          setConnectionStatus('Connected');
        }
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    };

    const handleIceCandidate = async (data: { fromUserId: string; candidate: any }) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc && data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    };

    const handleIceRestart = async (data: { fromUserId: string; sdp: any }) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('call:answer', { toUserId: data.fromUserId, chatId: callState.chatId, sdp: answer });
        }
      } catch (err) {
        console.error('Error handling ICE restart:', err);
      }
    };

    socket.on('call:offer', handleOffer);
    socket.on('call:answer', handleAnswer);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:ice-restart', handleIceRestart);

    return () => {
      socket.off('call:offer', handleOffer);
      socket.off('call:answer', handleAnswer);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:ice-restart', handleIceRestart);
    };
  }, [socket, callState, targetUser]);

  const getMediaStream = async (type: 'audio' | 'video', facing: 'user' | 'environment' = 'user') => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: type === 'video' ? { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      toast.error('Microphone or Camera access denied. Please grant permissions.');
      throw err;
    }
  };

  const createPeerConnection = async (targetUserId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('call:ice-candidate', {
          toUserId: targetUserId,
          chatId: callState?.chatId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = async () => {
      setConnectionStatus(pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setConnectionStatus('Reconnecting...');
        try {
          const offer = await pc.createOffer({ iceRestart: true });
          await pc.setLocalDescription(offer);
          socket.emit('call:ice-restart', { toUserId: targetUserId, chatId: callState?.chatId, sdp: offer });
        } catch (err) {
          console.warn('ICE restart attempt failed:', err);
        }
      }
    };

    return pc;
  };

  const handleAcceptCall = async () => {
    if (!callState || !targetUser) return;
    try {
      setConnectionStatus('Connecting...');
      const stream = await getMediaStream(callState.type, facingMode);
      const pc = await createPeerConnection(targetUser.id);

      socket.emit('call:accept', {
        toUserId: targetUser.id,
        chatId: callState.chatId,
        type: callState.type,
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('call:offer', { toUserId: targetUser.id, chatId: callState.chatId, sdp: offer });
      onAcceptCall();
    } catch (err) {
      handleEndCall();
    }
  };

  const handleRejectCall = () => {
    if (callState && targetUser) {
      socket.emit('call:reject', {
        toUserId: targetUser.id,
        chatId: callState.chatId,
        reason: 'Call rejected',
      });
    }
    handleEndCall();
  };

  const handleEndCall = () => {
    if (callState && targetUser) {
      socket.emit('call:end', { toUserId: targetUser.id, chatId: callState.chatId });
    }
    cleanUpCall();
    onEndCall();
  };

  const cleanUpCall = () => {
    stopTimer();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !isSpeakerMuted;
      setIsSpeakerMuted(!isSpeakerMuted);
    }
  };

  const handleSwitchCamera = async () => {
    if (callState?.type !== 'video') return;
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);

    try {
      const stream = await getMediaStream('video', newFacing);
      const newVideoTrack = stream.getVideoTracks()[0];

      if (peerConnectionRef.current && newVideoTrack) {
        const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(newVideoTrack);
        }
      }
      toast.success(`Switched to ${newFacing === 'user' ? 'front' : 'back'} camera`);
    } catch {
      toast.error('Failed to switch camera');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!callState || !callState.active) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-lg select-none p-4">
        <motion.div
          className="relative w-full max-w-lg bg-card/90 border border-border/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-between p-6 min-h-[480px]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          {/* Header info */}
          <div className="w-full flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                WebRTC {callState.type === 'video' ? 'Video' : 'Voice'} Call
              </span>
            </div>
            {callState.mode === 'connected' && (
              <span className="text-xs font-mono font-bold bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/30">
                {formatDuration(callDuration)}
              </span>
            )}
          </div>

          {/* Video Streams Container */}
          {callState.type === 'video' && callState.mode === 'connected' ? (
            <div className="relative w-full h-[320px] rounded-2xl overflow-hidden bg-black border border-border/40 my-4 flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 right-3 w-28 h-36 rounded-xl overflow-hidden border-2 border-primary shadow-xl bg-black">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            /* Voice / Incoming / Outgoing Avatar Display */
            <div className="flex flex-col items-center justify-center my-8 text-center space-y-4">
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/20"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Avatar className="h-28 w-28 border-4 border-primary/40 shadow-2xl relative">
                  <AvatarImage src={getMediaUrl(targetUser?.profile?.avatar)} />
                  <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                    {getInitials(targetUser?.profile?.username || 'U')}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {targetUser?.profile?.displayName || targetUser?.profile?.username || 'Gamer'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {callState.mode === 'incoming' && 'Wants to start a call with you'}
                  {callState.mode === 'outgoing' && 'Calling...'}
                  {callState.mode === 'connected' && `Call in progress • ${connectionStatus}`}
                </p>
              </div>
            </div>
          )}

          {/* Hidden audio element for remote audio stream */}
          <audio ref={remoteVideoRef as any} autoPlay />

          {/* Controls Footer */}
          <div className="w-full flex items-center justify-center gap-4 pt-4 border-t border-border/40 z-20">
            {callState.mode === 'incoming' ? (
              /* Request Screen Controls: Accept vs Reject */
              <div className="flex items-center gap-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAcceptCall}
                  className="h-14 w-14 rounded-full bg-success text-white flex items-center justify-center shadow-lg shadow-success/30 font-bold"
                  title="Accept Call"
                >
                  <PhoneCall className="h-6 w-6" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRejectCall}
                  className="h-14 w-14 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg shadow-destructive/30 font-bold"
                  title="Reject Call"
                >
                  <PhoneOff className="h-6 w-6" />
                </motion.button>
              </div>
            ) : (
              /* In-Call Controls */
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-11 w-11 rounded-2xl ${isMuted ? 'bg-destructive/20 border-destructive text-destructive' : ''}`}
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                {callState.type === 'video' && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className={`h-11 w-11 rounded-2xl ${isCameraOff ? 'bg-destructive/20 border-destructive text-destructive' : ''}`}
                      onClick={toggleCamera}
                      title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
                    >
                      {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 rounded-2xl"
                      onClick={handleSwitchCamera}
                      title="Switch Camera"
                    >
                      <Camera className="h-5 w-5" />
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="icon"
                  className={`h-11 w-11 rounded-2xl ${isSpeakerMuted ? 'bg-destructive/20 border-destructive text-destructive' : ''}`}
                  onClick={toggleSpeaker}
                  title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
                >
                  {isSpeakerMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>

                <Button
                  variant="destructive"
                  size="icon"
                  className="h-12 w-12 rounded-2xl font-bold shadow-lg shadow-destructive/30"
                  onClick={handleEndCall}
                  title="End Call"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
