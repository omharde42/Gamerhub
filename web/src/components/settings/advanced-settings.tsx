'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/authStore';
import { GAMES } from '@/lib/constants';
import { DeleteAccountCard } from './delete-account';
import {
  BarChart3,
  Bot,
  Crosshair,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  Activity,
  LineChart,
  Eye,
  Lightbulb,
} from 'lucide-react';

interface MatchRow {
  id: string;
  game: string;
  result: string;
  kills: number;
  deaths: number;
  assists: number;
  accuracy: number;
  playedAt: string;
}

const formatNumber = (value: number | null | undefined): string =>
  value === null || value === undefined ? '—' : Number(value).toLocaleString();

/** Turn live analytics into short, actionable coaching-style insights. */
function buildInsights(stats: any): string[] {
  const insights: string[] = [];
  const p = stats?.recentPerformance || {};
  const profile = stats?.profile || {};

  const kd = profile.kd ?? p.avgKd ?? 0;
  const winRate = profile.winRate ?? p.winRate ?? 0;
  const accuracy = profile.accuracy ?? p.avgAccuracy ?? 0;

  if (winRate >= 55) {
    insights.push('Your win rate is strong — you are consistently converting matches into victories.');
  } else if (winRate >= 45) {
    insights.push('Solid win rate. Tighten up late-game decisions to push past 55%.');
  } else if (winRate > 0) {
    insights.push('Your win rate is below 50% — review your losses and focus on positioning and communication.');
  }

  if (kd >= 2) {
    insights.push('Elite K/D! You are winning your duels consistently.');
  } else if (kd >= 1) {
    insights.push('Positive K/D — keep taking smart fights to grow your advantage.');
  } else if (kd > 0) {
    insights.push('Your K/D is below 1.0 — practice aim training and avoid overextending without cover.');
  }

  if (accuracy >= 40) {
    insights.push(`Great accuracy at ${formatNumber(accuracy)}% — you are landing your shots when it matters.`);
  } else if (accuracy > 0) {
    insights.push('Accuracy is a quick win — spend time in aim trainers to sharpen your crosshair placement.');
  }

  if (p.matches > 0 && p.matches < 10) {
    insights.push('Log more matches to unlock deeper trend analysis — more data means sharper insights.');
  } else if (p.matches >= 10) {
    insights.push('You have enough logged matches for reliable trends. Visit the Analytics page for charts and heatmaps.');
  }

  return insights;
}

