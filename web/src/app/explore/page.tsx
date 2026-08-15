'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Gamepad2, Compass, TrendingUp, Users, Trophy, Search, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import { PopularGamesModal } from '@/components/games/PopularGamesModal';
import { motion } from 'framer-motion';

export default function ExplorePage() {
  const { user } = useAuthStore();
  const [isPopularGamesOpen, setIsPopularGamesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user connected accounts
  const { data: userAccounts = [] } = useQuery({
    queryKey: ['user-game-connections'],
    queryFn: async () => {
      const res = await api.get('/game/user-connections');
      return res.data.data || [];
    },
  });

  const { data: trending } = useQuery({
    queryKey: ['trending'],
    queryFn: () => api.get('/posts/trending').then(r => r.data.data).catch(() => []),
  });

  const { data: recommendations } = useQuery({
    queryKey: ['recommendations-explore'],
    queryFn: () => api.get('/ai/recommendations?limit=8').then(r => r.data.data).catch(() => []),
  });

  return (
    <motion.div className="space-y-6 max-w-full overflow-x-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          Explore
        </h1>
      </div>

      {/* Compare Yourself Feature Banner */}
      <Card variant="glass" className="border-primary/40 bg-gradient-to-r from-indigo-950/50 via-purple-950/30 to-black overflow-hidden relative">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Trophy className="h-5 w-5 text-amber-400 shrink-0" />
              <h3 className="font-extrabold text-sm text-white">Compare Yourself</h3>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] px-2 py-0.5">NEW</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Compete with your friends using your real gaming stats.</p>
          </div>
          <Link href="/explore/compare" className="shrink-0">
            <Button variant="gradient" size="sm" className="font-extrabold text-xs rounded-xl gap-1.5 w-full sm:w-auto">
              <Sparkles className="h-3.5 w-3.5" /> Compare Now
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Popular Games Trigger Card */}
      <Card variant="glass" className="border-border/60 bg-gradient-to-br from-card via-background to-muted/20 overflow-hidden">
        <CardContent className="p-6 flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              <h2 className="font-extrabold text-lg text-foreground">Popular Games Catalog</h2>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">Curated</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Browse official game integrations including Clash of Clans, PUBG PC, Valorant, Fortnite, and more.
            </p>
          </div>
          <Button
            onClick={() => setIsPopularGamesOpen(true)}
            className="bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-600 text-primary-foreground font-extrabold rounded-2xl h-10 px-5 gap-2 shadow-lg"
          >
            <Gamepad2 className="h-4 w-4" /> Explore Popular Games
          </Button>
        </CardContent>
      </Card>

      {/* Trending Topics & Recommended Players */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card variant="glass">
          <CardHeader className="pb-2">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              Trending Topics
            </h2>
          </CardHeader>
          <CardContent className="space-y-1">
            {trending?.slice(0, 6).map((h: any, i: number) => (
              <Link key={i} href={`/feed?hashtag=${h.name}`}>
                <motion.div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-all" whileHover={{ x: 2 }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold w-5 text-right">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <span className="text-sm font-medium">#{h.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{h.count} posts</Badge>
                </motion.div>
              </Link>
            ))}
            {(!trending || trending.length === 0) ? (
              [
                { name: 'ValorantChampions', count: '14.2K' },
                { name: 'PUBGMobileGlobal', count: '9.8K' },
                { name: 'CS2Major2026', count: '8.4K' },
                { name: 'GTA6Trailer2', count: '7.1K' },
                { name: 'LeagueOfLegendsWorlds', count: '6.3K' },
                { name: 'RTX5090MonsterBuild', count: '5.2K' },
              ].map((h, i) => (
                <Link key={i} href={`/feed?hashtag=${h.name}`}>
                  <motion.div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 transition-all cursor-pointer" whileHover={{ x: 3 }}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold w-5 text-right">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </span>
                      <span className="text-xs font-bold text-foreground hover:text-emerald-400 transition-colors">#{h.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{h.count} posts</Badge>
                  </motion.div>
                </Link>
              ))
            ) : null}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="pb-2">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-emerald-400" />
              Recommended Players
            </h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {(recommendations && recommendations.length > 0 ? recommendations : [
              { id: '1', username: 'Gamer_9854', displayName: 'ViperX', rank: 'DIAMOND', matchScore: 94 },
              { id: '2', username: 'Gamer_9179', displayName: 'ApexSniper', rank: 'MASTER', matchScore: 91 },
              { id: '3', username: 'Gamer_4139', displayName: 'ShadowBlade', rank: 'PLATINUM', matchScore: 88 },
              { id: '4', username: 'Gamer_1214', displayName: 'CyberGhost', rank: 'CHALLENGER', matchScore: 85 },
            ]).map((rec: any) => (
              <div key={rec.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 transition-all">
                <Link href={`/profile/${rec.username}`} className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9 border border-emerald-500/30 shadow-md">
                    <AvatarImage src={rec.avatar || ''} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold">{getInitials(rec.displayName || rec.username)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate hover:text-emerald-400 transition-colors">{rec.displayName || rec.username}</p>
                    <p className="text-[10px] text-emerald-400 font-mono font-semibold uppercase">{rec.rank || 'PRO GAMER'}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border-emerald-500/40 px-2 py-0.5">
                    {Math.round(rec.matchScore || 85)}% match
                  </Badge>
                  <Button variant="outline" size="sm" className="h-7 px-2.5 text-[10px] font-bold rounded-xl border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20">
                    Follow
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Popular Games Modal */}
      <PopularGamesModal
        isOpen={isPopularGamesOpen}
        onClose={() => setIsPopularGamesOpen(false)}
        userConnections={userAccounts}
      />
    </motion.div>
  );
}
