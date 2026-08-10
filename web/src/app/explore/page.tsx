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
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <h3 className="font-extrabold text-sm text-white">Compare Yourself</h3>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] px-2 py-0.5">NEW</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Compete with your friends using your real gaming stats.</p>
          </div>
          <Link href="/explore/compare">
            <Button variant="gradient" size="sm" className="font-extrabold text-xs rounded-xl gap-1.5 shrink-0">
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
            {(!trending || trending.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No trending topics yet</p>
            )}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="pb-2">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              Recommended Players
            </h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendations?.slice(0, 5).map((rec: any) => (
              <div key={rec.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/30 transition-all">
                <Link href={`/profile/${rec.username}`} className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={rec.avatar || ''} />
                    <AvatarFallback className="text-xs">{getInitials(rec.username)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-semibold">{rec.displayName || rec.username}</p>
                    <p className="text-[10px] text-muted-foreground">{rec.rank || 'Gamer'}</p>
                  </div>
                </Link>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  {Math.round(rec.matchScore || 80)}% match
                </Badge>
              </div>
            ))}
            {(!recommendations || recommendations.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No recommendations available</p>
            )}
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
