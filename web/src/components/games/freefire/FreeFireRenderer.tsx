'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy, Star, CheckCircle2, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { GameRendererProps } from '../clashofclans/ClashOfClansRenderer';
import { UnverifiedGameNotice } from '../UnverifiedGameNotice';

export function FreeFireRenderer({ gameUid }: GameRendererProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['game-profile', 'freefire', gameUid],
    queryFn: async () => {
      const res = await api.get(`/game/freefire/profile?uid=${encodeURIComponent(gameUid)}`);
      return res.data.data;
    },
    enabled: Boolean(gameUid),
    staleTime: 5 * 60 * 1000,
  });

  // Free Fire has no official verification — the backend rejects it with a
  // clear error. Show the honest unavailable state instead of fake stats.
  if (isError) {
    return <UnverifiedGameNotice message={(error as any)?.response?.data?.message || undefined} />;
  }

  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl bg-[#1C0D0A]/80 border border-orange-500/30 animate-pulse space-y-4">
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

  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <Card variant="glass" className="border-orange-500/30 relative overflow-hidden bg-gradient-to-br from-[#241009] via-[#0F0A06] to-black shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="p-6 space-y-5">
          {/* Header */}
          <div className="p-4 rounded-2xl bg-black/60 border border-orange-500/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0">
                <Flame className="h-7 w-7 text-orange-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-lg text-white flex items-center gap-2">
                  {data.nickname}
                  <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs font-mono">{data.region}</Badge>
                </h4>
                <p className="text-xs text-orange-300 font-bold mt-0.5">{data.rank} • Level {data.level}</p>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold gap-1 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Garena Live Verified
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <p className="text-xs text-gray-400 font-medium">Booyahs</p>
              <p className="text-2xl font-black text-orange-400 font-mono">{data.booyahCount}</p>
              <p className="text-[10px] text-gray-400">Battle Royale Wins</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <p className="text-xs text-gray-400 font-medium">K/D Ratio</p>
              <p className="text-2xl font-black text-amber-400 font-mono">{data.kd}</p>
              <p className="text-[10px] text-gray-400">Headshot Rate: {data.headshotRate}%</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <p className="text-xs text-gray-400 font-medium">BR Rank</p>
              <p className="text-sm font-extrabold text-yellow-400">{data.brRank}</p>
              <p className="text-[10px] text-gray-400">Battle Royale</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <p className="text-xs text-gray-400 font-medium">CS Rank</p>
              <p className="text-sm font-extrabold text-red-400">{data.csRank}</p>
              <p className="text-[10px] text-gray-400">Clash Squad</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
