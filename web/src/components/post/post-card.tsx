'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, Trash2, ChevronDown } from 'lucide-react';
import { formatRelativeTime, formatNumber, getInitials } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface PostCardProps {
  post: any;
  onDelete?: (id: string) => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isOwner = user?.id === post.user?.id;

  const { data: commentsData } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => api.get(`/posts/${post.id}/comments`).then(r => r.data.data),
    enabled: showComments,
  });

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/posts/${post.id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/posts/${post.id}/comment`, { content: commentText }),
    onSuccess: () => { setCommentText(''); queryClient.invalidateQueries({ queryKey: ['feed'] }); queryClient.invalidateQueries({ queryKey: ['comments', post.id] }); toast.success('Comment added'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to comment'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/posts/${post.id}`),
    onSuccess: () => { toast.success('Post deleted'); onDelete?.(post.id); queryClient.invalidateQueries({ queryKey: ['feed'] }); },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="glass-card">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${post.user?.profile?.username}`}>
                <Avatar className="h-10 w-10 ring-2 ring-border">
                  <AvatarImage src={post.user?.profile?.avatar || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(post.user?.profile?.username || 'U')}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/profile/${post.user?.profile?.username}`} className="font-semibold hover:underline text-sm">
                    {post.user?.profile?.displayName || post.user?.profile?.username}
                  </Link>
                  {post.user?.profile?.rank && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      {post.user.profile.rank}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {isOwner && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate()}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

          {post.type === 'CLIP' && post.media?.[0] && (
            <div className="rounded-xl overflow-hidden bg-muted">
              {post.media[0].match(/\.(mp4|webm|ogg)$/i) ? (
                <video src={post.media[0]} controls className="w-full max-h-96 object-contain" />
              ) : (
                <img src={post.media[0]} alt="Post media" className="w-full max-h-96 object-cover" />
              )}
            </div>
          )}

          {post.tags?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {post.tags.map((tag: string, j: number) => (
                <Link key={j} href={`/feed?hashtag=${tag}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-accent text-xs">#{tag}</Badge>
                </Link>
              ))}
            </div>
          )}

          {post.poll && (
            <PollDisplay poll={post.poll} />
          )}

          <div className="flex items-center justify-between border-t border-border/50 pt-3">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className={`gap-1.5 h-8 ${post.isLiked ? 'text-red-500' : 'text-muted-foreground'}`} onClick={() => likeMutation.mutate()}>
                <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-red-500' : ''}`} />
                <span className="text-xs">{formatNumber(post._count?.likes || 0)}</span>
              </Button>
              <Button variant="ghost" size="sm" className={`gap-1.5 h-8 text-muted-foreground ${showComments ? 'text-primary' : ''}`} onClick={() => setShowComments(!showComments)}>
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{formatNumber(post._count?.comments || 0)}</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-muted-foreground">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-muted-foreground">
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>

          <AnimatePresence>
            {showComments && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3 border-t border-border/50 pt-3">
                <div className="flex gap-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={user?.profile?.avatar || ''} />
                    <AvatarFallback className="text-xs">{getInitials(user?.profile?.username || 'U')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Textarea
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="min-h-0 h-9 py-2 text-sm resize-none"
                    />
                    <Button
                      variant="gradient"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      disabled={!commentText.trim() || commentMutation.isPending}
                      onClick={() => commentMutation.mutate()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {commentsData?.map((comment: any) => (
                  <div key={comment.id} className="flex gap-2">
                    <Link href={`/profile/${comment.user?.profile?.username}`}>
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={comment.user?.profile?.avatar || ''} />
                        <AvatarFallback className="text-xs">{getInitials(comment.user?.profile?.username || 'U')}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${comment.user?.profile?.username}`} className="text-xs font-semibold hover:underline">
                          {comment.user?.profile?.username}
                        </Link>
                        <span className="text-[10px] text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))}
                {commentsData?.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No comments yet</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PollDisplay({ poll }: { poll: any }) {
  const [voted, setVoted] = useState(false);
  const queryClient = useQueryClient();
  const totalVotes = poll.options?.reduce((sum: number, o: any) => sum + o.votes, 0) || 0;

  const voteMutation = useMutation({
    mutationFn: (optionId: string) => api.post(`/polls/${poll.id}/vote`, { optionId }),
    onSuccess: () => { setVoted(true); queryClient.invalidateQueries({ queryKey: ['feed'] }); },
  });

  return (
    <div className="space-y-2 bg-muted/30 rounded-xl p-3">
      <p className="text-sm font-medium">{poll.question}</p>
      {poll.options?.map((option: any) => {
        const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
        return (
          <button
            key={option.id}
            disabled={voted}
            onClick={() => voteMutation.mutate(option.id)}
            className="relative w-full text-left p-2.5 rounded-lg border border-border bg-background hover:border-primary/50 transition-all disabled:cursor-not-allowed group"
          >
            <div
              className="absolute inset-0 rounded-lg bg-primary/10 transition-all"
              style={{ width: voted ? `${pct}%` : '0%' }}
            />
            <div className="relative flex items-center justify-between z-10">
              <span className="text-sm">{option.text}</span>
              {voted && <span className="text-xs text-muted-foreground">{pct}%</span>}
            </div>
          </button>
        );
      })}
      <p className="text-xs text-muted-foreground">{totalVotes} votes</p>
    </div>
  );
}
