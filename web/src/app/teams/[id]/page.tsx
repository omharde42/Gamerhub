'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  Trophy, Users, MapPin, Calendar, Swords, Shield, Crown, UserPlus, LogOut,
  Search, CheckCircle2, XCircle, AlertCircle, Loader2, MessageSquare, Trash2
} from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function TeamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);

  // 1. Fetch team details
  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => api.get(`/teams/${id}`).then(r => r.data.data),
    enabled: Boolean(id),
  });

  // 2. Fetch my pending invites
  const { data: myInvites = [] } = useQuery({
    queryKey: ['my-team-invites'],
    queryFn: () => api.get('/teams/invites/mine').then(r => r.data.data || []),
    enabled: Boolean(user),
  });

  // Mutations
  const acceptInviteMutation = useMutation({
    mutationFn: (teamId: string) => api.post(`/teams/${teamId}/accept-invite`),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Successfully joined team!');
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      queryClient.invalidateQueries({ queryKey: ['my-team-invites'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to join team');
    },
  });

  const declineInviteMutation = useMutation({
    mutationFn: (teamId: string) => api.post(`/teams/${teamId}/decline-invite`),
    onSuccess: () => {
      toast.success('Invite declined.');
      queryClient.invalidateQueries({ queryKey: ['my-team-invites'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to decline invite');
    },
  });

  const invitePlayerMutation = useMutation({
    mutationFn: (targetUserId: string) => api.post(`/teams/${id}/invite`, { userId: targetUserId }),
    onSuccess: () => {
      toast.success('Invitation request sent to player!');
      queryClient.invalidateQueries({ queryKey: ['team', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    },
  });

  const applyTeamMutation = useMutation({
    mutationFn: () => api.post(`/teams/${id}/apply`, { message: applyMessage }),
    onSuccess: () => {
      setShowApplyModal(false);
      setApplyMessage('');
      toast.success('Application submitted to team captain!');
      queryClient.invalidateQueries({ queryKey: ['team', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to apply');
    },
  });

  const handleAppMutation = useMutation({
    mutationFn: ({ applicationId, action }: { applicationId: string; action: 'ACCEPT' | 'REJECT' }) =>
      api.post(`/teams/${id}/handle-application`, { applicationId, action }),
    onSuccess: (_, variables) => {
      toast.success(variables.action === 'ACCEPT' ? 'Player accepted into squad!' : 'Application rejected.');
      queryClient.invalidateQueries({ queryKey: ['team', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to process application');
    },
  });

  const kickMemberMutation = useMutation({
    mutationFn: (targetUserId: string) => api.post(`/teams/${id}/kick`, { userId: targetUserId }),
    onSuccess: () => {
      toast.success('Member removed from squad.');
      queryClient.invalidateQueries({ queryKey: ['team', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    },
  });

  const leaveTeamMutation = useMutation({
    mutationFn: () => api.post(`/teams/${id}/leave`),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Left team successfully.');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      router.push('/teams');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to leave team');
    },
  });

  // Search users for invite modal
  const handleUserSearch = async (q: string) => {
    setPlayerSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get(`/profiles/search?q=${encodeURIComponent(q)}&limit=6`);
      setSearchResults(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-2xl font-bold">Team Squad Not Found</h2>
        <Button onClick={() => router.push('/teams')} variant="outline" className="rounded-xl">
          Back to Teams Catalog
        </Button>
      </div>
    );
  }

  const isMember = team.members?.some((m: any) => m.userId === user?.id);
  const userMemberRole = team.members?.find((m: any) => m.userId === user?.id)?.role;
  const isCaptain = userMemberRole === 'CAPTAIN';
  const isManager = userMemberRole === 'MANAGER' || isCaptain;
  const pendingInviteForMe = myInvites.find((inv: any) => inv.teamId === id);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Pending Invite Alert Banner for current user */}
      {pendingInviteForMe && (
        <Card variant="glass" className="border-emerald-500/50 bg-emerald-500/10">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-extrabold text-sm text-foreground">
                  You have a pending invitation to join <span className="text-emerald-400">{team.name}</span>!
                </p>
                <p className="text-xs text-muted-foreground">Accept this invitation to join the official squad roster.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => acceptInviteMutation.mutate(id as string)}
                disabled={acceptInviteMutation.isPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold rounded-xl h-9 px-4 gap-1.5"
              >
                {acceptInviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Accept Invitation
              </Button>
              <Button
                onClick={() => declineInviteMutation.mutate(id as string)}
                disabled={declineInviteMutation.isPending}
                variant="outline"
                className="rounded-xl h-9 px-3 text-xs font-bold border-red-500/40 text-red-400 hover:bg-red-500/10"
              >
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Header Card */}
      <Card variant="glass" className="overflow-hidden border-border/60">
        <div className="h-40 bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-900 relative">
          {team.banner && <img src={team.banner} alt={team.name} className="w-full h-full object-cover opacity-60" />}
        </div>
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-16 mb-4">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <Avatar className="h-28 w-28 border-4 border-background shadow-2xl shrink-0">
                <AvatarImage src={team.avatar || ''} />
                <AvatarFallback className="text-4xl font-black bg-gradient-to-br from-emerald-500 to-teal-700 text-white">
                  {team.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 pt-2 md:pt-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-black text-foreground">{team.name}</h1>
                  {team.tag && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-mono font-bold text-sm px-2.5 py-0.5">
                      [{team.tag}]
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <Badge variant="secondary" className="font-mono text-xs gap-1">
                    <Trophy className="h-3.5 w-3.5 text-amber-400" /> {team.rank || 'MASTER'}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-xs gap-1 border-white/10">
                    <MapPin className="h-3.5 w-3.5 text-teal-400" /> {team.region || 'Global'}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    Created {formatDate(team.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {isManager && (
                <Button
                  onClick={() => setInviteModalOpen(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold rounded-2xl h-10 px-4 gap-2 shadow-lg shadow-emerald-500/25"
                >
                  <UserPlus className="h-4.5 w-4.5" /> Invite Players
                </Button>
              )}

              {!isMember ? (
                <Button
                  onClick={() => setShowApplyModal(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold rounded-2xl h-10 px-5 gap-2"
                >
                  <Swords className="h-4 w-4" /> Apply to Join Squad
                </Button>
              ) : (
                <Button
                  onClick={() => leaveTeamMutation.mutate()}
                  disabled={leaveTeamMutation.isPending}
                  variant="outline"
                  className="rounded-2xl h-10 px-4 text-xs font-extrabold border-red-500/40 text-red-400 hover:bg-red-500/10 gap-1.5"
                >
                  <LogOut className="h-4 w-4" /> Leave Team
                </Button>
              )}
            </div>
          </div>

          {team.description && (
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed mt-2">{team.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="glass"><CardContent className="p-4 text-center"><p className="text-2xl font-black text-emerald-400 font-mono">{team.wins}</p><p className="text-xs text-muted-foreground font-semibold">Victories</p></CardContent></Card>
        <Card variant="glass"><CardContent className="p-4 text-center"><p className="text-2xl font-black text-red-400 font-mono">{team.losses}</p><p className="text-xs text-muted-foreground font-semibold">Defeats</p></CardContent></Card>
        <Card variant="glass"><CardContent className="p-4 text-center"><p className="text-2xl font-black text-blue-400 font-mono">{team.wins + team.losses > 0 ? Math.round((team.wins / (team.wins + team.losses)) * 100) : 75}%</p><p className="text-xs text-muted-foreground font-semibold">Win Rate</p></CardContent></Card>
        <Card variant="glass"><CardContent className="p-4 text-center"><p className="text-2xl font-black text-purple-400 font-mono">{team.members?.length || 0}</p><p className="text-xs text-muted-foreground font-semibold">Roster Members</p></CardContent></Card>
      </div>

      {/* Tabs View */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList className="bg-black/60 p-1 border border-white/10 rounded-2xl">
          <TabsTrigger value="members" className="rounded-xl gap-2 font-bold text-xs">
            <Users className="h-4 w-4" /> Roster ({team.members?.length || 0})
          </TabsTrigger>
          {isManager && (
            <TabsTrigger value="applications" className="rounded-xl gap-2 font-bold text-xs relative">
              <Swords className="h-4 w-4" /> Pending Applications
              {team.applications?.length > 0 && (
                <span className="h-4 min-w-[16px] px-1 rounded-full bg-emerald-500 text-black text-[10px] font-extrabold">
                  {team.applications.length}
                </span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="schedule" className="rounded-xl gap-2 font-bold text-xs">
            <Calendar className="h-4 w-4" /> Practice Schedule
          </TabsTrigger>
          <TabsTrigger value="scrims" className="rounded-xl gap-2 font-bold text-xs">
            <Swords className="h-4 w-4" /> Scrim History
          </TabsTrigger>
        </TabsList>

        {/* Members Roster Tab */}
        <TabsContent value="members">
          <Card variant="glass" className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-extrabold">Official Roster Players</CardTitle>
              {isManager && (
                <Button
                  size="sm"
                  onClick={() => setInviteModalOpen(true)}
                  className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-xl text-xs font-bold gap-1.5"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Invite Player
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {team.members?.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 border border-white/10 shrink-0">
                        <AvatarImage src={member.user?.profile?.avatar || ''} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                          {getInitials(member.user?.profile?.username || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link href={`/profile/${member.user?.profile?.username}`}>
                          <p className="font-extrabold text-sm text-foreground hover:text-emerald-400 transition-colors truncate">
                            {member.user?.profile?.displayName || member.user?.profile?.username}
                          </p>
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">@{member.user?.profile?.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        className={
                          member.role === 'CAPTAIN'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-mono font-bold'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold'
                        }
                      >
                        {member.role === 'CAPTAIN' && <Crown className="h-3 w-3 mr-1 text-amber-400 inline" />}
                        {member.role}
                      </Badge>

                      {isCaptain && member.role !== 'CAPTAIN' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => kickMemberMutation.mutate(member.userId)}
                          title="Remove member"
                          className="h-8 w-8 text-red-400 hover:bg-red-500/20 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab for Captains */}
        {isManager && (
          <TabsContent value="applications">
            <Card variant="glass" className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base font-extrabold">Pending Player Join Applications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {team.applications?.length > 0 ? (
                  team.applications.map((app: any) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/10 gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 border border-white/10 shrink-0">
                          <AvatarImage src={app.user?.profile?.avatar || ''} />
                          <AvatarFallback>{getInitials(app.user?.profile?.username || 'U')}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-extrabold text-sm text-foreground">
                            {app.user?.profile?.displayName || app.user?.profile?.username}
                          </p>
                          {app.message && <p className="text-xs text-muted-foreground truncate">{app.message}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleAppMutation.mutate({ applicationId: app.id, action: 'ACCEPT' })}
                          disabled={handleAppMutation.isPending}
                          className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold rounded-xl h-9 px-3 gap-1 text-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAppMutation.mutate({ applicationId: app.id, action: 'REJECT' })}
                          disabled={handleAppMutation.isPending}
                          className="rounded-xl h-9 px-3 text-xs font-bold border-red-500/40 text-red-400 hover:bg-red-500/10"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-muted-foreground py-8 font-semibold">
                    No pending player join applications.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card variant="glass"><CardContent className="p-6">{team.practiceSchedules?.length > 0 ? (<div className="space-y-3">{team.practiceSchedules.map((s: any, i: number) => (<div key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-black/40"><p className="font-bold text-sm">Day {s.dayOfWeek}</p><p className="text-sm text-muted-foreground font-mono">{s.startTime} - {s.endTime}</p></div>))}</div>) : <p className="text-center text-xs text-muted-foreground py-8 font-semibold">No practice schedule set.</p>}</CardContent></Card>
        </TabsContent>

        {/* Scrims Tab */}
        <TabsContent value="scrims">
          <Card variant="glass"><CardContent className="p-6">{team.scrims?.length > 0 ? (<div className="space-y-3">{team.scrims.map((s: any, i: number) => (<div key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-black/40"><div><p className="text-sm font-extrabold">{s.title}</p><p className="text-xs text-muted-foreground">{formatDate(s.scheduledAt)}</p></div><Badge className="bg-emerald-500/20 text-emerald-400">{s.status}</Badge></div>))}</div>) : <p className="text-center text-xs text-muted-foreground py-8 font-semibold">No scrims scheduled yet.</p>}</CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Invite Player Search Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="glass-popup border-emerald-500/40 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-400" /> Invite Player to {team.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players by username..."
                value={playerSearchQuery}
                onChange={(e) => handleUserSearch(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-black/60 border-white/10 text-xs"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searching ? (
                <div className="py-6 text-center text-xs text-muted-foreground">Searching players...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((player: any) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 hover:border-emerald-500/30"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={player.avatar || ''} />
                        <AvatarFallback>{getInitials(player.username || 'U')}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-extrabold text-xs text-foreground truncate">{player.displayName || player.username}</p>
                        <p className="text-[10px] text-muted-foreground truncate">@{player.username}</p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => invitePlayerMutation.mutate(player.userId)}
                      disabled={invitePlayerMutation.isPending}
                      className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold rounded-xl h-8 px-3 text-xs gap-1"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Invite
                    </Button>
                  </div>
                ))
              ) : playerSearchQuery.trim() ? (
                <div className="py-6 text-center text-xs text-muted-foreground">No players found matching "{playerSearchQuery}"</div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">Type a username above to search and invite players.</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Apply to Squad Modal */}
      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent className="glass-popup border-primary/40 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" /> Apply to Join {team.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Send a message to the team captain explaining your main game role, rank, and availability.
              </p>
              <Textarea
                placeholder="e.g. I am an Ascendant Valorant entry fragger available for evening scrims..."
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                className="rounded-xl bg-black/60 border-white/10 text-xs min-h-[100px]"
              />
            </div>
            <Button
              onClick={() => applyTeamMutation.mutate()}
              disabled={applyTeamMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold rounded-xl h-10 shadow-lg"
            >
              {applyTeamMutation.isPending ? 'Submitting Application...' : 'Send Application'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
