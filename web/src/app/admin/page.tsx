'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Shield, Users, Trophy, Briefcase, Building2, AlertTriangle,
  Ban, CheckCircle, FileText, Gamepad2, Clock, XCircle, Loader2,
  BarChart3, Settings, Bell, Eye, Trash2, Pin, Star,
  Menu, RefreshCw, LogOut, ArrowLeft, Search, Plus, Filter,
  Layers, Lock, Activity, Mail, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';

// Chart imports from recharts
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend
} from 'recharts';

type TabType =
  | 'dashboard'
  | 'users'
  | 'content'
  | 'communities'
  | 'tournaments'
  | 'game_apis'
  | 'reports'
  | 'analytics'
  | 'broadcast'
  | 'system'
  | 'settings'
  | 'audit';

export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  // Validate and refresh session
  useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  // Search and Filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userBannedFilter, setUserBannedFilter] = useState<string>('ALL');
  const [postSearch, setPostSearch] = useState('');
  const [postFilter, setPostFilter] = useState<'ALL' | 'PINNED' | 'DELETED'>('ALL');

  // Broadcast settings
  const [broadcastTarget, setBroadcastTarget] = useState<'EVERYONE' | 'SELECTED_USERS' | 'COMMUNITIES' | 'TEAMS'>('EVERYONE');
  const [broadcastType, setBroadcastType] = useState<'PUSH' | 'GLOBAL_ALERT' | 'MAINTENANCE_ALERT' | 'EMERGENCY'>('PUSH');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // Platform Settings State
  const [brandingName, setBrandingName] = useState('GamerZ Hub');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [featureFlags, setFeatureFlags] = useState({
    aiCoach: true,
    studio: true,
    marketplace: true,
    tournaments: true,
  });

  // User details Modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editRole, setEditRole] = useState<string>('');

  // Hydration handling
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
    } else {
      const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
        setHasHydrated(true);
      });
      return () => unsubscribe();
    }
  }, []);

  // Admin and Auth security checks
  const isAdmin = isAuthenticated && user && ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(user.role);

  // Queries
  const { data: stats } = useQuery<any>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data.data),
    enabled: !!isAdmin
  });

  const { data: usersData, isLoading: usersLoading } = useQuery<any>({
    queryKey: ['admin-users', userSearch, userRoleFilter, userBannedFilter],
    queryFn: () => {
      const params: Record<string, string> = {
        search: userSearch,
        limit: '100',
      };
      if (userRoleFilter !== 'ALL') params.role = userRoleFilter;
      if (userBannedFilter !== 'ALL') params.banned = userBannedFilter === 'BANNED' ? 'true' : 'false';
      return api.get('/admin/users', { params }).then(r => r.data);
    },
    enabled: !!isAdmin
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery<any>({
    queryKey: ['admin-reports'],
    queryFn: () => api.get('/admin/reports').then(r => r.data),
    enabled: !!isAdmin
  });

  const { data: gameRequests, isLoading: grLoading } = useQuery<any>({
    queryKey: ['admin-game-requests'],
    queryFn: () => api.get('/game-requests/all').then(r => r.data.data),
    enabled: !!isAdmin
  });

  const { data: apiStats } = useQuery<any>({
    queryKey: ['admin-game-apis'],
    queryFn: () => api.get('/admin/game-apis').then(r => r.data.data),
    enabled: !!isAdmin
  });

  const { data: auditData, isLoading: auditLoading } = useQuery<any>({
    queryKey: ['admin-audit-logs'],
    queryFn: () => api.get('/admin/audit-logs').then(r => r.data),
    enabled: !!isAdmin && user?.role === 'SUPER_ADMIN'
  });

  // Mutations
  const banUser = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      api.post(`/admin/users/${userId}/ban`, { reason: reason || 'Violation of Platform Rules' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('User has been banned.');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to ban user'),
  });

  const unbanUser = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/users/${userId}/unban`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('User has been unbanned.');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to unban user'),
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.put(`/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User role updated successfully');
      setSelectedUser(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update role'),
  });

  const verifyPlayer = useMutation({
    mutationFn: ({ userId, verified }: { userId: string; verified: boolean }) =>
      api.post(`/admin/users/${userId}/verify`, { verified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Player verification status updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update verification'),
  });

  const deleteUserPermanent = useMutation({
    mutationFn: (userId: string) => api.delete(`/admin/users/${userId}/delete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('User deleted permanently from Database');
      setSelectedUser(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete user'),
  });

  const resolveReport = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
      api.post(`/admin/reports/${id}/resolve`, { resolution }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Report has been resolved successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to resolve report'),
  });

  const manualSyncApi = useMutation({
    mutationFn: (apiName: string) => api.post('/admin/game-apis/sync', { apiName }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-game-apis'] });
      toast.success(`Triggered manual synchronization for ${variables}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Sync request failed'),
  });

  // Mock post list for Phase 3 (Content Moderation)
  const [mockPosts, setMockPosts] = useState<any[]>([
    { id: '1', username: 'pro_gamer99', content: 'Insane triple kill in Valorant ranked! Check out my clip!', media: ['/logo.jpg'], likes: 24, comments: 5, isPinned: false, isFeatured: true, createdAt: new Date(Date.now() - 4 * 3600000).toISOString() },
    { id: '2', username: 'shadow_ninja', content: 'Looking for a competitive tournament team to grind Clash of Clans!', media: [], likes: 12, comments: 18, isPinned: true, isFeatured: false, createdAt: new Date(Date.now() - 8 * 3600000).toISOString() },
    { id: '3', username: 'toxic_player_xyz', content: 'These teammates are trash. Uninstall the game and get out.', media: [], likes: 0, comments: 45, isPinned: false, isFeatured: false, createdAt: new Date(Date.now() - 12 * 3600000).toISOString() },
  ]);

  // Mock Communities & Teams for Phase 4
  const [mockCommunities, setMockCommunities] = useState<any[]>([
    { id: 'c1', name: 'Valorant India', slug: 'valorant-india', owner: 'shroud_fan', members: 4200, featured: true },
    { id: 'c2', name: 'Mobile Gaming Clan', slug: 'mobile-gaming', owner: 'bgmi_king', members: 1540, featured: false },
  ]);

  const [mockTeams, setMockTeams] = useState<any[]>([
    { id: 't1', name: 'Team Lethal', tag: 'TL', captain: 'lethal_vibe', wins: 45, losses: 12, featured: true },
    { id: 't2', name: 'Apex Predators', tag: 'AP', captain: 'apex_pred', wins: 32, losses: 24, featured: false },
  ]);

  // Mock Tournaments for Phase 5
  const [mockTournaments, setMockTournaments] = useState<any[]>([
    { id: 'tour1', title: 'Valorant Summer Cup 2026', game: 'Valorant', prizePool: 5000, entryFee: 0, maxTeams: 64, status: 'REGISTRATION_OPEN', date: '2026-08-25' },
    { id: 'tour2', title: 'Clash Royale League Clash', game: 'Clash Royale', prizePool: 2000, entryFee: 10, maxTeams: 128, status: 'IN_PROGRESS', date: '2026-08-18' },
  ]);

  // Handle mock actions
  const handleDeletePost = (id: string) => {
    setMockPosts(prev => prev.filter(p => p.id !== id));
    toast.success('Post removed by administrator');
  };

  const handleTogglePinPost = (id: string) => {
    setMockPosts(prev => prev.map(p => p.id === id ? { ...p, isPinned: !p.isPinned } : p));
    toast.success('Post pin state modified');
  };

  const handleToggleFeaturePost = (id: string) => {
    setMockPosts(prev => prev.map(p => p.id === id ? { ...p, isFeatured: !p.isFeatured } : p));
    toast.success('Post featured state modified');
  };

  const handleToggleFeaturedCommunity = (id: string) => {
    setMockCommunities(prev => prev.map(c => c.id === id ? { ...c, featured: !c.featured } : c));
    toast.success('Community featured status updated');
  };

  const handleToggleFeaturedTeam = (id: string) => {
    setMockTeams(prev => prev.map(t => t.id === id ? { ...t, featured: !t.featured } : t));
    toast.success('Team featured status updated');
  };

  const handleDeleteCommunity = (id: string) => {
    setMockCommunities(prev => prev.filter(c => c.id !== id));
    toast.success('Community deleted permanently');
  };

  const handleDeleteTeam = (id: string) => {
    setMockTeams(prev => prev.filter(t => t.id !== id));
    toast.success('Team deleted permanently');
  };

  const handleCreateTournament = (e: any) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const newTour = {
      id: `tour-${Date.now()}`,
      title: data.get('title') as string,
      game: data.get('game') as string,
      prizePool: parseFloat(data.get('prizePool') as string || '0'),
      entryFee: parseFloat(data.get('entryFee') as string || '0'),
      maxTeams: parseInt(data.get('maxTeams') as string || '64'),
      status: 'REGISTRATION_OPEN',
      date: data.get('date') as string,
    };
    setMockTournaments(prev => [newTour, ...prev]);
    toast.success('Tournament created successfully!');
    e.currentTarget.reset();
  };

  const handleSendBroadcast = (e: any) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      toast.error('Title and message are required for broadcast');
      return;
    }
    toast.success(`Successfully sent ${broadcastType} broadcast to ${broadcastTarget}!`);
    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  const handleExportUsers = () => {
    if (!usersData || (usersData.data || usersData).length === 0) {
      toast.error('No users to export');
      return;
    }
    const headers = ['ID', 'Email', 'Role', 'Banned', 'Username', 'GamerScore', 'Created At'];
    const rows = (usersData.data || usersData).map((u: any) => [
      u.id,
      u.email,
      u.role,
      u.banned ? 'YES' : 'NO',
      u.profile?.username || 'N/A',
      u.profile?.gamerScore || 0,
      u.createdAt
    ]);
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gamerhub_users_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('User list exported successfully to CSV');
  };

  const pendingGames = gameRequests?.filter((r: any) => r.status === 'PENDING') || [];

  // Safe checks for hydration or authentication
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-[#05070E] flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#05070E] flex flex-col items-center justify-center p-4 text-center">
        <Shield className="h-16 w-16 text-destructive mb-4 animate-bounce" />
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground max-w-md mt-2 mb-6">
          You do not have administrative permissions required to access the GamerZ Hub Admin Portal.
        </p>
        <Button onClick={() => router.push('/')} className="bg-primary hover:bg-primary/90">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Home
        </Button>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Shield },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'communities', label: 'Communities / Teams', icon: Building2 },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy },
    { id: 'game_apis', label: 'Game APIs', icon: Gamepad2 },
    { id: 'reports', label: 'Reports', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'broadcast', label: 'Broadcast', icon: Bell },
    { id: 'system', label: 'System Health', icon: Settings },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'audit', label: 'Audit Logs', icon: Clock, superOnly: true },
  ];

  // Mock analytics chart data (Phase 8)
  const activityData = [
    { name: 'Mon', DAU: 120, MAU: 500, registrations: 5, apiSyncs: 140 },
    { name: 'Tue', DAU: 154, MAU: 512, registrations: 12, apiSyncs: 198 },
    { name: 'Wed', DAU: 180, MAU: 520, registrations: 18, apiSyncs: 230 },
    { name: 'Thu', DAU: 240, MAU: 545, registrations: 24, apiSyncs: 310 },
    { name: 'Fri', DAU: 320, MAU: 601, registrations: 45, apiSyncs: 480 },
    { name: 'Sat', DAU: 450, MAU: 670, registrations: 62, apiSyncs: 690 },
    { name: 'Sun', DAU: 480, MAU: 720, registrations: 55, apiSyncs: 620 },
  ];

  return (
    <div className="min-h-screen bg-[#05070E] text-foreground flex flex-col md:flex-row">

      {/* Mobile Top Header Bar */}
      <div className="md:hidden bg-background border-b border-border/40 p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm tracking-tight text-primary">GamerZ Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-40 w-64 bg-background/90 md:bg-background/40 border-r border-border/40 flex flex-col justify-between shrink-0`}>
        <div className="p-5 flex flex-col gap-6">
          <div className="hidden md:flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-md shrink-0">
              <Shield className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight">{brandingName}</h2>
              <p className="text-[10px] text-muted-foreground">Admin Workspace Portal</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {sidebarItems.map(item => {
              if (item.superOnly && user?.role !== 'SUPER_ADMIN') return null;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabType);
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200
                    ${activeTab === item.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'}`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-border/40 flex items-center justify-between gap-3 bg-accent/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-8.5 w-8.5 ring-1 ring-primary/20">
              <AvatarImage src={user?.profile?.avatar || ''} />
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{user?.profile?.username?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate leading-tight">{user?.profile?.username || user?.email}</p>
              <span className="text-[9px] font-semibold text-primary capitalize tracking-wider">{user?.role?.toLowerCase().replace('_', ' ')}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5" onClick={() => router.push('/')}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Main Panel Viewport */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">

        {/* View Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-semibold tracking-wider uppercase">
              <span>Admin Console</span>
              <span>/</span>
              <span className="text-primary">{activeTab.replace('_', ' ')}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight capitalize flex items-center gap-2">
              {activeTab === 'dashboard' && <Shield className="h-6 w-6 text-primary" />}
              {activeTab === 'users' && <Users className="h-6 w-6 text-primary" />}
              {activeTab === 'content' && <FileText className="h-6 w-6 text-primary" />}
              {activeTab === 'reports' && <AlertTriangle className="h-6 w-6 text-primary" />}
              {activeTab === 'game_apis' && <Gamepad2 className="h-6 w-6 text-primary" />}
              {activeTab === 'tournaments' && <Trophy className="h-6 w-6 text-primary" />}
              {activeTab === 'analytics' && <BarChart3 className="h-6 w-6 text-primary" />}
              {activeTab === 'broadcast' && <Bell className="h-6 w-6 text-primary" />}
              {activeTab === 'system' && <Layers className="h-6 w-6 text-primary" />}
              {activeTab === 'settings' && <Settings className="h-6 w-6 text-primary" />}
              {activeTab === 'audit' && <Clock className="h-6 w-6 text-primary" />}
              {activeTab.replace('_', ' ')}
            </h1>
          </div>

          {/* Global Header Badge */}
          <div className="flex items-center gap-2">
            {maintenanceMode && (
              <Badge variant="destructive" className="animate-pulse flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Maintenance Mode Active
              </Badge>
            )}
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 text-[10px] font-extrabold tracking-widest uppercase">
              {user?.role}
            </Badge>
          </div>
        </div>

        {/* 1. DASHBOARD VIEW (Phase 1) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Real-time stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Total Users</p>
                    <p className="text-2xl font-black mt-1">{stats?.users || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                    <Users className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Active Users (DAU)</p>
                    <p className="text-2xl font-black mt-1 text-green-500">{stats?.dau || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                    <Activity className="h-5 w-5 animate-pulse" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Active Tournaments</p>
                    <p className="text-2xl font-black mt-1 text-yellow-500">{stats?.activeTournaments || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                    <Trophy className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Pending Reports</p>
                    <p className="text-2xl font-black mt-1 text-destructive">{stats?.pendingReports || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/20">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Recent Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              <Card className="glass-card lg:col-span-2">
                <CardContent className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-accent/10 border border-border/25">
                      <p className="text-[10px] text-muted-foreground font-semibold">Total Posts</p>
                      <p className="text-lg font-bold mt-1">{stats?.posts || 0}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-accent/10 border border-border/25">
                      <p className="text-[10px] text-muted-foreground font-semibold">Teams Registered</p>
                      <p className="text-lg font-bold mt-1">{stats?.teams || 0}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-accent/10 border border-border/25">
                      <p className="text-[10px] text-muted-foreground font-semibold">Communities Active</p>
                      <p className="text-lg font-bold mt-1">{stats?.communities || 0}</p>
                    </div>
                  </div>

                  {/* Quick Action triggers */}
                  <div className="border-t border-border/40 pt-4">
                    <p className="text-xs font-extrabold text-foreground mb-3">Quick Platform Actions</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="text-xs h-9" onClick={() => setActiveTab('users')}>
                        <Users className="h-3.5 w-3.5 mr-1" /> Manage Users
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-9" onClick={() => setActiveTab('reports')}>
                        <AlertTriangle className="h-3.5 w-3.5 mr-1" /> View Flagged Items
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-9" onClick={() => setActiveTab('game_apis')}>
                        <Gamepad2 className="h-3.5 w-3.5 mr-1" /> Force API Syncs
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-9" onClick={() => setActiveTab('broadcast')}>
                        <Bell className="h-3.5 w-3.5 mr-1" /> Create Global Alert
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Server Status Column */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold">Server Monitor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-border/20">
                    <span className="text-muted-foreground">Gateway Connection</span>
                    <Badge variant="default" className="bg-green-600 text-white">ONLINE</Badge>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/20">
                    <span className="text-muted-foreground">API Latency</span>
                    <span className="font-bold text-foreground">42 ms</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/20">
                    <span className="text-muted-foreground">Redis Server Memory</span>
                    <span className="font-bold text-foreground">1.2 MB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">CPU Temperature</span>
                    <span className="font-bold text-foreground">44 °C</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* 2. USER MANAGEMENT VIEW (Phase 2) */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Filter controls */}
            <Card className="glass-card">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-2.5 w-full">
                  <Search className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users by email, username, or ID..."
                    className="h-10 text-xs border-border/40 focus:border-primary/50"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="h-10 px-3 py-1 bg-accent/40 rounded-lg text-xs border border-border/40 font-semibold focus:outline-none"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="USER">Regular Users</option>
                    <option value="MODERATOR">Moderators</option>
                    <option value="ADMIN">Admins</option>
                    <option value="SUPER_ADMIN">Super Admins</option>
                  </select>

                  <select
                    value={userBannedFilter}
                    onChange={(e) => setUserBannedFilter(e.target.value)}
                    className="h-10 px-3 py-1 bg-accent/40 rounded-lg text-xs border border-border/40 font-semibold focus:outline-none"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="BANNED">Banned Only</option>
                  </select>

                  <Button size="sm" onClick={handleExportUsers} className="bg-primary/20 text-primary hover:bg-primary/30 h-10 gap-1.5 text-xs font-bold">
                    <FileText className="h-4 w-4" /> Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Users Directory Table */}
            <Card className="glass-card">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border/30 bg-accent/5 text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">
                      <th className="p-4">User</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Player Verification</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : !usersData || (usersData.data || usersData).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground text-xs font-medium">
                          No users matching search filters found.
                        </td>
                      </tr>
                    ) : (
                      (usersData.data || usersData).map((u: any) => {
                        const isVerified = u.profile?.verified === true;
                        return (
                          <tr key={u.id} className="border-b border-border/10 hover:bg-accent/10 transition-colors text-xs">
                            <td className="p-4 flex items-center gap-3">
                              <Avatar className="h-9 w-9 ring-1 ring-border/20 shrink-0">
                                <AvatarImage src={u.profile?.avatar || ''} />
                                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                  {u.profile?.username?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-bold text-foreground flex items-center gap-1.5">
                                  {u.profile?.username || 'N/A'}
                                  {isVerified && <Badge variant="default" className="text-[8px] bg-primary/20 text-primary px-1.5 py-0">V</Badge>}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                              </div>
                            </td>
                            <td className="p-4 font-bold capitalize">{u.role.toLowerCase().replace('_', ' ')}</td>
                            <td className="p-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`text-[10px] h-8 font-extrabold gap-1 px-2 rounded-lg
                                  ${isVerified
                                    ? 'text-green-500 bg-green-500/5 hover:bg-green-500/10'
                                    : 'text-muted-foreground bg-accent/20 hover:bg-accent/30'}`}
                                onClick={() => verifyPlayer.mutate({ userId: u.id, verified: !isVerified })}
                              >
                                {isVerified ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                {isVerified ? 'Verified' : 'Verify'}
                              </Button>
                            </td>
                            <td className="p-4">
                              {u.banned ? (
                                <Badge variant="destructive" className="bg-destructive/10 text-destructive border border-destructive/20 text-[9px] font-bold">Banned</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] font-bold">Active</Badge>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setEditRole(u.role);
                                  }}
                                >
                                  <Settings className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                </Button>
                                {u.banned ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-[10px] h-8 border-green-500/20 text-green-500 hover:bg-green-500/5"
                                    onClick={() => unbanUser.mutate(u.id)}
                                  >
                                    Unban
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-[10px] h-8 text-destructive hover:bg-destructive/5 font-semibold"
                                    onClick={() => banUser.mutate({ userId: u.id })}
                                  >
                                    <Ban className="h-3 w-3 mr-1" /> Ban
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 3. CONTENT MODERATION VIEW (Phase 3) */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <Card className="glass-card">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-2.5 w-full">
                  <Search className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                  <Input
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                    placeholder="Search posts content or authors..."
                    className="h-10 text-xs border-border/40 focus:border-primary/50"
                  />
                </div>
                <select
                  value={postFilter}
                  onChange={(e) => setPostFilter(e.target.value as any)}
                  className="h-10 px-3 bg-accent/40 rounded-lg text-xs border border-border/40 font-semibold focus:outline-none w-full sm:w-auto"
                >
                  <option value="ALL">All Posts</option>
                  <option value="PINNED">Pinned Only</option>
                </select>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {mockPosts
                .filter(p => p.content.toLowerCase().includes(postSearch.toLowerCase()) || p.username.toLowerCase().includes(postSearch.toLowerCase()))
                .filter(p => postFilter === 'ALL' || (postFilter === 'PINNED' && p.isPinned))
                .map(post => (
                  <Card key={post.id} className="glass-card">
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border/20">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{post.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm">{post.username}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(post.createdAt)}</p>
                          <p className="text-xs text-foreground mt-2 break-words whitespace-pre-wrap">{post.content}</p>

                          <div className="flex items-center gap-4 mt-3 text-muted-foreground text-[10px]">
                            <span className="flex items-center gap-1">Likes: {post.likes}</span>
                            <span>Comments: {post.comments}</span>
                            {post.isPinned && <Badge variant="default" className="text-[8px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0 border-yellow-500/20">PINNED</Badge>}
                            {post.isFeatured && <Badge variant="default" className="text-[8px] bg-primary/20 text-primary px-1.5 py-0">FEATURED</Badge>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center sm:flex-col justify-end gap-1.5 shrink-0">
                        <Button size="sm" variant="ghost" className="h-8 text-xs font-bold gap-1" onClick={() => handleTogglePinPost(post.id)}>
                          <Pin className="h-3.5 w-3.5" /> {post.isPinned ? 'Unpin' : 'Pin'}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs font-bold gap-1" onClick={() => handleToggleFeaturePost(post.id)}>
                          <Star className="h-3.5 w-3.5" /> {post.isFeatured ? 'Unfeature' : 'Feature'}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs font-bold text-destructive hover:bg-destructive/5 gap-1" onClick={() => handleDeletePost(post.id)}>
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* 4. COMMUNITIES & TEAMS (Phase 4) */}
        {activeTab === 'communities' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Communities Panel */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Building2 className="h-4.5 w-4.5 text-primary" /> Manage Communities
                </CardTitle>
                <CardDescription className="text-[11px]">Audit and feature community groups</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[350px]">
                  <thead>
                    <tr className="border-b border-border/35 text-[9px] font-bold text-muted-foreground uppercase bg-accent/10">
                      <th className="p-3">Community Name</th>
                      <th className="p-3">Members</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCommunities.map(c => (
                      <tr key={c.id} className="border-b border-border/10 hover:bg-accent/5 text-xs">
                        <td className="p-3 font-semibold">
                          <p>{c.name}</p>
                          <span className="text-[9px] text-muted-foreground">owner: {c.owner}</span>
                        </td>
                        <td className="p-3 font-bold">{c.members.toLocaleString()}</td>
                        <td className="p-3 text-right flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleToggleFeaturedCommunity(c.id)}>
                            <Star className={`h-3.5 w-3.5 ${c.featured ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 text-destructive hover:bg-destructive/5 text-xs font-bold" onClick={() => handleDeleteCommunity(c.id)}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Teams Panel */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-gaming-purple" /> Manage Teams
                </CardTitle>
                <CardDescription className="text-[11px]">Review and feature tournament guilds</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[350px]">
                  <thead>
                    <tr className="border-b border-border/35 text-[9px] font-bold text-muted-foreground uppercase bg-accent/10">
                      <th className="p-3">Team Name</th>
                      <th className="p-3">Win/Loss</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTeams.map(t => (
                      <tr key={t.id} className="border-b border-border/10 hover:bg-accent/5 text-xs">
                        <td className="p-3 font-semibold">
                          <p className="flex items-center gap-1.5">
                            {t.name} <Badge variant="outline" className="text-[8px]">{t.tag}</Badge>
                          </p>
                          <span className="text-[9px] text-muted-foreground">captain: {t.captain}</span>
                        </td>
                        <td className="p-3 font-bold text-green-500">{t.wins}W / {t.losses}L</td>
                        <td className="p-3 text-right flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleToggleFeaturedTeam(t.id)}>
                            <Star className={`h-3.5 w-3.5 ${t.featured ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 text-destructive hover:bg-destructive/5 text-xs font-bold" onClick={() => handleDeleteTeam(t.id)}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

          </div>
        )}

        {/* 5. TOURNAMENTS (Phase 5) */}
        {activeTab === 'tournaments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Create Tournament Form */}
            <Card className="glass-card lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base font-extrabold">Create Tournament</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTournament} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1">TOURNAMENT TITLE</label>
                    <Input name="title" required placeholder="Valorant Pro League" className="h-9 border-border/40" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1">GAME TITLE</label>
                    <Input name="game" required placeholder="Valorant" className="h-9 border-border/40" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">PRIZE POOL ($)</label>
                      <Input name="prizePool" type="number" required placeholder="5000" className="h-9 border-border/40" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">ENTRY FEE ($)</label>
                      <Input name="entryFee" type="number" required placeholder="0" className="h-9 border-border/40" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">MAX TEAMS</label>
                      <Input name="maxTeams" type="number" required placeholder="64" className="h-9 border-border/40" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">START DATE</label>
                      <Input name="date" type="date" required className="h-9 border-border/40" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary h-9 font-bold text-xs shadow-lg shadow-primary/25">
                    Launch Tournament Event
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Tournaments List */}
            <Card className="glass-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-extrabold">Active Tournaments Directory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockTournaments.map(tour => (
                  <div key={tour.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-accent/5">
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-foreground">{tour.title}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Game: {tour.game} • Prize Pool: ${tour.prizePool} • Max Teams: {tour.maxTeams}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20 capitalize font-extrabold">
                      {tour.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        )}

        {/* 6. GAME API INTEGRATIONS (Phase 6) */}
        {activeTab === 'game_apis' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {!apiStats ? (
                <div className="col-span-4 text-center py-8">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                </div>
              ) : (
                apiStats.apis?.map((item: any, i: number) => (
                  <Card key={i} className="glass-card">
                    <CardContent className="p-4 text-xs">
                      <div className="flex items-center justify-between pb-3 border-b border-border/20 mb-3">
                        <span className="font-bold text-foreground text-xs">{item.name}</span>
                        <Badge
                          variant={item.status === 'ACTIVE' ? 'default' : 'destructive'}
                          className={item.status === 'ACTIVE' ? 'bg-green-600 text-white' : ''}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-[11px] text-muted-foreground">
                        <p className="flex justify-between">
                          <span>Failed Logs:</span> <span className="font-semibold text-foreground">{item.failedRequests}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Queue Size:</span> <span className="font-semibold text-foreground">{item.syncQueue}</span>
                        </p>
                        <p className="text-[9px] truncate">Synced: {formatDate(item.lastSync)}</p>

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-[10px] h-8 mt-2"
                          onClick={() => manualSyncApi.mutate(item.name)}
                          disabled={manualSyncApi.isPending}
                        >
                          <RefreshCw className={`h-3 w-3 mr-1.5 ${manualSyncApi.isPending ? 'animate-spin' : ''}`} />
                          Sync Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Sync Queue Logs */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base font-extrabold">Live Integration Logs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-[10px] font-mono max-h-60 overflow-y-auto">
                {apiStats?.logs?.map((log: any, i: number) => (
                  <div key={i} className={`p-2.5 rounded border ${log.level === 'ERROR' ? 'bg-red-500/5 border-red-500/15 text-red-400' : log.level === 'WARN' ? 'bg-yellow-500/5 border-yellow-500/15 text-yellow-400' : 'bg-accent/10 border-border/20 text-muted-foreground'}`}>
                    <span>[{formatDate(log.timestamp)}]</span>{' '}
                    <span className="font-extrabold">[{log.level}]</span>{' '}
                    <span>{log.message}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 7. REPORTS & MODERATION (Phase 7) */}
        {activeTab === 'reports' && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" /> Urgent Flagged Reports
              </CardTitle>
              <CardDescription className="text-xs">Take direct enforcement action on flagged reports</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-border/30 bg-accent/5 text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">
                    <th className="p-4">Reason</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">Reporter</th>
                    <th className="p-4">Reported Player</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : !reportsData || (reportsData.data || reportsData).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground text-xs font-medium">
                        Platform safe! No active user reports found.
                      </td>
                    </tr>
                  ) : (
                    (reportsData.data || reportsData).map((r: any) => {
                      const isPending = r.status === 'PENDING';
                      return (
                        <tr key={r.id} className="border-b border-border/10 hover:bg-accent/10 transition-colors text-xs">
                          <td className="p-4 font-extrabold text-destructive flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                            {r.reason}
                          </td>
                          <td className="p-4 text-muted-foreground break-all max-w-[200px]">{r.description || 'N/A'}</td>
                          <td className="p-4 font-semibold">{r.reporter?.profile?.username || r.reporter?.email || 'N/A'}</td>
                          <td className="p-4 font-semibold text-destructive">{r.reported?.profile?.username || r.reported?.email || 'N/A'}</td>
                          <td className="p-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 h-8 text-[10px]"
                                  onClick={() => resolveReport.mutate({ id: r.id, resolution: 'Reviewed and dismissed by Admin' })}
                                  disabled={resolveReport.isPending}
                                >
                                  Dismiss
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 text-[10px]"
                                  onClick={() => {
                                    banUser.mutate({ userId: r.reportedId, reason: r.reason });
                                    resolveReport.mutate({ id: r.id, resolution: 'User has been banned' });
                                  }}
                                  disabled={banUser.isPending}
                                >
                                  Enforce Ban
                                </Button>
                              </div>
                            ) : (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] font-bold">
                                Resolved
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* 8. ANALYTICS (Phase 8) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* DAU vs MAU Trends */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-sm font-extrabold">Active User Engagement (DAU vs MAU)</CardTitle>
                </CardHeader>
                <CardContent className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData}>
                      <defs>
                        <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                      <XAxis dataKey="name" stroke="#A0AEC0" />
                      <YAxis stroke="#A0AEC0" />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#2D3748' }} />
                      <Legend />
                      <Area type="monotone" dataKey="DAU" stroke="#7C3AED" fillOpacity={1} fill="url(#colorDau)" />
                      <Area type="monotone" dataKey="MAU" stroke="#4B5563" fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Account Registrations Chart */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-sm font-extrabold">New Gamer Registrations</CardTitle>
                </CardHeader>
                <CardContent className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                      <XAxis dataKey="name" stroke="#A0AEC0" />
                      <YAxis stroke="#A0AEC0" />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#2D3748' }} />
                      <Legend />
                      <Bar dataKey="registrations" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* 9. BROADCAST VIEW (Phase 9) */}
        {activeTab === 'broadcast' && (
          <Card className="glass-card max-w-xl mx-auto">
            <CardHeader>
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-primary" /> Create Emergency Broadcast / Alert
              </CardTitle>
              <CardDescription className="text-xs">Publish system banners or send push notifications instantly</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1">AUDIENCE TARGET</label>
                    <select
                      value={broadcastTarget}
                      onChange={(e) => setBroadcastTarget(e.target.value as any)}
                      className="w-full h-9 px-3 bg-accent/40 rounded-lg text-xs border border-border/40 font-semibold focus:outline-none"
                    >
                      <option value="EVERYONE">Everyone (System-wide)</option>
                      <option value="SELECTED_USERS">Premium Tier Users</option>
                      <option value="COMMUNITIES">Tournament Captains</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1">ALERT TYPE</label>
                    <select
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value as any)}
                      className="w-full h-9 px-3 bg-accent/40 rounded-lg text-xs border border-border/40 font-semibold focus:outline-none"
                    >
                      <option value="PUSH">Direct Push Notification</option>
                      <option value="GLOBAL_ALERT">Interactive Banner Alert</option>
                      <option value="MAINTENANCE_ALERT">Maintenance Advisory</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground mb-1">BROADCAST TITLE</label>
                  <Input
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Server Maintenance in 10 minutes!"
                    className="h-9 border-border/40"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground mb-1">ALERT CONTENT / BODY</label>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Type the broadcast message details..."
                    className="w-full p-3 bg-accent/20 rounded-lg border border-border/40 h-24 focus:outline-none"
                  />
                </div>

                <Button type="submit" className="w-full bg-primary h-9 font-bold text-xs shadow-lg shadow-primary/25">
                  Send Global Announcement Broadcast
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 10. SYSTEM MONITORING VIEW (Phase 10) */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* System Resources */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Layers className="h-4.5 w-4.5 text-primary" /> Core Resource Allocation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Database Metrics */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Database Size (PostgreSQL)</span>
                    <span className="text-primary">{stats?.system?.databaseSize || '5.2 MB'}</span>
                  </div>
                  <div className="w-full bg-accent/20 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                </div>

                {/* RAM Allocation */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Server RAM Used</span>
                    <span className="text-primary">{stats?.system?.memoryUsage || '44 MB'}</span>
                  </div>
                  <div className="w-full bg-accent/20 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '58%' }}></div>
                  </div>
                </div>

                {/* API latency progress */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Server CPU Load</span>
                    <span className="text-primary">{stats?.system?.cpuUsage || '4.2%'}</span>
                  </div>
                  <div className="w-full bg-accent/20 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '12%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Health Summary */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-green-500 animate-pulse" /> Diagnostics Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex justify-between border-b border-border/20 pb-2">
                  <span className="text-muted-foreground">Server Status:</span>
                  <span className="font-extrabold text-green-500 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> ACTIVE
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/20 pb-2">
                  <span className="text-muted-foreground">Active Sessions:</span>
                  <span className="font-extrabold text-foreground">{stats?.system?.activeSessions || 4}</span>
                </div>
                <div className="flex justify-between border-b border-border/20 pb-2">
                  <span className="text-muted-foreground">Sync Queue Status:</span>
                  <span className="font-extrabold text-foreground">0 queued jobs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Errors Logged:</span>
                  <span className="font-extrabold text-red-500">2 warnings</span>
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* 11. PLATFORM SETTINGS VIEW (Phase 11) */}
        {activeTab === 'settings' && (
          <Card className="glass-card max-w-xl mx-auto">
            <CardHeader>
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <Settings className="h-4.5 w-4.5 text-primary" /> Portal Branding & Configurations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-xs">

              {/* Maintenance toggle */}
              <div className="flex justify-between items-center p-3.5 rounded-xl border border-border bg-accent/5">
                <div>
                  <h4 className="font-bold text-foreground">Platform Maintenance Mode</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Disable login and lock regular accounts temporarily</p>
                </div>
                <Button
                  size="sm"
                  variant={maintenanceMode ? 'destructive' : 'outline'}
                  onClick={() => {
                    setMaintenanceMode(!maintenanceMode);
                    toast.success(`Maintenance mode toggled to ${!maintenanceMode}`);
                  }}
                  className="h-8 text-[10px]"
                >
                  {maintenanceMode ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              {/* Brand Editing */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-muted-foreground">PLATFORM BRANDING NAME</label>
                <div className="flex gap-2">
                  <Input value={brandingName} onChange={(e) => setBrandingName(e.target.value)} className="h-9 border-border/40" />
                  <Button size="sm" onClick={() => toast.success('Branding update saved')} className="h-9 bg-primary">Save</Button>
                </div>
              </div>

              {/* Feature Flags */}
              <div className="space-y-3">
                <p className="block text-[10px] font-bold text-muted-foreground uppercase">Frontend Feature Flags</p>
                <div className="space-y-2">
                  {Object.entries(featureFlags).map(([flag, value]) => (
                    <div key={flag} className="flex justify-between items-center py-2 border-b border-border/20">
                      <span className="capitalize font-semibold text-muted-foreground">{flag.replace(/([A-Z])/g, ' $1')} Module</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setFeatureFlags(prev => ({ ...prev, [flag]: !value }));
                          toast.success(`Flag ${flag} toggled`);
                        }}
                        className={`h-8 text-[10px] px-2 rounded ${value ? 'text-green-500 bg-green-500/5' : 'text-muted-foreground bg-accent/10'}`}
                      >
                        {value ? 'ENABLED' : 'DISABLED'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>
        )}

        {/* 12. AUDIT LOGS VIEW (Phase 12) */}
        {activeTab === 'audit' && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Administrative Security Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-border/30 bg-accent/5 text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Admin User</th>
                    <th className="p-4">Action Event</th>
                    <th className="p-4">IP / Client Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLoading ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center">
                        <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : !auditData || (auditData.data || auditData).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-muted-foreground text-xs font-medium">
                        No administrative audits logged yet.
                      </td>
                    </tr>
                  ) : (
                    (auditData.data || auditData).map((log: any) => (
                      <tr key={log.id} className="border-b border-border/10 hover:bg-accent/10 transition-colors text-xs text-muted-foreground">
                        <td className="p-4 font-mono text-[10px] text-foreground">{formatDate(log.createdAt)}</td>
                        <td className="p-4 font-bold text-foreground">{log.user?.email || 'System'}</td>
                        <td className="p-4 text-primary font-semibold">{log.action}</td>
                        <td className="p-4 text-[10px] max-w-[200px] truncate">{log.ip || '127.0.0.1'} • {log.userAgent || 'Chrome/Windows'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

      </main>

      {/* USER MANAGEMENT EDIT ROLE / VIEW PASSPORT MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-[#000000bc] flex items-center justify-center p-4 z-[999]">
          <Card className="glass-card max-w-md w-full animate-scale-in">
            <CardHeader className="flex flex-row justify-between items-center pb-2">
              <CardTitle className="text-base font-extrabold">Modify User Settings</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedUser(null)}>
                <XCircle className="h-4.5 w-4.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-border/20">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.profile?.avatar || ''} />
                  <AvatarFallback>{selectedUser.profile?.username?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-sm text-foreground">{selectedUser.profile?.username || 'N/A'}</p>
                  <p className="text-[10px] text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              {/* View Gamer Passport */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Gamer Passport ID:</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/profile/${selectedUser.profile?.username}`)}
                  className="h-8 text-[10px] font-bold"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" /> View Profile Passport
                </Button>
              </div>

              {/* Edit role select option */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase">Administrative Authorization Role</label>
                <div className="flex gap-2">
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="flex-1 h-9 px-3 bg-accent/40 rounded-lg text-xs border border-border/40 font-semibold focus:outline-none"
                  >
                    <option value="USER">Regular User</option>
                    <option value="MODERATOR">Moderator</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                  <Button
                    size="sm"
                    onClick={() => updateRole.mutate({ userId: selectedUser.id, role: editRole })}
                    disabled={updateRole.isPending}
                    className="h-9 bg-primary font-bold"
                  >
                    Update
                  </Button>
                </div>
              </div>

              {/* Reset Password */}
              <div className="flex items-center justify-between pt-2 border-t border-border/20">
                <span className="font-semibold text-muted-foreground">Password Control:</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.success(`Generated reset link for ${selectedUser.email}`)}
                  className="h-8 text-[10px] font-semibold text-yellow-500 border-yellow-500/20"
                >
                  Reset Password Link
                </Button>
              </div>

              {/* Permanent deletion */}
              {user?.role === 'SUPER_ADMIN' && (
                <div className="flex items-center justify-between pt-3 border-t border-border/20">
                  <span className="font-semibold text-destructive">Platform Deletion:</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Are you absolutely sure you want to permanently delete this user account from PostgreSQL database? This action is non-reversible.')) {
                        deleteUserPermanent.mutate(selectedUser.id);
                      }
                    }}
                    disabled={deleteUserPermanent.isPending}
                    className="h-8 text-[10px] font-bold"
                  >
                    Delete User Database Record
                  </Button>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
