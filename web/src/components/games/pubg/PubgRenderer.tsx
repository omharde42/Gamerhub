'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle2, AlertCircle, Shield, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { PubgOverview } from './PubgOverview';

export interface PubgRendererProps {
  gameKey: string;
  gameUid: string;
  isOwner?: boolean;
}

export function PubgRenderer({ gameUid, isOwner }: PubgRendererProps) {
  const queryClient = useQueryClient();

  // Fetch user accounts to check connection status
  const { data: userAccounts = [] } = useQuery({
    queryKey: ['user-game-connections'],
    queryFn: async () => {
      const res = await api.get('/game/user-connections');
      return res.data.data || [];
    },
  });

  const pubgAccount = userAccounts.find((a: any) => (a.game || '').toUpperCase().includes('PUBG'));
  const effectiveUid = gameUid || pubgAccount?.inGameUid || '';

  const [nameInput, setNameInput] = useState(effectiveUid);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (effectiveUid) {
      setIsEditing(false);
      setNameInput(effectiveUid);
    }
  }, [effectiveUid]);

  const isConnected = Boolean(effectiveUid);

  // Fetch Live PUBG Profile & Stats
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['game-profile', 'pubg', effectiveUid || nameInput],
    queryFn: async () => {
      const targetName = effectiveUid || nameInput;
      if (!targetName) return null;
      const res = await api.get(`/pubg/player/steam/${encodeURIComponent(targetName.trim())}`);
      return res.data;
    },
    enabled: Boolean(effectiveUid || nameInput),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const fetchError = (error as any)?.response?.data?.message || (error as any)?.message || null;

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
      queryClient.invalidateQueries({ queryKey: ['compare-common-games'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to connect PUBG player name. Ensure player name exists on Steam.');
    },
  });

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      toast.error('Please enter a valid PUBG Steam Player Name (e.g. TGLTN)');
      return;
    }
    // PUBG Mobile UIDs are numeric IDs. This integration is PC/Console only,
    // so reject them up-front with a clear message instead of a confusing
    // "player not found" from the Steam shard. The backend re-validates too.
    if (/^\d+$/.test(trimmed)) {
      toast.error('PUBG Mobile UIDs are not supported for the PC/Console integration. Enter your PUBG PC/Steam player name instead.');
      return;
    }
    connectMutation.mutate(trimmed);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <Card variant="glass" className="border-amber-500/30 relative overflow-hidden bg-gradient-to-br from-[#1A1208] via-[#0D0A05] to-[#141A0B] shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="p-6 space-y-6">
          {!isConnected || isEditing ? (
            <div className="p-6 rounded-2xl bg-black/60 border border-amber-500/30 space-y-4">
              <div className="flex items-center gap-2">
                <Swords className="h-6 w-6 text-amber-400" />
                <h4 className="font-extrabold text-base text-white">
                  {isConnected ? 'Update PUBG Steam Player Name' : 'Connect your PUBG Steam account'}
                </h4>
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
                    className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-extrabold px-6 rounded-xl h-10"
                  >
                    {connectMutation.isPending ? 'Connecting...' : isConnected ? 'Save Changes' : 'Connect PUBG'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            // CONNECTED STATE
            <>
              {/* Connected Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-black/40 border border-amber-500/20">
                <div className="flex items-center gap-2.5">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold gap-1.5 px-3 py-1">
                    <CheckCircle2 className="h-4 w-4" /> ✓ PUBG Connected
                  </Badge>
                  <span className="text-xs text-amber-300 font-mono font-bold">
                    Steam Player: {effectiveUid}
                  </span>
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

              {/* STATS LOADING STATE */}
              {isLoading ? (
                <div className="p-6 rounded-2xl bg-black/40 border border-white/10 animate-pulse space-y-4 text-center">
                  <p className="text-xs text-amber-400 font-mono font-bold animate-bounce">
                    🟡 Syncing live PUBG PC statistics for {effectiveUid}...
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
                  <div className="flex items-center gap-2.5 text-red-300 text-xs font-semibold min-w-0">
                    <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                    <span className="break-words">{fetchError || 'Unable to fetch live PUBG API data right now. The API may be temporarily unavailable.'}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="text-xs font-bold text-red-300 border-red-500/40 rounded-xl shrink-0"
                  >
                    Retry Sync
                  </Button>
                </div>
              ) : data ? (
                <PubgOverview data={data} />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
