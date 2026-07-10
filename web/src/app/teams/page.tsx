'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Users, Trophy, MapPin, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function TeamsPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', tag: '', description: '', region: '' });
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: teamsData } = useQuery({ queryKey: ['teams', search], queryFn: () => api.get(`/teams?search=${search}`).then(r => r.data) });
  const createTeam = useMutation({ mutationFn: () => api.post('/teams', form), onSuccess: () => { setShowCreate(false); setForm({ name: '', tag: '', description: '', region: '' }); queryClient.invalidateQueries({ queryKey: ['teams'] }); toast.success('Team created!'); }, onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create team') });

  return (<div className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Teams</h1><Dialog open={showCreate} onOpenChange={setShowCreate}><DialogTrigger asChild><Button variant="default" className="gap-2"><Plus className="h-4 w-4" />Create Team</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Create a Team</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>Team Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter team name" /></div><div><Label>Tag (optional)</Label><Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="e.g. T1" maxLength={5} /></div><div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell players about your team..." /></div><div><Label>Region</Label><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="e.g. NA, EU" /></div><Button variant="default" className="w-full" disabled={!form.name || createTeam.isPending} onClick={() => createTeam.mutate()}>Create Team</Button></div></DialogContent></Dialog></div>

    <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search teams..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{teamsData?.data?.map((team: any, i: number) => (<motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}><Link href={`/teams/${team.id}`}><Card className="glass-card hover:border-gaming-purple/50 transition-all"><CardContent className="p-6 space-y-4"><div className="flex items-center gap-3"><Avatar className="h-14 w-14 border-2 border-border"><AvatarImage src={team.avatar || ''} /><AvatarFallback className="bg-primary/10 text-primary">{team.name?.charAt(0) || 'T'}</AvatarFallback></Avatar><div><h3 className="font-semibold text-lg">{team.name}</h3>{team.tag && <Badge variant="outline" className="text-xs">{team.tag}</Badge>}</div></div>{team.description && <p className="text-sm text-muted-foreground line-clamp-2">{team.description}</p>}<div className="flex items-center gap-3 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Users className="h-4 w-4" />{team._count?.members || 0} members</span>{team.rank && <span className="flex items-center gap-1"><Trophy className="h-4 w-4" />{team.rank}</span>}{team.region && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{team.region}</span>}</div></CardContent></Card></Link></motion.div>))}</div></div>);
}
