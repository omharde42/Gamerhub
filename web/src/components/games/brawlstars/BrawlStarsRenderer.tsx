'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Star, RefreshCw, AlertTriangle, CheckCircle2, AlertCircle, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { GameRendererProps } from '../clashofclans/ClashOfClansRenderer';

export function BrawlStarsRenderer({ gameUid, isOwner }: GameRendererProps) {
  const queryClient = useQueryClient();

  const { data: userAccounts = [] } = useQuery({
    queryKey: ['user-game-connections'],
    queryFn: async () => {
      const res = await api.get('/game/user-connections');
      return res.data.data || [];
    },
  });

  const bsAccount = userAccounts.find((a: any) => (a.game || '').toUpperCase().includes('BRAWL_STARS'));
  const effectiveTag = gameUid || bsAccount?.inGameUid || '';
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
    queryKey: ['game-profile', 'brawlstars', cleanTag],
    queryFn: async () => {
      if (!cleanTag) return null;
      const res = await api.get(`/game/brawlstars/profile?uid=${encodeURIComponent(cleanTag)}`);
      return res.data.data || res.data;
    },
    enabled: Boolean(cleanTag),
    staleTime: 5 * 60 * 1000,
  });

  const connectMutation = useMutation({
    mutationFn: async (tagToConnect: string) => {
      const res = await api.post('/game/brawlstars/connect', { playerTag: tagToConnect });
      return res.data;
    },
    onSuccess: () => {
      toast.success(`Brawl Stars Connected (#${cleanTag})`);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['game-profile', 'brawlstars'] });
      queryClient.invalidateQueries({ queryKey: ['user-game-connections'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to connect player tag. Check tag format & IP whitelist.');
    },
  });

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) {
      toast.error('Please enter a valid Player Tag (e.g. #2J2VQ0)');
      return;
    }
    connectMutation.mutate(tagInput.trim());
  };

  const totalWins = (data?.soloVictories || 0) + (data?.duoVictories || 0) + (data?.teamVictories || 0);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <Card variant="glass" className="border-yellow-500/30 relative overflow-hidden bg-gradient-to-br from-[#1A1408] via-[#0B0E17] to-[#221A0C] shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="p-6 space-y-6">
          {!isConnected || isEditing ? (
            <div className="p-6 rounded-2xl bg-black/60 border border-yellow-500/30 space-y-4">
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-400" />
                <h4 className="font-extrabold text-base text-white">
                  {isConnected ? 'Change your Brawl Stars Player Tag' : 'Connect your Brawl Stars account'}
                </h4>
              </div>

              <div className="p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-200 leading-relaxed">
                  Enter your in-game Brawl Stars Player Tag (with #). Your trophies, wins and battle stats sync from the official Supercell API.
                </p>
              </div>

              <form onSubmit={handleConnectSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Player Tag</label>
                  <Input
                    placeholder="e.g. #2J2VQ0"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="bg-black/80 border-yellow-500/40 text-white font-mono text-sm placeholder:text-gray-500 focus:border-yellow-500 h-11"
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
                    className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-extrabold px-6 rounded-xl h-10"
                  >
                    {connectMutation.isPending ? 'Connecting...' : isConnected ? 'Save Tag Change' : 'Connect'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-black/40 border border-yellow-500/20">
                <div className="flex items-center gap-2.5">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold gap-1.5 px-3 py-1">
                    <CheckCircle2 className="h-4 w-4" /> Brawl Stars Connected
                  </Badge>
                  <span className="text-xs text-yellow-300 font-mono font-bold">Tag: #{cleanTag}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="text-xs font-bold gap-1.5 rounded-xl h-8 border-yellow-500/30 hover:border-yellow-500/60 bg-black/40 text-yellow-300"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-yellow-400' : ''}`} />
                    {isFetching ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 h-8 px-3 rounded-xl border border-yellow-500/20"
                    >
                      Change Player Tag
                    </Button>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="p-6 rounded-2xl bg-black/40 border border-white/10 animate-pulse space-y-4 text-center">
                  <p className="text-xs text-yellow-400 font-mono font-bold animate-bounce">
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
                    <span>{(error as any)?.response?.data?.message || 'Unable to fetch live Brawl Stars data right now.'}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs font-bold text-red-300 border-red-500/40 rounded-xl">
                    Retry Sync
                  </Button>
                </div>
              ) : data ? (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-black/60 border border-yellow-500/20 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shrink-0">
                        <Trophy className="h-7 w-7 text-yellow-400" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-lg text-white flex items-center gap-2">
                          {data.name}
                          <span className="text-xs font-mono font-bold text-gray-400">ID: {data.tag}</span>
                        </h4>
                        <p className="text-xs text-yellow-300 font-bold mt-0.5">Club: {data.club?.name || 'None'} • XP: {data.totalXP}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                      <p className="text-xs text-gray-400 font-medium">Trophies</p>
                      <p className="text-2xl font-black text-yellow-400 font-mono">{data.trophies}</p>
                      <p className="text-[10px] text-gray-400">Highest: {data.highestTrophies}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                      <p className="text-xs text-gray-400 font-medium">Total Wins</p>
                      <p className="text-2xl font-black text-emerald-400 font-mono">{totalWins}</p>
                      <p className="text-[10px] text-gray-400">Solo {data.soloVictories} / Duo {data.duoVictories}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                      <p className="text-xs text-gray-400 font-medium">Battles</p>
                      <p className="text-2xl font-black text-purple-400 font-mono">{data.battleCount}</p>
                      <p className="text-[10px] text-gray-400">3v3 Wins: {data.teamVictories}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                      <p className="text-xs text-gray-400 font-medium">Brawlers</p>
                      <p className="text-2xl font-black text-amber-400 font-mono">{data.brawlers?.length || 0}</p>
                      <p className="text-[10px] text-gray-400">Power Play: {data.powerPlayPoints}</p>
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