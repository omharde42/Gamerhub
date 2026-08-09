'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Crown, RefreshCw, AlertTriangle, Lock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { PremiumModal } from '@/components/ui/premium-modal';
import toast from 'react-hot-toast';
import { ClashOfClansOverview } from './ClashOfClansOverview';
import { ClashOfClansHeroes } from './ClashOfClansHeroes';

export interface GameRendererProps {
  gameKey: string;
  gameUid: string;
  isOwner?: boolean;
}

export function ClashOfClansRenderer({ gameUid, isOwner }: GameRendererProps) {
  const [tagInput, setTagInput] = useState(gameUid || '');
  const [isEditing, setIsEditing] = useState(!gameUid);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const queryClient = useQueryClient();
  const cleanTag = (gameUid || tagInput).replace(/^#/, '');

  // Fetch connected account status from user-connections to know changeCount
  const { data: userAccounts = [] } = useQuery({
    queryKey: ['user-game-connections'],
    queryFn: async () => {
      const res = await api.get('/game/user-connections');
      return res.data.data || [];
    },
  });

  const cocAccount = userAccounts.find((a: any) => (a.game || '').toUpperCase() === 'CLASH_OF_CLANS');
  const changeCount = cocAccount?.changeCount || 0;
  const isLocked = changeCount >= 1;

  // Fetch Live Supercell Player Profile
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['game-profile', 'clashofclans', cleanTag],
    queryFn: async () => {
      if (!cleanTag) return null;
      const res = await api.get(`/game/clashofclans/profile?uid=${encodeURIComponent(cleanTag)}`);
      return res.data.data;
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

    // If changing tag for existing account, show confirmation modal
    if (cocAccount && cocAccount.inGameUid.toUpperCase() !== `#${cleanTag}`.toUpperCase()) {
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

  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl bg-[#121624]/80 border border-yellow-500/30 animate-pulse space-y-4">
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
      <Card variant="glass" className="border-yellow-500/30 relative overflow-hidden bg-gradient-to-br from-[#121624] via-[#0B0E17] to-[#1A1408] shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="p-6 space-y-6">
          {/* Connection Form (First Connection or Editing) */}
          {(isEditing || !data || isError) ? (
            <div className="p-6 rounded-2xl bg-black/60 border border-yellow-500/30 space-y-4">
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-yellow-400" />
                <h4 className="font-extrabold text-base text-white">Connect your Clash of Clans account</h4>
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
                    className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-extrabold px-6 rounded-xl h-10"
                  >
                    {connectMutation.isPending ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Connected Header & Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 border border-white/10">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold gap-1 px-3 py-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> ✓ Clash of Clans Connected
                  </Badge>
                  <span className="text-xs text-gray-400 font-medium">Player Tag connected</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Live Sync Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="text-xs font-bold gap-1.5 rounded-xl h-8 border-yellow-500/30 hover:border-yellow-500/60 bg-black/40 text-yellow-300"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-yellow-400' : ''}`} />
                    {isFetching ? 'Syncing Clash of Clans data...' : 'Sync Now'}
                  </Button>

                  {/* Change Tag / Locked Badge */}
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

              {/* Authentic Supercell Overview */}
              <ClashOfClansOverview data={data} />

              {/* Authentic Supercell Heroes & Pets */}
              {data.heroes && data.heroes.length > 0 && (
                <ClashOfClansHeroes heroes={data.heroes} pets={data.pets} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* One-Time Tag Change Confirmation Modal */}
      <PremiumModal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        variant="center"
        size="sm"
        showCloseButton={false}
        title="Confirm Player Tag Change"
      >
        <div className="flex min-h-full w-full flex-col bg-gradient-to-br from-[#1F1708] via-[#0F0D06] to-black">
          <div className="space-y-4 p-6">
            <div className="flex items-center gap-2.5 text-amber-400">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-lg font-extrabold text-white">Are you sure?</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Your Clash of Clans Player Tag can only be changed <strong>once</strong>. After this change, it will be permanently locked to your GamerZ Hub account.
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
                {connectMutation.isPending ? 'Changing...' : 'Change Tag'}
              </Button>
            </div>
          </div>
        </div>
      </PremiumModal>
    </motion.div>
  );
}
