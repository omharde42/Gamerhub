'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Monitor, Camera, Mic, MicOff, Video, VideoOff, Download, Scissors,
  Type, Play, Square, Clock, Film, Layers, Trash2, Save,
  Maximize2, Minimize2, Plus, GripVertical, Settings, Undo2,
  FileVideo, Image, Speaker, VolumeX, Crop, Sparkles, Pen,
  MousePointer2, Highlighter, ArrowUp, Split, FastForward,
  RefreshCw, Circle, Pointer, Laugh
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

type Clip = {
  id: string;
  blob: Blob;
  url: string;
  name: string;
  duration: number;
  createdAt: number;
};

type TextOverlay = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  startTime: number;
  endTime: number;
};

type Drawing = {
  id: string;
  tool: 'pen' | 'highlight' | 'arrow';
  points: { x: number; y: number }[];
  color: string;
  width: number;
};

type QualityPreset = {
  label: string;
  width: number;
  height: number;
  fps: number;
};

const GAMING_MEMES = [
  'Git Gud', 'Noob', 'EZ Clap', 'GG WP', 'Get Rekt', 'Tryhard',
  'PogChamp', 'WeirdChamp', 'KEKW', 'OMEGALUL', 'MonkaW',
  'This is fine 🔥', 'Nothing personal, kid', 'They don\'t know',
  'It\'s free real estate', 'Expected nothing less', 'Wait, that\'s illegal',
  'When you\'re on a win streak', 'Sweaty tryhard', 'Console peasant',
  'PC Master Race', 'Lag switch', 'Hacker?', 'Skill issue',
  'Touch grass', 'Go outside', 'No lifes', 'EZ Clap',
  'That was clean', 'Outplayed', 'Mechanics diff', 'Brain diff',
  'Team diff', 'Solo queue life', 'ELO hell', 'Hardstuck',
  'One more game', 'Just one more', 'It\'s 3 AM already',
  'Respect the 1v1', 'Fighting game moment', 'Hitbox porn',
  'Netcode issues', 'Desync', 'Rubberbanding', 'Ping diff',
  '360 no scope', 'MLG 420', 'FaZe ready', 'Pro gamer move',
];

