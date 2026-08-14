'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Trophy, Gamepad2, Users, DollarSign, Calendar, Swords, Shield, Star, Clock, CheckCircle2, ChevronRight, Share2 } from 'lucide-react';
import { formatDate, formatNumber, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { BackHeader } from '@/components/common/back-header';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const DEFAULT_MATCHES = [
  { id: 'm1', round: 1, roundName: 'Quarterfinals', team1: { name: 'Sentinels Esports', score: 2 }, team2: { name: 'Paper Rex', score: 1 }, winner: 'Sentinels Esports', status: 'COMPLETED' },
  { id: 'm2', round: 1, roundName: 'Quarterfinals', team1: { name: 'Fnatic Gaming', score: 2 }, team2: { name: 'DRX Korea', score: 0 }, winner: 'Fnatic Gaming', status: 'COMPLETED' },
  { id: 'm3', round: 1, roundName: 'Quarterfinals', team1: { name: 'Team Liquid', score: 1 }, team2: { name: 'Optic Gaming', score: 2 }, winner: 'Optic Gaming', status: 'COMPLETED' },
  { id: 'm4', round: 1, roundName: 'Quarterfinals', team1: { name: 'LOUD Brazil', score: 2 }, team2: { name: 'Natus Vincere', score: 1 }, winner: 'LOUD Brazil', status: 'COMPLETED' },
  { id: 'm5', round: 2, roundName: 'Semifinals', team1: { name: 'Sentinels Esports', score: 2 }, team2: { name: 'Fnatic Gaming', score: 1 }, winner: 'Sentinels Esports', status: 'COMPLETED' },
  { id: 'm6', round: 2, roundName: 'Semifinals', team1: { name: 'Optic Gaming', score: 0 }, team2: { name: 'LOUD Brazil', score: 2 }, winner: 'LOUD Brazil', status: 'COMPLETED' },
  { id: 'm7', round: 3, roundName: 'Grand Finals 🏆', team1: { name: 'Sentinels Esports', score: 3 }, team2: { name: 'LOUD Brazil', score: 2 }, winner: 'Sentinels Esports', status: 'LIVE CHAMPION' },
];

export default function TournamentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showRegModal, setShowRegModal] = useState(false);

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => api.get(`/tournaments/${id}`).then((r) => r.data.data),
    refetchInterval: 15000,
  });

  const registerMut = useMutation({
    mutationFn: () => api.post(`/tournaments/${id}/register`, {}),
    onSuccess: () => {
      setShowRegModal(false);
      toast.success('Successfully registered for this tournament!');
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Registration failed'),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  const tourney = tournament || {
    id: id as string,
    title: 'Wox Sorning Team Masters 2026',
    game: 'Valorant',
    status: 'REGISTRATION_OPEN',
    type: 'SINGLE_ELIMINATION',
    prizePool: 50000,
    maxTeams: 16,
    teams: [
      { team: { name: 'Sentinels Esports', avatar: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=80' }, membersCount: 5 },
      { team: { name: 'Fnatic Gaming', avatar: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150&auto=format&fit=crop&q=80' }, membersCount: 6 },
      { team: { name: 'Team Liquid', avatar: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=150&auto=format&fit=crop&q=80' }, membersCount: 5 },
      { team: { name: 'Paper Rex', avatar: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=150&auto=format&fit=crop&q=80' }, membersCount: 5 },
    ],
    startDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    matches: DEFAULT_MATCHES,
  };

  const matchesList = tourney.matches && tourney.matches.length > 0 ? tourney.matches : DEFAULT_MATCHES;

  const teamCount = tourney.teams?.length || 0;
  const participantCount = tourney.participants?.length || 0;
  const filledSpots = teamCount + participantCount;
  const isFull = filledSpots >= (tourney.maxTeams || 16);
  const isRegistered = !!user && (tourney.participants || []).some((p: any) => p.user?.id === user.id);
  const registrationOpen = tourney.status === 'REGISTRATION_OPEN' || tourney.status === 'DRAFT' || !tourney.status;

  return (
    <div className="max-w-5xl mx-auto space-y-6 overflow-x-hidden">
      {/* Dynamic Back Header */}
      <BackHeader title="Tournament Arena" />

      {/* Hero Banner */}
      <Card variant="glass" className="overflow-hidden rounded-[32px] border border-emerald-500/40 shadow-2xl relative">
        <div className="h-44 bg-gradient-to-r from-[#030509] via-[#0A0E1D] to-[#0F172A] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.25),transparent_70%)]" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Badge className="bg-emerald-500 text-black font-extrabold text-xs px-3 py-1 rounded-full shadow-lg">
              ${formatNumber(tourney.prizePool || 50000)} PRIZE POOL
            </Badge>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60" onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Tournament link copied!');
            }}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CardContent className="relative px-6 sm:px-8 pb-6 -mt-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
            <div className="flex items-end gap-4 min-w-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-xl shrink-0">
                <div className="w-full h-full rounded-[14px] bg-[#0A0E17] flex items-center justify-center">
                  <Trophy className="h-10 w-10 text-emerald-400" />
                </div>
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border-emerald-500/40 px-2.5 py-0.5 font-bold">
                    🟢 {tourney.status?.replace('_', ' ') || 'REGISTRATION OPEN'}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-mono bg-card text-slate-300 border border-white/10 px-2.5 py-0.5">
                    {tourney.type?.replace('_', ' ') || 'SINGLE ELIMINATION'}
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground truncate">{tourney.title}</h1>
              </div>
            </div>

            <Button
              variant="gradient"
              size="lg"
              className="font-extrabold rounded-2xl gap-2 shadow-lg shadow-emerald-500/30 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shrink-0"
              onClick={() => setShowRegModal(true)}
              disabled={isFull || isRegistered || !registrationOpen}
            >
              {isRegistered ? <CheckCircle2 className="h-5 w-5" /> : <Swords className="h-5 w-5" />}
              {isRegistered ? 'Registered' : isFull ? 'Tournament Full' : !registrationOpen ? 'Registration Closed' : 'Register Now'}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-card/60 border border-white/10 text-xs">
            <div className="flex items-center gap-2.5">
              <Gamepad2 className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-[10px] text-muted-foreground font-mono">GAME</p>
                <p className="font-bold text-foreground">{tourney.game}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-[10px] text-muted-foreground font-mono">SQUADS</p>
                <p className="font-bold text-foreground">{filledSpots}/{tourney.maxTeams || 16} Teams</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-[10px] text-muted-foreground font-mono">ENTRY FEE</p>
                <p className="font-bold text-emerald-400">FREE ENTRY</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-[10px] text-muted-foreground font-mono">START DATE</p>
                <p className="font-bold text-foreground">{formatDate(tourney.startDate)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Bracket Visualizer */}
      <Card variant="glass" className="rounded-[32px]">
        <CardHeader className="pb-3 border-b border-white/10 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-extrabold flex items-center gap-2">
            <Swords className="h-5 w-5 text-emerald-400" /> Live Tournament Brackets Tree
          </CardTitle>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-mono">
            4-ROUND BRACKET
          </Badge>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-6">
            {['Quarterfinals', 'Semifinals', 'Grand Finals 🏆'].map((roundLabel, rIdx) => {
              const roundMatches = matchesList.filter((m: any) => m.roundName?.includes(roundLabel) || m.round === (rIdx + 1));
              return (
                <div key={rIdx} className="space-y-3">
                  <h4 className="text-xs font-extrabold font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <Trophy className="h-3.5 w-3.5" /> {roundLabel}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {roundMatches.map((match: any) => (
                      <div key={match.id} className="p-3.5 rounded-2xl bg-card/70 border border-white/10 hover:border-emerald-500/40 transition-all space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold p-1.5 rounded-xl bg-card/60">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="truncate text-foreground">{match.team1?.name || match.team1?.team?.name || 'TBD'}</span>
                          </div>
                          <span className="font-mono text-emerald-400 font-extrabold text-sm ml-2">{match.team1?.score ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold p-1.5 rounded-xl bg-card/60">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-teal-500" />
                            <span className="truncate text-foreground">{match.team2?.name || match.team2?.team?.name || 'TBD'}</span>
                          </div>
                          <span className="font-mono text-emerald-400 font-extrabold text-sm ml-2">{match.team2?.score ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                          <span className="font-mono text-emerald-400/90 font-semibold">Winner: {match.winner}</span>
                          <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            {match.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Registered Teams Grid */}
      <Card variant="glass" className="rounded-[32px]">
        <CardHeader className="pb-3 border-b border-white/10">
          <CardTitle className="text-base font-extrabold flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" /> Registered Teams Roster ({filledSpots}/{tourney.maxTeams || 16})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
            {(tourney.teams || []).map((tItem: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl bg-card/60 border border-white/10 hover:border-emerald-500/40 transition-all">
                <Avatar className="h-12 w-12 border border-emerald-500/30 shadow-md">
                  <AvatarImage src={tItem.team?.avatar || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold">
                    {getInitials(tItem.team?.name || 'T')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-foreground truncate">{tItem.team?.name || 'Pro Team'}</p>
                  <p className="text-xs text-emerald-400 font-mono font-semibold">{tItem.membersCount || 5} Verified Roster Players</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  SEED #{i + 1}
                </Badge>
              </div>
            ))}
            {(tourney.participants || []).map((pItem: any) => (
              <div key={pItem.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-card/60 border border-white/10 transition-all">
                <Avatar className="h-12 w-12 border border-emerald-500/30 shadow-md">
                  <AvatarImage src={pItem.user?.profile?.avatar || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-700 text-white font-bold">
                    {getInitials(pItem.user?.profile?.username || pItem.user?.id || 'P')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-foreground truncate">{pItem.user?.profile?.username || 'Player'}</p>
                  <p className="text-xs text-emerald-400 font-mono font-semibold">Individual Player</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              </div>
            ))}
            {filledSpots === 0 && (
              <p className="text-xs text-muted-foreground col-span-full">No teams registered yet. Be the first!</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Registration Dialog Modal */}
      <Dialog open={showRegModal} onOpenChange={setShowRegModal}>
        <DialogContent className="glass-popup border-emerald-500/40">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <Trophy className="h-6 w-6 text-emerald-400" /> Confirm Squad Tournament Registration
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-300 leading-relaxed">
              You are registering for <strong className="text-emerald-400">{tourney.title}</strong>. Registration is free and your spot is confirmed immediately.
            </p>
            <div className="p-3.5 rounded-2xl bg-card/60 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Tournament</span>
                <span className="font-bold text-foreground">{tourney.title}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Game</span>
                <span className="font-bold text-emerald-400">{tourney.game}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Spots Left</span>
                <span className="font-bold text-emerald-400">{Math.max((tourney.maxTeams || 16) - filledSpots, 0)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Entry Fee</span>
                <span className="font-bold text-emerald-400">FREE ENTRY</span>
              </div>
            </div>
            <Button
              variant="gradient"
              className="w-full rounded-2xl font-extrabold h-11 shadow-lg shadow-emerald-500/30 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              disabled={registerMut.isPending}
              onClick={() => registerMut.mutate()}
            >
              {registerMut.isPending ? 'Registering...' : 'Confirm Registration'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
