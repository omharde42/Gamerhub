'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Flame, Users, Building2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function ClashOfClansOverview({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-black/60 border border-yellow-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex flex-col items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-yellow-400" />
            <span className="text-[10px] font-black text-yellow-400 font-mono mt-0.5">
              TH {data.townHallLevel || '--'}
            </span>
          </div>
          <div>
            <h4 className="font-extrabold text-lg text-white flex items-center gap-2">
              {data.name}
              <span className="text-xs font-mono font-bold text-gray-400">{data.tag}</span>
            </h4>
            <p className="text-xs text-gray-300 flex items-center gap-2 mt-0.5">
              <span>XP Level {data.expLevel || '--'}</span>
              {data.clan ? (
                <>
                  <span>•</span>
                  <span className="text-yellow-400 font-semibold">{data.clan.name} ({data.role || 'Member'})</span>
                </>
              ) : (
                <span className="text-gray-400">• No Clan</span>
              )}
            </p>
          </div>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold gap-1 px-3 py-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> Live Supercell API
        </Badge>
      </div>

      {/* Real Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
          <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5 text-yellow-400" /> Trophies
          </p>
          <p className="text-2xl font-black text-yellow-400 font-mono">{data.trophies ?? '--'}</p>
          <p className="text-[10px] text-gray-400">Best: {data.bestTrophies ?? '--'}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
          <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-amber-400" /> War Stars
          </p>
          <p className="text-2xl font-black text-amber-400 font-mono">{data.warStars ?? '--'}</p>
          <p className="text-[10px] text-gray-400">Attack Wins: {data.attackWins ?? '--'}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
          <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-orange-400" /> Builder Base
          </p>
          <p className="text-2xl font-black text-orange-400 font-mono">
            {data.builderHallLevel ? `BH ${data.builderHallLevel}` : 'Not Available'}
          </p>
          <p className="text-[10px] text-gray-400">{data.versusTrophies ?? '--'} Versus Trophies</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
          <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-blue-400" /> Donations
          </p>
          <p className="text-2xl font-black text-blue-400 font-mono">{data.donations ?? '--'}</p>
          <p className="text-[10px] text-gray-400">Received: {data.donationsReceived ?? '--'}</p>
        </div>
      </div>
    </div>
  );
}
