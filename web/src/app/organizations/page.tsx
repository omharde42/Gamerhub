'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Search, Plus, Verified, Users, Briefcase } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function OrganizationsPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', website: '', location: '' });
  const queryClient = useQueryClient();
  const { data: orgsData } = useQuery({ queryKey: ['organizations', search], queryFn: () => api.get(`/organizations?search=${search}`).then(r => r.data) });
  const createOrg = useMutation({ mutationFn: () => api.post('/organizations', form), onSuccess: () => { setShowCreate(false); setForm({ name: '', description: '', website: '', location: '' }); queryClient.invalidateQueries({ queryKey: ['organizations'] }); toast.success('Organization created!'); }, onError: (err: any) => toast.error(err.response?.data?.message || 'Failed') });

  return (<div className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Organizations</h1><Dialog open={showCreate} onOpenChange={setShowCreate}><DialogTrigger asChild><Button variant="default" className="gap-2"><Plus className="h-4 w-4" />Create Organization</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Create Organization</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>Organization Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div><div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div><div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div><Button variant="default" className="w-full" disabled={!form.name || createOrg.isPending} onClick={() => createOrg.mutate()}>Create</Button></div></DialogContent></Dialog></div>
    <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search organizations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{orgsData?.data?.map((org: any, i: number) => (<motion.div key={org.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}><Link href={`/organizations/${org.slug}`}><Card className="glass-card hover:border-gaming-purple/50 transition-all"><CardContent className="p-6 space-y-4"><div className="flex items-center gap-3"><div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center text-2xl font-bold">{org.name?.charAt(0)}</div><div><h3 className="font-semibold">{org.name}</h3>{org.verified && <Badge variant="success" className="gap-1"><Verified className="h-3 w-3" />Verified</Badge>}</div></div>{org.description && <p className="text-sm text-muted-foreground line-clamp-2">{org.description}</p>}<div className="flex gap-3 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Users className="h-4 w-4" />{org._count?.members || 0}</span><span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{org._count?.jobs || 0} jobs</span></div></CardContent></Card></Link></motion.div>))}</div></div>);
}
