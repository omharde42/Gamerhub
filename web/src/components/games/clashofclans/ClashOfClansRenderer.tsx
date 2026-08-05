'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const queryClient = useQueryClient();
  const cleanTag = (gameUid || tagInput).replace(/^#/, '');

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

  const connectMutation = useMutation({
    mutationFn: async (tagToConnect: string) => {
      const res = await api.post('/game/clashofclans/connect', { playerTag: tagToConnect });
      return res.data;
    },
    onSuccess: (resData) => {
      toast.success(`Connected Clash of Clans tag #${cleanTag}!`);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['game-profile', 'clashofclans'] });
      queryClient.invalidateQueries({ queryKey: ['user-game-connections'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to connect player tag. Please check tag & server IP authorization.');
    },
  });

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) {
      toast.error('Please enter a valid Player Tag (e.g. #GR8QQRV9J)');
      return;
    }
    connectMutation.mutate(tagInput.trim());
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl bg-[#121624]/80 border border-yellow-500/30 animate-pulse space-y-4">
        <div className="h-16 bg-white/5 rounded-2xl" />
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
          {/* Connection Bar & Input Form */}
          {(isEditing || !data || isError) ? (
            <div className="p-5 rounded-2xl bg-black/60 border border-yellow-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-400" />
                <h4 className="font-bold text-sm text-white">Connect Clash of Clans Player Tag</h4>
              </div>
              <p className="text-xs text-gray-300">
                Enter your Clash of Clans Player Tag (e.g. <code className="text-yellow-400 font-mono font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded">#GR8QQRV9J</code>) to connect and display your live Supercell profile.
              </p>
              <form onSubmit={handleConnect} className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Player Tag (e.g. #GR8QQRV9J)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="bg-black/60 border-yellow-500/30 text-white font-mono text-sm placeholder:text-gray-500 focus:border-yellow-500"
                />
                <Button
                  type="submit"
                  disabled={connectMutation.isPending}
                  className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-extrabold px-6 rounded-xl shrink-0"
                >
                  {connectMutation.isPending ? 'Connecting...' : 'Connect Tag'}
                </Button>
              </form>
            </div>
          ) : (
            <>
              {/* Authentic Supercell Overview */}
              <ClashOfClansOverview data={data} />

              {/* Authentic Supercell Heroes & Pets */}
              {data.heroes && data.heroes.length > 0 && (
                <ClashOfClansHeroes heroes={data.heroes} pets={data.pets} />
              )}

              {/* Edit Tag Action Button for Profile Owner */}
              {isOwner && (
                <div className="flex justify-end pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 gap-1.5 rounded-xl border border-yellow-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" /> Update Player Tag
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
