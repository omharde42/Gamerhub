'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ClashOfClansOverview } from './ClashOfClansOverview';
import { ClashOfClansHeroes } from './ClashOfClansHeroes';

export interface GameRendererProps {
  gameKey: string;
  gameUid: string;
  isOwner?: boolean;
}

export function ClashOfClansRenderer({ gameUid }: GameRendererProps) {
  const cleanTag = gameUid.replace(/^#/, '');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['game-profile', 'clashofclans', cleanTag],
    queryFn: async () => {
      const res = await api.get(`/game/clashofclans/profile?uid=${encodeURIComponent(cleanTag)}`);
      return res.data.data;
    },
    enabled: Boolean(cleanTag),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl bg-[#121624]/80 border border-yellow-500/30 animate-pulse space-y-4">
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

  if (isError || !data) {
    return (
      <div className="p-6 rounded-3xl bg-[#121624]/80 border border-red-500/30 text-center text-xs text-red-400">
        Unable to load Clash of Clans statistics for #{cleanTag}. Please verify player tag & server IP authorization.
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <Card variant="glass" className="border-yellow-500/30 relative overflow-hidden bg-gradient-to-br from-[#121624] via-[#0B0E17] to-[#1A1408] shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="p-6 space-y-6">
          {/* Authentic Supercell Overview */}
          <ClashOfClansOverview data={data} />

          {/* Authentic Supercell Heroes & Pets */}
          {data.heroes && data.heroes.length > 0 && (
            <ClashOfClansHeroes heroes={data.heroes} pets={data.pets} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
