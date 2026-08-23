'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Shield, Swords, Star, RefreshCw, CheckCircle2, Crown, Zap, Flame, Building2, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ClashOfClansCardProps {
  initialTag?: string;
  isOwner?: boolean;
  onConnected?: () => void;
}

export function ClashOfClansCard({ initialTag, isOwner = true, onConnected }: ClashOfClansCardProps) {
  const [tagInput, setTagInput] = useState(initialTag || '');
  const [connecting, setConnecting] = useState(false);
  const queryClient = useQueryClient();

  const cleanTag = (initialTag || tagInput).replace(/^#/, '');

  // Fetch live/cached player stats
  const { data: cocData, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['clash-of-clans', cleanTag],
    queryFn: async () => {
      if (!cleanTag) return null;
      const res = await api.get(`/clashofclans/player/${encodeURIComponent(cleanTag)}`);
      return res.data.data;
    },
    enabled: Boolean(cleanTag),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Connect Clash of Clans account mutation
  const connectMutation = useMutation({
    mutationFn: async (tagToConnect: string) => {
      const res = await api.post('/clashofclans/connect', { playerTag: tagToConnect });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Connected Clash of Clans profile: ${data.data.stats.name}!`);
      setConnecting(false);
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['clash-of-clans'] });
      onConnected?.();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to connect Clash of Clans account. Please check tag & server authorization.');
      setConnecting(false);
    },
  });

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) {
      toast.error('Please enter your Clash of Clans Player Tag');
      return;
    }
    setConnecting(true);
    connectMutation.mutate(tagInput.trim());
  };

  return (
    <Card variant="glass" className="border-yellow-500/30 relative overflow-hidden shadow-2xl bg-gradient-to-br from-[#121624] via-[#0B0E17] to-[#1A1408]">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <CardContent className="p-6 space-y-6 relative z-10">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-700 p-0.5 shadow-lg shadow-yellow-500/20">
              <div className="w-full h-full bg-black/80 rounded-[14px] flex items-center justify-center">
                <Crown className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                Clash of Clans
              </h3>
              <p className="text-xs text-yellow-400/80 font-mono">Supercell Live Sync</p>
            </div>
          </div>

          {cocData && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold gap-1 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Connected
            </Badge>
          )}
        </div>

        {/* Not Connected Form State */}
        {!initialTag && !cocData && (
          <form onSubmit={handleConnectSubmit} className="space-y-4">
            <p className="text-sm text-gray-300">
              Enter your Clash of Clans Player Tag (e.g. <code className="text-yellow-400 font-mono font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded">#GR8QQRV9J</code>) to display your Town Hall, League, Trophies, and War Stars on your GamerZ Hub profile.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Player Tag (e.g. #GR8QQRV9J)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="bg-black/50 border-yellow-500/30 text-white placeholder:text-gray-500 focus:border-yellow-500 font-mono text-sm"
              />
              <Button
                type="submit"
                disabled={connecting || connectMutation.isPending}
                className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-extrabold px-6 rounded-xl shrink-0"
              >
                {connecting || connectMutation.isPending ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          </form>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-16 bg-white/5 rounded-2xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="h-24 bg-white/5 rounded-2xl" />
              <div className="h-24 bg-white/5 rounded-2xl" />
              <div className="h-24 bg-white/5 rounded-2xl" />
              <div className="h-24 bg-white/5 rounded-2xl" />
            </div>
          </div>
        )}

        {/* Connected Player Live Stats Card */}
        {cocData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Player Banner */}
            <div className="p-4 rounded-2xl bg-black/60 border border-yellow-500/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex flex-col items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-yellow-400" />
                  <span className="text-[10px] font-black text-yellow-400 font-mono mt-0.5">TH {cocData.townHallLevel}</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                    {cocData.name}
                    <span className="text-xs font-mono font-bold text-gray-400">{cocData.tag}</span>
                  </h4>
                  <p className="text-xs text-gray-300 flex items-center gap-2 mt-0.5">
                    <span>XP Level {cocData.expLevel}</span>
                    {cocData.clan && (
                      <>
                        <span>•</span>
                        <span className="text-yellow-400 font-semibold">{cocData.clan.name} ({cocData.role || 'Member'})</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Refresh Trigger */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="text-xs text-gray-400 hover:text-white hover:bg-white/10 gap-1.5 rounded-xl border border-white/10"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-yellow-400' : ''}`} />
                {isFetching ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Trophies */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5 text-yellow-400" /> Trophies
                </p>
                <p className="text-2xl font-black text-yellow-400 font-mono">{cocData.trophies}</p>
                <p className="text-[10px] text-gray-400">Peak: {cocData.bestTrophies}</p>
              </div>

              {/* War Stars */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-400" /> War Stars
                </p>
                <p className="text-2xl font-black text-amber-400 font-mono">{cocData.warStars}</p>
                <p className="text-[10px] text-gray-400">Attacks: {cocData.attackWins}</p>
              </div>

              {/* Builder Hall */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-orange-400" /> Builder Base
                </p>
                <p className="text-2xl font-black text-orange-400 font-mono">BH {cocData.builderHallLevel || 1}</p>
                <p className="text-[10px] text-gray-400">{cocData.versusTrophies || 0} Trophies</p>
              </div>

              {/* Clan Donations */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-blue-400" /> Donations
                </p>
                <p className="text-2xl font-black text-blue-400 font-mono">{cocData.donations}</p>
                <p className="text-[10px] text-gray-400">Received: {cocData.donationsReceived}</p>
              </div>
            </div>

            {/* Cache Footer Timestamp */}
            <p className="text-[11px] text-gray-400 font-mono text-right">
              Last Synced: {new Date(cocData.cachedAt).toLocaleTimeString()} (5-Min Auto Cache)
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
