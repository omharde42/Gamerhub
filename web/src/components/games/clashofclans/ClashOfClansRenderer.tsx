'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Crown, RefreshCw, AlertTriangle, Lock, CheckCircle2, ShieldAlert, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ClashOfClansOverview } from './ClashOfClansOverview';
import { ClashOfClansHeroes } from './ClashOfClansHeroes';

export interface GameRendererProps {
  gameKey: string;
  gameUid: string;
  isOwner?: boolean;
}

export function ClashOfClansRenderer({ gameUid, isOwner }: GameRendererProps) {
  const queryClient = useQueryClient();

  // Fetch connected account status from user-connections
  const { data: userAccounts = [] } = useQuery({
    queryKey: ['user-game-connections'],
    queryFn: async () => {
      const res = await api.get('/game/user-connections');
      return res.data.data || [];
    },
  });

  const cocAccount = userAccounts.find((a: any) => (a.game || '').toUpperCase().includes('CLASH'));
  const effectiveTag = gameUid || cocAccount?.inGameUid || '';
  const cleanTag = effectiveTag.replace(/^#/, '');

  const [tagInput, setTagInput] = useState(effectiveTag);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Sync state when props or userAccounts update
  useEffect(() => {
    if (effectiveTag) {
      setIsEditing(false);
      setTagInput(effectiveTag);
    }
  }, [effectiveTag]);

  const changeCount = cocAccount?.changeCount || 0;
  const isLocked = changeCount >= 1;
  const isConnected = Boolean(effectiveTag);

  // Fetch Live Supercell Player Profile
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['game-profile', 'clashofclans', cleanTag],
    queryFn: async () => {
      if (!cleanTag) return null;
      try {
        const res = await api.get(`/api/clashofclans/player/${encodeURIComponent(cleanTag)}`);
        return res.data.data || res.data;
      } catch (err) {
        const res = await api.get(`/api/player/${encodeURIComponent(cleanTag)}`);
        return res.data.data || res.data;
      }
    },
    enabled: Boolean(cleanTag),
    staleTime: 5 * 60 * 1000,
  });

  // Connect / Update Mutation
  const connectMutation = useMutation({
    mutationFn: async (tagToConnect: string) => {
      const res = await api.post('/game/clashofclans/connect', { playerTag: tagToConnect });
      return res.data;
    },
    onSuccess: () => {
      toast.success(`✓ Clash of Clans Connected (#${cleanTag})`);
      setIsEditing(false);
      setShowConfirmModal(false);
      queryClient.invalidateQueries({ queryKey: ['game-profile', 'clashofclans'] });
      queryClient.invalidateQueries({ queryKey: ['user-game-connections'] });
      queryClient.invalidateQueries({ queryKey: ['compare-common-games'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to connect player tag. Please check tag format & IP whitelist.');
    },
  });

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) {
      toast.error('Please enter a valid Player Tag (e.g. #GR8QQRV9J)');
      return;
    }

    if (isConnected && cleanTag.toLowerCase() !== tagInput.replace(/^#/, '').toLowerCase()) {
      if (isLocked) {
        toast.error('Player Tag Locked: You have used your one allowed Player Tag change.');
        return;
      }
      setShowConfirmModal(true);
    } else {
      connectMutation.mutate(tagInput.trim());
    }
  };

  const confirmChangeTag = () => {
    connectMutation.mutate(tagInput.trim());
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <Card variant="glass" className="border-yellow-500/30 relative overflow-hidden bg-gradient-to-br from-[#121624] via-[#0B0E17] to-[#1A1408] shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="p-6 space-y-6">
          {/* STATE A: Show Connect Form ONLY if NOT connected OR if explicitly editing */}
          {!isConnected || isEditing ? (
            <div className="p-6 rounded-2xl bg-black/60 border border-yellow-500/30 space-y-4">
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-yellow-400" />
                <h4 className="font-extrabold text-base text-white">
                  {isConnected ? 'Change your Clash of Clans Player Tag' : 'Connect your Clash of Clans account'}
                </h4>
              </div>

              {/* Warning Alert Box */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200 leading-relaxed">
                  <strong>Important:</strong> Please enter your own Clash of Clans Player Tag. After connecting, your Player Tag can only be changed <strong>ONCE</strong>. Choose carefully.
                </p>
              </div>

              <form onSubmit={handleConnectSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Player Tag</label>
                  <Input
                    placeholder="e.g. #GR8QQRV9J"
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
            // STATE B: CONNECTED STATE DISPLAY
            <>
              {/* Connected Header & Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-black/40 border border-yellow-500/20">
                <div className="flex items-center gap-2.5">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold gap-1.5 px-3 py-1">
                    <CheckCircle2 className="h-4 w-4" /> ✓ Clash of Clans Connected
                  </Badge>
                  <span className="text-xs text-amber-300 font-mono font-bold">
                    Tag: #{cleanTag}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sync Now Button - Always active even if tag is locked */}
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

                  {/* Change Tag / Locked Badge - Controls tag changes only */}
                  {isOwner && (
                    isLocked ? (
                      <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-xs font-bold gap-1 py-1">
                        <Lock className="h-3 w-3" /> Player Tag Locked
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 h-8 px-3 rounded-xl border border-yellow-500/20"
                      >
                        Change Player Tag
                      </Button>
                    )
                  )}
                </div>
              </div>

              {/* STATE C: LIVE API DATA FETCHING */}
              {isLoading ? (
                <div className="p-6 rounded-2xl bg-black/40 border border-white/10 animate-pulse space-y-4 text-center">
                  <p className="text-xs text-yellow-400 font-mono font-bold animate-bounce">
                    🟡 Syncing live Supercell player data for #{cleanTag}...
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="h-20 bg-white/5 rounded-2xl" />
                    <div className="h-20 bg-white/5 rounded-2xl" />
                    <div className="h-20 bg-white/5 rounded-2xl" />
                    <div className="h-20 bg-white/5 rounded-2xl" />
                  </div>
                </div>
              ) : isError ? (
                /* ERROR STATE (Does NOT open connect form, keeps connected state) */
                <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-red-300 text-xs font-semibold">
                    <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                    <span>{(error as any)?.response?.data?.message || '🔴 Unable to fetch live Supercell API data right now.'}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="text-xs font-bold text-red-300 border-red-500/40 rounded-xl"
                  >
                    Retry Sync
                  </Button>
                </div>
              ) : data ? (
                /* SUCCESS STATE: AUTHENTIC SUPERCELL OVERVIEW & HEROES */
                <>
                  <ClashOfClansOverview data={data} />
                  {data.heroes && data.heroes.length > 0 && (
                    <ClashOfClansHeroes heroes={data.heroes} pets={data.pets} />
                  )}
                </>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md">
              <Card variant="glass" className="border-yellow-500/40 bg-gradient-to-br from-[#1F1708] via-[#0F0D06] to-black">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2.5 text-amber-400">
                    <ShieldAlert className="h-6 w-6" />
                    <h3 className="text-lg font-extrabold text-white">Are you sure?</h3>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Changing your Player Tag is allowed only <strong>once</strong>. Make sure this is your own Player Tag. After this change, your Player Tag will be permanently locked.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowConfirmModal(false)}
                      className="flex-1 text-gray-400 hover:text-white rounded-xl h-11"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={confirmChangeTag}
                      disabled={connectMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 font-extrabold text-black rounded-xl h-11"
                    >
                      {connectMutation.isPending ? 'Changing...' : 'Continue'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
