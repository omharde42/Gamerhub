'use client';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bookmark, 
  ArrowLeft, 
  ExternalLink, 
  Grid, 
  List, 
  Heart, 
  MessageCircle, 
  Trash2, 
  Video 
} from 'lucide-react';
import { useSavedPosts } from '@/hooks/useSavedPosts';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { PostCard } from '@/components/post/post-card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SavedPostsPage() {
  const { savedIds, toggle: removeBookmark } = useSavedPosts();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['saved-posts', savedIds],
    queryFn: async () => {
      if (savedIds.length === 0) return [];
      const results = await Promise.all(
        savedIds.map(id => 
          api.get(`/posts/${id}`)
            .then(r => r.data.data)
            .catch(() => null)
        )
      );
      return results.filter(Boolean);
    },
    enabled: savedIds.length > 0,
  });

  if (!mounted) {
    return (
      <div className="space-y-4 p-6 max-w-4xl mx-auto">
        <div className="h-12 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="space-y-3">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const validPosts = posts || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Link href="/feed">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/55">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
              <Bookmark className="h-6 w-6 text-primary fill-primary/10" />
              Saved Posts
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {savedIds.length} bookmarked {savedIds.length === 1 ? 'post' : 'posts'}
            </p>
          </div>
        </div>

        {savedIds.length > 0 && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto bg-muted/30 p-1 rounded-xl border border-border/40 backdrop-blur-sm">
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('grid')}
              className="rounded-lg px-3 py-1.5 h-8 gap-1.5 text-xs font-semibold transition-all duration-200"
            >
              <Grid className="h-3.5 w-3.5" />
              Grid
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('list')}
              className="rounded-lg px-3 py-1.5 h-8 gap-1.5 text-xs font-semibold transition-all duration-200"
            >
              <List className="h-3.5 w-3.5" />
              List
            </Button>
          </div>
        )}
      </div>

      {savedIds.length === 0 ? (
        <Card variant="glass" className="border border-border/40">
          <CardContent className="p-16 text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
              <Bookmark className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold tracking-tight">No saved posts yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Bookmark posts across GamerHub to save references, tutorials, and game clips for later.
              </p>
            </div>
            <Link href="/feed" className="inline-block pt-2">
              <Button variant="default" className="shadow-lg shadow-primary/20 gap-2">
                Browse Feed
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-4'}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="overflow-hidden border border-border/40">
              <CardContent className="p-0">
                <Skeleton className="w-full aspect-video" />
                <div className="p-4 space-y-2">
                  <div className="flex gap-2 items-center">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {viewMode === 'list' ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {validPosts.map((post: any) => (
                <div key={post.id} className="relative group animate-in fade-in-50 duration-200">
                  <PostCard post={post} />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
            >
              {validPosts.map((post: any) => {
                const hasMedia = post.media && post.media.length > 0;
                const mediaUrl = hasMedia ? post.media[0] : null;
                const isVideo = mediaUrl && (
                  mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i) || 
                  mediaUrl.includes('/video/upload/') || 
                  mediaUrl.startsWith('data:video/')
                );
                const thumb = mediaUrl
                  ? isVideo && mediaUrl.includes('/video/upload/')
                    ? mediaUrl.replace(/\/video\/upload\/(v\d+\/)?/, '/video/upload/c_limit,w_500,h_500/').replace(/\.[^/.]+$/, '.jpg')
                    : mediaUrl
                  : null;

                return (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="group relative overflow-hidden rounded-xl aspect-[4/3] border border-border/40 bg-muted/20 flex flex-col justify-between hover:border-primary/30 transition-all duration-300 shadow-sm"
                  >
                    {/* Media content or text fallback */}
                    {hasMedia && thumb ? (
                      <div className="absolute inset-0 z-0">
                        <img 
                          src={thumb} 
                          alt="" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                        {isVideo && (
                          <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-lg border border-white/10 backdrop-blur-sm z-10">
                            <Video className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/10 via-accent/5 to-muted-foreground/5 flex flex-col justify-between p-4">
                        <p className="text-sm font-medium text-foreground/80 line-clamp-4 leading-relaxed font-sans pt-2">
                          {post.content}
                        </p>
                      </div>
                    )}

                    {/* Gradient Overlay for readability on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col justify-between p-3" />

                    {/* Hover Info & Actions Overlay */}
                    <div className="absolute inset-0 z-20 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {/* Top Bar: Author profile info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <img 
                            src={post.user?.profile?.avatar || '/placeholder.png'} 
                            alt=""
                            className="h-6 w-6 rounded-full border border-white/20 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${post.user?.profile?.username || 'G'}`;
                            }}
                          />
                          <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                            @{post.user?.profile?.username}
                          </span>
                        </div>
                        {/* Remove bookmark button */}
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="h-7 w-7 rounded-lg shadow-md hover:scale-105 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            removeBookmark(post.id);
                            toast.success('Removed bookmark');
                          }}
                          title="Remove bookmark"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Bottom Info: Likes/Comments & Link to open */}
                      <div className="flex items-center justify-between text-white pt-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs font-semibold">
                            <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                            {post._count?.likes || 0}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-semibold">
                            <MessageCircle className="h-3.5 w-3.5 fill-white/10" />
                            {post._count?.comments || 0}
                          </span>
                        </div>

                        {/* Open original post */}
                        <Link href={`/feed?post=${post.id}`}>
                          <Button size="sm" variant="secondary" className="h-7 px-2.5 text-[10px] font-bold rounded-lg flex items-center gap-1 hover:bg-white hover:text-black">
                            Open Post
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Standard Grid Footer when not hovering (if media is present, show content snippet) */}
                    {hasMedia && (
                      <div className="w-full bg-background/95 border-t border-border/40 p-3 z-10 group-hover:opacity-0 transition-opacity duration-200 mt-auto flex flex-col justify-end">
                        <p className="text-xs font-medium text-foreground line-clamp-1">
                          {post.content || 'Video clip / Screenshot'}
                        </p>
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            @{post.user?.profile?.username}
                          </span>
                          <div className="flex gap-2">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Heart className="h-2.5 w-2.5" /> {post._count?.likes || 0}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <MessageCircle className="h-2.5 w-2.5" /> {post._count?.comments || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
