'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Swords, Check, X, Ban, Flag, Users, User, Clock, Calendar, Trophy, Loader2, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { formatDate, getInitials } from '@/lib/utils';
import type { Challenge } from '@/types';
import { gameIcon, gameLabel } from './challenge-utils';
import Link from 'next/link';

const RESULT_LABELS: Record<string, string> = {
  CHALLENGER_WIN: 'Challenger wins',
  OPPONENT_WIN: 'Opponent wins',
  DRAW: 'Draw',
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  ACCEPTED: { label: 'Accepted', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  DECLINED: { label: 'Declined', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  CANCELLED: { label: 'Cancelled', className: 'bg-white/5 text-muted-foreground border-white/10' },
  EXPIRED: { label: 'Expired', className: 'bg-white/5 text-muted-foreground border-white/10' },
  COMPLETED: { label: 'Completed', className: 'bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/30' },
};

function OtherParty({ challenge, currentUserId }: { challenge: Challenge; currentUserId: string }) {
  const isIncoming = challenge.opponent.id === currentUserId;
  const other = isIncoming ? challenge.challenger : challenge.opponent;
  const otherProfile = other?.profile;
  const otherHref = otherProfile?.username ? `/profile/${otherProfile.username}` : null;
  const content = (
    <>
      <Avatar className="h-9 w-9 border border-white/15">
        <AvatarImage src={otherProfile?.avatar || ''} />
        <AvatarFallback className="text-[10px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          {getInitials(otherProfile?.username || 'G')}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">
          {otherProfile?.displayName || otherProfile?.username}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">@{otherProfile?.username}</p>
      </div>
    </>
  );
  if (!otherHref) {
    return <div className="flex items-center gap-2.5 min-w-0">{content}</div>;
  }
  return (
    <Link href={otherHref} className="flex items-center gap-2.5 min-w-0 group">
      {content}
    </Link>
  );
}

function TeamRoster({ challenge }: { challenge: Challenge }) {
  const teams = challenge.teams || [];
  if (teams.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      {teams.map((team) => (
        <div key={team.id} className="rounded-xl border border-white/10 bg-black/30 p-2.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 truncate">
            {team.name || (team.teamRole === 'CHALLENGER' ? 'Challenger Team' : 'Opponent Team')}
          </p>
          <div className="space-y-1">
            {[team.captain, ...(team.members || []).map((m) => m.user)].map((u, i) => {
              const p = u?.profile;
              return (
                <div key={i} className="flex items-center gap-1.5 min-w-0">
                  <Avatar className="h-4.5 w-4.5 h-[18px] w-[18px] border border-white/10">
                    <AvatarImage src={p?.avatar || ''} />
                    <AvatarFallback className="text-[7px]">{getInitials(p?.username || '?')}</AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] truncate font-medium">
                    @{p?.username}
                    {i === 0 && <span className="text-amber-400 ml-0.5">👑</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChallengeCard({
  challenge,
  currentUserId,
  onChanged,
  index = 0,
}: {
  challenge: Challenge;
  currentUserId: string;
  onChanged: () => void;
  index?: number;
}) {
  const queryClient = useQueryClient();
  const isIncoming = challenge.opponent.id === currentUserId;
  const isCaptain = challenge.challenger.id === currentUserId || challenge.opponent.id === currentUserId;
  const other = isIncoming ? challenge.challenger : challenge.opponent;
  const statusStyle = STATUS_STYLES[challenge.status] || STATUS_STYLES.PENDING;

  const [showResult, setShowResult] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('HARASSMENT');
  const [reportNote, setReportNote] = useState('');

  const after = () => {
    onChanged();
    queryClient.invalidateQueries({ queryKey: ['challenge-counts'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const action = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: any }) =>
      api.post(`/challenges/${challenge.id}/${path}`, body).then((r) => r.data.data),
    onSuccess: (_data, vars) => {
      toast.success(`Challenge ${vars.path === 'accept' ? 'accepted' : vars.path === 'decline' ? 'declined' : vars.path === 'cancel' ? 'cancelled' : vars.path === 'complete' ? 'completed' : 'updated'}`);
      after();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Action failed'),
  });

  const block = useMutation({
    mutationFn: () => api.post('/challenges/block', { targetId: other.id }),
    onSuccess: () => { toast.success(`${other?.profile?.username || 'User'} blocked`); after(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to block'),
  });

  const report = useMutation({
    mutationFn: () => api.post(`/challenges/${challenge.id}/report`, { targetId: other.id, reason: reportReason, description: reportNote }),
    onSuccess: () => { toast.success('Report submitted — thanks for keeping GamerZ Hub safe'); setReportOpen(false); setReportNote(''); after(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to report'),
  });

  const winnerPayload = (who: 'me' | 'them' | 'draw') => {
    if (who === 'draw') return 'draw';
    const meIsChallenger = challenge.challenger.id === currentUserId;
    if (who === 'me') return meIsChallenger ? 'challenger' : 'opponent';
    return meIsChallenger ? 'opponent' : 'challenger';
  };

  const TypeIcon = challenge.challengeType === 'TEAM_VS_TEAM' ? Users : User;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="bg-[#111827] border-white/10 hover:border-[#7C3AED]/40 transition-all duration-200">
        <CardContent className="p-4 space-y-3">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#FF3D71] flex items-center justify-center shrink-0 shadow-lg shadow-[#7C3AED]/20">
                <span className="text-lg">{gameIcon(challenge.game)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{gameLabel(challenge.game)}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <TypeIcon className="h-3 w-3" />
                  {challenge.challengeType === 'TEAM_VS_TEAM' ? 'Team vs Team' : '1v1'} • {challenge.gameMode}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge className={`text-[10px] font-bold border ${statusStyle.className}`}>{statusStyle.label}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 glass-strong">
                  <DropdownMenuItem disabled>
                    <Swords className="h-4 w-4 mr-2" /> Challenge #{challenge.id.slice(0, 8)}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setReportOpen((v) => !v)}>
                    <Flag className="h-4 w-4 mr-2" /> Report {other?.profile?.username}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => block.mutate()} disabled={block.isPending}>
                    <Ban className="h-4 w-4 mr-2" /> Block {other?.profile?.username}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Report panel */}
          {reportOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden rounded-xl border border-red-500/20 bg-red-500/5 p-3 space-y-2"
            >
              <p className="text-[11px] font-bold text-red-400">Report {other?.profile?.username}</p>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full h-8 rounded-lg bg-black/40 border border-white/10 text-xs px-2 outline-none"
              >
                {['HARASSMENT', 'SPAM', 'CHEATING', 'TOXIC_BEHAVIOR', 'INAPPROPRIATE_CONTENT', 'IMPERSONATION', 'OTHER'].map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <input
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                placeholder="Add details (optional)"
                maxLength={1000}
                className="w-full h-8 rounded-lg bg-black/40 border border-white/10 text-xs px-2 outline-none placeholder:text-muted-foreground"
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setReportOpen(false)}>Cancel</Button>
                <Button variant="destructive" size="sm" className="h-7 text-[10px] gap-1" onClick={() => report.mutate()} disabled={report.isPending}>
                  {report.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Flag className="h-3 w-3" />} Submit Report
                </Button>
              </div>
            </motion.div>
          )}

          {/* Party */}
          <div className="flex items-center justify-between gap-3">
            <OtherParty challenge={challenge} currentUserId={currentUserId} />
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                <Calendar className="h-3 w-3" /> {formatDate(challenge.scheduledAt)}
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                <Clock className="h-3 w-3" /> Expires {formatDate(challenge.expiresAt)}
              </p>
              {challenge.result && (
                <p className="text-[10px] text-[#A78BFA] font-bold uppercase mt-0.5">{RESULT_LABELS[challenge.result] || challenge.result.replace(/_/g, ' ')}</p>
              )}
            </div>
          </div>

          {challenge.message && (
            <p className="text-[11px] text-muted-foreground italic border-l-2 border-[#7C3AED]/40 pl-2">“{challenge.message}”</p>
          )}

          {challenge.challengeType === 'TEAM_VS_TEAM' && <TeamRoster challenge={challenge} />}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {challenge.status === 'PENDING' && isIncoming && (
              <>
                <Button variant="default" size="sm" className="h-8 gap-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500" onClick={() => action.mutate({ path: 'accept' })} disabled={action.isPending}>
                  <Check className="h-3.5 w-3.5" /> Accept
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[11px] border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => action.mutate({ path: 'decline' })} disabled={action.isPending}>
                  <X className="h-3.5 w-3.5" /> Decline
                </Button>
              </>
            )}
            {challenge.status === 'PENDING' && !isIncoming && isCaptain && (
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[11px]" onClick={() => action.mutate({ path: 'cancel' })} disabled={action.isPending}>
                <Ban className="h-3.5 w-3.5" /> Cancel Challenge
              </Button>
            )}
            {challenge.status === 'ACCEPTED' && isCaptain && !showResult && (
              <Button variant="gradient" size="sm" animate className="h-8 gap-1.5 text-[11px]" onClick={() => setShowResult(true)}>
                <Trophy className="h-3.5 w-3.5" /> Mark Completed
              </Button>
            )}
            {showResult && (
              <div className="flex flex-wrap items-center gap-1.5 w-full">
                <span className="text-[10px] text-muted-foreground font-semibold mr-1">Who won?</span>
                <Button size="sm" className="h-7 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-500" onClick={() => action.mutate({ path: 'complete', body: { winner: winnerPayload('me') } })}>
                  <Trophy className="h-3 w-3" /> I won
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => action.mutate({ path: 'complete', body: { winner: 'draw' } })}>
                  🤝 Draw
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => action.mutate({ path: 'complete', body: { winner: winnerPayload('them') } })}>
                  They won
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setShowResult(false)}>Cancel</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
