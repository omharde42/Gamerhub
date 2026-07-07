'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { TrendingUp, Target, Crosshair, Calendar, Activity, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['analytics-stats'], queryFn: () => api.get('/analytics/stats').then(r => r.data.data) });
  const { data: weekly } = useQuery({ queryKey: ['analytics-weekly'], queryFn: () => api.get('/analytics/weekly-progress').then(r => r.data.data) });
  const { data: heatmap } = useQuery({ queryKey: ['analytics-heatmap'], queryFn: () => api.get('/analytics/heatmap').then(r => r.data.data) });

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>;

  const weeklyData = weekly?.map((d: any) => ({ name: new Date(d.date).toLocaleDateString('en', { weekday: 'short' }), winRate: Math.round(d.winRate), kd: d.kd, matches: d.matches })) || [];
  const heatmapData = Object.entries(heatmap || {}).map(([key, count]) => ({ name: key, value: count as number }));

  return (<div className="space-y-6"><h1 className="text-2xl font-bold"><BarChart3 className="h-6 w-6 inline mr-2 text-gaming-purple" />Analytics</h1>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="glass-card"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Win Rate</p><p className="text-2xl font-bold text-green-500">{stats?.profile?.winRate || 0}%</p></div><Target className="h-8 w-8 text-green-500/30" /></div></CardContent></Card>
      <Card className="glass-card"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">K/D Ratio</p><p className="text-2xl font-bold text-blue-500">{stats?.profile?.kd || 0}</p></div><TrendingUp className="h-8 w-8 text-blue-500/30" /></div></CardContent></Card>
      <Card className="glass-card"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Accuracy</p><p className="text-2xl font-bold text-gaming-purple">{stats?.profile?.accuracy || 0}%</p></div><Crosshair className="h-8 w-8 text-gaming-purple/30" /></div></CardContent></Card>
      <Card className="glass-card"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Total Matches</p><p className="text-2xl font-bold text-yellow-500">{stats?.profile?.totalMatches || 0}</p></div><Activity className="h-8 w-8 text-yellow-500/30" /></div></CardContent></Card>
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="glass-card"><CardHeader><CardTitle className="text-lg">Weekly Win Rate</CardTitle></CardHeader><CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weeklyData}><defs><linearGradient id="colorWin" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} /><Area type="monotone" dataKey="winRate" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorWin)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></CardContent></Card>
      <Card className="glass-card"><CardHeader><CardTitle className="text-lg">K/D Trend</CardTitle></CardHeader><CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={weeklyData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} /><Line type="monotone" dataKey="kd" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899' }} /></LineChart></ResponsiveContainer></div></CardContent></Card>
    </div>

    <Card className="glass-card"><CardHeader><CardTitle className="text-lg">Recent Match History</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-muted-foreground"><th className="text-left p-2">Game</th><th className="text-left p-2">Result</th><th className="text-center p-2">K</th><th className="text-center p-2">D</th><th className="text-center p-2">A</th><th className="text-center p-2">Accuracy</th></tr></thead><tbody>{stats?.matchHistory?.slice(0, 10).map((m: any, i: number) => (<tr key={i} className="border-b border-border/50 hover:bg-accent/50"><td className="p-2">{m.game}</td><td className="p-2"><span className={m.result === 'WIN' ? 'text-green-500' : 'text-red-500'}>{m.result}</span></td><td className="p-2 text-center">{m.kills}</td><td className="p-2 text-center">{m.deaths}</td><td className="p-2 text-center">{m.assists}</td><td className="p-2 text-center">{m.accuracy}%</td></tr>))}</tbody></table></div></CardContent></Card>
  </div>);
}
