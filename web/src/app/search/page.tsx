'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Search, X, Users, Trophy, Gamepad2, Star, Clock,
  TrendingUp, Sparkles, UserPlus, ChevronRight, UserCheck
} from 'lucide-react';
import api from '@/lib/api';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const RECENT_KEY = 'gamerhub-recent-searches';

export default function SearchPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(RECENT_KEY);
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch {}
    }
    // Auto focus search bar
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  // Fetch recommended gamers when history is empty
  const { data: recommendedGamers = [], isLoading: recommendedLoading } = useQuery({
    queryKey: ['search-recommended-gamers'],
    queryFn: async () => {
      const res = await api.get('/profiles/search?q=&limit=6');
      return res.data.data || [];
    },
    enabled: recentSearches.length === 0 && query.trim() === '',
  });

  // Save search term to recent history
  const saveSearchTerm = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter((t) => t !== trimmed)].slice(0, 10);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  // Remove a single term from history
  const removeRecentTerm = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((t) => t !== termToRemove);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  // Clear all recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(RECENT_KEY);
      } catch {}
    }
  };

  // Connect / Friend request mutation
  const connectMutation = useMutation({
    mutationFn: (userId: string) => api.post('/friends/request', { userId }),
    onSuccess: () => {
      toast.success('Connection request sent!');
      queryClient.invalidateQueries({ queryKey: ['search-recommended-gamers'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send connect request');
    },
  });

  // Perform search query
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const [playersRes, teamsRes, tournamentsRes] = await Promise.allSettled([
          api.get(`/profiles/search?q=${encodeURIComponent(query)}&limit=10`),
          api.get(`/teams?q=${encodeURIComponent(query)}`),
          api.get(`/tournaments?q=${encodeURIComponent(query)}`),
        ]);

        const players = playersRes.status === 'fulfilled' ? playersRes.value.data.data || [] : [];
        const teams = teamsRes.status === 'fulfilled' ? teamsRes.value.data.data || [] : [];
        const tournaments = tournamentsRes.status === 'fulfilled' ? tournamentsRes.value.data.data || [] : [];

        let combined: any[] = [];
        if (activeTab === 'all') {
          combined = [
            ...players.map((p: any) => ({ ...p, _type: 'player' })),
            ...teams.map((t: any) => ({ ...t, _type: 'team' })),
            ...tournaments.map((t: any) => ({ ...t, _type: 'tournament' })),
          ];
        } else if (activeTab === 'players') {
          combined = players.map((p: any) => ({ ...p, _type: 'player' }));
        } else if (activeTab === 'teams') {
          combined = teams.map((t: any) => ({ ...t, _type: 'team' }));
        } else if (activeTab === 'tournaments') {
          combined = tournaments.map((t: any) => ({ ...t, _type: 'tournament' }));
        }

        setResults(combined);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [query, activeTab]);

  const handleSelectResult = (path: string, searchWord?: string) => {
    if (searchWord || query) {
      saveSearchTerm(searchWord || query);
    }
    router.push(path);
  };

  const highlightMatch = (text: string, search: string) => {
    if (!search || !text) return text;
    const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="text-primary font-extrabold bg-primary/15 px-0.5 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#05070E] text-white w-full h-full overflow-hidden">
      {/* 1. Header Search Bar */}
      <div className="h-16 border-b border-border/40 flex items-center px-3 sm:px-4 gap-2.5 bg-card/40 shrink-0 backdrop-blur-xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground shrink-0 hover:bg-accent/40"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search players, teams, tournaments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                saveSearchTerm(query);
              }
            }}
            className="h-10 pl-10 pr-10 w-full bg-muted/40 border-0 rounded-full text-sm focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:bg-muted/70"
            variant="ghost"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 p-1 rounded-full bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
              aria-label="Clear query"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Category Tabs (shown when typing or querying) */}
      {query.trim().length > 0 && (
        <div className="px-4 py-2.5 shrink-0 border-b border-border/20 bg-card/20">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val)} className="w-full">
            <TabsList className="bg-muted/20 p-1 rounded-xl flex w-full justify-start gap-1">
              <TabsTrigger value="all" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-primary">
                All
              </TabsTrigger>
              <TabsTrigger value="players" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-primary">
                👤 Players
              </TabsTrigger>
              <TabsTrigger value="teams" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-primary">
                👥 Teams
              </TabsTrigger>
              <TabsTrigger value="tournaments" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-primary">
                🏆 Tournaments
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* 3. Main Viewport Content */}
      <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full space-y-6">
        {/* CASE A: No active query typed */}
        {query.trim().length === 0 && (
          <div className="space-y-6">
            {/* If HISTORY exists -> SHOW ONLY RECENT SEARCHES (No recommendations as requested) */}
            {recentSearches.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    Recent Searches
                  </h3>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs font-bold text-primary hover:underline transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-1">
                  {recentSearches.map((term, idx) => (
                    <div
                      key={idx}
                      onClick={() => setQuery(term)}
                      className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-card/30 hover:bg-muted/30 border border-white/[0.04] cursor-pointer transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Clock className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        <span className="text-sm font-semibold truncate text-foreground">{term}</span>
                      </div>
                      <button
                        onClick={(e) => removeRecentTerm(term, e)}
                        className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        aria-label="Remove search term"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* If HISTORY is EMPTY -> SHOW RECOMMENDED PLAYERS + POPULAR GAMES */
              <div className="space-y-6">
                {/* Popular Games Tags */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                    <Sparkles className="h-4 w-4 text-gaming-pink animate-pulse" />
                    Popular Games & Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Clash of Clans', 'PUBG / BGMI', 'Valorant', 'CS2', 'Apex Legends', 'League of Legends'].map((game) => (
                      <Badge
                        key={game}
                        variant="outline"
                        onClick={() => setQuery(game)}
                        className="px-3.5 py-2 cursor-pointer bg-card/40 hover:bg-primary/20 border-white/10 text-xs font-bold gap-1.5 rounded-2xl transition-all"
                      >
                        <Gamepad2 className="h-3.5 w-3.5 text-primary" />
                        {game}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Suggested Gamers */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Suggested Gamers
                  </h3>

                  {recommendedLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-card/20 rounded-2xl border border-white/5">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recommendedGamers.map((gamer: any) => (
                        <div
                          key={gamer.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-card/30 hover:bg-muted/20 border border-white/[0.04] transition-all"
                        >
                          <div
                            onClick={() => handleSelectResult(`/profile/${gamer.username}`, gamer.username)}
                            className="flex items-center gap-3 min-w-0 cursor-pointer"
                          >
                            <Avatar className="h-10 w-10 border border-border/30">
                              <AvatarImage src={gamer.avatar || ''} />
                              <AvatarFallback className="text-xs font-bold">{getInitials(gamer.username)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate hover:text-primary transition-colors text-foreground">
                                {gamer.displayName || gamer.username}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">@{gamer.username}</p>
                            </div>
                          </div>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => connectMutation.mutate(gamer.userId)}
                            disabled={connectMutation.isPending}
                            className="h-8 text-xs font-bold rounded-xl gap-1 shrink-0 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            Connect
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CASE B: Query is typed & results are loading */}
        {query.trim().length > 0 && loading && (
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 bg-card/25 rounded-2xl border border-white/[0.04]">
                <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CASE C: Query is typed & 0 results returned */}
        {query.trim().length > 0 && !loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center border border-border/20 text-muted-foreground">
              <X className="h-8 w-8" />
            </div>
            <div>
              <p className="text-base font-extrabold text-foreground">No matches found</p>
              <p className="text-xs text-muted-foreground max-w-xs mt-1 leading-relaxed">
                We couldn't find any results matching &quot;{query}&quot;. Try checking spelling or search for a different player or game.
              </p>
            </div>
          </div>
        )}

        {/* CASE D: Query is typed & results returned */}
        {query.trim().length > 0 && !loading && results.length > 0 && (
          <div className="space-y-2.5">
            <AnimatePresence>
              {results.map((item: any, idx: number) => {
                if (item._type === 'player') {
                  const display = item.displayName || item.username;
                  return (
                    <motion.div
                      key={`player-${item.id || idx}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => handleSelectResult(`/profile/${item.username}`, item.username)}
                      className="p-3.5 bg-card/30 border border-white/[0.04] rounded-2xl hover:bg-muted/25 hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Avatar className="h-11 w-11 border border-border/30 shrink-0">
                          <AvatarImage src={item.avatar || ''} />
                          <AvatarFallback className="text-xs font-bold">{getInitials(item.username)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate text-foreground">
                            {highlightMatch(display, query)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">@{highlightMatch(item.username, query)}</p>
                        </div>
                      </div>

                      <Button variant="outline" size="sm" className="h-8 text-xs font-bold rounded-xl gap-1 shrink-0">
                        View Profile
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  );
                } else if (item._type === 'team') {
                  return (
                    <motion.div
                      key={`team-${item.id || idx}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => handleSelectResult(`/teams/${item.id}`, item.name)}
                      className="p-3.5 bg-card/30 border border-white/[0.04] rounded-2xl hover:bg-muted/25 hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Avatar className="h-11 w-11 border border-border/30 shrink-0">
                          <AvatarImage src={item.avatar || ''} />
                          <AvatarFallback className="text-xs font-bold">{getInitials(item.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate text-foreground">{highlightMatch(item.name, query)}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.region || 'Global'} &bull; {item.wins || 0} Wins</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-bold gap-1 rounded-xl bg-primary/10 text-primary border-primary/20">
                        <Users className="h-3.5 w-3.5" />
                        Team
                      </Badge>
                    </motion.div>
                  );
                } else if (item._type === 'tournament') {
                  return (
                    <motion.div
                      key={`tourn-${item.id || idx}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => handleSelectResult(`/tournaments/${item.id}`, item.title)}
                      className="p-3.5 bg-card/30 border border-white/[0.04] rounded-2xl hover:bg-muted/25 hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="h-11 w-11 bg-gaming-purple/10 rounded-2xl flex items-center justify-center border border-gaming-purple/20 shrink-0">
                          <Trophy className="h-5 w-5 text-gaming-purple" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate text-foreground">{highlightMatch(item.title, query)}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.game} &bull; Pool: ${item.prizePool}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-bold gap-1 rounded-xl bg-gaming-purple/10 text-gaming-purple border-gaming-purple/20">
                        <Trophy className="h-3.5 w-3.5" />
                        Tournament
                      </Badge>
                    </motion.div>
                  );
                }
                return null;
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
