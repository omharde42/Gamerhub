'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Shield, Users, Trophy, Briefcase, Building2, AlertTriangle, Ban, CheckCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminPage() {
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.get('/admin/dashboard').then(r => r.data.data) });
  const { data: reports } = useQuery({ queryKey: ['admin-reports'], queryFn: () => api.get('/admin/reports').then(r => r.data) });
  const { data: users } = useQuery({ queryKey: ['admin-users'], queryFn: () => api.get('/admin/users').then(r => r.data) });
  const banUser = useMutation({ mutationFn: (userId: string) => api.post(`/admin/users/${userId}/ban`, { reason: 'Violation of terms' }), onSuccess: () => toast.success('User banned') });
  const statCards = [{ label: 'Users', value: stats?.users || 0, icon: Users, color: 'text-blue-500' }, { label: 'Tournaments', value: stats?.tournaments || 0, icon: Trophy, color: 'text-yellow-500' }, { label: 'Jobs', value: stats?.jobs || 0, icon: Briefcase, color: 'text-green-500' }, { label: 'Organizations', value: stats?.orgs || 0, icon: Building2, color: 'text-gaming-purple' }, { label: 'Pending Reports', value: stats?.pendingReports || 0, icon: AlertTriangle, color: 'text-red-500' }, { label: 'Posts', value: stats?.posts || 0, icon: FileText, color: 'text-cyan-500' }];

  return (<div className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-2xl font-bold"><Shield className="h-6 w-6 inline mr-2 text-gaming-purple" />Admin Panel</h1><Badge variant="default">Admin</Badge></div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">{statCards.map((s, i) => (<Card key={i} className="glass-card"><CardContent className="p-4 text-center"><div className={`w-10 h-10 rounded-lg bg-accent flex items-center justify-center mx-auto mb-2`}><s.icon className={`h-5 w-5 ${s.color}`} /></div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>))}</div>

    <Tabs defaultValue="users"><TabsList><TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />Users</TabsTrigger><TabsTrigger value="reports"><AlertTriangle className="h-4 w-4 mr-1" />Reports</TabsTrigger></TabsList>
      <TabsContent value="users"><Card className="glass-card"><CardContent className="p-4 sm:p-6"><div className="space-y-3">{users?.data?.map((u: any, i: number) => (<div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border"><div className="flex items-center gap-3 min-w-0"><Avatar className="h-10 w-10 shrink-0"><AvatarImage src={u.profile?.avatar || ''} /><AvatarFallback>{u.profile?.username?.charAt(0) || 'U'}</AvatarFallback></Avatar><div className="min-w-0"><p className="text-sm font-medium truncate">{u.profile?.username || u.email}</p><p className="text-xs text-muted-foreground truncate">{u.email} • {u.role}</p></div></div><div className="flex gap-2 shrink-0">{u.banned ? <Badge variant="destructive">Banned</Badge> : <Button variant="ghost" size="sm" className="text-destructive h-10 w-full sm:w-auto" onClick={() => banUser.mutate(u.id)}><Ban className="h-3 w-3 mr-1" />Ban</Button>}</div></div>))}</div></CardContent></Card></TabsContent>
      <TabsContent value="reports"><Card className="glass-card"><CardContent className="p-4 sm:p-6"><div className="space-y-3">{reports?.data?.map((r: any, i: number) => (<div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border"><div className="min-w-0"><div><p className="text-sm font-medium truncate">{r.reason}</p><p className="text-xs text-muted-foreground truncate">{r.description} • {formatDate(r.createdAt)}</p></div></div><Badge variant={r.status === 'PENDING' ? 'warning' : 'success'} className="w-fit shrink-0">{r.status}</Badge></div>))}</div></CardContent></Card></TabsContent>
    </Tabs>
  </div>);
}
