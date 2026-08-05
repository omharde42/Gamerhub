'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { GAMES_CONFIG } from '@/config/gamesConfig';
import { GameRendererProps } from './clashofclans/ClashOfClansRenderer';

export function GenericGameRenderer({ gameKey, gameUid }: GameRendererProps) {
  const config = GAMES_CONFIG[gameKey.toLowerCase()] || {
    name: gameKey.toUpperCase(),
    icon: '🎮',
    color: '#3B82F6',
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <Card variant="glass" className="border-primary/30 relative overflow-hidden bg-gradient-to-br from-[#121624] via-[#0B0E17] to-black shadow-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl">
                {config.icon}
              </div>
              <div>
                <h4 className="font-extrabold text-base text-white">{config.name} Profile</h4>
                <p className="text-xs font-mono text-gray-400">UID / Tag: {gameUid}</p>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold gap-1 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verified GamerZ Hub Link
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
