'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Briefcase, ArrowLeft, Loader2, Send, MapPin, DollarSign, Building2, Shield, CalendarClock } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ApplyJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [message, setMessage] = useState('');
  const [resume, setResume] = useState('');

  const { data: jobData, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.get(`/jobs/${jobId}`).then((r) => r.data.data),
    enabled: Boolean(jobId),
  });
  const job = jobData;

  const applyMut = useMutation({
    mutationFn: () => api.post(`/jobs/${jobId}/apply`, { message: message.trim(), resume: resume.trim() || undefined }),
    onSuccess: () => {
      toast.success('Application submitted successfully!');
      router.push('/jobs');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to submit application'),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <Briefcase className="h-12 w-12 text-muted-foreground mx-auto" />
        <h1 className="text-xl font-bold">Job not found</h1>
        <Link href="/jobs"><Button variant="outline">Back to Jobs</Button></Link>
      </div>
    );
  }

  const expired = job.expiresAt && new Date(job.expiresAt).getTime() < Date.now();
  const closed = job.status && job.status !== 'OPEN';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-emerald-400" />
            Apply
          </h1>
          <p className="text-xs text-muted-foreground">Submit your application for this position</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass" className="border-border/60">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="min-w-0 space-y-1">
                <h2 className="font-extrabold text-lg">{job.title}</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="font-bold text-foreground">{job.organization?.name || 'Organization'}</span>
                  {job.organization?.verified && (
                    <Badge variant="outline" className="text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-2 py-0.5 gap-1">
                      <Shield className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] font-mono">{job.type}</Badge>
                  {job.game && <Badge variant="secondary" className="text-[10px] font-mono">{job.game}</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-1">
                  {job.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-emerald-400" /> {job.location}</span>}
                  {job.salary && <span className="flex items-center gap-1 font-bold text-emerald-400 font-mono"><DollarSign className="h-3.5 w-3.5" /> {job.salary}</span>}
                  {job.expiresAt && <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5 text-amber-400" /> Deadline: {new Date(job.expiresAt).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{job.description}</p>
          </CardContent>
        </Card>
      </motion.div>

      {(expired || closed) && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 text-sm text-amber-300">
            {expired ? 'This job posting has expired and is no longer accepting applications.' : `This job is no longer accepting applications (status: ${job.status.replace(/_/g, ' ').toLowerCase()}).`}
          </CardContent>
        </Card>
      )}

      {!(expired || closed) && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card variant="glass" className="border-border/60">
            <CardHeader>
              <CardTitle>Your Application</CardTitle>
              <CardDescription>Tell the organization why you're a great fit.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-5"
                onSubmit={(e) => { e.preventDefault(); applyMut.mutate(); }}
              >
                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Introduce yourself, your experience, and why you're applying..."
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resume">Resume / Portfolio URL</Label>
                  <Input
                    id="resume"
                    placeholder="https://yourportfolio.com or a link to your GamerPassport"
                    value={resume}
                    onChange={(e) => setResume(e.target.value)}
                  />
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <Link href="/jobs">
                    <Button type="button" variant="outline">Cancel</Button>
                  </Link>
                  <Button type="submit" variant="gradient" disabled={applyMut.isPending || !message.trim()} className="gap-2">
                    {applyMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Submit Application
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
