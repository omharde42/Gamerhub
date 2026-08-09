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
import { ClashOfClansRenderer } from '@/components/games/clashofclans/ClashOfClansRenderer';
import { PubgRenderer } from '@/components/games/pubg/PubgRenderer';
import { Sparkles, Trash2, CheckCircle2, Gamepad2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { PremiumModal } from '@/components/ui/premium-modal';

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

  // Map connected games
  const connectedMap = new Map<string, any>();
  userAccounts.forEach((acc: any) => {
    const key = (acc.game || '').toLowerCase().replace(/_/g, '');
    connectedMap.set(key, acc);
  });

  const cocAccount = userAccounts.find((a: any) => (a.game || '').toUpperCase().includes('CLASH'));
  const pubgAccount = userAccounts.find((a: any) => (a.game || '').toUpperCase().includes('PUBG'));

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
                Connect official Clash of Clans and PUBG PC accounts. Real verified player data is synchronized directly to your Gamer Passport!
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
      {connectedCount === 0 && !connectingGameId ? (
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

          {/* Connected Game Cards */}
          <div className="space-y-6">
            {/* Clash of Clans Section */}
            {(cocAccount || connectingGameId === 'clash_of_clans') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">Clash of Clans Connector</span>
                  {cocAccount && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => disconnectMutation.mutate('clashofclans')}
                      disabled={disconnectMutation.isPending}
                      className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2.5 rounded-lg gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Disconnect Clash
                    </Button>
                  )}
                </div>
                <ClashOfClansRenderer gameKey="clashofclans" gameUid={cocAccount?.inGameUid || ''} isOwner={true} />
              </div>
            )}

<<<<<<< HEAD
      {/* Dynamic Connection Modal */}
      <PremiumModal
        open={!!selectedGame}
        onClose={() => setSelectedGame(null)}
        variant="center"
        size="sm"
        showCloseButton={false}
        title={selectedGame ? `Connect ${selectedGame.name}` : undefined}
        className={selectedGame?.borderColor}
      >
        {selectedGame && (
          <div className={`flex min-h-full w-full flex-col bg-gradient-to-br ${selectedGame.bgGradient}`}>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <span>{selectedGame.icon}</span> Connect {selectedGame.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleConnectSubmit} className="space-y-4">
                {selectedGame.fields.map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        className="w-full h-11 bg-black/60 border border-white/15 rounded-xl px-3 text-sm text-white focus:border-primary outline-none"
                      >
                        <option value="">{field.placeholder}</option>
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        placeholder={field.placeholder}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        className="bg-black/60 border-white/15 text-white placeholder:text-gray-500 h-11 rounded-xl"
                      />
                    )}
                  </div>
                ))}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedGame(null)}
                    className="flex-1 text-gray-400 hover:text-white rounded-xl h-11"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={connectMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-primary to-indigo-600 font-bold text-white rounded-xl h-11"
                  >
                    {connectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect Account'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </div>
        )}
      </PremiumModal>
=======
            {/* PUBG PC Section */}
            {(pubgAccount || connectingGameId === 'pubg') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">PUBG PC / Steam Connector</span>
                  {pubgAccount && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => disconnectMutation.mutate('pubg')}
                      disabled={disconnectMutation.isPending}
                      className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2.5 rounded-lg gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Disconnect PUBG
                    </Button>
                  )}
                </div>
                <PubgRenderer gameKey="pubg" gameUid={pubgAccount?.inGameUid || ''} isOwner={true} />
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
          toast.success(`Selected ${gameId === 'clash_of_clans' ? 'Clash of Clans' : 'PUBG PC'}. Enter your details below.`);
        }}
      />
>>>>>>> 185fc85d5d3e25e8786a8f54f848c69940c3be9a
    </div>
  );
}
