'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { BackHeader } from '@/components/common/back-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Trophy, Medal, Loader2, Crown, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  score: number | null;
  metricValue: string;
  detail: Record<string, any>;
}

interface LeaderboardResponse {
  game: string;
  name: string;
  icon: string;
  description: string;
  metricLabel: string;
  minSampleHint: string | null;
  data: LeaderboardEntry[];
  myEntry: LeaderboardEntry | null;
  meta: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
}

const RANK_STYLES: Record<number, { className: string; icon?: 'gold' | 'silver' | 'bronze' }> = {
  1: { className: 'from-amber-400/20 to-amber-600/10 border-amber-500/40', icon: 'gold' },
  2: { className: 'from-slate-300/20 to-slate-500/10 border-slate-400/40', icon: 'silver' },
  3: { className: 'from-orange-600/20 to-orange-800/10 border-orange-500/40', icon: 'bronze' },
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-amber-400 shrink-0" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-300 shrink-0" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-orange-400 shrink-0" />;
  return <span className="text-xs font-bold text-muted-foreground w-4 text-center shrink-0">{rank}</span>;
}

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  // Show top 3 in visual order: 2nd, 1st, 3rd.
  const ordered = [entries[1], entries[0], entries[2]].filter(Boolean);
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end">
      {ordered.map((entry: LeaderboardEntry) => {
        const style = RANK_STYLES[entry.rank];
        const height = entry.rank === 1 ? 'h-full' : entry.rank === 2 ? 'h-[85%]' : 'h-[70%]';
        return (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (entry.rank - 1) * 0.08 }}
            className="flex flex-col items-center"
          >
            <div className="mb-2 flex flex-col items-center">
              {entry.rank === 1 && <Crown className="h-5 w-5 text-amber-400 mb-0.5" />}
              <Link href={`/profile/${entry.username}`}>
                <Avatar className={`h-12 w-12 sm:h-16 sm:w-16 ring-2 ${entry.rank === 1 ? 'ring-amber-400' : entry.rank === 2 ? 'ring-slate-300' : 'ring-orange-500'} shadow-lg`}>
                  <AvatarImage src={entry.avatar || ''} />
                  <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    {getInitials(entry.displayName || entry.username)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Link href={`/profile/${entry.username}`} className="mt-1.5 text-[11px] sm:text-xs font-bold text-center hover:text-primary transition-colors max-w-[80px] truncate">
                {entry.displayName || entry.username}
              </Link>
            </div>
            <div className={`w-full rounded-t-2xl border bg-gradient-to-b ${style.className} p-2 sm:p-3 text-center flex items-end justify-center ${height}`}>
              <div>
                <p className="text-sm sm:text-lg font-extrabold">{entry.metricValue}</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">#{entry.rank}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function LeaderboardsPage() {
  const [game, setGame] = useState('clashofclans');
  const [page, setPage] = useState(1);

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ['leaderboard-games'],
    queryFn: () => api.get('/leaderboards/games').then((r) => r.data.data || []),
  });

  const { data: board, isLoading, isError, error, refetch, isFetching } = useQuery<LeaderboardResponse>({
    queryKey: ['leaderboard', game, page],
    queryFn: () => api.get(`/leaderboards/${game}?page=${page}&limit=25`).then((r) => r.data.data),
    enabled: !!game,
  });

  const entries = board?.data || [];
  const activeGame = games?.find((g: any) => g.id === game);

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-0 space-y-5 pb-16 md:pb-6">
      <BackHeader title="Global Leaderboards" />

      {/* Hero */}
      <div className="rounded-[28px] bg-card/80 border border-primary/20 p-5 relative overflow-hidden backdrop-blur-2xl shadow-xl">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gaming-purple to-gaming-pink flex items-center justify-center shadow-lg shadow-gaming-purple/30 shrink-0">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold tracking-tight">Leaderboard</h1>
            <p className="text-xs text-muted-foreground">
              Rankings are computed from <span className="text-emerald-400 font-semibold">verified real data only</span> — never fabricated. Each game uses its own metric.
            </p>
          </div>
        </div>
      </div>

      {/* Game tabs */}
      {gamesLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(games || []).map((g: any) => (
            <button
              key={g.id}
              onClick={() => { setGame(g.id); setPage(1); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all shrink-0 ${
                game === g.id
                  ? 'bg-primary/15 text-primary border-primary/40 shadow-lg shadow-primary/10'
                  : 'bg-card/60 border-white/10 text-muted-foreground hover:text-foreground hover:border-white/25'
              }`}
            >
              <span className="text-base">{g.icon}</span>
              {g.name}
            </button>
          ))}
        </div>
      )}

      {activeGame && (
        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
          {activeGame.description}
        </p>
      )}

      {isLoading ? (
        <Card><CardContent className="p-10 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <span className="text-xs">Loading leaderboard...</span>
        </CardContent></Card>
      ) : isError ? (
        <Card className="border-destructive/30">
          <CardContent className="p-10 flex flex-col items-center gap-3 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-semibold">Could not load the leaderboard</p>
            <p className="text-xs text-muted-foreground max-w-sm">{(error as any)?.response?.data?.message || 'Something went wrong. Please try again.'}</p>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()}>
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Retry
            </Button>
          </CardContent>
        </Card>
      ) : entries.length === 0 ? (
        <EmptyState
          title="No ranked players yet"
          description={`No verified players have enough data for ${activeGame?.name || 'this game'} yet. Rankings appear as soon as accounts are connected with real statistics.`}
          icon={Users}
        />
      ) : (
        <>
          {/* Podium */}
          <Podium entries={entries.slice(0, 3)} />

          {/* Full table */}
          <Card className="overflow-hidden border-white/10">
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {entries.map((entry) => {
                  const style = RANK_STYLES[entry.rank];
                  const isMe = board?.myEntry?.userId === entry.userId;
                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-3 px-3 sm:px-4 py-3 ${isMe ? 'bg-primary/10' : ''} ${style?.className ? 'bg-gradient-to-r ' + style.className.split(' ')[0] + ' to-transparent' : ''}`}
                    >
                      <RankBadge rank={entry.rank} />
                      <Link href={`/profile/${entry.username}`} className="flex items-center gap-2.5 min-w-0 flex-1 group">
                        <Avatar className="h-9 w-9 shrink-0 border border-white/10">
                          <AvatarImage src={entry.avatar || ''} />
                          <AvatarFallback className="text-[10px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                            {getInitials(entry.displayName || entry.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                            {entry.displayName || entry.username}
                            {isMe && <Badge className="ml-1.5 text-[8px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">YOU</Badge>}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            @{entry.username}
                            {entry.detail?.playerName && <span className="ml-1.5">• {entry.detail.playerName}</span>}
                            {entry.detail?.totalMatches != null && <span className="ml-1.5">• {entry.detail.totalMatches} matches</span>}
                          </p>
                        </div>
                      </Link>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-extrabold text-primary">{entry.metricValue}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{board?.metricLabel}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {board && board.meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                  <Button variant="ghost" size="sm" className="text-xs" disabled={!board.meta.hasPrev || isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    ← Prev
                  </Button>
                  <span className="text-[11px] text-muted-foreground">
                    Page {board.meta.page} of {board.meta.totalPages} • {board.meta.total} ranked
                  </span>
                  <Button variant="ghost" size="sm" className="text-xs" disabled={!board.meta.hasNext || isFetching} onClick={() => setPage((p) => p + 1)}>
                    Next →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {board?.myEntry && !entries.some((e) => e.userId === board.myEntry!.userId) && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-primary/30 bg-primary/5">
              <RankBadge rank={board.myEntry.rank} />
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Avatar className="h-8 w-8 shrink-0"><AvatarImage src={board.myEntry.avatar || ''} /><AvatarFallback className="text-[10px]">{getInitials(board.myEntry.username)}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{board.myEntry.displayName || board.myEntry.username}</p>
                  <p className="text-[10px] text-muted-foreground truncate">Your rank — #{board.myEntry.rank}</p>
                </div>
              </div>
              <p className="text-xs font-extrabold text-primary shrink-0">{board.myEntry.metricValue}</p>
            </div>
          )}

          {board?.minSampleHint && (
            <p className="text-[10px] text-muted-foreground text-center">
              {board.minSampleHint} — players below the threshold are not ranked.
            </p>
          )}
        </>
      )}
    </div>
  );
}
