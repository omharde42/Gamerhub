'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Trophy, Swords, Zap, CheckCircle2, Flame, ShieldAlert, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { GameRendererProps } from '../clashofclans/ClashOfClansRenderer';
import { GameConnectForm } from '../GameConnectForm';

export function ValorantRenderer({ gameUid }: GameRendererProps) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['game-profile', 'valorant', gameUid],
    queryFn: async () => {
      const res = await api.get(`/game/valorant/profile?uid=${encodeURIComponent(gameUid)}`);
      return res.data.data;
    },
    enabled: Boolean(gameUid),
    staleTime: 5 * 60 * 1000,
  });

  if (!gameUid) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
        <Card variant="glass" className="border-red-500/30 bg-gradient-to-br from-[#1C0F13] via-[#0F141C] to-black">
          <CardContent className="p-6 space-y-5">
            <GameConnectForm gameKey="valorant" fieldName="riotId" placeholder="PlayerName#NA1" gameLabel="Valorant" accent="red" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl bg-[#170E12]/80 border border-red-500/30 animate-pulse space-y-4">
        <div className="h-16 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="h-24 bg-white/5 rounded-2xl" />
          <div className="h-24 bg-white/5 rounded-2xl" />
          <div className="h-24 bg-white/5 rounded-2xl" />
          <div className="h-24 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-red-300 text-xs font-semibold">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <span>{(error as any)?.response?.data?.message || 'Unable to fetch Valorant data right now.'}</span>
        </div>
        <button onClick={() => refetch()} className="text-xs font-bold text-red-300 border border-red-500/40 rounded-xl px-3 py-1.5">Retry</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <Card variant="glass" className="border-red-500/30 relative overflow-hidden bg-gradient-to-br from-[#1C0F13] via-[#0F141C] to-black shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="p-6 space-y-6">
          {/* Header Banner */}
          <div className="p-4 rounded-2xl bg-black/60 border border-red-500/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                <Target className="h-7 w-7 text-red-500" />
              </div>
              <div>
                <h4 className="font-extrabold text-lg text-white flex items-center gap-2">
                  {data.riotId || gameUid}
                  {data.region && <Badge className="bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-mono">{data.region}</Badge>}
                </h4>
                <p className="text-xs text-red-400 font-bold mt-0.5">{data.rank || 'Unranked'} {data.rr ? `• ${data.rr} RR` : ''}</p>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold gap-1 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Riot Live Tracker
            </Badge>
          </div>

          {data.statsUnavailable ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
                <span>⚠ Statistics unavailable — We couldn't retrieve verified stats right now.</span>
              </div>
              <button onClick={() => refetch()} className="text-xs font-bold text-amber-300 border border-amber-500/40 rounded-xl px-3 py-1.5 hover:bg-amber-500/10">Try Again</button>
            </div>
          ) : (
            /* Stats Grid */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <p className="text-xs text-gray-400 font-medium">K/D Ratio</p>
                <p className="text-2xl font-black text-red-400 font-mono">{data.kd !== null && data.kd !== undefined ? data.kd : 'N/A'}</p>
                <p className="text-[10px] text-gray-400">Competitive K/D</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <p className="text-xs text-gray-400 font-medium">Win Rate</p>
                <p className="text-2xl font-black text-emerald-400 font-mono">{data.winRate !== null && data.winRate !== undefined ? `${data.winRate}%` : 'N/A'}</p>
                <p className="text-[10px] text-gray-400">Ranked Competitive</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <p className="text-xs text-gray-400 font-medium">Headshot %</p>
                <p className="text-2xl font-black text-amber-400 font-mono">{data.headshotPercentage !== null && data.headshotPercentage !== undefined ? `${data.headshotPercentage}%` : 'N/A'}</p>
                <p className="text-[10px] text-gray-400">Accuracy Rate</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <p className="text-xs text-gray-400 font-medium">Matches</p>
                <p className="text-2xl font-black text-purple-400 font-mono">{data.matchesPlayed !== null && data.matchesPlayed !== undefined ? data.matchesPlayed : 'N/A'}</p>
                <p className="text-[10px] text-gray-400">Tracked Matches</p>
              </div>
            </div>
          )}

          {/* Recent Matches */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Swords className="h-4 w-4 text-red-400" /> Recent Competitive Matches
            </h5>
            <div className="space-y-2">
              {data.recentMatches?.map((match: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={match.result === 'VICTORY' ? 'default' : 'destructive'} className="text-[10px] font-bold px-2 py-0.5">
                      {match.result}
                    </Badge>
                    <span className="font-bold text-sm text-white">{match.map}</span>
                    <span className="text-xs text-gray-400">({match.agent})</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="font-bold text-gray-300">{match.score}</span>
                    <span className="text-emerald-400 font-bold">{match.kills}K / {match.deaths}D</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
