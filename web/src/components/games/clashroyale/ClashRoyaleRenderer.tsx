'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Crown, RefreshCw, AlertTriangle, CheckCircle2, AlertCircle, Swords, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { GameRendererProps } from '../clashofclans/ClashOfClansRenderer';

export function ClashRoyaleRenderer({ gameUid, isOwner }: GameRendererProps) {
  const queryClient = useQueryClient();

  const { data: userAccounts = [] } = useQuery({
    queryKey: ['user-game-connections'],
    queryFn: async () => {
      const res = await api.get('/game/user-connections');
      return res.data.data || [];
    },
  });

  const crAccount = userAccounts.find((a: any) => (a.game || '').toUpperCase().includes('CLASH_ROYALE'));
  const effectiveTag = gameUid || crAccount?.inGameUid || '';
  const cleanTag = effectiveTag.replace(/^#/, '');

  const [tagInput, setTagInput] = useState(effectiveTag);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (effectiveTag) {
      setIsEditing(false);
      setTagInput(effectiveTag);
    }
  }, [effectiveTag]);

  const isConnected = Boolean(effectiveTag);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['game-profile', 'clashroyale', cleanTag],
    queryFn: async () => {
      if (!cleanTag) return null;
      const res = await api.get(`/game/clashroyale/profile?uid=${encodeURIComponent(cleanTag)}`);
      return res.data.data || res.data;
    },
    enabled: Boolean(cleanTag),
    staleTime: 5 * 60 * 1000,
  });

  const connectMutation = useMutation({
    mutationFn: async (tagToConnect: string) => {
      const res = await api.post('/game/clashroyale/connect', { playerTag: tagToConnect });
      return res.data;
    },
    onSuccess: () => {
      toast.success(`Clash Royale Connected (#${cleanTag})`);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['game-profile', 'clashroyale'] });
      queryClient.invalidateQueries({ queryKey: ['user-game-connections'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to connect player tag. Check tag format & IP whitelist.');
    },
  });

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) {
      toast.error('Please enter a valid Player Tag (e.g. #8QJ2YCPL)');
      return;
    }
    connectMutation.mutate(tagInput.trim());
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <Card variant="glass" className="border-blue-500/30 relative overflow-hidden bg-gradient-to-br from-[#0E1420] via-[#0B0E17] to-[#101A2E] shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="p-6 space-y-6">
          {!isConnected || isEditing ? (
            <div className="p-6 rounded-2xl bg-black/60 border border-blue-500/30 space-y-4">
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-blue-400" />
                <h4 className="font-extrabold text-base text-white">
                  {isConnected ? 'Change your Clash Royale Player Tag' : 'Connect your Clash Royale account'}
                </h4>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-200 leading-relaxed">
                  Enter your in-game Clash Royale Player Tag (with #). Your trophies, arena, win rate and battle stats sync from the official Supercell API.
                </p>
              </div>

              <form onSubmit={handleConnectSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Player Tag</label>
                  <Input
                    placeholder="e.g. #8QJ2YCPL"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="bg-black/80 border-blue-500/40 text-white font-mono text-sm placeholder:text-gray-500 focus:border-blue-500 h-11"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  {isConnected && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-gray-400 hover:text-white rounded-xl h-10 px-4"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={connectMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-extrabold px-6 rounded-xl h-10"
                  >
                    {connectMutation.isPending ? 'Connecting...' : isConnected ? 'Save Tag Change' : 'Connect'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-black/40 border border-blue-500/20">
                <div className="flex items-center gap-2.5">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold gap-1.5 px-3 py-1">
                    <CheckCircle2 className="h-4 w-4" /> Clash Royale Connected
                  </Badge>
                  <span className="text-xs text-blue-300 font-mono font-bold">Tag: #{cleanTag}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="text-xs font-bold gap-1.5 rounded-xl h-8 border-blue-500/30 hover:border-blue-500/60 bg-black/40 text-blue-300"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-blue-400' : ''}`} />
                    {isFetching ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8 px-3 rounded-xl border border-blue-500/20"
                    >
                      Change Player Tag
                    </Button>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="p-6 rounded-2xl bg-black/40 border border-white/10 animate-pulse space-y-4 text-center">
                  <p className="text-xs text-blue-400 font-mono font-bold animate-bounce">
                    Syncing live Supercell player data for #{cleanTag}...
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="h-20 bg-white/5 rounded-2xl" />
                    <div className="h-20 bg-white/5 rounded-2xl" />
                    <div className="h-20 bg-white/5 rounded-2xl" />
                    <div className="h-20 bg-white/5 rounded-2xl" />
                  </div>
                </div>
              ) : isError ? (
                <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-red-300 text-xs font-semibold">
                    <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                    <span>{(error as any)?.response?.data?.message || 'Unable to fetch live Clash Royale data right now.'}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs font-bold text-red-300 border-red-500/40 rounded-xl">
                    Retry Sync
                  </Button>
                </div>
              ) : data ? (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-black/60 border border-blue-500/20 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                        <Swords className="h-7 w-7 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-lg text-white flex items-center gap-2">
                          {data.name}
                          <span className="text-xs font-mono font-bold text-gray-400">ID: {data.tag}</span>
                        </h4>
                        <p className="text-xs text-blue-300 font-bold mt-0.5">{data.arena?.name} • Level {data.expLevel}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                      <p className="text-xs text-gray-400 font-medium">Trophies</p>
                      <p className="text-2xl font-black text-blue-400 font-mono">{data.trophies}</p>
                      <p className="text-[10px] text-gray-400">Best: {data.bestTrophies}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                      <p className="text-xs text-gray-400 font-medium">Win Rate</p>
                      <p className="text-2xl font-black text-emerald-400 font-mono">{data.battleCount > 0 ? Math.round((data.wins / data.battleCount) * 100) : 0}%</p>
                      <p className="text-[10px] text-gray-400">{data.wins}W / {data.losses}L</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                      <p className="text-xs text-gray-400 font-medium">Battles</p>
                      <p className="text-2xl font-black text-purple-400 font-mono">{data.battleCount}</p>
                      <p className="text-[10px] text-gray-400">3-Crown: {data.threeCrownWins}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                      <p className="text-xs text-gray-400 font-medium">Donations</p>
                      <p className="text-2xl font-black text-amber-400 font-mono">{data.totalDonations}</p>
                      <p className="text-[10px] text-gray-400">Clan: {data.clan?.name || 'None'}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}