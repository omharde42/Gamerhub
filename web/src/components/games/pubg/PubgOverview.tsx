'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Trophy, Swords, Shield, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export interface PubgOverviewProps {
  data: {
    player: {
      id: string;
      name: string;
      shard: string;
      clanId?: string | null;
      banType?: string;
    };
    stats: {
      kills: number;
      deaths: number;
      wins: number;
      matches: number;
      kdRatio: string;
      winRate: string;
      accuracy: string;
      accuracyNote?: string;
    };
  };
}

export function PubgOverview({ data }: PubgOverviewProps) {
  const { player, stats } = data;

  // The PUBG API reports no ranked matches for brand-new / unranked accounts.
  // In that case we show an honest "statistics unavailable" state instead of
  // displaying zeros as if the player had real stats.
  const hasStats = (stats?.matches || 0) > 0;

  if (!hasStats) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-amber-950/50 via-black/80 to-zinc-950 border border-amber-500/30 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30 border border-yellow-300/40">
              🪖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-wide">{player.name}</h3>
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-2.5 py-0.5">
                  STEAM (PC)
                </Badge>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">PUBG ID: {player.id}</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center text-center space-y-2">
          <Info className="h-8 w-8 text-amber-400/70" />
          <p className="text-sm font-bold text-white">Statistics unavailable</p>
          <p className="text-xs text-gray-400 max-w-md leading-relaxed">
            This account has no ranked match data yet. Stats appear automatically once the player has played ranked matches on PUBG PC.
          </p>
        </div>
      </div>
    );
  }

  const statItems = [
    {
      label: 'K/D Ratio',
      value: stats.kdRatio !== 'N/A' ? stats.kdRatio : 'N/A',
      subtext: `${stats.kills.toLocaleString()} Kills / ${stats.deaths.toLocaleString()} Deaths`,
      icon: Target,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'from-amber-500/10 to-amber-950/20',
    },
    {
      label: 'Win Rate',
      value: stats.winRate !== 'N/A' ? stats.winRate : 'N/A',
      subtext: `${stats.wins.toLocaleString()} Wins / ${stats.matches.toLocaleString()} Matches`,
      icon: Trophy,
      color: 'text-yellow-400',
      border: 'border-yellow-500/30',
      bg: 'from-yellow-500/10 to-yellow-950/20',
    },
    {
      label: 'Accuracy',
      value: stats.accuracy || 'N/A',
      subtext: stats.accuracyNote || 'Not available from PUBG API',
      icon: Info,
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'from-purple-500/10 to-purple-950/20',
    },
    {
      label: 'Matches Played',
      value: stats.matches.toLocaleString(),
      subtext: `Platform: ${player.shard.toUpperCase()} (PC)`,
      icon: Swords,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'from-emerald-500/10 to-emerald-950/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-amber-950/50 via-black/80 to-zinc-950 border border-amber-500/30 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30 border border-yellow-300/40">
            🪖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white tracking-wide">{player.name}</h3>
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-2.5 py-0.5">
                STEAM (PC)
              </Badge>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              PUBG ID: {player.id} {player.banType ? `• Fair Play (${player.banType})` : ''}
            </p>
          </div>
        </div>

        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/40 text-xs font-bold gap-1.5 px-3 py-1.5">
          <Shield className="h-4 w-4" /> Live Official PUBG API
        </Badge>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.25 }}
          >
            <Card className={`border ${item.border} bg-gradient-to-br ${item.bg} backdrop-blur-md rounded-2xl`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label}</span>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                <p className="text-[11px] text-gray-400 font-medium truncate">{item.subtext}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