export function AdvancedSettingsTab() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: () => api.get('/analytics/stats').then((r) => r.data.data).catch(() => null),
  });

  // ── Self-serve performance logger ────────────────────────────────
  const [game, setGame] = useState('');
  const [result, setResult] = useState('WIN');
  const [kills, setKills] = useState('');
  const [deaths, setDeaths] = useState('');
  const [assists, setAssists] = useState('');
  const [accuracy, setAccuracy] = useState('');

  const invalidateStats = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics-stats'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  const logMatch = useMutation({
    mutationFn: () =>
      api.post('/analytics/matches', {
        game,
        result,
        kills: Number(kills) || 0,
        deaths: Number(deaths) || 0,
        assists: Number(assists) || 0,
        accuracy: accuracy ? Number(accuracy) : undefined,
      }),
    onSuccess: () => {
      invalidateStats();
      setKills(''); setDeaths(''); setAssists(''); setAccuracy(''); setResult('WIN');
      toast.success('Match logged! Your stats were updated.', { id: 'match-logged' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to log the match');
    },
  });

  const deleteMatch = useMutation({
    mutationFn: (id: string) => api.delete(`/analytics/matches/${id}`),
    onSuccess: () => {
      invalidateStats();
      toast.success('Match removed', { id: 'match-deleted' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete the match');
    },
  });

  // ── Privacy toggle ───────────────────────────────────────────────
  const [allowComparison, setAllowComparison] = useState<boolean>(
    (user as any)?.profile?.allowComparison ?? true
  );
  const updateComparison = useMutation({
    mutationFn: (value: boolean) => api.put('/profiles', { allowComparison: value }),
    onSuccess: (_, value) => {
      setUser({ ...user, profile: { ...user?.profile, allowComparison: value } } as any);
      toast.success(value ? 'Your profile is now visible in comparisons.' : 'Your profile is hidden from comparisons.');
    },
    onError: (err: any) => {
      setAllowComparison((user as any)?.profile?.allowComparison ?? true);
      toast.error(err.response?.data?.message || 'Failed to update privacy setting');
    },
  });

  const handleComparisonToggle = (value: boolean) => {
    setAllowComparison(value);
    updateComparison.mutate(value);
  };

  // ── Derived data ─────────────────────────────────────────────────
  const matchHistory: MatchRow[] = stats?.matchHistory || [];
  const recentPerformance = stats?.recentPerformance || {};
  const insights = useMemo(() => buildInsights(stats), [stats]);

  const hubLinks = [
    {
      href: '/analytics',
      label: 'Analytics Dashboard',
      desc: 'Win rate, K/D, accuracy trends & heatmaps',
      icon: BarChart3,
    },
    {
      href: '/ai-coach',
      label: 'AI Game Coach',
      desc: 'Personalized coaching, strategy & training advice',
      icon: Bot,
    },
    {
      href: `/passport/${user?.profile?.username || (user as any)?.username || ''}`,
      label: 'Gamer Passport',
      desc: 'Your verified identity, ranks & achievements',
      icon: Trophy,
    },
  ];

  const quickStats = [
    { label: 'Win Rate', value: `${formatNumber(recentPerformance.winRate)}%`, icon: Target, color: 'text-green-500' },
    { label: 'K/D Ratio', value: formatNumber(recentPerformance.avgKd), icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Accuracy', value: `${formatNumber(recentPerformance.avgAccuracy)}%`, icon: Crosshair, color: 'text-gaming-purple' },
    { label: 'Matches', value: formatNumber(recentPerformance.matches), icon: Activity, color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Performance Analysis */}
      <Card variant="glass" className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <LineChart className="h-4 w-4 text-primary" />
            Performance Analysis
          </CardTitle>
          <CardDescription className="text-xs">
            Log your match results yourself — no verified game account needed — and get live win rate, K/D, and
            accuracy insights to track your improvement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quickStats.map((s) => (
                  <div key={s.label} className="p-3 rounded-xl border border-border/50 bg-background/40">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">{s.label}</p>
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <p className={`text-xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {insights.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5">
                  <p className="text-xs font-bold flex items-center gap-1.5 text-amber-400">
                    <Lightbulb className="h-3.5 w-3.5" /> Coach Insights
                  </p>
                  <ul className="space-y-1">
                    {insights.map((insight, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-amber-400/70">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <Separator />

          {/* Match logger */}
          <div className="space-y-3">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-primary" /> Log a Match
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="space-y-1.5 lg:col-span-2">
                <Label className="text-[11px] font-semibold">Game</Label>
                <Select value={game} onValueChange={setGame}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select game" /></SelectTrigger>
                  <SelectContent>
                    {GAMES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold">Result</Label>
                <Select value={result} onValueChange={setResult}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WIN"><span className="text-green-500 font-semibold">WIN</span></SelectItem>
                    <SelectItem value="LOSS"><span className="text-red-500 font-semibold">LOSS</span></SelectItem>
                    <SelectItem value="DRAW"><span className="text-yellow-500 font-semibold">DRAW</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold">Kills</Label>
                <Input type="number" min={0} value={kills} onChange={(e) => setKills(e.target.value)} placeholder="0" variant="neon" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold">Deaths</Label>
                <Input type="number" min={0} value={deaths} onChange={(e) => setDeaths(e.target.value)} placeholder="0" variant="neon" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold">Accuracy %</Label>
                <Input type="number" min={0} max={100} value={accuracy} onChange={(e) => setAccuracy(e.target.value)} placeholder="e.g. 45" variant="neon" className="h-10" />
              </div>
            </div>
            <Button
              variant="gradient"
              size="sm"
              className="gap-1.5"
              animate
              disabled={!game || logMatch.isPending}
              onClick={() => logMatch.mutate()}
            >
              {logMatch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Log Match
            </Button>
          </div>

          {/* Recent matches */}
          {matchHistory.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Recent Matches</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {matchHistory.slice(0, 10).map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-background/30 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${
                          m.result === 'WIN'
                            ? 'text-green-500 border-green-500/30 bg-green-500/10'
                            : m.result === 'LOSS'
                              ? 'text-red-500 border-red-500/30 bg-red-500/10'
                              : 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
                        }`}
                      >
                        {m.result}
                      </Badge>
                      <span className="font-semibold truncate">{m.game}</span>
                      <span className="text-muted-foreground shrink-0">
                        {formatNumber(m.kills)}/{formatNumber(m.deaths)}/{formatNumber(m.assists)}
                        {m.accuracy != null && m.accuracy > 0 ? ` • ${m.accuracy}%` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">
                        {new Date(m.playedAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteMatch.mutate(m.id)}
                        disabled={deleteMatch.isPending}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Delete match"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics & AI Hub */}
      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Analytics & AI Hub
          </CardTitle>
          <CardDescription className="text-xs">
            Jump into your full analytics suite, AI coaching, and your Gamer Passport.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3">
          {hubLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="p-3 rounded-xl border border-border/50 bg-background/40 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
            >
              <link.icon className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm font-semibold group-hover:text-primary transition-colors">{link.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{link.desc}</p>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            Privacy
          </CardTitle>
          <CardDescription className="text-xs">
            Control how your gaming data is used across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/20 transition-colors">
            <div>
              <p className="text-sm font-semibold">Allow profile comparisons</p>
              <p className="text-xs text-muted-foreground">
                Let other gamers compare their stats against yours. Turn off to hide your profile from the
                comparison and leaderboard tools.
              </p>
            </div>
            <Switch
              checked={allowComparison}
              onCheckedChange={handleComparisonToggle}
              disabled={updateComparison.isPending}
            />
          </div>
        </CardContent>
      </Card>

      <DeleteAccountCard />
    </div>
  );
}
