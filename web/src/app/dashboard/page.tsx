'use client';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Trophy, Users, Target, TrendingUp, Gamepad2, ArrowRight, Zap, Clock, Star, Sparkles, Activity, Swords, Flame, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { getInitials } from '@/lib/utils';
import { motion } from 'framer-motion';
import { SteamShowcase } from '@/components/profile/steam-showcase';

function AnimatedStat({ value, label, icon: Icon, color, bg }: { value: string; label: string; icon: any; color: string; bg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card variant="bento" hover={false} className="p-4 bg-card/60 border border-white/10 backdrop-blur-xl shadow-lg">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-black tracking-tight text-foreground font-mono">
                {value}
              </p>
            </div>
            <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center border border-white/10 shadow-md`}>
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
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: () => api.get('/analytics/stats').then(r => r.data.data).catch(() => null)
  });
  const { data: recommendations } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => api.get('/ai/recommendations?limit=4').then(r => r.data.data).catch(() => [])
  });

  const stats = [
    { label: 'Win Rate', value: statsLoading ? '...' : (statsData?.profile?.winRate ? `${statsData.profile.winRate}%` : '--'), icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'K/D Ratio', value: statsLoading ? '...' : (statsData?.profile?.kd ? `${statsData.profile.kd}` : '--'), icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Rank Score', value: statsLoading ? '...' : (statsData?.profile?.rankScore ? `${statsData.profile.rankScore}` : '--'), icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Matches Played', value: statsLoading ? '...' : (statsData?.profile?.totalMatches ? `${statsData.profile.totalMatches}` : '--'), icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  ];

  const quickActions = [
    { title: 'Find Teammates', href: '/feed', icon: Users, desc: 'Connect & squad up' },
    { title: 'Join Tournament', href: '/tournaments', icon: Trophy, desc: 'Compete for prizes' },
    { title: 'AI Game Coach', href: '/ai-coach', icon: Star, desc: 'Improve strategy' },
    { title: 'Esports Jobs', href: '/jobs', icon: Target, desc: 'Career opportunities' },
  ];

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Hybrid Aurora Banner Header */}
      <motion.div
        className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-r from-indigo-950 via-purple-900 to-indigo-900 p-6 md:p-8 backdrop-blur-2xl shadow-2xl text-white"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-cyan-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-cyan-500/10 border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold px-2.5 py-0.5">
                ⚡ GAMER PASSPORT DASHBOARD
              </Badge>
              <Badge variant="secondary" className="bg-purple-500/10 border-purple-500/20 text-purple-300 text-xs font-mono">
                HYBRID HYPER-UI v2.5
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Welcome back, <span className="text-aurora">{user?.profile?.username || 'Gamer'}</span>
              <Sparkles className="h-6 w-6 text-amber-400 animate-pulse" />
            </h1>
            <p className="text-sm text-blue-200/80 max-w-xl">
              Your esports hub performance summary, Steam achievements, AI recommendations, and live matchmaking queue.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link href="/profile/settings" className="flex-1 md:flex-none">
              <Button variant="neumorphic" size="sm" className="w-full font-semibold rounded-xl">
                Edit Profile
              </Button>
            </Link>
            <Link href="/matchmaking" className="flex-1 md:flex-none">
              <Button variant="gradient" size="sm" className="w-full font-bold gap-2 rounded-xl shadow-lg shadow-indigo-500/25" animate>
                <Zap className="h-4 w-4" /> Find Match
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Bento Grid Stats */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        initial="hidden"
        animate="show"
      >
        {stats.map((stat, i) => (
          <motion.div key={i} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
            <AnimatedStat {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Modular Bento Sections */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Action Hub (Bento Style) */}
          <Card variant="bento">
            <CardHeader className="pb-4 p-0">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Activity className="h-5 w-5 text-primary" /> Quick Action Hub
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quickActions.map((action, i) => (
                  <Link key={i} href={action.href}>
                    <motion.div
                      className="flex flex-col items-center text-center p-4 rounded-2xl border border-white/10 bg-background/40 hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 cursor-pointer group shadow-sm"
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/30 group-hover:scale-110 transition-all shadow-inner">
                        <action.icon className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-xs font-bold text-foreground">{action.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{action.desc}</p>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Steam Showcase Integration Widget */}
          {user?.id && <SteamShowcase userId={user.id} />}

          {/* Weekly Esports Performance Graph */}
          {statsData?.weeklyProgress && (
            <Card variant="bento">
              <CardHeader className="pb-4 p-0">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <TrendingUp className="h-5 w-5 text-cyan-400" /> Weekly Esports Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-4 space-y-3">
                {statsData.weeklyProgress.slice(-7).map((day: any, i: number) => (
                  <motion.div key={i} className="flex items-center gap-3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <span className="text-xs font-semibold text-muted-foreground w-10 font-mono">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                    </span>
                    <div className="flex-1 h-2.5 bg-background/60 rounded-full overflow-hidden border border-white/10">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${day.winRate}%` }}
                        transition={{ duration: 1, delay: i * 0.05, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-xs font-bold font-mono w-12 text-right text-foreground">{Math.round(day.winRate)}%</span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Bento Column */}
        <div className="space-y-6">
          {/* Gamer Passport Card */}
          <Card variant="bento">
            <CardHeader className="pb-3 p-0">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5 text-indigo-400" /> Gamer Passport
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-3 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/50 shadow-xl shrink-0">
                  <AvatarImage src={user?.profile?.avatar || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-lg">
                    {getInitials(user?.profile?.username || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-base text-foreground truncate">{user?.profile?.displayName || user?.profile?.username}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                      {user?.profile?.rank || 'Pro Gamer'}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">{user?.profile?.role || 'Flex'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/10">
                {user?.profile?.mainGames?.map((game: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px] gap-1 bg-background/50 border-white/10">
                    <Gamepad2 className="h-3 w-3 text-cyan-400" /> {game}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Matchmaking Recommendations */}
          <Card variant="bento">
            <CardHeader className="pb-3 p-0">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5 text-amber-400" /> AI Teammate Matches
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-3 space-y-2.5">
              {recommendations?.length > 0 ? (
                recommendations.slice(0, 3).map((rec: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <Link href={`/profile/${rec.username}`}>
                      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-background/40 border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all group">
                        <Avatar className="h-10 w-10 shrink-0 border border-white/10">
                          <AvatarImage src={rec.avatar || ''} />
                          <AvatarFallback className="text-xs font-bold">{getInitials(rec.username)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{rec.username}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{rec.rank} &bull; {rec.role}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-mono font-bold shrink-0">
                          {rec.compatibility}% Match
                        </Badge>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground p-2">Complete your profile games to receive personalized teammate recommendations.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
