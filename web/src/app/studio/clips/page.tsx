'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BackHeader } from '@/components/common/back-header';
import { Scissors, Trash2, Sparkles, Upload, Film, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const MAX_SIZE = 2 * 1024 * 1024 * 1024;
const MAX_DURATION = 20 * 60;

export default function ClipsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['video-clips'],
    queryFn: () => api.get('/video/clips').then(r => r.data.data),
  });
  const clips = data || [];

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('video', file);
      return api.post('/video/clips/upload', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000 });
    },
    onSuccess: () => {
      toast.success('Clip uploaded!');
      queryClient.invalidateQueries({ queryKey: ['video-clips'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Upload failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/video/clips/${id}`),
    onSuccess: () => {
      toast.success('Clip deleted');
      queryClient.invalidateQueries({ queryKey: ['video-clips'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file (MP4, WebM, MOV...).');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('Video is too large. Maximum size is 2GB.');
      return;
    }
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      if (probe.duration > MAX_DURATION) {
        toast.error('Video is too long. Maximum duration is 20 minutes.');
        return;
      }
      setUploading(true);
      uploadMut.mutate(file, { onSettled: () => setUploading(false) });
    };
    probe.onerror = () => {
      setUploading(true);
      uploadMut.mutate(file, { onSettled: () => setUploading(false) });
    };
    probe.src = URL.createObjectURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-5">
      <BackHeader title="Clip Studio" />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="hud-corners relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-[#030509]/95 to-[#0A0E1D]/90 p-6">
        <div className="scanlines absolute inset-0 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-emerald-400" />
              <h1 className="text-xl font-extrabold">Gameplay Clips</h1>
              <Badge variant="outline" className="text-[10px] font-mono text-emerald-400 border-emerald-500/40">CLOUD LIBRARY</Badge>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Upload gameplay footage, trim it to a shareable length, or generate an AI highlight reel.
            </p>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="shrink-0 gap-2 font-extrabold rounded-2xl shadow-lg shadow-emerald-500/30 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading...' : 'Upload Clip'}
          </Button>
          <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : clips.length === 0 ? (
        <div className="text-center py-16 space-y-3 border border-dashed border-border/60 rounded-3xl">
          <Scissors className="h-10 w-10 text-muted-foreground/50 mx-auto" />
          <p className="font-semibold text-muted-foreground">No clips yet</p>
          <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto">
            Upload your first gameplay clip, then trim it or generate AI highlights.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {clips.map((clip: any, i: number) => (
            <motion.div key={clip.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="overflow-hidden bg-card/60 border-white/10" hover={false}>
                <Link href={`/studio/clips/${clip.id}/trim`} className="block relative aspect-video bg-black/60">
                  <video src={clip.trimmedUrl || clip.sourceUrl} className="w-full h-full object-contain" muted playsInline preload="metadata" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full truncate max-w-[70%]">{clip.title}</span>
                    {clip.durationSec && (
                      <span className="text-[10px] font-mono text-white bg-black/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />{Math.round(clip.durationSec)}s
                      </span>
                    )}
                  </div>
                  {clip.status === 'TRIMMED' && (
                    <Badge className="absolute top-2 right-2 text-[9px] bg-emerald-500/90 text-black">TRIMMED</Badge>
                  )}
                  {clip.status === 'FAILED' && (
                    <Badge className="absolute top-2 right-2 text-[9px] bg-red-500/90 text-white">FAILED</Badge>
                  )}
                </Link>
                <div className="p-3 flex items-center gap-1.5">
                  <Link href={`/studio/clips/${clip.id}/trim`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full text-[11px] gap-1.5">
                      <Scissors className="h-3 w-3" /> Trim
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost" className="text-[11px] gap-1.5" title="Generate AI highlights"
                    onClick={async () => {
                      toast.loading('Analyzing footage...');
                      try {
                        const res = await api.post(`/video/clips/${clip.id}/highlights`);
                        toast.dismiss();
                        toast.success('AI highlights draft created!');
                        router.push(`/studio/projects/${res.data.data.project.id}`);
                      } catch (err: any) {
                        toast.dismiss();
                        toast.error(err.response?.data?.message || 'AI analysis failed');
                      }
                    }}>
                    <Sparkles className="h-3 w-3 text-purple-400" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-[11px] text-red-400" title="Delete"
                    onClick={() => { if (confirm('Delete this clip?')) deleteMut.mutate(clip.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-2 pt-2">
        <Link href="/studio"><Button variant="ghost" size="sm" className="text-xs gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Back to Recorder</Button></Link>
        <Link href="/studio/projects"><Button variant="ghost" size="sm" className="text-xs gap-1.5"><Film className="h-3.5 w-3.5" /> Montage Projects</Button></Link>
      </div>
    </div>
  );
}