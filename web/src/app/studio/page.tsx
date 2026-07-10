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
  FileVideo, Image, Speaker, SpeakerOff, Crop, Sparkles
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

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-0 p-0">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-muted/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gaming-purple to-gaming-pink flex items-center justify-center">
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
                <TabsTrigger value="record" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md gap-1.5 text-xs px-3 py-1.5">
                  <Monitor className="h-3.5 w-3.5" /> Record
                </TabsTrigger>
                <TabsTrigger value="edit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md gap-1.5 text-xs px-3 py-1.5">
                  <Scissors className="h-3.5 w-3.5" /> Edit
                </TabsTrigger>
                <TabsTrigger value="export" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md gap-1.5 text-xs px-3 py-1.5">
                  <Download className="h-3.5 w-3.5" /> Export
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="record" className="h-full m-0 p-0 data-[state=active]:flex flex-col">
                <RecorderTab clips={clips} setClips={setClips} setSelectedClipId={setSelectedClipId} setActiveTab={setActiveTab} />
              </TabsContent>
              <TabsContent value="edit" className="h-full m-0 p-0 data-[state=active]:flex flex-col">
                <EditorTab clip={selectedClip} clips={clips} setClips={setClips} />
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
                {clips.map((clip) => (
                  <motion.div
                    key={clip.id}
                    className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedClipId === clip.id ? 'border-primary' : 'border-border/30 hover:border-border/60'
                    }`}
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);

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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: audioEnabled,
      });
      setScreenStream(stream);
      if (showCamera) {
        const cam = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCameraStream(cam);
      }
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const clip: Clip = {
          id: Date.now().toString(),
          blob,
          url,
          name: `Clip ${clips.length + 1}`,
          duration: recordingTime,
          createdAt: Date.now(),
        };
        setClips(prev => [...prev, clip]);
        setSelectedClipId(clip.id);
        setScreenStream(null);
        setCameraStream(null);
        setRecordingTime(0);
        toast.success('Recording saved!');
      };
      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setRecording(true);
      setPaused(false);
      let startTime = Date.now();
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
      }, 100);
      toast.success('Recording started');
    } catch (err: any) {
      if (err.name === 'NotAllowedError') toast.error('Screen capture permission denied');
      else toast.error('Failed to start recording');
    }
  }, [audioEnabled, showCamera, recordingTime, clips.length, setClips, setSelectedClipId]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    screenStream?.getTracks().forEach(t => t.stop());
    cameraStream?.getTracks().forEach(t => t.stop());
    clearInterval(timerRef.current);
    setRecording(false);
    setPaused(false);
  }, [screenStream, cameraStream]);

  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      clearInterval(timerRef.current);
      setPaused(true);
    } else {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime(p => p + 1);
      }, 1000);
      setPaused(false);
    }
  }, []);

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
      } catch {
        toast.error('Camera access denied');
      }
    }
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      screenStream?.getTracks().forEach(t => t.stop());
      cameraStream?.getTracks().forEach(t => t.stop());
      clearInterval(timerRef.current);
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
      <div className="flex-1 relative bg-black/90 flex items-center justify-center">
        {screenStream ? (
          <>
            <video ref={previewRef} autoPlay muted className="max-w-full max-h-full object-contain" />
            {cameraStream && (
              <div className={`absolute w-48 h-36 rounded-lg overflow-hidden border-2 border-primary/50 shadow-lg shadow-primary/20 ${
                cameraPosition === 'top-left' ? 'top-4 left-4' :
                cameraPosition === 'top-right' ? 'top-4 right-4' :
                cameraPosition === 'bottom-left' ? 'bottom-24 left-4' :
                'bottom-24 right-4'
              }`}>
                <video ref={cameraPreviewRef} autoPlay muted className="w-full h-full object-cover" />
              </div>
            )}
            {recording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full border border-red-500/50">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-white font-medium">{formatTime(recordingTime)}</span>
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

      <div className="border-t border-border/50 bg-muted/10 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Button variant={audioEnabled ? 'outline' : 'secondary'} size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setAudioEnabled(!audioEnabled)}>
              {audioEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
              Audio
            </Button>
            <Button variant={showCamera ? 'outline' : 'secondary'} size="sm" className="h-8 gap-1.5 text-xs" onClick={toggleCamera}>
              {showCamera ? <Camera className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
              Camera
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {recording ? (
              <>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={togglePause}>
                  {paused ? <Play className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                  {paused ? 'Resume' : 'Pause'}
                </Button>
                <Button variant="destructive" size="sm" className="h-8 gap-1.5 text-xs" onClick={stopRecording}>
                  <Square className="h-3.5 w-3.5" /> Stop
                </Button>
              </>
            ) : (
              <Button variant="gradient" size="sm" className="h-8 gap-1.5 text-xs" onClick={startRecording} animate>
                <div className="w-2 h-2 rounded-full bg-white" />
                Start Recording
              </Button>
            )}
          </div>

          {showCamera && (
            <div className="flex items-center gap-1">
              {cameraPositions.map(pos => (
                <button key={pos.id} onClick={() => setCameraPosition(pos.id)}
                  className={`w-6 h-6 text-[8px] font-bold rounded border transition-all ${
                    cameraPosition === pos.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border/30 hover:border-primary/50'
                  }`}>
                  {pos.label}
                </button>
              ))}
            </div>
          )}
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
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [newText, setNewText] = useState('');
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);

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
    }
  }, [clip?.id]);

  useEffect(() => {
    if (!videoRef.current || !clip) return;
    const vid = videoRef.current;
    const onTime = () => setCurrentTime(vid.currentTime);
    vid.addEventListener('timeupdate', onTime);
    return () => vid.removeEventListener('timeupdate', onTime);
  }, [clip]);

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
      id: Date.now().toString(),
      text: newText.trim(),
      x: 100,
      y: 100,
      fontSize: 32,
      color: '#ffffff',
      startTime: trimStart,
      endTime: trimEnd,
    };
    setTextOverlays(prev => [...prev, overlay]);
    setNewText('');
  };

  const removeOverlay = (id: string) => setTextOverlays(prev => prev.filter(o => o.id !== id));

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
      recorder.ondataavailable = e => { if (e.size > 0) chunks.push(e.data); };
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
      const renderFrame = () => {
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
        requestAnimationFrame(renderFrame);
      };
      video.onseeked = () => {
        video.play();
        renderFrame();
      };
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
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/10" onClick={exportTrimmed}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="border-t border-border/50 bg-muted/10 p-3 space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Trim</label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{formatTime(trimStart)} - {formatTime(trimEnd)}</span>
            </div>
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
                  <button onClick={() => removeOverlay(overlay.id)} className="ml-0.5 hover:text-destructive">
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
              {textOverlays.length === 0 && (
                <span className="text-[10px] text-muted-foreground/60">No overlays added</span>
              )}
            </div>
          </div>
          <div className="w-32 space-y-1">
            <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Volume</label>
            <div className="flex items-center gap-2">
              <SpeakerOff className="h-3 w-3 text-muted-foreground" />
              <Slider value={[volume]} onValueChange={([v]) => setVolume(v)} min={0} max={1} step={0.1} className="flex-1" />
              <Speaker className="h-3 w-3 text-muted-foreground" />
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

  const handleExport = async () => {
    if (!clip) return toast.error('No clip selected');
    setExporting(true);
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
