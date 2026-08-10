'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Users, Trophy, MapPin, Shield, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';

const FEATURED_TEAMS = [
  {
    id: 'feat-1',
    name: 'Sentinels Esports',
    tag: 'SEN',
    description: 'Official Valorant & Apex Legends Pro Division. 2026 Masters Champions competing in global circuits.',
    avatar: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=80',
    game: 'Valorant',
    members: 5,
    rank: 'CHALLENGER',
    region: 'North America',
    winRate: '78%'
  },
  {
    id: 'feat-2',
    name: 'Fnatic Gaming',
    tag: 'FNC',
    description: 'Tier 1 European Esports Division. Reigning Masters & VCT Champions.',
    avatar: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150&auto=format&fit=crop&q=80',
    game: 'CS2 & Valorant',
    members: 6,
    rank: 'LEGEND',
    region: 'Europe',
    winRate: '82%'
  },
  {
    id: 'feat-3',
    name: 'Team Liquid',
    tag: 'TL',
    description: 'Global esports organization competing in League of Legends, Dota 2, and CS2.',
    avatar: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=150&auto=format&fit=crop&q=80',
    game: 'Dota 2 & CS2',
    members: 8,
    rank: 'MASTER',
    region: 'Global',
    winRate: '74%'
  },
  {
    id: 'feat-4',
    name: 'Paper Rex',
    tag: 'PRX',
    description: 'High-octane aggression squad from APAC. Known for chaotic W-gaming tactics.',
    avatar: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=150&auto=format&fit=crop&q=80',
    game: 'Valorant',
    members: 5,
    rank: 'GRANDMASTER',
    region: 'APAC',
    winRate: '76%'
  }
];

export default function TeamsPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', tag: '', description: '', region: '' });
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['teams', search],
    queryFn: () => api.get(`/teams?search=${search}`).then(r => r.data)
  });

  const createTeam = useMutation({
    mutationFn: () => api.post('/teams', form),
    onSuccess: () => {
      setShowCreate(false);
      setForm({ name: '', tag: '', description: '', region: '' });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team created!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create team')
  });

  const displayTeams = (teamsData?.data && teamsData.data.length > 0) ? teamsData.data : FEATURED_TEAMS;

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Shield className="h-6 w-6 text-emerald-400" />
            Teams & Esports Squads
          </h1>
          <p className="text-xs text-muted-foreground">Join competitive squads, form rosters, and participate in tournaments.</p>
        </div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button variant="gradient" className="gap-2 rounded-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <Plus className="h-4 w-4" /> Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-popup border-emerald-500/40">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" /> Create a Pro Squad
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-xs font-bold text-muted-foreground">Team Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sentinels Apex" className="mt-1 rounded-xl bg-card/60 border-white/10" />
              </div>
              <div>
                <Label className="text-xs font-bold text-muted-foreground">Tag (optional)</Label>
                <Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="e.g. SEN" maxLength={5} className="mt-1 rounded-xl bg-card/60 border-white/10" />
              </div>
              <div>
                <Label className="text-xs font-bold text-muted-foreground">Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell players about your team requirements..." className="mt-1 rounded-xl bg-card/60 border-white/10" />
              </div>
              <div>
                <Label className="text-xs font-bold text-muted-foreground">Region</Label>
                <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="e.g. NA, EU, APAC" className="mt-1 rounded-xl bg-card/60 border-white/10" />
              </div>
              <Button variant="gradient" className="w-full rounded-xl font-bold h-11 shadow-lg shadow-emerald-500/30" disabled={!form.name || createTeam.isPending} onClick={() => createTeam.mutate()}>
                {createTeam.isPending ? 'Creating Squad...' : 'Create Team'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search squads by name, game, region..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10 rounded-2xl bg-card/60 border-white/10" />
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {displayTeams.map((team: any, i: number) => (
          <motion.div key={team.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card variant="glass" className="hover:border-emerald-500/50 transition-all rounded-[28px] overflow-hidden group">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar className="h-14 w-14 border-2 border-emerald-500/30 shadow-lg shrink-0">
                      <AvatarImage src={team.avatar || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-extrabold text-lg">
                        {team.name?.charAt(0) || 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-foreground truncate group-hover:text-emerald-400 transition-colors">{team.name}</h3>
                        {team.tag && <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-2 py-0.5">{team.tag}</Badge>}
                      </div>
                      <p className="text-xs text-emerald-400/90 font-mono font-semibold mt-0.5">{team.game || 'Esports Division'}</p>
                    </div>
                  </div>

                  {team.winRate && (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground font-mono">WIN RATE</p>
                      <p className="text-sm font-extrabold text-emerald-400 font-mono">{team.winRate}</p>
                    </div>
                  )}
                </div>

                {team.description && (
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{team.description}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 font-semibold text-foreground"><Users className="h-3.5 w-3.5 text-emerald-400" />{team.members || team._count?.members || 5} players</span>
                    <span className="flex items-center gap-1 font-semibold text-foreground"><Trophy className="h-3.5 w-3.5 text-amber-400" />{team.rank || 'MASTER'}</span>
                    <span className="flex items-center gap-1 font-semibold text-foreground"><MapPin className="h-3.5 w-3.5 text-teal-400" />{team.region || 'Global'}</span>
                  </div>

                  <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-bold rounded-xl border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20">
                    Join Squad
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
