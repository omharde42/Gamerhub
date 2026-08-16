'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BackHeader } from '@/components/common/back-header';
import { Film, Plus, Play, Sparkles, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  RENDERING: 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse',
  READY: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  FAILED: 'bg-red-500/20 text-red-400 border-red-500/40',
};

export default function ProjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['montage-projects'],
    queryFn: () => api.get('/video/projects').then(r => r.data.data),
    refetchInterval: 15000,
  });
  const projects = data || [];

  const createMut = useMutation({
    mutationFn: () => {
      const edl = { segments: [], overlays: [], music: null, resolution: '720p', fps: 30 };
      return api.post('/video/projects', { title: title || 'Untitled montage', edl });
    },
    onSuccess: (res) => {
      toast.success('Montage project created');
      setOpen(false);
      setTitle('');
      router.push(`/studio/projects/${res.data.data.project.id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create project'),
  });

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-5">
      <BackHeader title="Montage Studio" />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold flex items-center gap-2">
            <Film className="h-5 w-5 text-emerald-400" /> Montage Projects
          </h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Combine clips, transitions, music and text overlays — renders run in the cloud and you get notified when ready.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-extrabold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create montage project</DialogTitle>
            </DialogHeader>
            <Input placeholder="Montage title (e.g. Clutch Plays 2026)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Button className="w-full gap-2 font-bold" disabled={createMut.isPending} onClick={() => createMut.mutate()}>
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </Button>
            <p className="text-xs text-muted-foreground">
              Tip: generate a draft automatically from a clip with the <Sparkles className="inline h-3 w-3" /> AI Highlights button in Clip Studio.
            </p>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 space-y-3 border border-dashed border-border/60 rounded-3xl">
          <Film className="h-10 w-10 text-muted-foreground/50 mx-auto" />
          <p className="font-semibold text-muted-foreground">No montage projects yet</p>
          <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto">
            Create a project, add clips to the timeline, then export a rendered video.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {projects.map((p: any, i: number) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={`/studio/projects/${p.id}`}>
                <Card className="overflow-hidden bg-card/60 border-white/10 hover:border-emerald-500/40 transition-colors" hover={false}>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold truncate">{p.title}</p>
                        {p.isAiGenerated && (
                          <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1 mt-0.5">
                            <Sparkles className="h-2.5 w-2.5" /> AI-GENERATED DRAFT
                          </span>
                        )}
                      </div>
                      <Badge className={`text-[10px] shrink-0 ${STATUS_STYLES[p.status] || STATUS_STYLES.DRAFT}`}>{p.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Film className="h-3 w-3" /> {(p.edl?.segments || []).length} segments</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(p.updatedAt).toLocaleDateString()}</span>
                      {p.renderUrl && (
                        <a href={p.renderUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1">
                          <Play className="h-3 w-3" /> Watch render
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}