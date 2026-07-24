'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ImagePreview } from '@/components/ui/image-preview';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, Trash2, ChevronDown, Sparkles, BarChart3, CheckCircle2 } from 'lucide-react';
import { formatRelativeTime, formatNumber, getInitials, getMediaUrl, cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useSavedPosts } from '@/hooks/useSavedPosts';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface PostCardProps {
  post: any;
  onDelete?: (id: string) => void;
}

function LikeButton({ post }: { post: any }) {
  const [animated, setAnimated] = useState(false);
  const queryClient = useQueryClient();
  const likeMutation = useMutation({
    mutationFn: () => api.post(`/posts/${post.id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
    },
  });

  const handleClick = () => {
    if (!post.isLiked) {
      setAnimated(true);
      setTimeout(() => setAnimated(false), 400);
    }
    likeMutation.mutate();
  };

  return (
    <button
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-red-500/5 group ${
        post.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
      }`}
      onClick={handleClick}
    >
      <motion.div
        animate={animated ? { scale: [1, 1.3, 1], rotate: [0, -5, 5, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart className={`h-4 w-4 transition-all duration-150 ${post.isLiked ? 'fill-red-500 stroke-red-500' : ''} group-hover:scale-105`} />
      </motion.div>
      <span>{formatNumber(post._count?.likes || 0)}</span>
    </button>
  );
}

function PollDisplay({ poll }: { poll: any }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const userVotedOptionId = poll.options?.find((o: any) =>
    o.voters?.some((v: any) => v.userId === user?.id)
  )?.id;

  const totalVotes = poll.options?.reduce((sum: number, o: any) => sum + (o.votes || o.voters?.length || 0), 0) || 0;
  const hasVoted = Boolean(userVotedOptionId);

  const voteMutation = useMutation({
    mutationFn: (optionId: string) => api.post('/posts/poll/vote', { optionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit vote');
    }
  });

  return (
    <div className="space-y-2 bg-muted/30 rounded-xl p-3 border border-border/50 my-2">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">{poll.question}</p>
      </div>
      <div className="space-y-2">
        {poll.options?.map((option: any) => {
          const optionVotes = option.votes || option.voters?.length || 0;
          const pct = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
          const isSelected = option.id === userVotedOptionId;

          return (
            <button
              key={option.id}
              disabled={voteMutation.isPending}
              onClick={() => voteMutation.mutate(option.id)}
              className={cn(
                "relative w-full text-left p-3 rounded-lg border transition-all overflow-hidden group select-none cursor-pointer",
                isSelected
                  ? "border-primary bg-primary/10 font-medium"
                  : "border-border/60 bg-background hover:border-primary/50"
              )}
            >
              {(hasVoted || totalVotes > 0) && (
                <motion.div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 opacity-20",
                    isSelected ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                  initial={{ width: '0%' }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              )}
              <div className="relative flex items-center justify-between z-10 text-xs sm:text-sm">
                <span className="flex items-center gap-2">
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                  <span>{option.text}</span>
                </span>
                {(hasVoted || totalVotes > 0) && (
                  <span className="text-xs text-muted-foreground font-mono font-medium ml-2 shrink-0">
                    {pct}% ({optionVotes})
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground font-medium pt-1">
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
      </p>
    </div>
  );
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { isSaved, toggle: toggleSave } = useSavedPosts();
  const saved = isSaved(post.id);
  const isOwner = user?.id === post.user?.id;

  const { data: commentsData } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => api.get(`/posts/${post.id}/comments`).then(r => r.data.data),
    enabled: showComments,
  });

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/posts/${post.id}/comment`, { content: commentText }),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
      queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
      toast.success('Comment added');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to comment'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/posts/${post.id}`),
    onSuccess: () => {
      toast.success('Post deleted');
      onDelete?.(post.id);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
    },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} layout>
      <Card variant="glass" className="group border-border/60 hover:border-border/80 shadow-sm transition-all duration-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${post.user?.profile?.username}`}>
                <Avatar className="h-10 w-10 border border-border/60 transition-all duration-200 group-hover:border-primary/40">
                  <AvatarImage src={post.user?.profile?.avatar || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(post.user?.profile?.username || 'U')}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/profile/${post.user?.profile?.username}`} className="font-semibold hover:text-primary transition-colors text-sm">
                    {post.user?.profile?.displayName || post.user?.profile?.username}
                  </Link>
                  {post.user?.profile?.rank && (
                    <Badge variant="rank" className="text-[10px] px-1.5 py-0 h-4">
                      {post.user.profile.rank}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(post.createdAt)}
                  {post.updatedAt && new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 1000 && (
                    <span className="text-[10px] text-muted-foreground/60 ml-1.5 italic">(Edited)</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
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

          {post.media && post.media.length > 0 && (
            <motion.div
              className="rounded-xl overflow-hidden bg-muted border border-border/50"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {post.media[0].match(/\.(mp4|webm|ogg|mov)$/i) || post.media[0].includes('/video/upload/') ? (
                <video
                  src={getMediaUrl(post.media[0])}
                  controls
                  poster={
                    post.media[0].includes('/video/upload/')
                      ? post.media[0].replace(/\/video\/upload\/(v\d+\/)?/, '/video/upload/c_limit,w_1200,h_675/').replace(/\.[^/.]+$/, '.jpg')
                      : undefined
                  }
                  className="w-full max-h-96 object-contain bg-black"
                />
              ) : (
                <div className={`grid gap-1 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {post.media.map((imgUrl: string, imgIdx: number) => (
                    <img 
                      key={imgIdx}
                      src={getMediaUrl(imgUrl)} 
                      alt="Post media" 
                      className="w-full max-h-96 object-cover cursor-pointer hover:scale-[1.01] transition-transform duration-300" 
                      onClick={() => {
                        setSelectedImageIndex(imgIdx);
                        setPreviewOpen(true);
                      }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {post.poll && <PollDisplay poll={post.poll} />}

          <ImagePreview 
            images={post.media || []} 
            initialIndex={selectedImageIndex} 
            isOpen={previewOpen} 
            onClose={() => setPreviewOpen(false)} 
          />

          {post.tags?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {post.tags.map((tag: string, j: number) => (
                <Link key={j} href={`/feed?hashtag=${tag}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-accent hover:text-accent-foreground text-xs transition-all duration-200">
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {post.poll && <PollDisplay poll={post.poll} />}

          <div className="flex items-center justify-between border-t border-border/50 pt-3">
            <div className="flex items-center gap-0.5">
              <LikeButton post={post} />
              <Button variant="ghost" size="sm" className={`gap-1.5 h-8 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 ${showComments ? 'text-primary bg-primary/10' : ''}`} onClick={() => setShowComments(!showComments)}>
                <MessageCircle className="h-4 w-4" />
                <span>{formatNumber(post._count?.comments || 0)}</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={() => {
                  const url = `${window.location.origin}/feed?post=${post.id}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Link copied to clipboard');
                }}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm"
              className={`gap-1.5 h-8 text-xs transition-all duration-200 ${saved ? 'text-primary hover:text-primary' : 'text-muted-foreground hover:text-primary'}`}
              onClick={() => { toggleSave(post.id); toast.success(saved ? 'Post unsaved' : 'Post saved'); }}>
              <Bookmark className={`h-4 w-4 transition-all duration-200 ${saved ? 'fill-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]' : ''}`} />
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
                      variant="default"
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
                  <motion.div key={comment.id} className="flex gap-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <Link href={`/profile/${comment.user?.profile?.username}`}>
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={comment.user?.profile?.avatar || ''} />
                        <AvatarFallback className="text-xs">{getInitials(comment.user?.profile?.username || 'U')}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2 border border-border/30">
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${comment.user?.profile?.username}`} className="text-xs font-semibold hover:underline">
                          {comment.user?.profile?.username}
                        </Link>
                        <span className="text-[10px] text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-0.5">{comment.content}</p>
                    </div>
                  </motion.div>
                ))}
                {commentsData?.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
