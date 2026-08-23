'use client';
import { useEffect } from 'react';
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
import { HudCard } from '@/components/hud/hud-card';
import { StatCounter } from '@/components/hud/stat-counter';
import { LevelChip } from '@/components/hud/level-chip';
import { gamerLevel, levelTitle, levelColor } from '@/lib/gamer-level';
import { fireCelebration } from '@/components/hud/celebration';

function AnimatedStat({ value, label, icon: Icon, color, bg, raw }: { value: string; label: string; icon: any; color: string; bg: string; raw?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <HudCard glow="emerald" className="p-4 border-white/10 bg-card/60" corners scanlines>
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rotate-45 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                {label}
              </p>
              <p className={`text-2xl font-black tracking-tight text-foreground font-mono ${value === '--' ? 'text-muted-foreground' : 'neon-emerald'}`}>
                {raw != null && value !== '--' ? (
                  <StatCounter value={raw} suffix={label === 'Win Rate' ? '%' : ''} />
                ) : (
                  value
                )}
              </p>
            </div>
            <div className={`w-11 h-11 clip-hud ${bg} flex items-center justify-center border border-white/10 shadow-md`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
          </div>
        </CardContent>
      </HudCard>
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
    { label: 'Win Rate', value: statsLoading ? '...' : (statsData?.profile?.winRate ? `${statsData.profile.winRate}%` : '--'), raw: statsLoading ? undefined : (statsData?.profile?.winRate ? Number(statsData.profile.winRate) : undefined), icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'K/D Ratio', value: statsLoading ? '...' : (statsData?.profile?.kd ? `${statsData.profile.kd}` : '--'), raw: statsLoading ? undefined : (statsData?.profile?.kd ? Number(statsData.profile.kd) : undefined), icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Rank Score', value: statsLoading ? '...' : (statsData?.profile?.rankScore ? `${statsData.profile.rankScore}` : '--'), raw: statsLoading ? undefined : (statsData?.profile?.rankScore ? Number(statsData.profile.rankScore) : undefined), icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Matches Played', value: statsLoading ? '...' : (statsData?.profile?.totalMatches ? `${statsData.profile.totalMatches}` : '--'), raw: statsLoading ? undefined : (statsData?.profile?.totalMatches ? Number(statsData.profile.totalMatches) : undefined), icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  ];

  const totalMatches = statsData?.profile?.totalMatches ? Number(statsData.profile.totalMatches) : 0;
  const { level, xp } = gamerLevel(totalMatches);
  const rankTitle = levelTitle(level);
  const rankColor = levelColor(level);

  // LEVEL-UP celebration: fire once when the gamer level increases.
  useEffect(() => {
    if (statsLoading) return;
    const prev = Number(sessionStorage.getItem('gh-last-level') || '0');
    if (level > prev && prev > 0) {
      fireCelebration(`LEVEL ${level} UNLOCKED`, `${rankTitle} — keep climbing, legend!`);
    }
    sessionStorage.setItem('gh-last-level', String(level));
  }, [level, totalMatches, statsLoading, rankTitle]);

  const quickActions = [
    { title: 'Find Teammates', href: '/feed', icon: Users, desc: 'Connect & squad up' },
    { title: 'Join Tournament', href: '/tournaments', icon: Trophy, desc: 'Compete for prizes' },
    { title: 'AI Game Coach', href: '/ai-coach', icon: Star, desc: 'Improve strategy' },
    { title: 'Esports Jobs', href: '/jobs', icon: Target, desc: 'Career opportunities' },
  ];

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Concept Art Obsidian Glass Hero Banner with Cybernetic Artifact */}
      <motion.div
        className="hud-corners relative overflow-hidden rounded-[32px] border border-emerald-500/40 bg-gradient-to-r from-[#030509]/95 via-[#0A0E1D]/90 to-[#0F172A]/95 p-6 md:p-8 backdrop-blur-3xl shadow-[0_25px_60px_-15px_rgba(16,185,129,0.25)] text-white"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="scanlines absolute inset-0 pointer-events-none z-[1]" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 md:w-80 h-64 md:h-80 rounded-full overflow-hidden opacity-40 pointer-events-none mix-blend-screen animate-pulse shrink-0 hidden sm:block">
          <img src="/cybernetic-artifact.jpg" alt="Cybernetic Artifact" className="w-full h-full object-cover rounded-full" loading="lazy" decoding="async" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-emerald-500/15 border-emerald-400/40 text-emerald-400 text-xs font-mono font-bold px-3 py-1 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                ⚡ GAMER PASSPORT DASHBOARD
              </Badge>
              <Badge variant="secondary" className="bg-purple-500/15 border-purple-500/30 text-purple-300 text-xs font-mono rounded-full px-3 py-1">
                OBSIDIAN HYPER-UI v3.0
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3 flex-wrap">
              Welcome back, <span className="holo-text font-mono">{user?.profile?.username || 'Gamer'}</span>
              <Sparkles className="h-6 w-6 text-emerald-400 animate-pulse" />
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Your esports hub performance summary, Steam achievements, AI recommendations, and live matchmaking queue.
            </p>
            <div className="hud-divider !justify-start max-w-md">
              <span className="hud-diamond" />
            </div>
          </div>

          {/* Gamified Level HUD */}
          <div className="flex items-center gap-4 w-full md:w-auto relative z-20">
            <div
              className="level-ring shrink-0"
              style={{ ['--lvl-pct' as any]: `${xp}%` }}
            >
              <div className="w-16 h-16 rounded-full bg-[#0A0E17] border border-white/10 flex flex-col items-center justify-center">
                <span className="text-[9px] font-mono font-bold text-slate-400 tracking-widest">LVL</span>
                <span className="text-xl font-black font-mono leading-none" style={{ color: rankColor, textShadow: `0 0 12px ${rankColor}` }}>
                  {level}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-black tracking-wider" style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}88` }}>
                  {rankTitle}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{xp}% XP TO NEXT LVL</span>
              </div>
              <div className="xp-shell mt-1.5 w-full max-w-[220px]">
                <div className="xp-fill" style={{ width: `${xp}%`, background: `linear-gradient(90deg, ${rankColor}99, ${rankColor})` }}>
                  <div className="xp-shine" />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2.5">
                <Link href="/profile/settings" className="flex-1 md:flex-none">
                  <Button variant="outline" size="sm" className="w-full font-bold rounded-2xl border-white/20 hover:border-emerald-400">
                    Edit Profile
                  </Button>
                </Link>
                <Link href="/matchmaking" className="flex-1 md:flex-none">
                  <Button variant="gradient" size="sm" className="w-full font-extrabold gap-2 rounded-2xl shadow-lg shadow-emerald-500/30 bg-gradient-to-r from-emerald-500 to-teal-600 text-white" animate>
                    <Zap className="h-4 w-4" /> Find Match
                  </Button>
                </Link>
              </div>
            </div>
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
