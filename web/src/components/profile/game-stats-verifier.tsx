'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, Sparkles, CheckCircle2, Shield, Flame, Trophy, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface GameStatsVerifierProps {
  userId?: string;
  isEditable?: boolean;
}

export function GameStatsVerifier({ userId, isEditable = true }: GameStatsVerifierProps) {
  const queryClient = useQueryClient();
  const [selectedGame, setSelectedGame] = useState('Free Fire');
  const [inGameUid, setInGameUid] = useState('');
  const [inGameName, setInGameName] = useState('');
  const [region, setRegion] = useState('IND');

  const { data: verifiedAccounts, isLoading } = useQuery({
    queryKey: ['verified-game-accounts', userId],
    queryFn: async () => {
      const res = await api.get(`/game-stats/user/${userId || 'me'}`);
      return res.data.data || [];
    },
    enabled: true,
  });

  const verifyMutation = useMutation({
    mutationFn: () => api.post('/game-stats/verify', {
      game: selectedGame,
      inGameUid: inGameUid.trim(),
      inGameName: inGameName.trim() || undefined,
      region,
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['verified-game-accounts'] });
      toast.success(data.data?.message || `${selectedGame} verified successfully!`);
      setInGameUid('');
      setInGameName('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to verify in-game UID. Please try again.');
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/game-stats/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verified-game-accounts'] });
      toast.success('Game account unlinked.');
    },
  });

  const gameOptions = [
    { name: 'Free Fire', icon: '🔥', placeholder: 'Enter Free Fire UID (e.g. 189238472)' },
    { name: 'PUBG Mobile / BGMI', icon: '🍗', placeholder: 'Enter PUBG Character ID (e.g. 512938412)' },
    { name: 'Valorant', icon: '🎯', placeholder: 'Enter Riot ID (e.g. TenZ#1234)' },
    { name: 'CS2', icon: '💣', placeholder: 'Enter Steam64 ID or Custom URL' },
    { name: 'COD Mobile', icon: '🔫', placeholder: 'Enter CODM OpenID / Character ID' },
  ];

  return (
    <Card variant="bento" className="border-white/10 bg-[#111827] shadow-xl overflow-hidden">
      <CardHeader className="pb-4 p-0">
        <CardTitle className="text-base font-bold flex items-center justify-between">
          <span className="flex items-center gap-2 text-foreground font-orbitron">
            <Shield className="h-5 w-5 text-[#00E676]" /> Verified In-Game Accounts & Stats
          </span>
          <Badge variant="outline" className="bg-[#00E676]/10 text-[#00E676] border-[#00E676]/30 text-xs font-mono font-bold">
            LIVE VERIFICATION ACTIVE
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 pt-4 space-y-6">
        {/* Verification Form for Editable view */}
        {isEditable && (
          <div className="p-4 rounded-2xl bg-[#0B1220] border border-white/[0.08] space-y-4">
            <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Sparkles className="h-4 w-4 text-[#FF6B00]" /> Link & Verify Your Game UID
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {gameOptions.map((g) => (
                <button
                  key={g.name}
                  onClick={() => setSelectedGame(g.name)}
                  className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${
                    selectedGame === g.name
                      ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20 font-bold'
                      : 'bg-background/40 border-white/[0.08] text-[#94A3B8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{g.icon}</span>
                  <span className="truncate">{g.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="sm:col-span-2">
                <Input
                  placeholder={gameOptions.find((g) => g.name === selectedGame)?.placeholder || 'Enter In-Game UID'}
                  value={inGameUid}
                  onChange={(e) => setInGameUid(e.target.value)}
                  className="bg-[#111827] border-white/[0.08] text-xs h-10 rounded-xl focus:border-[#7C3AED]"
                />
              </div>
              <Button
                variant="gradient"
                size="sm"
                className="h-10 rounded-xl text-xs font-bold gap-1.5"
                disabled={!inGameUid.trim() || verifyMutation.isPending}
                onClick={() => verifyMutation.mutate()}
              >
                {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Verify & Sync Stats
              </Button>
            </div>
          </div>
        )}

        {/* Display Verified Accounts */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider font-mono">
            Connected In-Game Credentials ({verifiedAccounts?.length || 0})
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-xs text-[#94A3B8] gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#7C3AED]" />
              <span>Fetching verified in-game stats...</span>
            </div>
          ) : verifiedAccounts?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {verifiedAccounts.map((acc: any) => (
                <motion.div
                  key={acc.id}
                  whileHover={{ scale: 1.01 }}
                  className="p-3.5 rounded-2xl bg-[#0B1220] border border-white/[0.08] flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white font-inter">{acc.inGameName}</span>
                      <Badge variant="outline" className="text-[10px] bg-[#00E676]/10 text-[#00E676] border-[#00E676]/30 font-mono font-bold">
                        ✓ Verified
                      </Badge>
                    </div>

                    <p className="text-xs text-[#7C3AED] font-semibold font-mono mt-0.5">{acc.game} &bull; {acc.rank}</p>

                    <div className="flex items-center gap-3 text-[11px] text-[#94A3B8] font-mono mt-1.5">
                      <span>UID: {acc.inGameUid}</span>
                      <span>Level {acc.level}</span>
                      <span className="text-amber-400 font-bold">{acc.kdRatio} K/D</span>
                    </div>
                  </div>

                  {isEditable && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#94A3B8] hover:text-[#FF3D71] shrink-0"
                      onClick={() => unlinkMutation.mutate(acc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center text-xs text-[#94A3B8]">
              No in-game accounts linked yet. Enter your Free Fire, PUBG Mobile, or Valorant UID above to display verified live stats!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
