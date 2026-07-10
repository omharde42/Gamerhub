'use client';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, ArrowLeft, ExternalLink } from 'lucide-react';
import { useSavedPosts } from '@/hooks/useSavedPosts';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { PostCard } from '@/components/post/post-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SavedPostsPage() {
  const { savedIds } = useSavedPosts();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => { if (savedIds.length > 0) setEnabled(true); }, [savedIds]);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['saved-posts', savedIds],
    queryFn: () => Promise.all(savedIds.map(id => api.get(`/posts/${id}`).then(r => r.data.data).catch(() => null))),
    enabled: savedIds.length > 0,
  });

  const validPosts = posts?.filter(Boolean) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/feed">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            Saved Posts
          </h1>
          <p className="text-xs text-muted-foreground">{savedIds.length} saved posts</p>
        </div>
      </div>

      {savedIds.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-2">
            <Bookmark className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-lg font-medium">No saved posts</p>
            <p className="text-sm text-muted-foreground">Bookmark posts to read them later</p>
            <Link href="/feed">
              <Button variant="default" size="sm" className="mt-2">Browse Feed</Button>
            </Link>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <Card key={i}><CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div>
              <Skeleton className="h-16 w-full" />
            </CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {validPosts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
