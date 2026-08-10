'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { GAMES_CATALOG } from '@/config/gamesCatalog';
import { GameRenderer } from '@/components/games';
import { PopularGamesModal } from '@/components/games/PopularGamesModal';
import { GamerPassportEmptyState } from '@/components/games/GamerPassportEmptyState';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Gamepad2, Settings } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface ModularGameHubProps {
  userId: string;
  isOwner?: boolean;
}

export function ModularGameHub({ userId, isOwner }: ModularGameHubProps) {
  const [activeGameKey, setActiveGameKey] = useState<string | null>(null);
  const [isPopularGamesOpen, setIsPopularGamesOpen] = useState(false);

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

  // Map database enum/key to catalog items
  const connectedGames = userAccounts.map((acc: any) => {
    let key = (acc.game || '').toLowerCase().replace(/_/g, '');
    if (key.includes('clash')) key = 'clash_of_clans';
    if (key.includes('pubg')) key = 'pubg';

    const catalogItem = GAMES_CATALOG.find((g) => g.id === key) || {
      id: key,
      name: acc.game,
      icon: '🎮',
      color: '#3B82F6',
      bgGradient: 'from-slate-900 to-black',
      borderColor: 'border-white/20',
    };

    return {
      account: acc,
      config: catalogItem,
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
      <>
        <GamerPassportEmptyState onOpenPopularGames={() => setIsPopularGamesOpen(true)} />
        <PopularGamesModal
          isOpen={isPopularGamesOpen}
          onClose={() => setIsPopularGamesOpen(false)}
          userConnections={userAccounts}
        />
      </>
    );
  }

  const activeConnectedGame = connectedGames.find((g: any) => g.config.id === activeGameKey) || connectedGames[0];

  return (
    <div className="space-y-4">
      {/* Horizontal Connected Games Bar */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {connectedGames.map(({ config }: any) => {
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

        <div className="flex items-center gap-2 shrink-0">
          {/* Three Dots Menu for Popular Games & Managing Connections */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-2xl border-white/15 hover:border-primary/40 text-foreground"
                aria-label="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl glass-strong border-border/40 p-1.5 z-50">
              <DropdownMenuItem
                onClick={() => setIsPopularGamesOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl cursor-pointer hover:bg-primary/10 text-primary"
              >
                <Gamepad2 className="h-4 w-4 text-primary" />
                Popular Games
              </DropdownMenuItem>
              {isOwner && (
                <DropdownMenuItem asChild>
                  <Link href="/connections" className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl cursor-pointer hover:bg-accent">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Manage Connections
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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

      {/* Popular Games Catalog Modal */}
      <PopularGamesModal
        isOpen={isPopularGamesOpen}
        onClose={() => setIsPopularGamesOpen(false)}
        userConnections={userAccounts}
      />
    </div>
  );
}
