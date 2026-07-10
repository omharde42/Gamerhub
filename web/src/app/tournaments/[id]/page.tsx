'use client';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Trophy, Gamepad2, Users, DollarSign, Calendar, Swords } from 'lucide-react';
import { formatDate, formatNumber, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { data: tournament, isLoading } = useQuery({ queryKey: ['tournament', id], queryFn: () => api.get(`/tournaments/${id}`).then(r => r.data.data) });
  const registerMut = useMutation({ mutationFn: () => api.post(`/tournaments/${id}/register`, { teamId: '' }), onSuccess: () => toast.success('Registered!'), onError: (err: any) => toast.error(err.response?.data?.message || 'Failed') });

  if (isLoading) return <div className="max-w-4xl mx-auto space-y-6"><Skeleton className="h-48" /><Skeleton className="h-96" /></div>;
  if (!tournament) return <div className="text-center py-20"><h2 className="text-2xl font-bold">Tournament not found</h2></div>;

  return (<div className="max-w-4xl mx-auto space-y-6">
    <Card className="glass-card overflow-hidden"><div className="h-32 bg-gradient-to-r from-gaming-purple via-gaming-pink to-gaming-blue" /><CardContent className="relative px-6 pb-6 -mt-8"><div className="flex flex-col md:flex-row md:items-end gap-4 mb-4"><div className="w-16 h-16 rounded-2xl bg-background border-4 border-background flex items-center justify-center"><Trophy className="h-8 w-8 text-yellow-500" /></div><div className="flex-1"><h1 className="text-2xl font-bold">{tournament.title}</h1><div className="flex flex-wrap gap-2 mt-1"><Badge variant={tournament.status === 'REGISTRATION_OPEN' ? 'success' : 'secondary'}>{tournament.status}</Badge><Badge variant="outline">{tournament.type?.replace('_', ' ')}</Badge></div></div>{tournament.status === 'REGISTRATION_OPEN' && <Button variant="default" onClick={() => registerMut.mutate()}>Register Team</Button>}</div><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"><div className="flex items-center gap-2"><Gamepad2 className="h-4 w-4 text-muted-foreground" /><span>{tournament.game}</span></div><div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span>{tournament.teams?.length || 0}/{tournament.maxTeams} Teams</span></div><div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" /><span>${formatNumber(tournament.prizePool)} Prize Pool</span></div><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{formatDate(tournament.startDate)}</span></div></div></CardContent></Card>

    <Card className="glass-card"><CardHeader><CardTitle>Registered Teams ({tournament.teams?.length || 0})</CardTitle></CardHeader><CardContent><div className="grid md:grid-cols-2 gap-4">{tournament.teams?.map((tt: any, i: number) => (<div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border"><Avatar className="h-12 w-12"><AvatarImage src={tt.team?.avatar || ''} /><AvatarFallback>{getInitials(tt.team?.name || 'T')}</AvatarFallback></Avatar><div><p className="font-medium">{tt.team?.name}</p><p className="text-xs text-muted-foreground">{tt.members?.length || 0} players</p></div></div>))}</div></CardContent></Card>

    {tournament.matches?.length > 0 && (<Card className="glass-card"><CardHeader><CardTitle>Brackets</CardTitle></CardHeader><CardContent><div className="space-y-2">{tournament.matches.map((match: any, i: number) => (<div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border"><div className="flex items-center gap-4"><Badge variant="outline">R{match.round}</Badge><span className="font-medium text-sm">{match.team1?.team?.name || 'TBD'}</span><Swords className="h-4 w-4 text-muted-foreground" /><span className="font-medium text-sm">{match.team2?.team?.name || 'TBD'}</span></div><Badge variant={match.status === 'COMPLETED' ? 'success' : 'secondary'}>{match.status}</Badge></div>))}</div></CardContent></Card>)}
  </div>);
}
