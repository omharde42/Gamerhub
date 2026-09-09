'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, UserCheck, Check, X, Radio, Lock, AlertTriangle, Trophy, BarChart3, Users } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface OrganizerDashboardProps {
  tournament: any;
}

export function OrganizerDashboard({ tournament }: OrganizerDashboardProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('requests');

  // Rejection Dialog state
  const [rejectingTeam, setRejectingTeam] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Room credentials state
  const [credMatch, setCredMatch] = useState<any>(null);
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [instructions, setInstructions] = useState('');

  // Announcement state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  const teamsList = tournament.teams || [];
  const pendingRequests = teamsList.filter((t: any) => t.status === 'PENDING' || !t.status);
  const acceptedTeams = teamsList.filter((t: any) => t.status === 'ACCEPTED');
  const rejectedTeams = teamsList.filter((t: any) => t.status === 'REJECTED');

  const { data: analytics } = useQuery({
    queryKey: ['tournament-analytics', tournament.id],
    queryFn: () => api.get(`/tournaments/${tournament.id}/analytics`).then((r) => r.data.data),
  });

  const acceptMutation = useMutation({
    mutationFn: (teamId: string) => api.post(`/tournaments/${tournament.id}/registrations/${teamId}/accept`),
    onSuccess: () => {
      toast.success('Team accepted into tournament!');
      queryClient.invalidateQueries({ queryKey: ['tournament', tournament.id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to accept team'),
  });

  const rejectMutation = useMutation({
    mutationFn: (teamId: string) =>
      api.post(`/tournaments/${tournament.id}/registrations/${teamId}/reject`, { rejectionReason }),
    onSuccess: () => {
      toast.success('Team request rejected');
      setRejectingTeam(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['tournament', tournament.id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to reject team'),
  });

  const credentialsMutation = useMutation({
    mutationFn: () =>
      api.post(`/tournaments/${tournament.id}/matches/${credMatch.id}/credentials`, {
        roomId,
        roomPassword,
        instructions,
      }),
    onSuccess: () => {
      toast.success('Match credentials & room details published!');
      setCredMatch(null);
      setRoomId('');
      setRoomPassword('');
      setInstructions('');
      queryClient.invalidateQueries({ queryKey: ['tournament', tournament.id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update credentials'),
  });

  const announcementMutation = useMutation({
    mutationFn: () =>
      api.post(`/tournaments/${tournament.id}/announcements`, { title: annTitle, content: annContent, isPinned: true }),
    onSuccess: () => {
      toast.success('Announcement broadcasted to participants!');
      setAnnTitle('');
      setAnnContent('');
      queryClient.invalidateQueries({ queryKey: ['tournament', tournament.id] });
      queryClient.invalidateQueries({ queryKey: ['tournament-announcements', tournament.id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to publish announcement'),
  });

  return (
    <div className="space-y-6">
      {/* Top Quick Stats Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card variant="glass" className="p-4 rounded-2xl border-white/10">
          <span className="text-[11px] text-muted-foreground block font-bold uppercase">Pending Requests</span>
          <span className="text-2xl font-extrabold text-amber-400">{pendingRequests.length}</span>
        </Card>
        <Card variant="glass" className="p-4 rounded-2xl border-white/10">
          <span className="text-[11px] text-muted-foreground block font-bold uppercase">Accepted Teams</span>
          <span className="text-2xl font-extrabold text-emerald-400">{acceptedTeams.length}</span>
        </Card>
        <Card variant="glass" className="p-4 rounded-2xl border-white/10">
          <span className="text-[11px] text-muted-foreground block font-bold uppercase">Check-in Rate</span>
          <span className="text-2xl font-extrabold text-cyan-400">{analytics?.checkInRate || 0}%</span>
        </Card>
        <Card variant="glass" className="p-4 rounded-2xl border-white/10">
          <span className="text-[11px] text-muted-foreground block font-bold uppercase">Completion Rate</span>
          <span className="text-2xl font-extrabold text-purple-400">{analytics?.completionRate || 0}%</span>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card/60 p-1 border border-white/10 rounded-2xl flex-wrap">
          <TabsTrigger value="requests" className="rounded-xl text-xs font-bold gap-1.5">
            <Users className="h-3.5 w-3.5" /> Team Requests ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="teams" className="rounded-xl text-xs font-bold gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Accepted Teams ({acceptedTeams.length})
          </TabsTrigger>
          <TabsTrigger value="matches" className="rounded-xl text-xs font-bold gap-1.5">
            <Lock className="h-3.5 w-3.5" /> Match Room IDs
          </TabsTrigger>
          <TabsTrigger value="announcements" className="rounded-xl text-xs font-bold gap-1.5">
            <Radio className="h-3.5 w-3.5" /> Announcements
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: TEAM REQUESTS */}
        <TabsContent value="requests" className="space-y-3">
          {pendingRequests.length === 0 ? (
            <Card variant="glass" className="p-8 text-center rounded-2xl border-white/10">
              <UserCheck className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold">No pending team requests</p>
              <p className="text-xs text-muted-foreground">All registration requests have been reviewed.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((t: any) => {
                const captain = t.team?.members?.[0]?.user || t.members?.[0]?.user;
                return (
                  <Card key={t.id} variant="glass" className="p-4 rounded-2xl border-amber-500/30 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-emerald-500/40">
                          <AvatarImage src={t.team?.avatar} />
                          <AvatarFallback>{(t.team?.name || 'TM').slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-sm font-extrabold text-foreground">{t.team?.name || 'ShadowX'}</h4>
                          <span className="text-[11px] text-muted-foreground block">
                            Captain: {captain?.profile?.displayName || 'Yash Patil'}
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold">
                        PENDING
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-card/60 p-2.5 rounded-xl border border-white/5">
                      <div>
                        <span className="text-muted-foreground block">Players:</span>
                        <span className="font-semibold">{t.team?.members?.length || 4} Players</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Captain UID:</span>
                        <span className="font-mono text-emerald-400 font-bold">5123456789</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Previous Tourneys:</span>
                        <span className="font-semibold">8 Completed</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Reliability Score:</span>
                        <span className="font-bold text-emerald-400">94/100</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        disabled={acceptMutation.isPending}
                        onClick={() => acceptMutation.mutate(t.teamId)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl text-xs gap-1"
                      >
                        <Check className="h-4 w-4" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRejectingTeam(t)}
                        className="flex-1 rounded-xl text-xs gap-1"
                      >
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: ACCEPTED TEAMS */}
        <TabsContent value="teams" className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {acceptedTeams.map((t: any) => (
              <Card key={t.id} variant="glass" className="p-3.5 rounded-2xl border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-emerald-500/40">
                    <AvatarImage src={t.team?.avatar} />
                    <AvatarFallback>{t.team?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-bold text-foreground">{t.team?.name}</p>
                    <p className="text-[10px] text-muted-foreground">ID: {t.id.slice(0, 8)}</p>
                  </div>
                </div>
                <Badge
                  className={
                    t.checkInStatus === 'CHECKED_IN'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]'
                      : 'bg-slate-500/20 text-slate-400 border-slate-500/40 text-[10px]'
                  }
                >
                  {t.checkInStatus === 'CHECKED_IN' ? 'CHECKED IN' : 'WAITING CHECK-IN'}
                </Badge>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: MATCH ROOM CREDS */}
        <TabsContent value="matches" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(tournament.matches || []).map((m: any) => (
              <Card key={m.id} variant="glass" className="p-4 rounded-2xl border-white/10 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-400">Round {m.round} - Match #{m.matchIndex + 1}</span>
                  <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                </div>
                <p className="text-xs font-semibold text-foreground">
                  {m.team1?.team?.name || 'TBD'} vs {m.team2?.team?.name || 'TBD'}
                </p>

                {m.roomId ? (
                  <div className="bg-card/80 p-2.5 rounded-xl border border-emerald-500/30 text-xs font-mono space-y-0.5">
                    <p className="text-emerald-400">Room ID: {m.roomId}</p>
                    {m.roomPassword && <p className="text-slate-300">Password: {m.roomPassword}</p>}
                  </div>
                ) : null}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCredMatch(m);
                    setRoomId(m.roomId || '');
                    setRoomPassword(m.roomPassword || '');
                    setInstructions(m.instructions || '');
                  }}
                  className="w-full text-xs rounded-xl border-white/10 gap-1"
                >
                  <Lock className="h-3.5 w-3.5 text-amber-400" /> Set Room ID & Credentials
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 4: ANNOUNCEMENTS */}
        <TabsContent value="announcements" className="space-y-4">
          <Card variant="glass" className="p-4 rounded-2xl border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-foreground">Publish Broadcast Announcement</h4>
            <Input
              placeholder="Announcement Title (e.g. Room ID updated / Check-in starts)"
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              className="bg-card border-white/10 text-xs"
            />
            <Textarea
              placeholder="Write message details for participants..."
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              className="bg-card border-white/10 text-xs min-h-[80px]"
            />
            <Button
              disabled={!annTitle.trim() || !annContent.trim() || announcementMutation.isPending}
              onClick={() => announcementMutation.mutate()}
              className="bg-emerald-500 text-black font-bold rounded-xl text-xs"
            >
              Broadcast Announcement
            </Button>
          </Card>
        </TabsContent>
      </Tabs>

      {/* REJECTION REASON DIALOG */}
      <Dialog open={Boolean(rejectingTeam)} onOpenChange={(open) => !open && setRejectingTeam(null)}>
        <DialogContent className="bg-[#0A0E1A] border-white/10 text-foreground rounded-2xl p-6 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-400">Reject Registration</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Provide an optional reason for rejecting {rejectingTeam?.team?.name}:</p>
            <Textarea
              placeholder="e.g. Roster incomplete / Ineligible region"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="bg-card border-white/10 text-xs"
            />
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setRejectingTeam(null)} className="flex-1 text-xs rounded-xl">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => rejectMutation.mutate(rejectingTeam?.teamId)}
                className="flex-1 text-xs rounded-xl font-bold"
              >
                Confirm Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ROOM CREDENTIALS DIALOG */}
      <Dialog open={Boolean(credMatch)} onOpenChange={(open) => !open && setCredMatch(null)}>
        <DialogContent className="bg-[#0A0E1A] border-white/10 text-foreground rounded-2xl p-6 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-emerald-400">Set Match Room Credentials</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">Room ID *</span>
              <Input
                placeholder="e.g. 5928103"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="bg-card border-white/10 text-xs mt-1"
              />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Room Password</span>
              <Input
                placeholder="e.g. gh123"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                className="bg-card border-white/10 text-xs mt-1"
              />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Instructions / Notes</span>
              <Textarea
                placeholder="e.g. Map: Erangel. Join lobby by 8:45 PM."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="bg-card border-white/10 text-xs mt-1"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setCredMatch(null)} className="flex-1 text-xs rounded-xl">
                Cancel
              </Button>
              <Button
                disabled={!roomId.trim() || credentialsMutation.isPending}
                onClick={() => credentialsMutation.mutate()}
                className="flex-1 bg-emerald-500 text-black font-bold text-xs rounded-xl"
              >
                Save Credentials
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
