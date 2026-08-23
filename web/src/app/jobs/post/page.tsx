'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, ArrowLeft, Loader2, CalendarClock, MapPin, DollarSign, Shield } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Link from 'next/link';

const JOB_TYPES = [
  { value: 'PLAYER', label: 'Player' },
  { value: 'COACH', label: 'Coach' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'CASTER', label: 'Caster' },
  { value: 'ANALYST', label: 'Analyst' },
  { value: 'CONTENT_CREATOR', label: 'Content Creator' },
  { value: 'OTHER', label: 'Other' },
];

function JobPostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(Boolean(editId));

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'PLAYER',
    game: '',
    location: '',
    salary: '',
    rankRequired: '',
    requirements: '',
    expiresAt: '',
  });

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const { data } = await api.get(`/jobs/${editId}`);
        const job = data.data;
        setFormData({
          title: job.title || '',
          description: job.description || '',
          type: job.type || 'PLAYER',
          game: job.game || '',
          location: job.location || '',
          salary: job.salary || '',
          rankRequired: job.rankRequired || '',
          requirements: Array.isArray(job.requirements) ? job.requirements.join(', ') : '',
          expiresAt: job.expiresAt ? new Date(job.expiresAt).toISOString().slice(0, 10) : '',
        });
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to load job');
      } finally {
        setFetching(false);
      }
    })();
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in the required fields (title & description).');
      return;
    }
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      game: formData.game.trim() || undefined,
      location: formData.location.trim() || undefined,
      salary: formData.salary.trim() || undefined,
      rankRequired: formData.rankRequired.trim() || undefined,
      requirements: formData.requirements.split(',').map((s) => s.trim()).filter(Boolean),
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
    };

    setLoading(true);
    try {
      if (editId) {
        await api.put(`/jobs/${editId}`, payload);
        toast.success('Job updated successfully!');
      } else {
        await api.post('/jobs', payload);
        toast.success('Job posted successfully!');
      }
      router.push('/jobs');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (typeof msg === 'string') {
        toast.error(msg);
      } else if (msg?.organizationId?.[0]) {
        toast.error(msg.organizationId[0]);
      } else {
        toast.error('Failed to save job');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-emerald-400" />
            {editId ? 'Edit Job' : 'Post a Job'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {editId ? 'Update your job posting' : 'Publish an esports career opportunity'}
          </p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass" className="border-border/60">
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>
              Job posts are listed under the organization you own. Make sure you have created one on the{' '}
              <Link href="/organizations" className="text-emerald-400 hover:underline">Organizations</Link> page first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Head Coach - Valorant Pro Division"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Job Type *</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select Job Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="game">Game</Label>
                  <Input
                    id="game"
                    placeholder="e.g. Valorant, CS2"
                    value={formData.game}
                    onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="Remote / Los Angeles"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary" className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" /> Salary Range
                  </Label>
                  <Input
                    id="salary"
                    placeholder="$75,000 - $110,000 / yr"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rankRequired">Rank Requirement</Label>
                  <Input
                    id="rankRequired"
                    placeholder="e.g. Immortal 3+"
                    value={formData.rankRequired}
                    onChange={(e) => setFormData({ ...formData, rankRequired: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiresAt" className="flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" /> Application Deadline
                  </Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Role overview, responsibilities, what you're looking for..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements" className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" /> Requirements & Skills
                </Label>
                <Textarea
                  id="requirements"
                  placeholder="Comma-separated: e.g. 2+ years coaching, VCT experience, English fluency"
                  rows={2}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Link href="/jobs">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" variant="gradient" disabled={loading} className="gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Briefcase className="h-4 w-4" />}
                  {editId ? 'Save Changes' : 'Publish Job'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function PostJobPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <JobPostForm />
    </Suspense>
  );
}
