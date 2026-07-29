'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import {
  Shield, RefreshCw, Trash2, ExternalLink, Check, Sparkles,
  Gamepad2, Zap, Trophy, Clock, Lock, Star, ChevronRight, Loader2
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

type PlatformConfig = {
  id: string;
  name: string;
  category: 'Gaming' | 'Esports' | 'Social';
  brandColor: string;
  bgGradient: string;
  borderColor: string;
  icon: string;
  description: string;
  defaultIdPlaceholder: string;
};

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'STEAM',
    name: 'Steam',
    category: 'Gaming',
    brandColor: '#171A21',
    bgGradient: 'from-[#171A21] via-[#1B2838] to-[#2A475E]',
    borderColor: 'border-[#66C0F4]/40',
    icon: '🎮',
    description: 'Sync Steam Level, Owned Games, Playtime & CS2 Achievements',
    defaultIdPlaceholder: 'Steam ID 64 (e.g. 76561198012345678)',
  },
  {
    id: 'VALORANT',
    name: 'Riot Games (Valorant / LoL)',
    category: 'Gaming',
    brandColor: '#FF4655',
    bgGradient: 'from-[#FF4655]/20 via-[#0F1923] to-[#111827]',
    borderColor: 'border-[#FF4655]/50',
    icon: '👑',
    description: 'Sync Valorant Radiant/Immortal Rank, K/D, Win Rate & Headshot %',
    defaultIdPlaceholder: 'Riot ID (e.g. TenZ#NA1)',
  },
  {
    id: 'FACEIT',
    name: 'FACEIT Esports',
    category: 'Esports',
    brandColor: '#FF5500',
    bgGradient: 'from-[#FF5500]/20 via-[#111827] to-[#0B1220]',
    borderColor: 'border-[#FF5500]/50',
    icon: '⚡',
    description: 'Sync FACEIT Level 1-10, ELO, Win Rate & Pro Scrim Stats',
    defaultIdPlaceholder: 'FACEIT Username (e.g. s1mple)',
  },
  {
    id: 'DISCORD',
    name: 'Discord',
    category: 'Social',
    brandColor: '#5865F2',
    bgGradient: 'from-[#5865F2]/20 via-[#111827] to-[#0B1220]',
    borderColor: 'border-[#5865F2]/50',
    icon: '💬',
    description: 'Connect Discord Tag for instant voice channels and community badges',
    defaultIdPlaceholder: 'Discord Tag (e.g. GamerZ#0001)',
  },
];

const UPCOMING_PLATFORMS = [
  { name: 'Clash of Clans / Royale', icon: '🛡️', tag: 'Supercell' },
  { name: 'Xbox Live', icon: '🟢', tag: 'Microsoft' },
  { name: 'PlayStation Network', icon: '🔵', tag: 'Sony' },
  { name: 'Ubisoft Connect', icon: '🌀', tag: 'Ubisoft' },
  { name: 'Twitch Gaming', icon: '💜', tag: 'Amazon' },
];

