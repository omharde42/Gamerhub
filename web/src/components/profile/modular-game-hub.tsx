'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { GAMES_CONFIG, GameConfig } from '@/config/gamesConfig';
import { GameRenderer } from '@/components/games';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface ModularGameHubProps {
  userId: string;
  isOwner?: boolean;
}

export function ModularGameHub({ userId, isOwner }: ModularGameHubProps) {
  const [activeGameKey, setActiveGameKey] = useState<string | null>(null);

  // Fetch user's connected games
  const { data: userAccounts = [], isLoading } = useQuery({
    queryKey: ['user-game-connections', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await api.get(`/game/user-connections?userId=${userId}`);
      return res.data.data || [];
    },
    enabled: Boolean(userId),
  });

  // Map database enum/key to config keys
  const connectedGames = userAccounts.map((acc: any) => {
    let key = (acc.game || '').toLowerCase().replace(/_/g, '');
    if (key === 'clashofclans' || key === 'coc') key = 'clashofclans';
    if (key === 'pubg') key = 'bgmi';
    if (key === 'freefire') key = 'freefire';

    const config = GAMES_CONFIG[key] || {
      id: key,
      name: acc.game,
      icon: '🎮',
      color: '#3B82F6',
      brandColor: '#3B82F6',
      bgGradient: 'from-slate-900 to-black',
      borderColor: 'border-white/20',
    };

    return {
      account: acc,
      config,
    };
  });

  // Auto-select first game on load
  useEffect(() => {
    if (connectedGames.length > 0 && !activeGameKey) {
      setActiveGameKey(connectedGames[0].config.id);
    }
  }, [connectedGames, activeGameKey]);

  if (isLoading) {
    return <div className="h-48 bg-card/40 rounded-3xl animate-pulse border border-white/10" />;
  }

  // If user has no connected games
  if (connectedGames.length === 0) {
    return (
      <Card variant="glass" className="border-border/60">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-2xl">
            🎮
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-white">No Connected Games Yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Connect your Clash of Clans, Valorant, Steam, or Free Fire accounts to display live in-game statistics, ranks, and badges!
            </p>
          </div>
          {isOwner && (
            <Link href="/connections">
              <Button variant="gradient" size="sm" className="font-bold gap-2 rounded-xl mt-2">
                <Plus className="h-4 w-4" /> Connect Games
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  const activeConnectedGame = connectedGames.find((g: any) => g.config.id === activeGameKey) || connectedGames[0];

  return (
    <div className="space-y-4">
      {/* Horizontal Connected Games Bar */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {connectedGames.map(({ config, account }: any) => {
            const isActive = activeGameKey === config.id;
            return (
              <motion.button
                key={config.id}
                onClick={() => setActiveGameKey(config.id)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold border transition-all duration-200 shrink-0 shadow-md ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 via-primary to-purple-600 text-white border-primary shadow-lg shadow-primary/30 ring-2 ring-primary/40'
                    : 'bg-black/60 text-gray-300 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                <span className="text-base">{config.icon}</span>
                <span>{config.name}</span>
              </motion.button>
            );
          })}
        </div>

        {isOwner && (
          <Link href="/connections" className="shrink-0">
            <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 rounded-2xl h-10 border-white/15 hover:border-primary/40">
              <Plus className="h-3.5 w-3.5" /> Manage
            </Button>
          </Link>
        )}
      </div>

      {/* Selected Game Animated Stats View */}
      <AnimatePresence mode="wait">
        {activeConnectedGame && (
          <motion.div
            key={activeConnectedGame.config.id}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <GameRenderer
              gameKey={activeConnectedGame.config.id}
              gameUid={activeConnectedGame.account.inGameUid}
              isOwner={isOwner}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
