'use client';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CallState } from '@/hooks/useWebRTC';
import { getInitials } from '@/lib/utils';

interface CallModalProps {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onAnswer: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
}

export function CallModal({
  callState,
  localStream,
  remoteStream,
  onAnswer,
  onReject,
  onEnd,
  onToggleAudio,
  onToggleVideo,
}: CallModalProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!callState.isActive) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-2xl bg-card border border-border/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center p-6 space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-1">
            <h3 className="text-xl font-bold">
              {callState.isVideo ? 'Video Call' : 'Voice Call'}
            </h3>
            <p className="text-sm text-muted-foreground capitalize">
              {callState.status === 'calling' && 'Calling...'}
              {callState.status === 'ringing' && 'Incoming Call...'}
              {callState.status === 'connected' && 'Connected'}
            </p>
          </div>

          {/* Media Viewport */}
          <div className="relative w-full aspect-video bg-muted/40 rounded-xl overflow-hidden flex items-center justify-center border border-border/50">
            {callState.isVideo ? (
              <>
                {/* Remote Video Stream */}
                {remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-20 w-20 border-2 border-primary animate-pulse">
                      <AvatarFallback className="text-xl">
                        {getInitials(callState.targetUsername || 'G')}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-muted-foreground">{callState.targetUsername}</p>
                  </div>
                )}

                {/* Local Video Picture-in-Picture */}
                {localStream && (
                  <div className="absolute bottom-3 right-3 w-32 aspect-video bg-black/60 rounded-lg overflow-hidden border border-white/20 shadow-md">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </>
            ) : (
              /* Voice Call Avatar View */
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24 border-4 border-primary/40 animate-pulse">
                  <AvatarFallback className="text-2xl font-bold">
                    {getInitials(callState.targetUsername || 'G')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-semibold text-lg">{callState.targetUsername}</p>
                  <p className="text-xs text-muted-foreground animate-pulse">
                    {callState.status === 'connected' ? 'Audio Stream Active' : 'Connecting...'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-4">
            {callState.isIncoming && callState.status === 'ringing' ? (
              <>
                <Button
                  onClick={onAnswer}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-14 w-14 p-0 shadow-lg"
                >
                  <Phone className="h-6 w-6" />
                </Button>
                <Button
                  onClick={onReject}
                  size="lg"
                  variant="destructive"
                  className="rounded-full h-14 w-14 p-0 shadow-lg"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={onToggleAudio}
                  variant={callState.isAudioMuted ? 'destructive' : 'outline'}
                  size="lg"
                  className="rounded-full h-12 w-12 p-0"
                >
                  {callState.isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                {callState.isVideo && (
                  <Button
                    onClick={onToggleVideo}
                    variant={callState.isVideoMuted ? 'destructive' : 'outline'}
                    size="lg"
                    className="rounded-full h-12 w-12 p-0"
                  >
                    {callState.isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </Button>
                )}

                <Button
                  onClick={onEnd}
                  size="lg"
                  variant="destructive"
                  className="rounded-full h-14 w-14 p-0 shadow-lg"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
