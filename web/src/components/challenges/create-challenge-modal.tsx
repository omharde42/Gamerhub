'use client';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { PremiumModal } from '@/components/ui/premium-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Swords, Users, User, X, Loader2, Send, Clock, Calendar, Search, ShieldAlert, Gamepad2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import { normalizeGameKey, CHALLENGE_GAME_META, type ChallengeGameKey } from './challenge-utils';
import Link from 'next/link';

export interface OpponentInfo {
  id: string;
  username: string;
  displayName?: string | null;
  avatar?: string | null;
}

interface TeamMember {
  username: string;
  displayName?: string | null;
  avatar?: string | null;
}

const EXPIRY_OPTIONS = [
  { label: '1 hour', hours: 1 },
  { label: '6 hours', hours: 6 },
  { label: '12 hours', hours: 12 },
  { label: '24 hours', hours: 24 },
  { label: '48 hours', hours: 48 },
  { label: '72 hours', hours: 72 },
];

const MAX_TEAM_SIZE = 5;

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CreateChallengeModal({
  open,
  onClose,
  opponent,
}: {
  open: boolean;
  onClose: () => void;
  opponent: OpponentInfo;
}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // ── Connected games (opponent + me) ─────────────────────────────
  const { data: opponentAccounts = [] } = useQuery({
    queryKey: ['user-game-connections', opponent.id],
    queryFn: () => api.get(`/game/user-connections?userId=${opponent.id}`).then((r) => r.data.data || []),
    enabled: open && !!opponent.id,
  });
  const { data: myAccounts = [] } = useQuery({
    queryKey: ['user-game-connections', user?.id],
    queryFn: () => api.get('/game/user-connections').then((r) => r.data.data || []),
    enabled: open && !!user?.id,
  });
  const { data: myTeams = [] } = useQuery({
    queryKey: ['my-teams'],
    queryFn: () => api.get('/teams/mine').then((r) => r.data.data || []),
    enabled: open,
  });
  const { data: gameModes = [] } = useQuery({
    queryKey: ['challenge-game-modes'],
    queryFn: () => api.get('/challenges/game-modes').then((r) => r.data.data || []),
  });

  const opponentGames = useMemo(() => {
    const set = new Set<ChallengeGameKey>();
    (opponentAccounts as any[]).forEach((acc) => {
      const key = normalizeGameKey(acc.game || '');
      if (key) set.add(key);
    });
    return [...set];
  }, [opponentAccounts]);

  const myGameKeys = useMemo(() => {
    const set = new Set<ChallengeGameKey>();
    (myAccounts as any[]).forEach((acc) => {
      const key = normalizeGameKey(acc.game || '');
      if (key) set.add(key);
    });
    return set;
  }, [myAccounts]);

  // ── Form state ───────────────────────────────────────────────────
  const [game, setGame] = useState<ChallengeGameKey>('clashofclans');
  const [challengeType, setChallengeType] = useState<'ONE_VS_ONE' | 'TEAM_VS_TEAM'>('ONE_VS_ONE');
  const [gameMode, setGameMode] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [expiryHours, setExpiryHours] = useState(24);
  const [message, setMessage] = useState('');
  const [myTeam, setMyTeam] = useState<TeamMember[]>([]);
  const [oppTeam, setOppTeam] = useState<TeamMember[]>([]);

  // Reset form when opened / opponent changes
  useEffect(() => {
    if (open) {
      const preferred = opponentGames.find((g) => myGameKeys.has(g)) || opponentGames[0] || 'clashofclans';
      setGame(preferred);
      setChallengeType('ONE_VS_ONE');
      setGameMode('');
      setMessage('');
      setMyTeam([]);
      setOppTeam([]);
      setExpiryHours(24);
      const defaultTime = new Date(Date.now() + 60 * 60 * 1000);
      setScheduledAt(toLocalInputValue(defaultTime));
    }
  }, [open, opponent.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // If the games list loads after the modal opens, snap to a valid default game.
  useEffect(() => {
    if (open && opponentGames.length > 0 && !opponentGames.includes(game)) {
      setGame(opponentGames.find((g) => myGameKeys.has(g)) || opponentGames[0]);
    }
  }, [open, opponentGames, myGameKeys, game]);

  const modesForGame = useMemo(() => {
    const g = gameModes.find((m: any) => m.game === game);
    return g?.modes || [];
  }, [gameModes, game]);
  useEffect(() => {
    if (modesForGame.length && !modesForGame.includes(gameMode)) {
      setGameMode(modesForGame[0]);
    }
  }, [modesForGame, gameMode]);

  // ── Username search (per team) ────────────────────────────────────
  const [searchFor, setSearchFor] = useState<'mine' | 'opp' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!searchFor) {
      setSearchResults([]);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/profiles/search?q=${encodeURIComponent(searchQuery.trim())}&limit=6`);
        setSearchResults(res.data.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery, searchFor]);

  const addMember = (side: 'mine' | 'opp', username: string, displayName?: string | null, avatar?: string | null) => {
    const list = side === 'mine' ? myTeam : oppTeam;
    if (list.length >= MAX_TEAM_SIZE) {
      toast.error(`Maximum ${MAX_TEAM_SIZE} members per team`);
      return;
    }
    if (list.some((m) => m.username.toLowerCase() === username.toLowerCase())) return;
    const updater = side === 'mine' ? setMyTeam : setOppTeam;
    updater((prev) => [...prev, { username, displayName, avatar }]);
  };

  const removeMember = (side: 'mine' | 'opp', username: string) => {
    const updater = side === 'mine' ? setMyTeam : setOppTeam;
    updater((prev) => prev.filter((m) => m.username.toLowerCase() !== username.toLowerCase()));
  };

  const addTeamToMySide = (team: any) => {
    const usernames = (team.members || [])
      .map((m: any) => m.user?.profile?.username)
      .filter((u: string | undefined): u is string => !!u && u !== user?.profile?.username);
    usernames.forEach((u: string) => addMember('mine', u));
    toast.success(`Added ${usernames.length} teammate${usernames.length === 1 ? '' : 's'} from ${team.name || 'team'}`);
  };

  // ── Submit ────────────────────────────────────────────────────────
  const createChallenge = useMutation({
    mutationFn: () => {
      const scheduled = new Date(scheduledAt).toISOString();
      const base = new Date(Math.max(Date.now(), new Date(scheduledAt).getTime()));
      const expires = new Date(base.getTime() + expiryHours * 60 * 60 * 1000).toISOString();
      return api.post('/challenges', {
        opponentId: opponent.id,
        game,
        challengeType,
        gameMode,
        message: message.trim() || undefined,
        scheduledAt: scheduled,
        expiresAt: expires,
        ...(challengeType === 'TEAM_VS_TEAM'
          ? {
              challengerTeam: myTeam.map((m) => m.username),
              opponentTeam: oppTeam.map((m) => m.username),
            }
          : {}),
      }).then((r) => r.data.data);
    },
    onSuccess: () => {
      toast.success('⚔️ Challenge sent!');
      onClose();
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenge-counts'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send challenge');
    },
  });

  const canSubmit = game && gameMode && scheduledAt && !createChallenge.isPending;
  const hasGameConnected = game ? myGameKeys.has(game) : false;
  const meta = CHALLENGE_GAME_META[game];

  const renderMemberChips = (side: 'mine' | 'opp', members: TeamMember[]) => (
    <div className="flex flex-wrap gap-1.5">
      {members.map((m) => (
        <motion.span
          key={m.username}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2 py-1 text-[11px] font-semibold"
        >
          <span className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[8px] text-white flex items-center justify-center">
            {getInitials(m.displayName || m.username)}
          </span>
          @{m.username}
          <button onClick={() => removeMember(side, m.username)} className="text-muted-foreground hover:text-destructive transition-colors">
            <X className="h-3 w-3" />
          </button>
        </motion.span>
      ))}
      {members.length === 0 && <span className="text-[11px] text-muted-foreground">No extra members — captain only</span>}
    </div>
  );

  const renderTeamPicker = (side: 'mine' | 'opp') => {
    const members = side === 'mine' ? myTeam : oppTeam;
    const isMine = side === 'mine';
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold flex items-center gap-1.5">
            {isMine ? <Users className="h-3.5 w-3.5 text-indigo-400" /> : <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />}
            {isMine ? 'Your Team' : `${opponent.displayName || opponent.username}'s Team`}
            <span className="text-[10px] text-muted-foreground font-normal">({members.length}/{MAX_TEAM_SIZE})</span>
          </p>
          {isMine && (
            <Select
              value=""
              onValueChange={(teamId) => {
                const team = (myTeams as any[]).find((t) => t.id === teamId);
                if (team) addTeamToMySide(team);
              }}
            >
              <SelectTrigger className="h-7 w-auto gap-1 text-[10px] rounded-lg px-2 border-white/10">
                <Gamepad2 className="h-3 w-3" /> My Teams
              </SelectTrigger>
              <SelectContent>
                {(myTeams as any[]).length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No teams yet</div>}
                {(myTeams as any[]).map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Username search */}
        <div>
          <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-2.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              value={searchFor === side ? searchQuery : ''}
              onChange={(e) => {
                setSearchFor(side);
                setSearchQuery(e.target.value);
              }}
              onFocus={() => setSearchFor(side)}
              placeholder={`Search gamers to add to the ${isMine ? 'challenger' : 'opponent'} team...`}
              className="h-8 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
            {searching && <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />}
          </div>
          <AnimatePresence>
            {searchFor === side && searchQuery.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-[#0B1220] shadow-xl"
              >
                {searchResults.length === 0 && !searching && (
                  <div className="px-3 py-2 text-[11px] text-muted-foreground">No gamers found</div>
                )}
                {searchResults.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      addMember(side, p.username, p.displayName, p.avatar);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-white/5 text-left transition-colors"
                  >
                    <Avatar className="h-6 w-6 border border-white/10">
                      <AvatarImage src={p.avatar || ''} />
                      <AvatarFallback className="text-[9px]">{getInitials(p.username)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold truncate">{p.displayName || p.username}</span>
                    <span className="text-[10px] text-muted-foreground truncate">@{p.username}</span>
                    <User className="h-3 w-3 text-primary ml-auto shrink-0" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {renderMemberChips(side, members)}
      </div>
    );
  };

  return (
    <PremiumModal open={open} onClose={onClose} variant="bottom" size="md" title="Create Challenge" swipeToClose={false}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#FF3D71] flex items-center justify-center shadow-lg shadow-[#7C3AED]/30">
            <Swords className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight">Create Challenge</h2>
            <p className="text-xs text-muted-foreground">
              Challenge <span className="text-primary font-semibold">@{opponent.username}</span> — no friendship needed
            </p>
          </div>
        </div>

        {/* Game */}
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Game</Label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            {opponentGames.map((g) => {
              const m = CHALLENGE_GAME_META[g];
              const active = game === g;
              return (
                <button
                  key={g}
                  onClick={() => setGame(g)}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all duration-200 ${
                    active
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary/40'
                      : 'border-white/10 bg-black/30 hover:border-white/25'
                  }`}
                >
                  <span className="text-xl">{m.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{m.name}</p>
                    {!myGameKeys.has(g) && <p className="text-[9px] text-amber-400/90">Not connected by you</p>}
                  </div>
                </button>
              );
            })}
          </div>
          {!hasGameConnected && (
            <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3 text-amber-400" />
              You haven't connected this game yet.
              <Link href="/connections" className="text-primary hover:underline font-semibold">Connect now</Link>
            </p>
          )}
        </div>

        {/* Type */}
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Challenge Type</Label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            {([
              { value: 'ONE_VS_ONE', label: '1v1 Duel', icon: User, desc: 'Head-to-head' },
              { value: 'TEAM_VS_TEAM', label: 'Team vs Team', icon: Users, desc: 'Squads battle' },
            ] as const).map((opt) => {
              const active = challengeType === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setChallengeType(opt.value)}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all duration-200 ${
                    active
                      ? 'border-[#7C3AED] bg-[#7C3AED]/10 shadow-lg shadow-[#7C3AED]/10 ring-1 ring-[#7C3AED]/40'
                      : 'border-white/10 bg-black/30 hover:border-white/25'
                  }`}
                >
                  <opt.icon className={`h-4 w-4 ${active ? 'text-[#7C3AED]' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[9px] text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Game Mode */}
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Game Mode</Label>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {modesForGame.map((m: string) => (
              <button
                key={m}
                onClick={() => setGameMode(m)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all duration-200 ${
                  gameMode === m
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/25'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Team pickers */}
        <AnimatePresence>
          {challengeType === 'TEAM_VS_TEAM' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              {renderTeamPicker('mine')}
              {renderTeamPicker('opp')}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Date & Time */}
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Date & Time</Label>
          <div className="flex items-center gap-2 mt-1.5">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <Input
              type="datetime-local"
              value={scheduledAt}
              min={toLocalInputValue(new Date())}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="bg-black/30 border-white/10 text-xs"
            />
          </div>
        </div>

        {/* Expiry */}
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Challenge Expiry</Label>
          <div className="flex items-center gap-2 mt-1.5">
            <Clock className="h-4 w-4 text-amber-400 shrink-0" />
            <Select value={String(expiryHours)} onValueChange={(v) => setExpiryHours(parseInt(v, 10))}>
              <SelectTrigger className="bg-black/30 border-white/10 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.hours} value={String(opt.hours)}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Message */}
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
            Message <span className="normal-case font-normal">(optional)</span>
          </Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Set the stakes... winner takes bragging rights!"
            maxLength={500}
            className="mt-1.5 bg-black/30 border-white/10 text-xs min-h-[70px] resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11" disabled={createChallenge.isPending}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            animate
            onClick={() => createChallenge.mutate()}
            disabled={!canSubmit}
            className="flex-1 h-11 gap-2 font-bold"
          >
            {createChallenge.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Challenge
          </Button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground">
          <Badge variant="outline" className="text-[9px] gap-1 mr-1">
            <Swords className="h-2.5 w-2.5 text-emerald-400" />
            No friendship required
          </Badge>
          Challenges expire automatically & abusive users can be blocked or reported.
        </p>
      </div>
    </PremiumModal>
  );
}
