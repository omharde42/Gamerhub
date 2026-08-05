'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Swords, Trophy, Target, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { GameRendererProps } from '../clashofclans/ClashOfClansRenderer';

export function BgmiRenderer({ gameUid }: GameRendererProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['game-profile', 'bgmi', gameUid],
    queryFn: async () => {
      const res = await api.get(`/game/bgmi/profile?uid=${encodeURIComponent(gameUid)}`);
      return res.data.data;
    },
    enabled: Boolean(gameUid),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl bg-[#1A1408]/80 border border-amber-500/30 animate-pulse space-y-4">
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
      <Card variant="glass" className="border-amber-500/30 relative overflow-hidden bg-gradient-to-br from-[#1F1708] via-[#0F0D06] to-black shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="p-6 space-y-5">
          {/* Header */}
          <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Swords className="h-7 w-7 text-amber-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-lg text-white flex items-center gap-2">
                  {data.inGameName}
                  <span className="text-xs font-mono font-bold text-gray-400">ID: {data.uid}</span>
                </h4>
                <p className="text-xs text-amber-300 font-bold mt-0.5">{data.rankTier} • Level {data.level}</p>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold gap-1 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> BGMI Live Verified
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <p className="text-xs text-gray-400 font-medium">Chicken Dinners</p>
              <p className="text-2xl font-black text-amber-400 font-mono">{data.chickenDinners}</p>
              <p className="text-[10px] text-gray-400">Wins out of {data.seasonMatches}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <p className="text-xs text-gray-400 font-medium">F/D (K/D) Ratio</p>
              <p className="text-2xl font-black text-emerald-400 font-mono">{data.kd}</p>
              <p className="text-[10px] text-gray-400">Headshot: {data.headshotRate}%</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <p className="text-xs text-gray-400 font-medium">Win Rate</p>
              <p className="text-2xl font-black text-purple-400 font-mono">{data.winRate}%</p>
              <p className="text-[10px] text-gray-400">Season Rank</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <p className="text-xs text-gray-400 font-medium">Most Kills</p>
              <p className="text-2xl font-black text-red-400 font-mono">{data.mostKillsInSingleMatch}</p>
              <p className="text-[10px] text-gray-400">Single Match Record</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
