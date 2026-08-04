'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft, Search, X, Users, Trophy, Gamepad2, Globe, Star, Loader2, Sparkles, TrendingUp, Clock
} from 'lucide-react';
import api from '@/lib/api';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const RECENT_KEY = 'gamerhub-recent-searches';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('players');
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
    // Auto focus the search bar and open keyboard
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  // Save query to recent searches
  const saveSearchTerm = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches(prev => {
      const updated = [trimmed, ...prev.filter(t => t !== trimmed)].slice(0, 5);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(RECENT_KEY);
      } catch {}
    }
  };

  // Debounced API Search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        // Fetch depending on active tab
        if (activeTab === 'players') {
          const { data } = await api.get(`/profiles/search?q=${encodeURIComponent(query)}&limit=15`);
          setResults(data.data || []);
        } else if (activeTab === 'teams') {
          const { data } = await api.get(`/teams?q=${encodeURIComponent(query)}`);
          setResults(data.data || []);
        } else if (activeTab === 'tournaments') {
          const { data } = await api.get(`/tournaments?q=${encodeURIComponent(query)}`);
          setResults(data.data || []);
        } else {
          // Fallback empty search categories
          setResults([]);
        }
        saveSearchTerm(query);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [query, activeTab]);

  const highlightMatch = (text: string, search: string) => {
    if (!search || !text) return text;
    const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <span key={i} className="text-primary font-extrabold bg-primary/10 px-0.5 rounded">{part}</span>
        : part
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#05070E] text-white overflow-hidden pb-10">
      {/* Search Header Wrapper */}
      <div className="h-16 border-b border-border/40 flex items-center px-3 sm:px-4 gap-2 bg-card/10 shrink-0 sticky top-0 z-50 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-11 w-11 rounded-full text-muted-foreground hover:text-foreground shrink-0 flex items-center justify-center hover:bg-accent/40"
          aria-label="Back"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        {/* Full width rounded search bar */}
        <div className="flex-1 relative flex items-center">
          <Search className="absolute left-3.5 h-4.5 w-4.5 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search players, teams, tournaments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 pl-10 pr-10 w-full bg-muted/40 border-0 rounded-full text-sm focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:bg-muted/65"
            variant="ghost"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 p-1 rounded-full bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs and Categories switcher */}
      <div className="px-4 py-3 shrink-0 border-b border-border/20 bg-card/5">
        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setResults([]); }} className="w-full">
          <TabsList className="bg-muted/20 p-1 rounded-xl flex w-full overflow-x-auto whitespace-nowrap scrollbar-none justify-start gap-1">
            <TabsTrigger value="players" className="flex-1 rounded-lg text-xs font-semibold data-[state=active]:bg-primary">
              👤 Players
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex-1 rounded-lg text-xs font-semibold data-[state=active]:bg-primary">
              👥 Teams
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="flex-1 rounded-lg text-xs font-semibold data-[state=active]:bg-primary">
              🏆 Tournaments
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Scrollable Results Content */}
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        {loading ? (
          // Skeletons list
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-card/25 rounded-xl border border-white/[0.03]">
                <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : query.trim().length === 0 ? (
          // Recent searches and recommendations
          <div className="space-y-6 pt-2">
            {recentSearches.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Recent Searches
                  </h3>
                  <button onClick={clearRecentSearches} className="text-[11px] font-semibold text-primary hover:underline">
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((term, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      onClick={() => setQuery(term)}
                      className="px-3 py-1 cursor-pointer bg-muted/40 hover:bg-muted border border-border/10 text-xs gap-1 rounded-full"
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-gaming-pink animate-pulse" /> Trending Gamers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {['AceStriker', 'ProGamerX', 'ShadowBlade', 'Valkyrie_Ranked'].map((name, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(name)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card/30 hover:bg-accent/40 border border-white/[0.03] text-left transition-all"
                  >
                    <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]">{getInitials(name)}</AvatarFallback></Avatar>
                    <span className="text-xs font-semibold">@{name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : results.length === 0 ? (
          // No matches state
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-muted/10 flex items-center justify-center border border-border/10 text-muted-foreground">
              <X className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">No matches found</p>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                We couldn't find any {activeTab} matching &quot;{query}&quot;. Check spelling or try a different term.
              </p>
            </div>
          </div>
        ) : (
          // Match results list
          <div className="space-y-2.5">
            <AnimatePresence>
              {results.map((item: any, idx: number) => {
                if (activeTab === 'players') {
                  const display = item.displayName || item.username;
                  return (
                    <motion.div
                      key={item.id || idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="p-3 bg-card/25 border border-white/[0.03] rounded-xl hover:bg-accent/40 hover:border-primary/20 transition-all cursor-pointer flex items-center justify-between"
                      onClick={() => router.push(`/profile/${item.username}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 border border-border/30">
                          <AvatarImage src={item.avatar || ''} />
                          <AvatarFallback className="text-xs">{getInitials(item.username)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">
                            {highlightMatch(display, query)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">@{highlightMatch(item.username, query)}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 gap-1 bg-muted/20">
                        <Star className="h-3 w-3 text-primary shrink-0" />
                        Gamer
                      </Badge>
                    </motion.div>
                  );
                } else if (activeTab === 'teams') {
                  return (
                    <motion.div
                      key={item.id || idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="p-3 bg-card/25 border border-white/[0.03] rounded-xl hover:bg-accent/40 hover:border-primary/20 transition-all cursor-pointer flex items-center justify-between"
                      onClick={() => router.push(`/teams/${item.id}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 border border-border/30">
                          <AvatarImage src={item.avatar || ''} />
                          <AvatarFallback className="text-xs font-bold">{getInitials(item.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">
                            {highlightMatch(item.name, query)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{item.region || 'Global'} &bull; {item.wins} Wins</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 gap-1 bg-muted/20">
                        <Trophy className="h-3 w-3 text-yellow-500 shrink-0" />
                        Team
                      </Badge>
                    </motion.div>
                  );
                } else if (activeTab === 'tournaments') {
                  return (
                    <motion.div
                      key={item.id || idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="p-3 bg-card/25 border border-white/[0.03] rounded-xl hover:bg-accent/40 hover:border-primary/20 transition-all cursor-pointer flex items-center justify-between"
                      onClick={() => router.push(`/tournaments/${item.id}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shrink-0">
                          <Gamepad2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">
                            {highlightMatch(item.title, query)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{item.game} &bull; Pool: ${item.prizePool}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 gap-1 bg-muted/20">
                        <Trophy className="h-3 w-3 text-gaming-pink shrink-0" />
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
