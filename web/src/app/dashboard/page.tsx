'use client';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Trophy, Users, Target, TrendingUp, Gamepad2, ArrowRight, Zap, Clock, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { getInitials, formatNumber } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: statsData, isLoading: statsLoading } = useQuery({ queryKey: ['analytics-stats'], queryFn: () => api.get('/analytics/stats').then(r => r.data.data).catch(() => null) });
  const { data: recommendations } = useQuery({ queryKey: ['recommendations'], queryFn: () => api.get('/ai/recommendations?limit=4').then(r => r.data.data).catch(() => []) });

  const stats = [
    { label: 'Win Rate', value: statsLoading ? '...' : `${statsData?.profile?.winRate || 0}%`, icon: Target, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'K/D Ratio', value: statsLoading ? '...' : statsData?.profile?.kd || '0.00', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Rank Score', value: statsLoading ? '...' : statsData?.profile?.rankScore || '0', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Matches', value: statsLoading ? '...' : statsData?.profile?.totalMatches || '0', icon: Zap, color: 'text-gaming-purple', bg: 'bg-gaming-purple/10' },
  ];

  const quickActions = [
    { title: 'Find Teammates', href: '/feed', icon: Users, desc: 'Connect with players' },
    { title: 'Join Tournament', href: '/tournaments', icon: Trophy, desc: 'Compete and win' },
    { title: 'AI Coach', href: '/ai-coach', icon: Star, desc: 'Improve your game' },
    { title: 'Browse Jobs', href: '/jobs', icon: Target, desc: 'Find opportunities' },
  ];

  return (<div className="space-y-8">
    <div className="flex flex-col md:flex-row justify-between gap-4"><div><h1 className="text-3xl font-bold">Welcome back, {user?.profile?.username || 'Gamer'}</h1><p className="text-muted-foreground">Here's your gaming overview</p></div><div className="flex gap-2"><Link href="/profile/settings"><Button variant="outline" size="sm">Edit Profile</Button></Link><Link href="/matchmaking"><Button variant="gradient" size="sm" className="gap-2"><Zap className="h-4 w-4" />Find Players</Button></Link></div></div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{stats.map((stat, i) => (<motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}><Card className="glass-card"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="space-y-1"><p className="text-sm text-muted-foreground">{stat.label}</p><p className="text-2xl font-bold">{stat.value}</p></div><div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div></div></CardContent></Card></motion.div>))}</div>

    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="glass-card"><CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{quickActions.map((action, i) => (<Link key={i} href={action.href}><div className="flex flex-col items-center text-center p-4 rounded-xl border border-border hover:border-gaming-purple/50 hover:bg-accent/50 transition-all cursor-pointer"><action.icon className="h-8 w-8 text-gaming-purple mb-2" /><p className="text-sm font-medium">{action.title}</p><p className="text-xs text-muted-foreground">{action.desc}</p></div></Link>))}</div></CardContent></Card>

        {statsData?.weeklyProgress && (<Card className="glass-card"><CardHeader><CardTitle className="text-lg">Weekly Progress</CardTitle></CardHeader><CardContent><div className="space-y-3">{statsData.weeklyProgress.slice(-7).map((day: any, i: number) => (<div key={i} className="flex items-center gap-3"><span className="text-xs text-muted-foreground w-8">{new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</span><Progress value={day.winRate} className="flex-1 h-3" /><span className="text-xs font-medium w-12 text-right">{Math.round(day.winRate)}%</span></div>))}</div></CardContent></Card>)}
      </div>

      <div className="space-y-6">
        <Card className="glass-card"><CardHeader><CardTitle className="text-lg">Your Profile</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-center gap-3"><Avatar className="h-16 w-16 border-2 border-gaming-purple"><AvatarImage src={user?.profile?.avatar || ''} /><AvatarFallback className="bg-primary/10 text-primary text-lg">{getInitials(user?.profile?.username || 'U')}</AvatarFallback></Avatar><div><p className="font-semibold text-lg">{user?.profile?.displayName || user?.profile?.username}</p><p className="text-sm text-muted-foreground">{user?.profile?.rank || 'Unranked'} • {user?.profile?.role || 'Flex'}</p></div></div><div className="flex flex-wrap gap-2">{user?.profile?.mainGames?.map((game: string, i: number) => (<Badge key={i} variant="secondary"><Gamepad2 className="h-3 w-3 mr-1" />{game}</Badge>))}</div></CardContent></Card>

        <Card className="glass-card"><CardHeader><CardTitle className="text-lg">AI Recommendations</CardTitle></CardHeader><CardContent className="space-y-3">{recommendations?.length > 0 ? recommendations.slice(0, 3).map((rec: any, i: number) => (<Link key={i} href={`/profile/${rec.username}`}><div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-all"><Avatar className="h-10 w-10"><AvatarImage src={rec.avatar || ''} /><AvatarFallback>{getInitials(rec.username)}</AvatarFallback></Avatar><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{rec.username}</p><p className="text-xs text-muted-foreground">{rec.rank} • {rec.role}</p></div><Badge variant="success">{rec.compatibility}%</Badge></div></Link>)) : <p className="text-sm text-muted-foreground">Complete your profile to get recommendations</p>}</CardContent></Card>
      </div>
    </div>
  </div>);
}
