'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { PubgOverview } from './PubgOverview';

export interface PubgRendererProps {
  gameKey: string;
  gameUid: string;
  isOwner?: boolean;
}

export function PubgRenderer({ gameUid, isOwner }: PubgRendererProps) {
  const [nameInput, setNameInput] = useState(gameUid || '');
  const [isEditing, setIsEditing] = useState(!gameUid);
  const queryClient = useQueryClient();

  // Fetch Live PUBG Profile & Stats
  const { data, isLoading, isError, refetch, isFetching, error } = useQuery({
    queryKey: ['game-profile', 'pubg', gameUid || nameInput],
    queryFn: async () => {
      const targetName = gameUid || nameInput;
      if (!targetName) return null;
      const res = await api.get(`/pubg/player/steam/${encodeURIComponent(targetName.trim())}`);
      return res.data;
    },
    enabled: Boolean(gameUid || nameInput),
    staleTime: 5 * 60 * 1000,
  });

  // Connect / Update Mutation
  const connectMutation = useMutation({
    mutationFn: async (playerName: string) => {
      const res = await api.post('/game/pubg/connect', { playerName });
      return res.data;
    },
    onSuccess: () => {
      toast.success(`✓ PUBG Steam Connected (${nameInput})`);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['game-profile', 'pubg'] });
      queryClient.invalidateQueries({ queryKey: ['user-game-connections'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to connect PUBG player name. Ensure player name exists on Steam.');
    },
  });

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      toast.error('Please enter a valid PUBG Steam Player Name (e.g. TGLTN)');
      return;
    }
    connectMutation.mutate(nameInput.trim());
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl bg-[#121624]/80 border border-amber-500/30 animate-pulse space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10" />
          <div className="h-4 w-40 bg-white/10 rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="h-24 bg-white/5 rounded-2xl" />
          <div className="h-24 bg-white/5 rounded-2xl" />
          <div className="h-24 bg-white/5 rounded-2xl" />
          <div className="h-24 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <Card variant="glass" className="border-amber-500/30 relative overflow-hidden bg-gradient-to-br from-[#1A1408] via-[#0B0E17] to-black shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="p-6 space-y-6">
          {/* Connection Form */}
          {(isEditing || !data || isError) ? (
            <div className="p-6 rounded-2xl bg-black/60 border border-amber-500/30 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪖</span>
                <h4 className="font-extrabold text-base text-white">Connect PUBG (Steam / PC)</h4>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200 leading-relaxed">
                  Currently GamerZ Hub supports <strong>PUBG PC / Steam</strong> players only. Enter your official Steam PUBG in-game name (e.g. <code>TGLTN</code>).
                </p>
              </div>

              <form onSubmit={handleConnectSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">PUBG Steam Player Name</label>
                  <Input
                    placeholder="e.g. TGLTN"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="bg-black/80 border-amber-500/40 text-white font-mono text-sm placeholder:text-gray-500 focus:border-amber-500 h-11"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  {gameUid && (
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
                    className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-extrabold px-6 rounded-xl h-10"
                  >
                    {connectMutation.isPending ? 'Connecting...' : 'Connect PUBG'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Connected Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 border border-white/10">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold gap-1 px-3 py-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> ✓ PUBG Connected
                  </Badge>
                  <span className="text-xs text-gray-400 font-medium">Steam PC Player Connected</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="text-xs font-bold gap-1.5 rounded-xl h-8 border-amber-500/30 hover:border-amber-500/60 bg-black/40 text-amber-300"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-amber-400' : ''}`} />
                    {isFetching ? 'Syncing...' : 'Sync Now'}
                  </Button>

                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-8 px-3 rounded-xl border border-amber-500/20"
                    >
                      Update Player Name
                    </Button>
                  )}
                </div>
              </div>

              {/* Authentic PUBG Overview */}
              <PubgOverview data={data} />
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
