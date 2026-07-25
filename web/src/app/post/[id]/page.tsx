'use client';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import { PostCard } from '@/components/post/post-card';
import { motion } from 'framer-motion';

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: postData, isLoading, isError } = useQuery({
    queryKey: ['post', id],
    queryFn: () => api.get(`/posts/${id}`).then((r) => r.data.data),
    enabled: Boolean(id),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Top Header with Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 border-b border-border/40 pb-3"
      >
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-semibold text-sm">Back</span>
        </Button>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          <span>Post Discussion</span>
        </div>
      </motion.div>

      {/* Main Content View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading post...</p>
        </div>
      ) : isError || !postData ? (
        <div className="text-center py-16 space-y-3 bg-muted/20 rounded-xl border border-border/50">
          <p className="text-lg font-semibold">Post Not Found</p>
          <p className="text-sm text-muted-foreground">
            The post you are looking for has been removed or is unavailable.
          </p>
          <Button variant="outline" size="sm" onClick={() => router.push('/feed')}>
            Return to Feed
          </Button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <PostCard post={postData} />
        </motion.div>
      )}
    </div>
  );
}
