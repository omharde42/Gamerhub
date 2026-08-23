'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, Trophy, Clock, CheckCircle2, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { GameRendererProps } from '../clashofclans/ClashOfClansRenderer';

export function SteamRenderer({ gameUid }: GameRendererProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['game-profile', 'steam', gameUid],
    queryFn: async () => {
      const res = await api.get(`/game/steam/profile?uid=${encodeURIComponent(gameUid)}`);
      return res.data.data;
    },
    enabled: Boolean(gameUid),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl bg-[#0B1522]/80 border border-sky-500/30 animate-pulse space-y-4">
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
      <Card variant="glass" className="border-sky-500/30 relative overflow-hidden bg-gradient-to-br from-[#0F1C2E] via-[#0B1220] to-black shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="p-4 rounded-2xl bg-black/60 border border-sky-500/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shrink-0">
                <Gamepad2 className="h-7 w-7 text-sky-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-lg text-white flex items-center gap-2">
                  {data.username || data.personaName || 'Steam Player'}
                  {data.level != null && <Badge className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-mono">Level {data.level}</Badge>}
                </h4>
                <p className="text-xs text-gray-400 font-mono mt-0.5">Steam ID: {data.steamId}</p>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold gap-1 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Steam Community Live
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <p className="text-xs text-gray-400 font-medium">Owned Games</p>
              <p className="text-2xl font-black text-sky-400 font-mono">{data.totalGames ?? data.ownedGamesCount ?? '—'}</p>
              <p className="text-[10px] text-gray-400">Library Games</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <p className="text-xs text-gray-400 font-medium">Total Play Time</p>
              <p className="text-2xl font-black text-emerald-400 font-mono">{data.totalPlaytimeHours ?? data.totalPlayTimeHours ?? '—'} hrs</p>
              <p className="text-[10px] text-gray-400">Lifetime Hours</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <p className="text-xs text-gray-400 font-medium">Steam Level</p>
              <p className="text-2xl font-black text-amber-400 font-mono">{data.level ?? data.steamLevel ?? '—'}</p>
              <p className="text-[10px] text-gray-400">From Steam API</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <p className="text-xs text-gray-400 font-medium">Top Game</p>
              <p className="text-sm font-black text-purple-400 font-mono truncate">{data.topGames?.[0]?.name || '—'}</p>
              <p className="text-[10px] text-gray-400">{data.topGames?.[0]?.playtimeForeverHours || data.topGames?.[0]?.playTimeForeverHours ? `${Math.round((data.topGames?.[0]?.playtimeForeverHours ?? 0) * 10) / 10} Hours Played` : 'From Steam API'}</p>
            </div>
          </div>

          {/* Recently Played */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-sky-400" /> Recently Played Games
            </h5>
            <div className="grid sm:grid-cols-3 gap-3">
              {data.recentlyPlayed?.map((game: any, i: number) => (
                <div key={i} className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-2">
                  <p className="font-bold text-sm text-white truncate">{game.name}</p>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Last 2 Weeks:</span>
                    <span className="font-bold text-sky-400 font-mono">{game.playtime2WeeksMinutes != null ? `${Math.round(game.playtime2WeeksMinutes / 60)}h` : game.playTime2WeeksHours ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>All Time:</span>
                    <span className="font-bold text-sky-400 font-mono">{game.playtimeForeverMinutes != null ? `${Math.round(game.playtimeForeverMinutes / 60)}h` : game.playTimeForeverHours ?? '—'}</span>
                  </div>
                </div>
              ))}
              {(!data.recentlyPlayed || data.recentlyPlayed.length === 0) && (
                <p className="text-xs text-gray-400">No recently played games returned by the Steam API (profile may be private).</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
