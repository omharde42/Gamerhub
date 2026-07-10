'use client';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Trophy, Users, Target, TrendingUp, Gamepad2, ArrowRight, Zap, Clock, Star, Sparkles, Activity, Swords } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { getInitials } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

function AnimatedStat({ value, label, icon: Icon, color, bg }: { value: string; label: string; icon: any; color: string; bg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="relative"
    >
      <Card variant="glass" hover={false}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{label}</p>
              <motion.p
                className="text-2xl font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {value}
              </motion.p>
            </div>
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center border border-primary/20`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: statsData, isLoading: statsLoading } = useQuery({ queryKey: ['analytics-stats'], queryFn: () => api.get('/analytics/stats').then(r => r.data.data).catch(() => null) });
  const { data: recommendations } = useQuery({ queryKey: ['recommendations'], queryFn: () => api.get('/ai/recommendations?limit=4').then(r => r.data.data).catch(() => []) });

  const stats = [
    { label: 'Win Rate', value: statsLoading ? '...' : `${statsData?.profile?.winRate || 0}%`, icon: Target, color: 'text-success', bg: 'bg-success/10' },
    { label: 'K/D Ratio', value: statsLoading ? '...' : statsData?.profile?.kd || '0.00', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Rank Score', value: statsLoading ? '...' : statsData?.profile?.rankScore || '0', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Matches', value: statsLoading ? '...' : statsData?.profile?.totalMatches || '0', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const quickActions = [
    { title: 'Find Teammates', href: '/feed', icon: Users, desc: 'Connect with players' },
    { title: 'Join Tournament', href: '/tournaments', icon: Trophy, desc: 'Compete and win' },
    { title: 'AI Coach', href: '/ai-coach', icon: Star, desc: 'Improve your game' },
    { title: 'Browse Jobs', href: '/jobs', icon: Target, desc: 'Find opportunities' },
  ];

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="flex flex-col md:flex-row justify-between gap-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Welcome back, {user?.profile?.username || 'Gamer'}
            <Sparkles className="h-5 w-5 text-yellow-500" />
          </h1>
          <p className="text-sm text-muted-foreground">Here's your gaming overview</p>
        </div>
        <div className="flex gap-2">
          <Link href="/profile/settings"><Button variant="outline" size="sm">Edit Profile</Button></Link>
          <Link href="/matchmaking"><Button variant="gradient" size="sm" className="gap-2" animate><Zap className="h-4 w-4" />Find Players</Button></Link>
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3" variants={{ show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="show">
        {stats.map((stat, i) => (
          <motion.div key={i} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
            <AnimatedStat {...stat} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card variant="glass">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Quick Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {quickActions.map((action, i) => (
                  <Link key={i} href={action.href}>
                    <motion.div
                      className="flex flex-col items-center text-center p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-accent/50 transition-all duration-200 cursor-pointer group"
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-all">
                        <action.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                      </div>
                      <p className="text-xs font-medium">{action.title}</p>
                      <p className="text-[10px] text-muted-foreground">{action.desc}</p>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {statsData?.weeklyProgress && (
            <Card variant="glass">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Weekly Progress</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statsData.weeklyProgress.slice(-7).map((day: any, i: number) => (
                    <motion.div key={i} className="flex items-center gap-3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <span className="text-xs text-muted-foreground w-8">{new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-gaming-purple to-gaming-cyan rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${day.winRate}%` }}
                          transition={{ duration: 1, delay: i * 0.05, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="text-xs font-medium w-10 text-right">{Math.round(day.winRate)}%</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card variant="glass">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Swords className="h-4 w-4 text-primary" />Your Profile</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Avatar className="h-14 w-14 border-2 border-primary shadow-lg shadow-primary/20" ring>
                  <AvatarImage src={user?.profile?.avatar || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-gaming-purple to-gaming-pink text-white">{getInitials(user?.profile?.username || 'U')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{user?.profile?.displayName || user?.profile?.username}</p>
                  <p className="text-xs text-muted-foreground">{user?.profile?.rank || 'Unranked'} &bull; {user?.profile?.role || 'Flex'}</p>
                </div>
              </motion.div>
              <div className="flex flex-wrap gap-1.5">
                {user?.profile?.mainGames?.map((game: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-[10px] gap-1"><Gamepad2 className="h-3 w-3" />{game}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-yellow-500" />AI Recommendations</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {recommendations?.length > 0 ? recommendations.slice(0, 3).map((rec: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <Link href={`/profile/${rec.username}`}>
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-all group">
                      <Avatar className="h-9 w-9"><AvatarImage src={rec.avatar || ''} /><AvatarFallback className="text-xs">{getInitials(rec.username)}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{rec.username}</p>
                        <p className="text-xs text-muted-foreground">{rec.rank} &bull; {rec.role}</p>
                      </div>
                      <Badge variant="success" className="text-[10px]">{rec.compatibility}%</Badge>
                    </div>
                  </Link>
                </motion.div>
              )) : <p className="text-sm text-muted-foreground">Complete your profile to get recommendations</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
