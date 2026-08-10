'use client';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { BackHeader } from '@/components/common/back-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Swords, Loader2, Send, Zap, Shield, Bell, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import { ChallengeCard } from '@/components/challenges/challenge-card';
import type { Challenge } from '@/types';

type Tab = 'incoming' | 'sent' | 'history';

export default function ChallengesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [tab, setTab] = useState<Tab>('incoming');

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => api.get('/challenges?limit=100').then((r) => r.data.data || []),
    enabled: !!user,
  });

  const { data: counts } = useQuery({
    queryKey: ['challenge-counts'],
    queryFn: () => api.get('/challenges/counts').then((r) => r.data.data || { incoming: 0, outgoing: 0, history: 0 }),
    enabled: !!user,
  });

  // Real-time: refresh whenever a challenge event arrives via socket.
  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenge-counts'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
    socket.on('challenge:new', refresh);
    socket.on('challenge:updated', refresh);
    socket.on('challenge:expired', refresh);
    socket.on('challenge:completed', refresh);
    return () => {
      socket.off('challenge:new', refresh);
      socket.off('challenge:updated', refresh);
      socket.off('challenge:expired', refresh);
      socket.off('challenge:completed', refresh);
    };
  }, [socket, queryClient]);

  const { incoming, sent, history } = useMemo(() => {
    const inc = challenges.filter((c: Challenge) => c.opponent.id === user?.id && ['PENDING', 'ACCEPTED'].includes(c.status));
    const out = challenges.filter((c: Challenge) => c.challenger.id === user?.id && ['PENDING', 'ACCEPTED'].includes(c.status));
    const hist = challenges.filter((c: Challenge) => ['DECLINED', 'CANCELLED', 'EXPIRED', 'COMPLETED'].includes(c.status));
    return { incoming: inc, sent: out, history: hist };
  }, [challenges, user?.id]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['challenges'] });
    queryClient.invalidateQueries({ queryKey: ['challenge-counts'] });
  };

  const activeList = tab === 'incoming' ? incoming : tab === 'sent' ? sent : history;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-0 space-y-4">
      <BackHeader title="My Challenges" />

      {/* Hero */}
      <div className="rounded-[28px] bg-card/80 border border-emerald-500/40 p-5 relative overflow-hidden backdrop-blur-2xl shadow-xl">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
            <Swords className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold tracking-tight text-foreground">Challenge Arena</h1>
            <p className="text-xs text-slate-300">
              Direct matchmaking for <span className="text-emerald-400 font-bold">Clash of Clans</span> &{' '}
              <span className="text-emerald-400 font-bold">PUBG PC/Console</span> — challenge anyone, friends not required.
            </p>
          </div>
          <Badge className="hidden sm:flex bg-emerald-500/15 text-emerald-400 border-emerald-500/40 gap-1 font-mono font-bold">
            <Shield className="h-3 w-3" /> Spam protected
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="w-full bg-card/60 border border-white/10 p-1 rounded-2xl grid grid-cols-3 gap-1">
          <TabsTrigger value="incoming" className="rounded-xl data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border data-[state=active]:border-emerald-500/50 font-bold gap-1.5 text-xs">
            <Bell className="h-3.5 w-3.5" /> Incoming
            {counts?.incoming > 0 && (
              <span className="h-4 min-w-[16px] px-1 rounded-full bg-emerald-500 text-black text-[9px] font-extrabold flex items-center justify-center">
                {counts.incoming}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="rounded-xl data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border data-[state=active]:border-emerald-500/50 font-bold gap-1.5 text-xs">
            <Send className="h-3.5 w-3.5" /> Sent
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border data-[state=active]:border-emerald-500/50 font-bold gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-0 space-y-3 outline-none">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Loading challenges...</span>
            </div>
          ) : activeList.length === 0 ? (
            <EmptyState
              title={tab === 'incoming' ? 'No incoming challenges' : tab === 'sent' ? 'No challenges sent' : 'No challenge history'}
              description={
                tab === 'incoming'
                  ? 'When gamers challenge you to Clash of Clans or PUBG, they will appear here.'
                  : tab === 'sent'
                    ? 'Challenge a gamer directly from their profile — no friendship needed.'
                    : 'Declined, cancelled, expired and completed challenges are stored here.'
              }
              icon={tab === 'incoming' ? Bell : tab === 'sent' ? Send : Clock}
            />
          ) : (
            <>
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-muted-foreground">
                  {activeList.length} active {activeList.length === 1 ? 'challenge' : 'challenges'}
                </p>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={refresh}>
                  <Zap className="h-3 w-3" /> Refresh
                </Button>
              </div>
              {activeList.map((c: Challenge, i: number) => (
                <ChallengeCard key={c.id} challenge={c} currentUserId={user!.id} onChanged={refresh} index={i} />
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