export default function ConnectedAccountsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const socket = useSocket();

  const [connectModalPlatform, setConnectModalPlatform] = useState<PlatformConfig | null>(null);
  const [inputIdentifier, setInputIdentifier] = useState('');
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);

  const { data: connectedAccounts, isLoading } = useQuery({
    queryKey: ['connected-accounts'],
    queryFn: () => api.get('/game-sync/connected-accounts').then(r => r.data.data).catch(() => []),
    enabled: !!user,
  });

  // Listen to live WebSocket updates from the sync engine
  useEffect(() => {
    if (!socket) return;
    const handleStatsUpdated = (payload: any) => {
      if (payload.userId === user?.id) {
        queryClient.invalidateQueries({ queryKey: ['connected-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['passport'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        toast.success(`Live ${payload.platform} stats updated!`, { icon: '⚡' });
      }
    };
    socket.on('game-stats:updated', handleStatsUpdated);
    return () => {
      socket.off('game-stats:updated', handleStatsUpdated);
    };
  }, [socket, user?.id, queryClient]);

  const syncMutation = useMutation({
    mutationFn: ({ platform, identifier }: { platform: string; identifier?: string }) =>
      api.post(`/game-sync/sync/${platform}`, { identifier }),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['connected-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['passport'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSyncingPlatform(null);
      setConnectModalPlatform(null);
      setInputIdentifier('');
      toast.success(`${vars.platform} connected & synchronized!`, { icon: '✅' });
    },
    onError: (err: any) => {
      setSyncingPlatform(null);
      toast.error(err.response?.data?.message || 'Sync failed. Please try again.');
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (platform: string) => api.delete(`/game-sync/disconnect/${platform}`),
    onSuccess: (_, platform) => {
      queryClient.invalidateQueries({ queryKey: ['connected-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['passport'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(`${platform} account disconnected.`);
    },
    onError: () => toast.error('Failed to disconnect account.'),
  });

  const handleTriggerSync = (platform: PlatformConfig) => {
    setSyncingPlatform(platform.id);
    const existing = connectedAccounts?.find((a: any) => a.game.toUpperCase() === platform.id);
    syncMutation.mutate({ platform: platform.id, identifier: existing?.inGameUid });
  };

  const handleConnectSubmit = () => {
    if (!connectModalPlatform || !inputIdentifier.trim()) {
      return toast.error('Please enter a valid in-game ID or username');
    }
    setSyncingPlatform(connectModalPlatform.id);
    syncMutation.mutate({ platform: connectModalPlatform.id, identifier: inputIdentifier.trim() });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0B1220] via-[#111827] to-[#0B1220] border border-[#7C3AED]/30 p-6 md:p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#7C3AED]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-[#7C3AED] to-[#FF6B00] text-white font-extrabold text-[10px] uppercase px-3 py-0.5 tracking-wider">
                Universal Identity Engine
              </Badge>
              <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 font-bold gap-1">
                <Shield className="h-3 w-3" /> Live OAuth Sync
              </Badge>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Connected Gaming Accounts</h1>
            <p className="text-sm text-gray-300 max-w-xl leading-relaxed">
              Connect your official game accounts. GamerZ Hub automatically retrieves and updates your live ranks, levels, win rates, and match history directly from official servers.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Supported Platforms Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-[#7C3AED]" /> Official Game API Integrations
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {PLATFORMS.map((platform) => {
            const connected = connectedAccounts?.find((a: any) => a.game.toUpperCase() === platform.id);
            const isSyncingThis = syncingPlatform === platform.id;

            return (
              <motion.div key={platform.id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Card className={`bg-gradient-to-br ${platform.bgGradient} border ${platform.borderColor} shadow-xl relative overflow-hidden`}>
                  <CardContent className="p-6 space-y-4 relative z-10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center text-2xl shadow-inner shrink-0">
                          {platform.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white flex items-center gap-2">
                            {platform.name}
                            {connected && <Check className="h-4 w-4 text-emerald-400 fill-emerald-400/20" />}
                          </h3>
                          <p className="text-xs text-gray-300">{platform.description}</p>
                        </div>
                      </div>

                      <Badge className={connected ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold" : "bg-white/10 text-gray-300 border border-white/10"}>
                        {connected ? "CONNECTED" : "DISCONNECTED"}
                      </Badge>
                    </div>

                    {/* Connected Account Details */}
                    {connected ? (
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">In-Game Identity:</span>
                          <span className="font-bold text-white font-mono">{connected.inGameName} ({connected.inGameUid})</span>
                        </div>
                        {connected.rank && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Verified Rank / Level:</span>
                            <span className="font-bold text-[#00E676]">{connected.rank} • Lvl {connected.level || 1}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-white/10">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Last Synced: {formatRelativeTime(connected.lastSyncedAt || connected.updatedAt)}
                          </span>
                          <span className="text-emerald-400 font-semibold text-[10px]">AUTO-SYNC ACTIVE</span>
                        </div>
                      </div>
                    ) : null}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      {connected ? (
                        <>
                          <Button
                            variant="gradient"
                            size="sm"
                            className="flex-1 gap-1.5 font-bold text-xs"
                            onClick={() => handleTriggerSync(platform)}
                            disabled={isSyncingThis}
                            animate
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${isSyncingThis ? 'animate-spin' : ''}`} />
                            {isSyncingThis ? 'Syncing Live Data...' : 'Sync Now'}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                            onClick={() => disconnectMutation.mutate(platform.id)}
                            disabled={disconnectMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 font-bold text-xs bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/40"
                          onClick={() => {
                            setConnectModalPlatform(platform);
                            setInputIdentifier('');
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Connect {platform.name}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Connect Account Modal */}
      <Dialog open={!!connectModalPlatform} onOpenChange={(open) => !open && setConnectModalPlatform(null)}>
        <DialogContent className="bg-[#0B1220] border-white/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <span>{connectModalPlatform?.icon}</span> Connect {connectModalPlatform?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <p className="text-xs text-gray-300 leading-relaxed">
              Enter your official in-game UID or account tag. GamerZ Hub will verify and retrieve live statistics directly from official API servers.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Identifier / Tag</label>
              <Input
                placeholder={connectModalPlatform?.defaultIdPlaceholder}
                value={inputIdentifier}
                onChange={(e) => setInputIdentifier(e.target.value)}
                className="bg-[#111827] border-white/20 text-white text-sm focus:border-[#7C3AED]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="gradient"
                className="flex-1 font-bold text-xs h-10 gap-2"
                onClick={handleConnectSubmit}
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {syncMutation.isPending ? 'Verifying & Syncing...' : 'Authorize & Connect Account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upcoming Scalable API Integrations */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" /> Scalable Integrations Queue (Phase 2)
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {UPCOMING_PLATFORMS.map((item, i) => (
            <div key={i} className="p-3 rounded-xl bg-[#111827]/60 border border-white/5 flex items-center gap-2.5">
              <span className="text-xl">{item.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                <p className="text-[9px] text-muted-foreground">{item.tag}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
