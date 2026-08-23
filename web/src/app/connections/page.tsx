'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { GAMES_CATALOG } from '@/config/gamesCatalog';
import { PopularGamesModal } from '@/components/games/PopularGamesModal';
import { GamerPassportEmptyState } from '@/components/games/GamerPassportEmptyState';
import { GameRenderer } from '@/components/games';
import { Sparkles, Trash2, CheckCircle2, Gamepad2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// Catalog id -> connector key used by /game/:game/* routes
const CONNECTOR_KEY: Record<string, string> = {
  clash_of_clans: 'clashofclans',
  clash_royale: 'clashroyale',
  brawl_stars: 'brawlstars',
  pubg: 'pubg',
  valorant: 'valorant',
  steam: 'steam',
  freefire: 'freefire',
  bgmi: 'bgmi',
};

function normalizeGameKey(game: string): string {
  let key = (game || '').toLowerCase().replace(/_/g, '');
  if (key.includes('clashroyale') || key === 'cr') key = 'clash_royale';
  else if (key.includes('clash')) key = 'clash_of_clans';
  else if (key.includes('brawlstars') || key === 'bs') key = 'brawl_stars';
  else if (key.includes('pubg') && key.includes('mobile')) key = 'bgmi';
  else if (key.includes('pubg')) key = 'pubg';
  else if (key.includes('freefire')) key = 'freefire';
  else if (key.includes('valorant')) key = 'valorant';
  else if (key.includes('steam')) key = 'steam';
  else if (key.includes('bgmi')) key = 'bgmi';
  return key;
}

function catalogFor(key: string) {
  return GAMES_CATALOG.find((g) => g.id === key) || {
    id: key,
    name: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: '🎮',
    color: '#3B82F6',
  };
}

export default function ConnectionsPage() {
  const queryClient = useQueryClient();
  const [isPopularGamesOpen, setIsPopularGamesOpen] = useState(false);
  const [connectingGameId, setConnectingGameId] = useState<string | null>(null);

  // Fetch user connected accounts
  const { data: userAccounts = [] } = useQuery({
    queryKey: ['user-game-connections'],
    queryFn: async () => {
      const res = await api.get('/game/user-connections');
      return res.data.data || [];
    },
  });

  // Map connected games to catalog items
  const connectedGames = userAccounts.map((acc: any) => {
    const key = normalizeGameKey(acc.game || '');
    return { account: acc, config: catalogFor(key), key };
  });

  const connectedCount = userAccounts.length;

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async (gameKey: string) => {
      const res = await api.post(`/game/${gameKey}/disconnect`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Game account disconnected');
      queryClient.invalidateQueries({ queryKey: ['user-game-connections'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to disconnect account');
    },
  });

  const isConnecting = Boolean(connectingGameId);
  const isConnectingAlreadyConnected = connectedGames.some((x: any) => x.key === connectingGameId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <Card variant="glass" className="overflow-hidden border-border/60">
        <CardContent className="p-6 md:p-8 relative">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/40 text-xs font-mono font-bold">
                  GAME CONNECTIONS
                </Badge>
                <span className="text-xs text-muted-foreground">• Official API Identity</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                Connected Games & Gamer Passport <Sparkles className="h-5 w-5 text-amber-400" />
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground max-w-xl">
                Connect your game accounts — Clash of Clans, Clash Royale, Brawl Stars, PUBG PC, Valorant, Free Fire, BGMI & more. Verified player data syncs directly to your Gamer Passport!
              </p>
            </div>

            <Button
              onClick={() => setIsPopularGamesOpen(true)}
              className="bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-600 text-primary-foreground font-extrabold rounded-2xl h-11 px-5 gap-2 shadow-lg"
            >
              <Gamepad2 className="h-4 w-4" /> Popular Games Catalog
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      {connectedCount === 0 && !isConnecting ? (
        <GamerPassportEmptyState onOpenPopularGames={() => setIsPopularGamesOpen(true)} />
      ) : (
        <div className="space-y-6">
          {/* Active Connections List */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              Your Connected Games ({connectedCount})
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPopularGamesOpen(true)}
              className="text-xs font-bold rounded-xl gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Connect Another Game
            </Button>
          </div>

          {/* Connected Game Sections */}
          <div className="space-y-6">
            {connectedGames.map(({ account, config, key }: any) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <span className="text-sm">{config.icon}</span>
                    <span className="truncate">{config.name} Connector</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] gap-1 shrink-0">
                      <CheckCircle2 className="h-3 w-3" /> Connected
                    </Badge>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnectMutation.mutate(CONNECTOR_KEY[key] || key)}
                    disabled={disconnectMutation.isPending}
                    className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2.5 rounded-lg gap-1 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Disconnect
                  </Button>
                </div>
                <GameRenderer gameKey={key} gameUid={account.inGameUid || ''} isOwner={true} />
              </div>
            ))}

            {/* Connecting a new game */}
            {isConnecting && !isConnectingAlreadyConnected && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <span className="text-sm">{catalogFor(connectingGameId as string).icon}</span>
                    {catalogFor(connectingGameId as string).name} Connector
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConnectingGameId(null)}
                    className="text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 h-7 px-2.5 rounded-lg gap-1"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </Button>
                </div>
                <GameRenderer gameKey={connectingGameId as string} gameUid="" isOwner={true} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popular Games Catalog Modal */}
      <PopularGamesModal
        isOpen={isPopularGamesOpen}
        onClose={() => setIsPopularGamesOpen(false)}
        userConnections={userAccounts}
        onSelectGameToConnect={(gameId) => {
          setConnectingGameId(gameId);
          setIsPopularGamesOpen(false);
          toast.success(`Selected ${catalogFor(gameId).name}. Enter your details below.`);
        }}
      />
    </div>
  );
}
