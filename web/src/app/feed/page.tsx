'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Gamepad2, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import { PostCard } from '@/components/post/post-card';
import { CreatePost } from '@/components/post/create-post';
import { Skeleton } from '@/components/ui/skeleton';

const SUGGESTED_PLAYERS = [
  { username: 'ProGamerX', rank: 'Diamond', role: 'Entry Fragger', game: 'Valorant' },
  { username: 'AceStriker', rank: 'Master', role: 'AWPer', game: 'CS2' },
  { username: 'ShadowBlade', rank: 'Platinum', role: 'Support', game: 'League of Legends' },
];

export default function FeedPage() {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<string>('all');

  const { data: feedData, isLoading, refetch } = useQuery({
    queryKey: ['feed', filter],
    queryFn: () => api.get(`/feed${filter !== 'all' ? `?hashtag=${filter}` : ''}`).then(r => r.data),
  });

  const { data: trending } = useQuery({
    queryKey: ['trending'],
    queryFn: () => api.get('/posts/trending').then(r => r.data.data).catch(() => []),
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feed</h1>
          <p className="text-sm text-muted-foreground">See what the community is talking about</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <CreatePost />
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="glass-card"><CardContent className="p-4 space-y-3"><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div><Skeleton className="h-20 w-full" /><Skeleton className="h-8 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : (
            feedData?.data?.map((post: any) => (
              <PostCard key={post.id} post={post} onDelete={(id) => refetch()} />
            ))
          )}
          {feedData?.data?.length === 0 && (
            <Card className="glass-card"><CardContent className="p-8 text-center"><p className="text-muted-foreground">No posts yet. Be the first to share something!</p></CardContent></Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="glass-card sticky top-20">
            <CardHeader className="pb-2">
              <h3 className="font-semibold text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-gaming-purple" /> Trending Topics</h3>
            </CardHeader>
            <CardContent className="space-y-1">
              {trending?.slice(0, 8).map((h: any, i: number) => (
                <button key={i} onClick={() => setFilter(h.name)} className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-all text-left ${filter === h.name ? 'bg-primary/10 text-primary' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                    <span className="text-sm font-medium">#{h.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{h.count}</Badge>
                </button>
              ))}
              {filter !== 'all' && (
                <Button variant="ghost" size="sm" className="w-full text-xs mt-2" onClick={() => setFilter('all')}>Clear filter</Button>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <h3 className="font-semibold text-sm flex items-center gap-2"><Users className="h-4 w-4 text-gaming-pink" /> Suggested Players</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {SUGGESTED_PLAYERS.map((p, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-all cursor-pointer">
                  <Avatar className="h-9 w-9"><AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(p.username)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.rank} • {p.role}</p>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Gamepad2 className="h-3 w-3" />
                    <span className="text-[10px]">{p.game}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
