'use client';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Trophy, Users, MapPin, Calendar, Swords, Shield, Crown, UserPlus, LogOut } from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function TeamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: team, isLoading } = useQuery({ queryKey: ['team', id], queryFn: () => api.get(`/teams/${id}`).then(r => r.data.data) });
  const joinTeam = useMutation({ mutationFn: () => api.post(`/teams/${id}/accept-invite`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['team', id] }); toast.success('Joined team!'); }, onError: (err: any) => toast.error(err.response?.data?.message || 'Failed') });
  const applyTeam = useMutation({ mutationFn: () => api.post(`/teams/${id}/apply`), onSuccess: () => toast.success('Application sent!') });

  if (isLoading) return <div className="max-w-4xl mx-auto space-y-6"><Skeleton className="h-48" /><Skeleton className="h-96" /></div>;
  if (!team) return <div className="text-center py-20"><h2 className="text-2xl font-bold">Team not found</h2></div>;

  const isMember = team.members?.some((m: any) => m.userId === user?.id);
  const isCaptain = team.members?.find((m: any) => m.userId === user?.id)?.role === 'CAPTAIN';

  return (<div className="max-w-4xl mx-auto space-y-6">
    <Card className="glass-card overflow-hidden"><div className="h-32 bg-gradient-to-r from-gaming-purple to-gaming-pink" /><CardContent className="relative px-6 pb-6"><div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 mb-4"><Avatar className="h-24 w-24 border-4 border-background"><AvatarImage src={team.avatar || ''} /><AvatarFallback className="text-3xl bg-primary/10 text-primary">{team.name?.charAt(0)}</AvatarFallback></Avatar><div className="flex-1 pt-12 md:pt-0"><h1 className="text-2xl font-bold">{team.name}{team.tag && <span className="text-muted-foreground ml-2">[{team.tag}]</span>}</h1><div className="flex gap-2 mt-1">{team.rank && <Badge variant="secondary"><Trophy className="h-3 w-3 mr-1" />{team.rank}</Badge>}{team.region && <Badge variant="outline"><MapPin className="h-3 w-3 mr-1" />{team.region}</Badge>}</div></div>{!isMember ? (<div className="flex gap-2"><Button variant="gradient" onClick={() => applyTeam.mutate()}>Apply</Button><Button variant="outline" onClick={() => router.push(`/messages?user=${team.members?.[0]?.userId}`)}>Contact</Button></div>) : isCaptain && (<Button variant="outline" size="sm">Manage Team</Button>)}</div>{team.description && <p className="text-sm text-muted-foreground">{team.description}</p>}</CardContent></Card>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="glass-card"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-500">{team.wins}</p><p className="text-xs text-muted-foreground">Wins</p></CardContent></Card>
      <Card className="glass-card"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-500">{team.losses}</p><p className="text-xs text-muted-foreground">Losses</p></CardContent></Card>
      <Card className="glass-card"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-500">{team.wins + team.losses > 0 ? Math.round((team.wins / (team.wins + team.losses)) * 100) : 0}%</p><p className="text-xs text-muted-foreground">Win Rate</p></CardContent></Card>
      <Card className="glass-card"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gaming-purple">{team.members?.length || 0}</p><p className="text-xs text-muted-foreground">Members</p></CardContent></Card>
    </div>

    <Tabs defaultValue="members"><TabsList><TabsTrigger value="members"><Users className="h-4 w-4 mr-1" />Members</TabsTrigger><TabsTrigger value="schedule"><Calendar className="h-4 w-4 mr-1" />Schedule</TabsTrigger><TabsTrigger value="scrims"><Swords className="h-4 w-4 mr-1" />Scrims</TabsTrigger></TabsList>
      <TabsContent value="members"><Card className="glass-card"><CardContent className="p-6"><div className="space-y-3">{team.members?.map((member: any, i: number) => (<div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border"><div className="flex items-center gap-3"><Avatar className="h-10 w-10"><AvatarImage src={member.user?.profile?.avatar || ''} /><AvatarFallback>{getInitials(member.user?.profile?.username || 'U')}</AvatarFallback></Avatar><div><p className="font-medium text-sm">{member.user?.profile?.username}</p><p className="text-xs text-muted-foreground">{member.role}</p></div></div><Badge variant={member.role === 'CAPTAIN' ? 'default' : 'secondary'}>{member.role === 'CAPTAIN' && <Crown className="h-3 w-3 mr-1" />}{member.role}</Badge></div>))}</div></CardContent></Card></TabsContent>
      <TabsContent value="schedule"><Card className="glass-card"><CardContent className="p-6">{team.practiceSchedules?.length > 0 ? (<div className="space-y-3">{team.practiceSchedules.map((s: any, i: number) => (<div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border"><p className="font-medium text-sm">Day {s.dayOfWeek}</p><p className="text-sm text-muted-foreground">{s.startTime} - {s.endTime}</p></div>))}</div>) : <p className="text-center text-muted-foreground py-8">No practice schedule set</p>}</CardContent></Card></TabsContent>
      <TabsContent value="scrims"><Card className="glass-card"><CardContent className="p-6">{team.scrims?.length > 0 ? (<div className="space-y-3">{team.scrims.map((s: any, i: number) => (<div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border"><div><p className="text-sm font-medium">{s.title}</p><p className="text-xs text-muted-foreground">{formatDate(s.scheduledAt)}</p></div><Badge>{s.status}</Badge></div>))}</div>) : <p className="text-center text-muted-foreground py-8">No scrims scheduled</p>}</CardContent></Card></TabsContent>
    </Tabs>
  </div>);
}
