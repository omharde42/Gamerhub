'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BackHeader } from '@/components/common/back-header';
import { Scissors, Play, Pause, Copy, Check, Link as LinkIcon, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function TrimPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrubRef = useRef<HTMLDivElement>(null);

  const [inPoint, setInPoint] = useState(0);
  const [outPoint, setOutPoint] = useState(0);
  const [playhead, setPlayhead] = useState(0);
  const [dragging, setDragging] = useState<'in' | 'out' | 'playhead' | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['video-clip', id],
    queryFn: () => api.get(`/video/clips/${id}`).then(r => r.data.data.clip),
  });
  const clip = data;

  const duration = clip?.durationSec || 0;

  useEffect(() => {
    if (clip?.id && duration > 0) {
      setInPoint(0);
      setOutPoint(Math.min(duration, Math.max(10, duration * 0.25)));
    }
  }, [clip?.id, duration]);

  const trimMut = useMutation({
    mutationFn: () => api.post(`/video/clips/${id}/trim`, { start: inPoint, end: outPoint }),
    onSuccess: () => {
      toast.success('Clip trimmed successfully!');
      queryClient.invalidateQueries({ queryKey: ['video-clip', id] });
      queryClient.invalidateQueries({ queryKey: ['video-clips'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Trim failed'),
  });

  const setPreview = () => {
    const v = videoRef.current;
    if (!v) return;
    const src = clip?.trimmedUrl || clip?.sourceUrl;
    if (v.src !== src) v.src = src;
  };

  const playRange = () => {
    const v = videoRef.current;
    if (!v) return;
    setPreview();
    v.currentTime = inPoint;
    v.play();
    setIsPlaying(true);
  };

  const seekTo = (sec: number) => {
    const v = videoRef.current;
    if (v) {
      v.currentTime = Math.max(0, Math.min(sec, duration));
      setPlayhead(sec);
    }
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    const t = v.currentTime;
    setPlayhead(t);
    if (isPlaying && (t >= outPoint || t >= v.duration - 0.1)) {
      v.pause();
      setIsPlaying(false);
      v.currentTime = inPoint;
    }
  };

  const pointerX = (clientX: number) => {
    const el = scrubRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const onPointerDown = (e: React.PointerEvent, handle: 'in' | 'out' | 'playhead') => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(handle);
    moveTo(e.clientX, handle);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging) moveTo(e.clientX, dragging);
  };

  const moveTo = (clientX: number, handle: 'in' | 'out' | 'playhead') => {
    const sec = pointerX(clientX) * duration;
    if (handle === 'in') {
      setInPoint(Math.max(0, Math.min(sec, outPoint - 1)));
    } else if (handle === 'out') {
      setOutPoint(Math.min(duration, Math.max(sec, inPoint + 1)));
    } else {
      seekTo(sec);
    }
  };

  const shareUrl = clip?.trimmedUrl || '';

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-5">
      <BackHeader title="Trim Clip" />

      {isLoading || !clip ? (
        <Skeleton className="h-72 rounded-3xl" />
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Scissors className="h-5 w-5 text-emerald-400 shrink-0" />
              <h1 className="font-extrabold truncate">{clip.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              {clip.status === 'TRIMMING' && <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse">TRIMMING...</Badge>}
              {clip.status === 'TRIMMED' && <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/40">TRIMMED</Badge>}
              <Badge variant="outline" className="text-[10px] font-mono">{Math.round(duration)}s SOURCE</Badge>
            </div>
          </div>

          {/* Preview */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="hud-corners relative overflow-hidden rounded-3xl border border-white/10 bg-black/70 aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              src={clip.sourceUrl}
              playsInline
              preload="auto"
              onTimeUpdate={onTimeUpdate}
              onEnded={() => setIsPlaying(false)}
            />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <Badge className="text-[10px] bg-black/60 text-white border-white/20 font-mono">
                {inPoint.toFixed(1)}s → {outPoint.toFixed(1)}s
              </Badge>
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <Button size="icon" className="h-10 w-10 rounded-full shadow-xl bg-emerald-500 text-black hover:bg-emerald-400"
                onClick={playRange}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
          </motion.div>

          {/* Scrubber */}
          <div
            ref={scrubRef}
            className="relative h-14 rounded-2xl border border-white/10 bg-black/60 overflow-hidden select-none touch-none cursor-pointer"
            onPointerMove={onPointerMove}
            onPointerUp={() => setDragging(null)}
            onPointerLeave={() => setDragging(null)}
          >
            {/* time grid */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex-1 border-r border-white/5" />
              ))}
            </div>
            {/* selected range */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/25 border-x-2 border-emerald-400"
              style={{ left: `${(inPoint / duration) * 100}%`, width: `${((outPoint - inPoint) / duration) * 100}%` }}
            />
            {/* playhead */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-white z-10" style={{ left: `${(playhead / duration) * 100}%` }} />
            {/* IN handle */}
            <div
              className="absolute top-0 bottom-0 w-6 -ml-3 flex items-center justify-center z-20 cursor-ew-resize"
              style={{ left: `${(inPoint / duration) * 100}%` }}
              onPointerDown={(e) => onPointerDown(e, 'in')}
            >
              <div className="w-1.5 h-full bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            </div>
            {/* OUT handle */}
            <div
              className="absolute top-0 bottom-0 w-6 -ml-3 flex items-center justify-center z-20 cursor-ew-resize"
              style={{ left: `${(outPoint / duration) * 100}%` }}
              onPointerDown={(e) => onPointerDown(e, 'out')}
            >
              <div className="w-1.5 h-full bg-red-400 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            </div>
            {/* labels */}
            <span className="absolute top-1 left-2 text-[9px] font-mono text-emerald-400">{inPoint.toFixed(1)}s</span>
            <span className="absolute top-1 right-2 text-[9px] font-mono text-red-400">{outPoint.toFixed(1)}s</span>
          </div>

          {/* Quick actions */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="text-[11px] gap-1.5"
              onClick={() => { const v = videoRef.current; if (v) { setInPoint(v.currentTime); } }}>
              <LinkIcon className="h-3 w-3" /> Set IN
            </Button>
            <Button size="sm" variant="outline" className="text-[11px] gap-1.5"
              onClick={() => { const v = videoRef.current; if (v) { setOutPoint(v.currentTime); } }}>
              <LinkIcon className="h-3 w-3 rotate-180" /> Set OUT
            </Button>
            <Button size="sm" className="text-[11px] gap-1.5 font-extrabold"
              onClick={() => trimMut.mutate()} disabled={trimMut.isPending || inPoint >= outPoint - 2}>
              {trimMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Scissors className="h-3 w-3" />}
              Trim & Process
            </Button>
            <Button size="sm" variant="ghost" className="text-[11px] gap-1.5 text-purple-400"
              disabled={aiBusy}
              onClick={async () => {
                setAiBusy(true);
                toast.loading('AI is analyzing your footage...');
                try {
                  const res = await api.post(`/video/clips/${id}/highlights`);
                  toast.dismiss();
                  toast.success('AI highlight draft created!');
                  router.push(`/studio/projects/${res.data.data.project.id}`);
                } catch (err: any) {
                  toast.dismiss();
                  toast.error(err.response?.data?.message || 'AI analysis failed');
                } finally {
                  setAiBusy(false);
                }
              }}>
              {aiBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              AI Highlights
            </Button>
          </div>

          {/* Result / share */}
          {shareUrl && clip.status === 'TRIMMED' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <p className="text-sm font-bold text-emerald-400">Trimmed clip ready — share it or add it to a montage</p>
              </div>
              <video src={shareUrl} controls className="w-full max-h-64 rounded-2xl bg-black/60" playsInline preload="metadata" />
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="text-[11px] gap-1.5 flex-1 min-w-[200px]" onClick={async () => {
                  await navigator.clipboard.writeText(shareUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied!' : 'Copy shareable link'}
                </Button>
                <Link href="/studio/projects" className="flex-1 min-w-[200px]">
                  <Button size="sm" className="w-full text-[11px] gap-1.5 font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                    Build a Montage
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}