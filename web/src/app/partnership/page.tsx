'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { BackHeader } from '@/components/common/back-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Handshake, Sparkles, Loader2, CheckCircle2, Clock, XCircle, Building2, Volume2, Send, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

type ApplicationType = 'PARTNERSHIP' | 'SPONSORSHIP';
type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

const STATUS_CONFIG: Record<Status, { label: string; className: string; icon: any }> = {
  PENDING: { label: 'Under Review', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Clock },
  APPROVED: { label: 'Approved', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  REJECTED: { label: 'Not Approved', className: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle },
};

const emptyForm = {
  type: 'PARTNERSHIP' as ApplicationType,
  organizationName: '',
  contactName: '',
  contactEmail: '',
  website: '',
  description: '',
  audience: '',
};

export default function PartnershipPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: program } = useQuery({
    queryKey: ['partnership-program'],
    queryFn: () => api.get('/partnerships/program').then((r) => r.data.data),
    retry: false,
  });

  const { data: myApps = [], isLoading: appsLoading, refetch: refetchApps } = useQuery({
    queryKey: ['partnership-my'],
    queryFn: () => api.get('/partnerships/my').then((r) => r.data.data || []),
    retry: false,
  });

  const submit = useMutation({
    mutationFn: () =>
      api.post('/partnerships/apply', {
        type: form.type,
        organizationName: form.organizationName,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        website: form.website.trim() || undefined,
        description: form.description,
        audience: form.audience.trim() || undefined,
      }).then((r) => r.data.data),
    onSuccess: () => {
      toast.success('Application submitted! Our team will review it shortly.');
      setForm(emptyForm);
      setFieldErrors({});
      refetchApps();
    },
    onError: (err: any) => {
      const data = err.response?.data;
      if (data?.errors) {
        setFieldErrors(data.errors);
      } else {
        toast.error(data?.message || 'Could not submit the application. Please try again.');
      }
    },
  });

  const set = (key: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const canSubmit =
    form.type &&
    form.organizationName.trim() &&
    form.contactName.trim() &&
    form.contactEmail.trim() &&
    form.description.trim() &&
    !submit.isPending;

  const prog = program?.program || {};
  const partnershipInfo = prog.partnership;
  const sponsorshipInfo = prog.sponsorship;

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-0 space-y-5 pb-16 md:pb-6">
      <BackHeader title="Partnership & Sponsorship" />

      {/* Hero */}
      <div className="rounded-[28px] bg-card/80 border border-primary/20 p-5 relative overflow-hidden backdrop-blur-2xl shadow-xl">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gaming-purple to-gaming-pink flex items-center justify-center shadow-lg shadow-gaming-purple/30 shrink-0">
            <Handshake className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold tracking-tight">Partnership & Sponsorship</h1>
            <p className="text-xs text-muted-foreground">
              Grow with GamerZ Hub — partner your brand, organization or tournament with our community.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="apply" className="space-y-4">
        <TabsList className="w-full bg-card/60 border border-white/10 p-1 rounded-2xl grid grid-cols-3 gap-1">
          <TabsTrigger value="apply" className="rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold gap-1.5 text-xs">
            <Send className="h-3.5 w-3.5" /> Apply
          </TabsTrigger>
          <TabsTrigger value="program" className="rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Programs
          </TabsTrigger>
          <TabsTrigger value="status" className="rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" /> My Applications
            {myApps.length > 0 && (
              <span className="h-4 min-w-[16px] px-1 rounded-full bg-primary text-white text-[9px] font-extrabold flex items-center justify-center">{myApps.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Apply */}
        <TabsContent value="apply" className="mt-0 outline-none">
          <Card className="border-white/10">
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap gap-2">
                {([
                  { value: 'PARTNERSHIP', label: '🤝 Partnership', desc: 'Brand / org / creator' },
                  { value: 'SPONSORSHIP', label: '📢 Sponsorship', desc: 'Sponsor events & teams' },
                ] as const).map((opt) => {
                  const active = form.type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('type', opt.value)}
                      className={`flex-1 min-w-[140px] rounded-2xl border p-3 text-left transition-all ${
                        active ? 'border-primary bg-primary/10 ring-1 ring-primary/40' : 'border-white/10 bg-black/30 hover:border-white/25'
                      }`}
                    >
                      <p className="text-xs font-bold">{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Organization / Brand Name *</Label>
                  <Input value={form.organizationName} onChange={(e) => set('organizationName', e.target.value)} placeholder="e.g. Neon Esports" className="bg-black/30 border-white/10 text-xs" />
                  {fieldErrors.organizationName && <p className="text-[11px] text-destructive">{fieldErrors.organizationName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Contact Name *</Label>
                  <Input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder="Your name" className="bg-black/30 border-white/10 text-xs" />
                  {fieldErrors.contactName && <p className="text-[11px] text-destructive">{fieldErrors.contactName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Contact Email *</Label>
                  <Input type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} placeholder="you@company.com" className="bg-black/30 border-white/10 text-xs" />
                  {fieldErrors.contactEmail && <p className="text-[11px] text-destructive">{fieldErrors.contactEmail}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Website</Label>
                  <Input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://..." className="bg-black/30 border-white/10 text-xs" />
                  {fieldErrors.website && <p className="text-[11px] text-destructive">{fieldErrors.website}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Description / Proposal *</Label>
                <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Tell us about your organization, goals and what you'd like to achieve together." className="bg-black/30 border-white/10 text-xs min-h-[100px] resize-none" />
                {fieldErrors.description && <p className="text-[11px] text-destructive">{fieldErrors.description}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Audience / Reach <span className="normal-case font-normal">(optional)</span></Label>
                <Input value={form.audience} onChange={(e) => set('audience', e.target.value)} placeholder="e.g. 50K followers across Twitch & YouTube" className="bg-black/30 border-white/10 text-xs" />
              </div>

              <Button
                variant="gradient"
                animate
                onClick={() => submit.mutate()}
                disabled={!canSubmit}
                className="w-full h-11 gap-2 font-bold"
              >
                {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit Application
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                Applications are reviewed by the GamerZ Hub team. You will be notified when your status changes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Programs */}
        <TabsContent value="program" className="mt-0 outline-none">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-gaming-purple/30 bg-gradient-to-br from-gaming-purple/10 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4 text-gaming-purple" /> {partnershipInfo?.title || 'Partnership Program'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">{partnershipInfo?.description}</p>
                <ul className="space-y-1.5">
                  {(partnershipInfo?.benefits || []).map((b: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-gaming-cyan/30 bg-gradient-to-br from-gaming-cyan/10 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Volume2 className="h-4 w-4 text-gaming-cyan" /> {sponsorshipInfo?.title || 'Sponsorship Opportunities'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">{sponsorshipInfo?.description}</p>
                <ul className="space-y-1.5">
                  {(sponsorshipInfo?.benefits || []).map((b: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          {!partnershipInfo && !sponsorshipInfo && (
            <Card className="mt-4"><CardContent className="p-6 text-xs text-muted-foreground text-center">
              Program details are being prepared. Apply now and our team will reach out.
            </CardContent></Card>
          )}
        </TabsContent>

        {/* My Applications */}
        <TabsContent value="status" className="mt-0 outline-none">
          {appsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : myApps.length === 0 ? (
            <EmptyState
              title="No applications yet"
              description="Submit a partnership or sponsorship application and track its status here."
              icon={FileText}
            />
          ) : (
            <div className="space-y-3">
              {myApps.map((app: any) => {
                const cfg = STATUS_CONFIG[app.status as Status] || STATUS_CONFIG.PENDING;
                const StatusIcon = cfg.icon;
                return (
                  <Card key={app.id} className="border-white/10">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold">{app.organizationName}</h3>
                            <Badge variant="outline" className="text-[9px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                              {app.type === 'PARTNERSHIP' ? '🤝 Partnership' : '📢 Sponsorship'}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">{app.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-1.5">Submitted {formatDate(app.createdAt)}</p>
                          {app.adminNote && (
                            <p className="text-[11px] text-muted-foreground italic mt-2 border-l-2 border-primary/40 pl-2">Team note: {app.adminNote}</p>
                          )}
                        </div>
                        <Badge className={`text-[10px] font-bold border ${cfg.className} shrink-0 gap-1`}>
                          <StatusIcon className="h-3 w-3" /> {cfg.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