const QUALITY_PRESETS: QualityPreset[] = [
  { label: '720p 30fps', width: 1280, height: 720, fps: 30 },
  { label: '720p 60fps', width: 1280, height: 720, fps: 60 },
  { label: '1080p 30fps', width: 1920, height: 1080, fps: 30 },
  { label: '1080p 60fps', width: 1920, height: 1080, fps: 60 },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState('record');
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  const selectedClip = clips.find(c => c.id === selectedClipId);

  const handleClipsUpdate = (fn: (prev: Clip[]) => Clip[]) => setClips(fn);

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-0 p-0">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-muted/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gaming-purple to-gaming-pink flex items-center justify-center animate-breathe">
            <Film className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-lg font-bold">Game Studio</h1>
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">BETA</Badge>
        </div>
        {selectedClip && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs border-border/50">
              <Clock className="h-3 w-3" /> {formatTime(selectedClip.duration)}
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs border-border/50">
              <Film className="h-3 w-3" /> {selectedClip.name}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-6 pt-3 border-b border-border/30 bg-muted/5">
              <TabsList className="bg-muted/20 p-0.5 rounded-lg">
                <TabsTrigger value="record" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md gap-1.5 text-xs px-3 py-1.5 animate-scale-in">
                  <Monitor className="h-3.5 w-3.5" /> Record
                </TabsTrigger>
                <TabsTrigger value="edit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md gap-1.5 text-xs px-3 py-1.5 animate-scale-in" style={{ animationDelay: '0.05s' }}>
                  <Scissors className="h-3.5 w-3.5" /> Edit
                </TabsTrigger>
                <TabsTrigger value="export" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md gap-1.5 text-xs px-3 py-1.5 animate-scale-in" style={{ animationDelay: '0.1s' }}>
                  <Download className="h-3.5 w-3.5" /> Export
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="record" className="h-full m-0 p-0 data-[state=active]:flex flex-col">
                <RecorderTab clips={clips} setClips={handleClipsUpdate} setSelectedClipId={setSelectedClipId} setActiveTab={setActiveTab} />
              </TabsContent>
              <TabsContent value="edit" className="h-full m-0 p-0 data-[state=active]:flex flex-col">
                <EditorTab clip={selectedClip} clips={clips} setClips={handleClipsUpdate} />
              </TabsContent>
              <TabsContent value="export" className="h-full m-0 p-0 data-[state=active]:flex flex-col">
                <ExportTab clip={selectedClip} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="w-64 border-l border-border/50 bg-muted/5 hidden md:flex flex-col">
          <div className="px-3 py-2.5 border-b border-border/50">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3 w-3" /> Media Library
            </h3>
          </div>
          <ScrollArea className="flex-1 p-2">
            {clips.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center px-3">
                <Film className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-xs text-muted-foreground">No clips yet</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Record your first clip to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clips.map((clip, idx) => (
                  <motion.div
                    key={clip.id}
                    className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all animate-scale-in ${
                      selectedClipId === clip.id ? 'border-primary' : 'border-border/30 hover:border-border/60'
                    }`}
                    style={{ animationDelay: `${idx * 0.03}s` }}
                    onClick={() => setSelectedClipId(clip.id)}
                    layout
                  >
                    <video src={clip.url} className="w-full aspect-video object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-[10px] font-medium truncate">{clip.name}</p>
                      <p className="text-[8px] text-white/70">{formatTime(clip.duration)}</p>
                    </div>
                    <button
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); setClips(p => p.filter(c => c.id !== clip.id)); URL.revokeObjectURL(clip.url); }}
                    >
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function RecorderTab({ clips, setClips, setSelectedClipId, setActiveTab }: {
  clips: Clip[]; setClips: (fn: (prev: Clip[]) => Clip[]) => void;
  setSelectedClipId: (id: string) => void; setActiveTab: (tab: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraPosition, setCameraPosition] = useState('bottom-right');
  const [cameraSize, setCameraSize] = useState(180);
  const [countdown, setCountdown] = useState(0);
  const [qualityPreset, setQualityPreset] = useState(QUALITY_PRESETS[0]);
  const [drawingMode, setDrawingMode] = useState(false);
  const [activeTool, setActiveTool] = useState<'pen' | 'highlight' | 'arrow'>('pen');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
  const [showClicks, setShowClicks] = useState(true);
  const [clicks, setClicks] = useState<{ x: number; y: number; id: number }[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const clickIdRef = useRef(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (previewRef.current && screenStream) {
      previewRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  useEffect(() => {
    if (cameraPreviewRef.current && cameraStream) {
      cameraPreviewRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    if (!drawingMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      if (!containerRef.current) return;
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [drawingMode]);

  useEffect(() => {
    if (!canvasRef.current || !drawingMode) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    drawings.forEach(d => drawDrawing(ctx, d));
    if (currentDrawing) drawDrawing(ctx, currentDrawing);
  }, [drawings, currentDrawing, drawingMode]);

  const drawDrawing = (ctx: CanvasRenderingContext2D, d: Drawing) => {
    if (d.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = d.color;
    ctx.lineWidth = d.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (d.tool === 'highlight') {
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = d.width * 3;
    } else {
      ctx.globalAlpha = 1;
    }
    ctx.moveTo(d.points[0].x, d.points[0].y);
    for (let i = 1; i < d.points.length; i++) {
      ctx.lineTo(d.points[i].x, d.points[i].y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (d.tool === 'arrow' && d.points.length >= 2) {
      const last = d.points[d.points.length - 1];
      const prev = d.points[d.points.length - 2];
      const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
      const headLen = 12;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(last.x - headLen * Math.cos(angle - Math.PI / 6), last.y - headLen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(last.x - headLen * Math.cos(angle + Math.PI / 6), last.y - headLen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
  };

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (!drawingMode) return;
    isDrawingRef.current = true;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const d: Drawing = { id: Date.now().toString(), tool: activeTool, points: [{ x, y }], color: '#ff4444', width: 3 };
    setCurrentDrawing(d);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!isDrawingRef.current || !currentDrawing) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentDrawing(prev => prev ? { ...prev, points: [...prev.points, { x, y }] } : null);
  };

  const handleCanvasPointerUp = () => {
    if (!isDrawingRef.current || !currentDrawing) return;
    isDrawingRef.current = false;
    if (currentDrawing.points.length > 1) {
      setDrawings(prev => [...prev, currentDrawing]);
    }
    setCurrentDrawing(null);
  };

  const startRecording = useCallback(async () => {
    setCountdown(3);
    const cd = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(cd); return 0; }
        return prev - 1;
      });
    }, 1000);
    await new Promise(r => setTimeout(r, 3000));
    try {
      // 1. Capture screen capture stream
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' } as any,
        audio: audioEnabled,
      });

      // 2. Capture microphone stream if audio is enabled
      let micStream: MediaStream | null = null;
      if (audioEnabled) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = micStream;
        } catch (micErr) {
          console.warn('Microphone stream access not granted or not available', micErr);
        }
      }

      // 3. Mix audio using AudioContext if both system capture and mic streams are present
      let finalStream = displayStream;
      if (audioEnabled) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        const dest = audioContext.createMediaStreamDestination();
        let hasAudioSource = false;

        const displayAudioTracks = displayStream.getAudioTracks();
        if (displayAudioTracks.length > 0) {
          const source1 = audioContext.createMediaStreamSource(new MediaStream([displayAudioTracks[0]]));
          source1.connect(dest);
          hasAudioSource = true;
        }

        if (micStream && micStream.getAudioTracks().length > 0) {
          const source2 = audioContext.createMediaStreamSource(new MediaStream([micStream.getAudioTracks()[0]]));
          source2.connect(dest);
          hasAudioSource = true;
        }

        if (hasAudioSource) {
          const tracks = [displayStream.getVideoTracks()[0], dest.stream.getAudioTracks()[0]];
          finalStream = new MediaStream(tracks);
        }
      }

      setScreenStream(displayStream);
      if (showCamera) {
        try {
          const cam = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          setCameraStream(cam);
        } catch {
          toast.error('Camera access denied');
        }
      }

      chunksRef.current = [];
      startTimeRef.current = Date.now();

      let options = { mimeType: 'video/webm;codecs=vp9,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm;codecs=vp8,opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/webm' };
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/mp4' };
          }
        }
      }

      const recorder = new MediaRecorder(finalStream, options);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Calculate duration dynamically using start timestamp to avoid stale state closure bug
        const duration = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
        
        const clip: Clip = {
          id: Date.now().toString(),
          blob,
          url,
          name: `Clip ${clips.length + 1}`,
          duration: duration,
          createdAt: Date.now(),
        };
        setClips(prev => [...prev, clip]);
        setSelectedClipId(clip.id);
        
        // Stop display tracks
        displayStream.getTracks().forEach(t => t.stop());
        setScreenStream(null);
        setCameraStream(null);
        setRecordingTime(0);
        setDrawings([]);
        
        // Release audio tracks
        micStreamRef.current?.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
        audioContextRef.current = null;

        toast.success('Recording saved!');
      };
      
      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setRecording(true);
      setPaused(false);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
      toast.success('Recording started');
    } catch (err: any) {
      setCountdown(0);
      if (err.name === 'NotAllowedError') toast.error('Screen capture permission denied');
      else toast.error('Failed to start recording');
    }
  }, [audioEnabled, showCamera, qualityPreset, clips.length, setClips, setSelectedClipId]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    screenStream?.getTracks().forEach(t => t.stop());
    cameraStream?.getTracks().forEach(t => t.stop());
    clearInterval(timerRef.current);
    setRecording(false);
    setPaused(false);
    
    // Release resources on stop
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
  }, [screenStream, cameraStream]);

  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      clearInterval(timerRef.current);
      setPaused(true);
    } else {
      mediaRecorderRef.current.resume();
      // Resume timer relative to elapsed time
      const elapsed = recordingTime;
      startTimeRef.current = Date.now() - elapsed * 1000;
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
      setPaused(false);
    }
  }, [recordingTime]);

  const toggleCamera = useCallback(async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
      setShowCamera(false);
    } else {
      try {
        const cam = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCameraStream(cam);
        setShowCamera(true);
      } catch { toast.error('Camera access denied'); }
    }
  }, [cameraStream]);

  const clearDrawings = () => { setDrawings([]); setCurrentDrawing(null); };

  useEffect(() => {
    return () => {
      screenStream?.getTracks().forEach(t => t.stop());
      cameraStream?.getTracks().forEach(t => t.stop());
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      clearInterval(timerRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [screenStream, cameraStream]);

  const cameraPositions = [
    { id: 'top-left', label: 'TL' },
    { id: 'top-right', label: 'TR' },
    { id: 'bottom-left', label: 'BL' },
    { id: 'bottom-right', label: 'BR' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div ref={containerRef} className="flex-1 relative bg-black/90 flex items-center justify-center overflow-hidden">
        {screenStream ? (
          <>
            <video ref={previewRef} autoPlay muted className="max-w-full max-h-full object-contain" />
            {cameraStream && (
              <div className={`absolute rounded-lg overflow-hidden border-2 border-primary/50 shadow-lg shadow-primary/20 transition-all`}
                style={{
                  width: cameraSize,
                  height: cameraSize * 0.75,
                  ...(cameraPosition === 'top-left' ? { top: 4, left: 4 } :
                    cameraPosition === 'top-right' ? { top: 4, right: 4 } :
                    cameraPosition === 'bottom-left' ? { bottom: 24, left: 4 } :
                    { bottom: 24, right: 4 }),
                }}>
                <video ref={cameraPreviewRef} autoPlay muted className="w-full h-full object-cover" />
              </div>
            )}
            {drawingMode && (
              <canvas ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair z-10"
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
              />
            )}
            {countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                <motion.span key={countdown} initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="text-8xl font-bold text-white drop-shadow-2xl">
                  {countdown}
                </motion.span>
              </div>
            )}
            {recording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full border border-red-500/50 z-10">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-white font-medium">{formatTime(recordingTime)}</span>
                <Badge className="text-[9px] bg-primary/20 text-primary border-primary/30">{qualityPreset.label}</Badge>
                {paused && <Badge className="text-[9px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30">PAUSED</Badge>}
              </div>
            )}
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gaming-purple/20 to-gaming-cyan/20 flex items-center justify-center mx-auto border border-border/30">
              <Monitor className="h-12 w-12 text-primary/60" />
            </div>
            <h2 className="text-lg font-bold text-foreground/80">Ready to Record</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Capture your gaming moments with screen recording, camera overlay, and audio
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border/50 bg-muted/10 px-4 py-2.5">
        <div className="flex items-center justify-between max-w-6xl mx-auto flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Button variant={audioEnabled ? 'outline' : 'secondary'} size="sm" className="h-7 gap-1 text-[10px]" onClick={() => setAudioEnabled(!audioEnabled)}>
              {audioEnabled ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />} Audio
            </Button>
            <Button variant={showCamera ? 'outline' : 'secondary'} size="sm" className="h-7 gap-1 text-[10px]" onClick={toggleCamera}>
              {showCamera ? <Camera className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />} Cam
            </Button>
            <Button variant={drawingMode ? 'default' : 'outline'} size="sm" className="h-7 gap-1 text-[10px]" onClick={() => setDrawingMode(!drawingMode)}>
              <Pen className="h-3 w-3" /> Draw
            </Button>
            <Button variant={showClicks ? 'outline' : 'secondary'} size="sm" className="h-7 gap-1 text-[10px]" onClick={() => setShowClicks(!showClicks)}>
              <MousePointer2 className="h-3 w-3" /> Clicks
            </Button>
          </div>

          {drawingMode && (
            <div className="flex items-center gap-1">
              <Button variant={activeTool === 'pen' ? 'default' : 'outline'} size="sm" className="h-7 w-7 p-0" onClick={() => setActiveTool('pen')}><Pen className="h-3 w-3" /></Button>
              <Button variant={activeTool === 'highlight' ? 'default' : 'outline'} size="sm" className="h-7 w-7 p-0" onClick={() => setActiveTool('highlight')}><Highlighter className="h-3 w-3" /></Button>
              <Button variant={activeTool === 'arrow' ? 'default' : 'outline'} size="sm" className="h-7 w-7 p-0" onClick={() => setActiveTool('arrow')}><ArrowUp className="h-3 w-3" /></Button>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-[10px]" onClick={clearDrawings}><Trash2 className="h-3 w-3" /> Clear</Button>
            </div>
          )}

          {showCamera && (
            <div className="flex items-center gap-1">
              {cameraPositions.map(pos => (
                <button key={pos.id} onClick={() => setCameraPosition(pos.id)}
                  className={`w-5 h-5 text-[7px] font-bold rounded border transition-all ${
                    cameraPosition === pos.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border/30 hover:border-primary/50'
                  }`}>{pos.label}</button>
              ))}
              <Slider value={[cameraSize]} onValueChange={([v]) => setCameraSize(v)} min={100} max={300} step={10} className="w-16 ml-1" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <select value={qualityPreset.label} onChange={(e) => setQualityPreset(QUALITY_PRESETS.find(q => q.label === e.target.value) || QUALITY_PRESETS[0])}
              className="h-7 text-[10px] bg-muted/30 border border-border/30 rounded-lg px-2 text-muted-foreground focus:outline-none focus:border-primary/50"
              disabled={recording}>
              {QUALITY_PRESETS.map(q => <option key={q.label} value={q.label}>{q.label}</option>)}
            </select>
            {recording ? (
              <>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-[10px]" onClick={togglePause}>
                  {paused ? <Play className="h-3 w-3" /> : <Square className="h-3 w-3" />}{paused ? 'Resume' : 'Pause'}
                </Button>
                <Button variant="destructive" size="sm" className="h-7 gap-1 text-[10px]" onClick={stopRecording}>
                  <Square className="h-3 w-3" /> Stop
                </Button>
              </>
            ) : (
              <Button variant="gradient" size="sm" className="h-7 gap-1 text-[10px]" onClick={startRecording} animate>
                <Circle className="h-3 w-3" /> Record
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorTab({ clip, clips, setClips }: { clip: Clip | undefined; clips: Clip[]; setClips: (fn: (prev: Clip[]) => Clip[]) => void }) {
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(clip?.duration || 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playback, setPlayback] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [newText, setNewText] = useState('');
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [clipName, setClipName] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (clip) {
      setTrimStart(0);
      setTrimEnd(clip.duration);
      setCurrentTime(0);
      setTextOverlays([]);
      setPlayback(false);
      setPlaybackRate(1);
      setClipName(clip.name);
    }
  }, [clip?.id]);

  useEffect(() => {
    if (!videoRef.current || !clip) return;
    const vid = videoRef.current;
    const onTime = () => setCurrentTime(vid.currentTime);
    vid.addEventListener('timeupdate', onTime);
    return () => vid.removeEventListener('timeupdate', onTime);
  }, [clip]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (playback) {
      videoRef.current.pause();
      setPlayback(false);
      cancelAnimationFrame(animRef.current);
    } else {
      videoRef.current.play();
      setPlayback(true);
      const renderFrame = () => {
        if (!canvasRef.current || !videoRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        canvasRef.current.width = videoRef.current.videoWidth || 1280;
        canvasRef.current.height = videoRef.current.videoHeight || 720;
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        textOverlays.forEach(o => {
          const t = videoRef.current!.currentTime;
          if (t >= o.startTime && t <= o.endTime) {
            ctx.font = `${o.fontSize}px sans-serif`;
            ctx.fillStyle = o.color;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.strokeText(o.text, o.x, o.y);
            ctx.fillText(o.text, o.x, o.y);
          }
        });
        animRef.current = requestAnimationFrame(renderFrame);
      };
      renderFrame();
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const addTextOverlay = () => {
    if (!newText.trim()) return;
    const overlay: TextOverlay = {
      id: Date.now().toString(), text: newText.trim(), x: 100, y: 100, fontSize: 32, color: '#ffffff', startTime: trimStart, endTime: trimEnd,
    };
    setTextOverlays(prev => [...prev, overlay]);
    setNewText('');
  };

  const removeOverlay = (id: string) => setTextOverlays(prev => prev.filter(o => o.id !== id));

  const splitClip = async () => {
    if (!clip || currentTime <= 0 || currentTime >= clip.duration) return toast.error('Move to a position between start and end to split');
    const splitIdx = clips.findIndex(c => c.id === clip.id);
    if (splitIdx === -1) return;
    const baseName = `Clip ${splitIdx + 1}`;
    const video = document.createElement('video');
    video.src = clip.url;
    await video.play();
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    const stream = canvas.captureStream(30);
    for (let part = 0; part < 2; part++) {
      const start = part === 0 ? 0 : currentTime;
      const end = part === 0 ? currentTime : clip.duration;
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.start(100);
      await new Promise<void>((resolve) => {
        video.currentTime = start;
        video.onseeked = () => {
          video.play();
          const frame = () => {
            if (video.currentTime >= end || video.ended) {
              recorder.stop();
              video.pause();
              resolve();
              return;
            }
            ctx.drawImage(video, 0, 0, w, h);
            requestAnimationFrame(frame);
          };
          frame();
        };
      });
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const newClip: Clip = { id: Date.now().toString() + part, blob, url, name: `${baseName} part ${part + 1}`, duration: end - start, createdAt: Date.now() };
      setClips(prev => [...prev, newClip]);
    }
    setClips(prev => prev.filter(c => c.id !== clip.id));
    URL.revokeObjectURL(clip.url);
    toast.success(`Split into 2 clips at ${formatTime(currentTime)}`);
  };

  const exportTrimmed = async () => {
    if (!clip) return toast.error('No clip selected');
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return toast.error('Canvas not supported');
      const video = document.createElement('video');
      video.src = clip.url;
      await video.play();
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      video.currentTime = trimStart;
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      const chunks: Blob[] = [];
      let lastProgress = 0;
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${clip.name}-edited.webm`;
        a.click();
        toast.success('Video exported!');
      };
      recorder.start(100);
      const frame = () => {
        if (video.currentTime >= trimEnd) {
          recorder.stop();
          video.pause();
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        textOverlays.forEach(o => {
          if (video.currentTime >= o.startTime && video.currentTime <= o.endTime) {
            ctx.font = `${o.fontSize}px sans-serif`;
            ctx.fillStyle = o.color;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.strokeText(o.text, o.x, o.y);
            ctx.fillText(o.text, o.x, o.y);
          }
        });
        requestAnimationFrame(frame);
      };
      video.onseeked = () => { video.play(); frame(); };
    } catch { toast.error('Export failed'); }
  };

  if (!clip) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Scissors className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <h3 className="text-sm font-medium text-muted-foreground">No clip selected</h3>
          <p className="text-xs text-muted-foreground/60">Record or select a clip from the media library to edit</p>
        </div>
      </div>
    );
  }

  const speeds = [0.25, 0.5, 1, 1.5, 2, 4];

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 relative bg-black/90 flex items-center justify-center">
        <video ref={videoRef} src={clip.url} className="hidden" />
        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/10" onClick={togglePlayback}>
            {playback ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <span className="text-xs text-white">{formatTime(currentTime)} / {formatTime(clip.duration)}</span>
          <Separator orientation="vertical" className="h-4 bg-white/20" />
          <div className="flex items-center gap-0.5">
            {speeds.map(s => (
              <button key={s} onClick={() => setPlaybackRate(s)}
                className={`text-[10px] px-1.5 py-0.5 rounded ${playbackRate === s ? 'bg-primary text-white' : 'text-white/60 hover:text-white'}`}>
                {s}x
              </button>
            ))}
          </div>
          <Separator orientation="vertical" className="h-4 bg-white/20" />
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/10" onClick={exportTrimmed}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="border-t border-border/50 bg-muted/10 p-3 space-y-3">
        <div className="flex items-center gap-3">
          <Input value={clipName} onChange={(e) => setClipName(e.target.value)} className="h-7 text-xs max-w-[200px]" variant="neon"
            onBlur={() => { if (clip) setClips(prev => prev.map(c => c.id === clip.id ? { ...c, name: clipName } : c)); }} />
          <Button variant="outline" size="sm" className="h-7 gap-1 text-[10px]" onClick={splitClip}>
            <Split className="h-3 w-3" /> Split at {formatTime(currentTime)}
          </Button>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Trim</label>
            <span className="text-[10px] text-muted-foreground">{formatTime(trimStart)} - {formatTime(trimEnd)}</span>
          </div>
          <div className="relative h-8 bg-muted/30 rounded-lg border border-border/30">
            <div className="absolute top-0 bottom-0 bg-primary/20 rounded-lg" style={{
              left: `${(trimStart / clip.duration) * 100}%`,
              right: `${100 - (trimEnd / clip.duration) * 100}%`,
            }} />
            <input type="range" min={0} max={clip.duration} step={0.1} value={trimStart}
              onChange={(e) => { const v = parseFloat(e.target.value); if (v < trimEnd) { setTrimStart(v); handleSeek(v); } }}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
            <input type="range" min={0} max={clip.duration} step={0.1} value={trimEnd}
              onChange={(e) => { const v = parseFloat(e.target.value); if (v > trimStart) { setTrimEnd(v); handleSeek(v); } }}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-6 bg-primary rounded-sm border-2 border-white/50 shadow-lg"
              style={{ left: `calc(${(trimStart / clip.duration) * 100}% - 6px)` }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-6 bg-primary rounded-sm border-2 border-white/50 shadow-lg"
              style={{ left: `calc(${(trimEnd / clip.duration) * 100}% - 6px)` }} />
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Text Overlays</label>
            <div className="flex items-center gap-2">
              <Input value={newText} onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter overlay text..." className="h-8 text-xs" variant="neon"
                onKeyDown={(e) => e.key === 'Enter' && addTextOverlay()} />
              <Button variant="gradient" size="sm" className="h-8 gap-1 text-xs shrink-0" onClick={addTextOverlay} disabled={!newText.trim()} animate>
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {textOverlays.map(overlay => (
                <Badge key={overlay.id} variant="outline" className={`gap-1 text-[10px] cursor-pointer border-primary/30 ${
                  selectedOverlayId === overlay.id ? 'bg-primary/20 ring-1 ring-primary' : ''
                }`} onClick={() => setSelectedOverlayId(overlay.id)}>
                  <Type className="h-2.5 w-2.5" /> {overlay.text}
                  <button onClick={() => removeOverlay(overlay.id)} className="ml-0.5 hover:text-destructive"><Trash2 className="h-2.5 w-2.5" /></button>
                </Badge>
              ))}
              {textOverlays.length === 0 && <span className="text-[10px] text-muted-foreground/60">No overlays added</span>}
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Laugh className="h-3 w-3" /> Gaming Memes
              </label>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {GAMING_MEMES.map(meme => (
                  <Badge key={meme} variant="secondary" className="text-[10px] cursor-pointer hover:bg-primary/20 hover:text-primary transition-all"
                    onClick={() => {
                      const existing = textOverlays.find(o => o.text === meme);
                      if (!existing) {
                        const offset = 60 + textOverlays.length * 30;
                        setTextOverlays(prev => [...prev, {
                          id: Date.now().toString(), text: meme, x: 80, y: 80 + offset,
                          fontSize: 36, color: '#ffffff', startTime: trimStart, endTime: trimEnd,
                        }]);
                      }
                    }}>
                    {meme}
                  </Badge>
                ))}
                {GAMING_MEMES.length === 0 && <span className="text-[10px] text-muted-foreground/60">No memes loaded</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="w-44 space-y-1">
              <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Volume</label>
              <div className="flex items-center gap-2">
                <VolumeX className="h-3 w-3 text-muted-foreground" />
                <Slider value={[volume]} onValueChange={([v]) => setVolume(v)} min={0} max={1} step={0.1} className="flex-1" />
                <Speaker className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportTab({ clip }: { clip: Clip | undefined }) {
  const [quality, setQuality] = useState('1080p');
  const [format, setFormat] = useState('webm');
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    if (!clip) return toast.error('No clip selected');
    setExporting(true);
    setProgress(0);
    const total = 100;
    for (let i = 0; i <= total; i++) {
      await new Promise(r => setTimeout(r, 20));
      setProgress(i);
    }
    try {
      const a = document.createElement('a');
      a.href = clip.url;
      a.download = `${clip.name}.${format}`;
      a.click();
      toast.success('Download started!');
    } catch {
      toast.error('Export failed');
    }
    setExporting(false);
    setProgress(0);
  };

  if (!clip) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Download className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <h3 className="text-sm font-medium text-muted-foreground">No clip selected</h3>
          <p className="text-xs text-muted-foreground/60">Select a clip from the media library to export</p>
        </div>
      </div>
    );
  }

  const qualities = [
    { id: '720p', label: '720p', desc: 'HD Ready' },
    { id: '1080p', label: '1080p', desc: 'Full HD' },
    { id: '4k', label: '4K', desc: 'Ultra HD' },
  ];

  const formats = [
    { id: 'webm', label: 'WebM', desc: 'Best quality' },
    { id: 'mp4', label: 'MP4', desc: 'Wide compatibility' },
  ];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-32 aspect-video rounded-lg overflow-hidden border border-border/30 bg-black">
            <video src={clip.url} className="w-full h-full object-cover" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">{clip.name}</h3>
            <p className="text-xs text-muted-foreground">{formatTime(clip.duration)} duration</p>
            <p className="text-xs text-muted-foreground">{(clip.blob.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
        </div>

        <Separator className="bg-border/30" />

        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quality</h4>
          <div className="grid grid-cols-3 gap-2">
            {qualities.map(q => (
              <button key={q.id} onClick={() => setQuality(q.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  quality === q.id ? 'border-primary bg-primary/10' : 'border-border/30 hover:border-border/60 bg-muted/20'
                }`}>
                <p className="text-sm font-semibold">{q.label}</p>
                <p className="text-[10px] text-muted-foreground">{q.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Format</h4>
          <div className="grid grid-cols-2 gap-2">
            {formats.map(f => (
              <button key={f.id} onClick={() => setFormat(f.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  format === f.id ? 'border-primary bg-primary/10' : 'border-border/30 hover:border-border/60 bg-muted/20'
                }`}>
                <p className="text-sm font-semibold">{f.label}</p>
                <p className="text-[10px] text-muted-foreground">{f.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <Separator className="bg-border/30" />

        {exporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Exporting...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden border border-border/30">
              <motion.div className="h-full bg-gradient-to-r from-gaming-purple to-gaming-cyan rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button variant="gradient" size="lg" className="flex-1 gap-2" onClick={handleExport} disabled={exporting} animate>
            {exporting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Download className="h-4 w-4" />}
            {exporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
          </Button>
          <Button variant="outline" size="lg" className="gap-2">
            <Save className="h-4 w-4" /> Save to Library
          </Button>
        </div>
      </div>
    </div>
  );
}
