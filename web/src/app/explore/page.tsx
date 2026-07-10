'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gamepad2, Compass, TrendingUp, Users, Trophy, Zap, Search, Loader2, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import { GAMES } from '@/lib/constants';
import { motion } from 'framer-motion';

export default function ExplorePage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: trending } = useQuery({
    queryKey: ['trending'],
    queryFn: () => api.get('/posts/trending').then(r => r.data.data).catch(() => []),
  });

  const { data: recommendations } = useQuery({
    queryKey: ['recommendations-explore'],
    queryFn: () => api.get('/ai/recommendations?limit=8').then(r => r.data.data).catch(() => []),
  });

  const popularGames = GAMES.slice(0, 12);
  const filteredGames = searchQuery
    ? GAMES.filter(g => g.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 12)
    : popularGames;

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          Explore
        </h1>
        <p className="text-xs text-muted-foreground">Discover games, players, and trending content</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 h-10 bg-muted/30 border-border/50"
          placeholder="Search games..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="neon"
        />
      </div>

      <Card variant="glass">
        <CardHeader className="pb-2">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <Gamepad2 className="h-4 w-4 text-primary" />
            Popular Games
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filteredGames.map((game, i) => (
              <motion.div
                key={game}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -2 }}
              >
                <Card variant="glass" className="cursor-pointer border-border/50 hover:border-primary/30">
                  <CardContent className="p-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Gamepad2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-medium truncate">{game}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

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
            {recommendations?.slice(0, 5).map((rec: any, i: number) => (
              <Link key={i} href={`/profile/${rec.username}`}>
                <motion.div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-all" whileHover={{ x: 2 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Avatar className="h-8 w-8" ring>
                    <AvatarImage src={rec.avatar || ''} />
                    <AvatarFallback className="text-[10px]">{getInitials(rec.username)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{rec.username}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{rec.rank || 'Unranked'} &bull; {rec.role || 'Flex'}</p>
                  </div>
                  <Badge variant="success" className="text-[10px]">{rec.compatibility}%</Badge>
                </motion.div>
              </Link>
            ))}
            {(!recommendations || recommendations.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">Complete your profile for recommendations</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/tournaments', icon: Trophy, title: 'Tournaments', desc: 'Compete & win', color: 'text-gaming-purple' },
          { href: '/teams', icon: Users, title: 'Teams', desc: 'Find your squad', color: 'text-gaming-cyan' },
          { href: '/jobs', icon: Zap, title: 'Jobs', desc: 'Pro opportunities', color: 'text-gaming-pink' },
          { href: '/ai-coach', icon: TrendingUp, title: 'AI Coach', desc: 'Level up', color: 'text-success' },
        ].map((item, i) => (
          <Link key={i} href={item.href}>
            <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card variant="glass" className="cursor-pointer border-border/50 hover:border-primary/30 transition-all">
                <CardContent className="p-4 text-center space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
