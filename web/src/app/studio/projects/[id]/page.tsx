'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { BackHeader } from '@/components/common/back-header';
import {
  Play, Pause, Trash2, Plus, Headphones, Type, Loader2, ArrowUp, ArrowDown, Check, Upload, Copy, Film, Layers, Sparkles, Palette
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const TRANSITIONS = ['cut', 'fade', 'crossfade'] as const;

export default function MontageEditorPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const previewRef = useRef<HTMLVideoElement>(null);

  const [edl, setEdl] = useState<any>(null);
  const [playIdx, setPlayIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [musicBusy, setMusicBusy] = useState(false);
  const musicInputRef = useRef<HTMLInputElement>(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ['montage-project', id],
    queryFn: () => api.get(`/video/projects/${id}`).then(r => r.data.data.project),
    refetchInterval: (q) => (q.state.data?.status === 'RENDERING' ? 5000 : false),
  });

  const { data: clips } = useQuery({
    queryKey: ['video-clips'],
    queryFn: () => api.get('/video/clips').then(r => r.data.data),
  });

  // Sync the server's EDL into local editor state only when it actually
  // changed (segment count or status). The guard keeps the effect from
  // clobbering in-progress local edits on unrelated refetches/polls, which
  // recreate the project object on every response.
  const lastSyncedEdlKeyRef = useRef('');
  useEffect(() => {
    const syncKey = `${project?.status || ''}:${project?.edl?.segments?.length ?? ''}`;
    if (project?.edl && syncKey !== lastSyncedEdlKeyRef.current) {
      lastSyncedEdlKeyRef.current = syncKey;
      setEdl(project.edl);
    }
  }, [project]);

  const saveEdl = (next: any) => {
    setEdl(next);
    saveMut.mutate(next);
  };

  const saveMut = useMutation({
    mutationFn: (nextEdl: any) => api.put(`/video/projects/${id}/edl`, { edl: nextEdl }),
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const renderMut = useMutation({
    mutationFn: () => api.post(`/video/projects/${id}/render`, { resolution: edl?.resolution || '720p', fps: edl?.fps || 30 }),
    onSuccess: (res) => {
      toast.success(res.data.data.message || 'Render queued!');
      queryClient.invalidateQueries({ queryKey: ['montage-project', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Render failed'),
  });

  const musicMut = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('music', file);
      return api.post('/video/music/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (res) => {
      const m = res.data.data.music;
      saveEdl({ ...edl, music: { publicId: m.publicId, url: m.url, volume: 70 } });
      toast.success('Music track added');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Music upload failed'),
  });

  const addSegment = (clip: any) => {
    const src = clip.trimmedUrl || clip.sourceUrl;
    const dur = Math.min(clip.durationSec || 10, 10);
    const seg = {
      clipId: clip.id,
      sourceUrl: src,
      publicId: clip.trimmedPublicId || clip.sourcePublicId || null,
      start: clip.trimStartSec || 0,
      end: (clip.trimEndSec || clip.durationSec || dur) - (clip.trimStartSec || 0) + (clip.trimStartSec || 0),
      transition: 'cut',
    };
    saveEdl({ ...edl, segments: [...(edl?.segments || []), seg] });
  };

  const updateSegment = (idx: number, patch: any) => {
    const segments = [...(edl?.segments || [])];
    segments[idx] = { ...segments[idx], ...patch };
    saveEdl({ ...edl, segments });
  };

  const removeSegment = (idx: number) => {
    const segments = [...(edl?.segments || [])];
    segments.splice(idx, 1);
    saveEdl({ ...edl, segments });
  };

  const moveSegment = (idx: number, dir: -1 | 1) => {
    const segments = [...(edl?.segments || [])];
    const j = idx + dir;
    if (j < 0 || j >= segments.length) return;
    [segments[idx], segments[j]] = [segments[j], segments[idx]];
    saveEdl({ ...edl, segments });
  };

  const addOverlay = () => {
    saveEdl({
      ...edl,
      overlays: [...(edl?.overlays || []), { text: 'GG WP', x: 0, y: 0, fontSize: 48, color: '#ffffff', start: 0, end: 5 }],
    });
  };

  const updateOverlay = (idx: number, patch: any) => {
    const overlays = [...(edl?.overlays || [])];
    overlays[idx] = { ...overlays[idx], ...patch };
    saveEdl({ ...edl, overlays });
  };

  const removeOverlay = (idx: number) => {
    const overlays = [...(edl?.overlays || [])];
    overlays.splice(idx, 1);
    saveEdl({ ...edl, overlays });
  };

  // Sequenced low-res preview: plays each segment in order
  const startPreview = () => {
    setPlayIdx(0);
    const v = previewRef.current;
    if (v && edl?.segments?.length) {
      v.src = edl.segments[0].sourceUrl;
      v.currentTime = edl.segments[0].start || 0;
      v.play();
    }
  };

  const onPreviewEnded = () => {
    const segs = edl?.segments || [];
    if (playIdx + 1 < segs.length) {
      const next = playIdx + 1;
      setPlayIdx(next);
      const v = previewRef.current;
      if (v) {
        v.src = segs[next].sourceUrl;
        v.currentTime = segs[next].start || 0;
        v.play();
      }
    }
  };

  const status = project?.status;
  const renderUrl = project?.renderUrl;

  if (isLoading) return <div className="max-w-5xl mx-auto p-4"><Skeleton className="h-72 rounded-3xl" /></div>;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-5">
      <BackHeader title={project?.title || 'Montage Editor'} />

      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-extrabold">{project?.title}</h1>
          <Badge className={`text-[10px] ${
            status === 'RENDERING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse' :
            status === 'READY' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
            status === 'FAILED' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
            'bg-slate-500/20 text-slate-300 border-slate-500/40'}`}>
            {status}
          </Badge>
          {project?.isAiGenerated && (
            <Badge className="text-[10px] bg-purple-500/20 text-purple-400 border-purple-500/40">
              <Sparkles className="h-2.5 w-2.5 mr-1" /> AI DRAFT — editable
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-xl bg-black/40 border border-white/10 text-xs px-2"
            value={edl?.resolution || '720p'}
            onChange={(e) => saveEdl({ ...edl, resolution: e.target.value })}
          >
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
          </select>
          <Button size="sm" className="gap-1.5 text-[11px] font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
            onClick={() => renderMut.mutate()} disabled={renderMut.isPending || status === 'RENDERING' || !edl?.segments?.length}>
            {renderMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Film className="h-3 w-3" />}
            {status === 'RENDERING' ? 'Rendering...' : 'Export Render'}
          </Button>
        </div>
      </div>

      {/* Preview */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="hud-corners relative overflow-hidden rounded-3xl border border-white/10 bg-black/70 aspect-video">
        <video ref={previewRef} className="w-full h-full object-contain" playsInline preload="auto" onEnded={onPreviewEnded} />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <Button size="icon" className="h-10 w-10 rounded-full bg-emerald-500 text-black hover:bg-emerald-400 shadow-xl" onClick={startPreview}>
            <Play className="h-4 w-4" />
          </Button>
          <Badge className="text-[10px] bg-black/60 text-white border-white/20 font-mono">
            {playIdx + 1}/{edl?.segments?.length || 0} • {edl?.resolution || '720p'}
          </Badge>
        </div>
      </motion.div>

      {/* Render result */}
      {renderUrl && status === 'READY' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <p className="text-sm font-bold text-emerald-400">Final render ready — check your notifications too</p>
          </div>
          <video src={renderUrl} controls className="w-full max-h-72 rounded-2xl bg-black/60" playsInline />
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="text-[11px] gap-1.5 flex-1 min-w-[180px]" onClick={async () => {
              await navigator.clipboard.writeText(renderUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? 'Copied!' : 'Copy video link'}
            </Button>
            <a href={renderUrl} target="_blank" rel="noreferrer" className="flex-1 min-w-[180px]">
              <Button size="sm" className="w-full text-[11px] gap-1.5 font-extrabold">Open render</Button>
            </a>
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        <div className="space-y-4">
          {/* Video track */}
          <div className="rounded-3xl border border-white/10 bg-card/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> VIDEO TRACK
              </p>
              <span className="text-[10px] text-muted-foreground">{edl?.segments?.length || 0} segments</span>
            </div>
            {(!edl?.segments || edl.segments.length === 0) && (
              <div className="text-center py-6 border border-dashed border-border/60 rounded-2xl space-y-2">
                <p className="text-xs text-muted-foreground">Timeline is empty — add clips below</p>
                <Link href="/studio/clips" className="block">
                  <Button size="sm" variant="outline" className="text-[11px] gap-1.5"><Plus className="h-3 w-3" /> Browse clips</Button>
                </Link>
              </div>
            )}
            {edl?.segments?.map((seg: any, i: number) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-black/40 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <select className="h-7 rounded-lg bg-black/40 border border-white/10 text-[10px] px-1.5" value={seg.transition}
                        onChange={(e) => updateSegment(i, { transition: e.target.value })}>
                        {TRANSITIONS.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                      </select>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {Number(seg.start).toFixed(1)}s → {Number(seg.end).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveSegment(i, -1)} disabled={i === 0}><ArrowUp className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveSegment(i, 1)} disabled={i === edl.segments.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => removeSegment(i)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={seg.end} step={0.1} value={seg.start}
                    onChange={(e) => updateSegment(i, { start: Number(e.target.value) })}
                    className="flex-1 accent-emerald-500" />
                  <input type="range" min={seg.start} max={(seg.end + 60)} step={0.1} value={seg.end}
                    onChange={(e) => updateSegment(i, { end: Number(e.target.value) })}
                    className="flex-1 accent-red-500" />
                </div>
              </div>
            ))}
          </div>

          {/* Music track */}
          <div className="rounded-3xl border border-white/10 bg-card/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                <Headphones className="h-3.5 w-3.5" /> MUSIC TRACK
              </p>
              <Button size="sm" variant="ghost" className="text-[10px] gap-1.5 text-cyan-400" onClick={() => musicInputRef.current?.click()}
                disabled={musicBusy}>
                {musicBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload track
              </Button>
              <input ref={musicInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setMusicBusy(true); musicMut.mutate(f, { onSettled: () => setMusicBusy(false) }); }
              }} />
            </div>
            {edl?.music?.publicId ? (
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="text-[10px] bg-cyan-500/20 text-cyan-400 border-cyan-500/40">TRACK LOADED</Badge>
                <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                  <span className="text-[10px] text-muted-foreground shrink-0">Vol</span>
                  <Slider value={[edl.music.volume ?? 70]} min={0} max={100} step={5}
                    onValueChange={(v) => saveEdl({ ...edl, music: { ...edl.music, volume: v[0] } })} />
                  <span className="text-[10px] font-mono text-muted-foreground w-8">{edl.music.volume ?? 70}%</span>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => saveEdl({ ...edl, music: null })}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">No music — upload a track or skip (video audio is kept).</p>
            )}
          </div>

          {/* Overlay track */}
          <div className="rounded-3xl border border-white/10 bg-card/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-mono font-bold text-purple-400 flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5" /> TEXT OVERLAYS
              </p>
              <Button size="sm" variant="ghost" className="text-[10px] gap-1.5 text-purple-400" onClick={addOverlay}>
                <Plus className="h-3 w-3" /> Add text
              </Button>
            </div>
            {edl?.overlays?.length === 0 && (
              <p className="text-[11px] text-muted-foreground">No text overlays — burned into the render at export time.</p>
            )}
            {edl?.overlays?.map((o: any, i: number) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-black/40 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input value={o.text} className="h-8 text-xs flex-1" onChange={(e) => updateOverlay(i, { text: e.target.value })} />
                  <input type="color" value={o.color} onChange={(e) => updateOverlay(i, { color: e.target.value })} className="h-8 w-10 rounded-lg bg-black/40 border border-white/10" />
                  <select className="h-8 rounded-lg bg-black/40 border border-white/10 text-[10px] px-1"
                    value={o.fontSize} onChange={(e) => updateOverlay(i, { fontSize: Number(e.target.value) })}>
                    {[24, 36, 48, 64, 80].map(s => <option key={s} value={s}>{s}px</option>)}
                  </select>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => removeOverlay(i)}><Trash2 className="h-3 w-3" /></Button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground shrink-0">Start</span>
                  <input type="range" min={0} max={120} step={0.5} value={o.start} onChange={(e) => updateOverlay(i, { start: Number(e.target.value) })} className="flex-1 accent-purple-500" />
                  <span className="text-[10px] font-mono text-muted-foreground">{o.start}s</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clip library sidebar */}
        <div className="rounded-3xl border border-white/10 bg-card/40 p-4 h-fit space-y-3">
          <p className="text-[11px] font-mono font-bold text-muted-foreground">ADD FROM CLIP LIBRARY</p>
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {(clips || []).map((c: any) => (
              <button key={c.id} onClick={() => addSegment(c)}
                className="w-full text-left rounded-2xl border border-white/10 bg-black/40 overflow-hidden hover:border-emerald-500/50 transition-colors">
                <video src={c.trimmedUrl || c.sourceUrl} className="w-full aspect-video object-contain bg-black/60" muted playsInline preload="metadata" />
                <div className="p-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold truncate">{c.title}</span>
                  <Plus className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                </div>
              </button>
            ))}
            {(clips || []).length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-4">
                No clips yet — <Link href="/studio/clips" className="text-emerald-400 underline">upload one</Link>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Palette className="h-3 w-3 text-muted-foreground" />
            <Link href="/studio/clips" className="text-[11px] text-muted-foreground hover:text-emerald-400">Manage clips</Link>
          </div>
        </div>
      </div>
    </div>
  );
}