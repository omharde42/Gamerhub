'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Shield, Users, Trophy, Briefcase, Building2, AlertTriangle,
  Ban, CheckCircle, FileText, Gamepad2, Clock, XCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.get('/admin/dashboard').then(r => r.data.data) });
  const { data: reports } = useQuery({ queryKey: ['admin-reports'], queryFn: () => api.get('/admin/reports').then(r => r.data) });
  const { data: users } = useQuery({ queryKey: ['admin-users'], queryFn: () => api.get('/admin/users').then(r => r.data) });
  const { data: gameRequests, isLoading: grLoading } = useQuery({
    queryKey: ['admin-game-requests'],
    queryFn: () => api.get('/game-requests/all').then(r => r.data.data),
  });

  const banUser = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/users/${userId}/ban`, { reason: 'Violation of terms' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User banned'); },
  });

  const approveGame = useMutation({
    mutationFn: (id: string) => api.post(`/game-requests/${id}/approve`, { adminNote: adminNotes[id] || '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-game-requests'] });
      toast.success('Game request approved!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const rejectGame = useMutation({
    mutationFn: (id: string) => api.post(`/game-requests/${id}/reject`, { adminNote: adminNotes[id] || '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-game-requests'] });
      toast.success('Game request rejected');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const pendingGames = gameRequests?.filter((r: any) => r.status === 'PENDING') || [];

  const statCards = [
    { label: 'Users', value: stats?.users || 0, icon: Users, color: 'text-blue-500' },
    { label: 'Tournaments', value: stats?.tournaments || 0, icon: Trophy, color: 'text-yellow-500' },
    { label: 'Jobs', value: stats?.jobs || 0, icon: Briefcase, color: 'text-green-500' },
    { label: 'Organizations', value: stats?.orgs || 0, icon: Building2, color: 'text-violet-500' },
    { label: 'Pending Reports', value: stats?.pendingReports || 0, icon: AlertTriangle, color: 'text-red-500' },
    { label: 'Game Requests', value: pendingGames.length, icon: Gamepad2, color: 'text-gaming-purple' },
  ];

  return (
    <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          <Shield className="h-6 w-6 inline mr-2 text-primary" />
          Admin Panel
        </h1>
        <Badge variant="default">Admin</Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mx-auto mb-2">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="game-requests">
        <TabsList>
          <TabsTrigger value="game-requests" className="gap-1">
            <Gamepad2 className="h-4 w-4" /> Game Requests
            {pendingGames.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[9px] px-1.5 py-0">{pendingGames.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1"><Users className="h-4 w-4" /> Users</TabsTrigger>
          <TabsTrigger value="reports" className="gap-1"><AlertTriangle className="h-4 w-4" /> Reports</TabsTrigger>
        </TabsList>

        {/* Game Requests Tab */}
        <TabsContent value="game-requests">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-gaming-purple" />
                Game Submission Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {grLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : !gameRequests || gameRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground space-y-2">
                  <Gamepad2 className="h-10 w-10 mx-auto text-muted-foreground/30" />
                  <p className="font-semibold text-foreground">No game requests</p>
                  <p className="text-xs">Users haven't submitted any game requests yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {gameRequests.map((req: any) => {
                    const isPending = req.status === 'PENDING';
                    return (
                      <div key={req.id} className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200 ${isPending ? 'border-yellow-500/20 bg-yellow-500/5' : req.status === 'APPROVED' ? 'border-green-500/10 bg-green-500/5' : 'border-red-500/10 bg-red-500/5'}`}>
                        <div className="flex items-center gap-4 min-w-0">
                          {req.logo ? (
                            <img src={req.logo} alt={req.gameName} className="h-12 w-12 rounded-xl object-cover border border-primary/10 shrink-0" />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
                              <Gamepad2 className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-foreground">{req.gameName}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                              <span className="flex items-center gap-1"><Gamepad2 className="h-3 w-3" /> {req.genre}</span>
                              <span className="text-border">•</span>
                              <span>by {req.user?.profile?.username || 'Unknown'}</span>
                              <span className="text-border">•</span>
                              <span>{formatDate(req.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isPending ? (
                            <>
                              <Input
                                value={adminNotes[req.id] || ''}
                                onChange={(e) => setAdminNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                                placeholder="Admin note (optional)"
                                className="h-9 text-xs border-primary/20 w-40 lg:w-48"
                              />
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white h-9 gap-1 text-xs"
                                onClick={() => approveGame.mutate(req.id)}
                                disabled={approveGame.isPending}
                              >
                                <CheckCircle className="h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-9 gap-1 text-xs"
                                onClick={() => rejectGame.mutate(req.id)}
                                disabled={rejectGame.isPending}
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </Button>
                            </>
                          ) : (
                            <Badge variant="outline" className={`text-xs font-semibold ${req.status === 'APPROVED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                              {req.status === 'APPROVED' ? <CheckCircle className="h-3.5 w-3.5 mr-1" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                              {req.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="glass-card">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3">
                {users?.data?.map((u: any, i: number) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={u.profile?.avatar || ''} />
                        <AvatarFallback>{u.profile?.username?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.profile?.username || u.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email} • {u.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {u.banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-destructive h-10 w-full sm:w-auto" onClick={() => banUser.mutate(u.id)}>
                          <Ban className="h-3 w-3 mr-1" />Ban
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card className="glass-card">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3">
                {reports?.data?.map((r: any, i: number) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.reason}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.description} • {formatDate(r.createdAt)}</p>
                    </div>
                    <Badge variant={r.status === 'PENDING' ? 'warning' as any : 'success' as any} className="w-fit shrink-0">{r.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
