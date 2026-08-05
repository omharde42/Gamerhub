'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { GAMES_CONFIG, GameConfig } from '@/config/gamesConfig';
import { Shield, Check, Trash2, Loader2, Sparkles, Gamepad2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConnectionsPage() {
  const queryClient = useQueryClient();
  const [selectedGame, setSelectedGame] = useState<GameConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Fetch connected game accounts
  const { data: userAccounts = [], isLoading } = useQuery({
    queryKey: ['user-game-connections'],
    queryFn: async () => {
      const res = await api.get('/game/user-connections');
      return res.data.data || [];
    },
  });

  const connectedMap = new Map<string, any>();
  userAccounts.forEach((acc: any) => {
    const key = (acc.game || '').toLowerCase().replace(/_/g, '');
    connectedMap.set(key, acc);
  });

  // Dynamic Connect Mutation
  const connectMutation = useMutation({
    mutationFn: async ({ gameKey, payload }: { gameKey: string; payload: Record<string, any> }) => {
      const res = await api.post(`/game/${gameKey}/connect`, payload);
      return res.data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Successfully connected ${GAMES_CONFIG[variables.gameKey]?.name || variables.gameKey}!`);
      setSelectedGame(null);
      setFormData({});
      queryClient.invalidateQueries({ queryKey: ['user-game-connections'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to connect game account. Please check fields.');
    },
  });

  // Dynamic Disconnect Mutation
  const disconnectMutation = useMutation({
    mutationFn: async (gameKey: string) => {
      const res = await api.post(`/game/${gameKey}/disconnect`);
      return res.data;
    },
    onSuccess: (_, gameKey) => {
      toast.success(`Disconnected ${GAMES_CONFIG[gameKey]?.name || gameKey}`);
      queryClient.invalidateQueries({ queryKey: ['user-game-connections'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to disconnect account');
    },
  });

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame) return;

    for (const field of selectedGame.fields) {
      if (field.required && !formData[field.name]?.trim()) {
        toast.error(`Please fill out ${field.label}`);
        return;
      }
    }

    connectMutation.mutate({
      gameKey: selectedGame.id,
      payload: formData,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <Card variant="glass" className="overflow-hidden border-border/60">
        <CardContent className="p-6 md:p-8 relative">
          <div className="flex items-center gap-3 mb-2">
            <Badge className="bg-primary/20 text-primary border-primary/40 text-xs font-mono font-bold">
              MODULAR GAME CONNECTORS
            </Badge>
            <span className="text-xs text-muted-foreground">• Auto-Sync Platform Identity</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Connected Games & Identity Hub <Sparkles className="h-5 w-5 text-amber-400" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Connect your esports profiles across Clash of Clans, Valorant, Steam, Free Fire, and BGMI. Your stats, ranks, and achievements render dynamically on your Gamer Passport!
          </p>
        </CardContent>
      </Card>

      {/* Connected Games Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {Object.values(GAMES_CONFIG).map((game) => {
          const connectedAccount = connectedMap.get(game.id) || connectedMap.get(game.id.replace(/[^a-z]/g, ''));
          const isConnected = Boolean(connectedAccount);

          return (
            <motion.div key={game.id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <Card variant="glass" className={`border ${game.borderColor} bg-gradient-to-br ${game.bgGradient} relative overflow-hidden`}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center text-2xl shadow-lg">
                        {game.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                          {game.name}
                        </h3>
                        <p className="text-xs text-gray-300 mt-0.5">{game.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Connected Status or Connect Form Button */}
                  {isConnected ? (
                    <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                          <Check className="h-3 w-3 mr-0.5" /> CONNECTED
                        </Badge>
                        <span className="text-xs font-mono font-bold text-white truncate max-w-[140px]">
                          {connectedAccount?.inGameName || connectedAccount?.inGameUid}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnectMutation.mutate(game.id)}
                        disabled={disconnectMutation.isPending}
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2.5 rounded-lg gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedGame(game);
                        setFormData({});
                      }}
                      className="w-full bg-black/40 border-white/10 hover:bg-white/10 text-white font-bold text-xs rounded-xl h-10 gap-1.5 justify-between"
                    >
                      <span>Connect {game.name}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Dynamic Connection Modal */}
      <AnimatePresence>
        {selectedGame && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md">
              <Card variant="glass" className={`border ${selectedGame.borderColor} bg-gradient-to-br ${selectedGame.bgGradient}`}>
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
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
