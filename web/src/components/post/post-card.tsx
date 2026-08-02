'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ImagePreview } from '@/components/ui/image-preview';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, Trash2, Sparkles, BarChart3, CheckCircle2 } from 'lucide-react';
import { formatRelativeTime, formatNumber, getInitials, getMediaUrl, getOptimizedMediaUrl, cn } from '@/lib/utils';
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
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 hover:bg-[#FF3D71]/10 group ${
        post.isLiked ? 'text-[#FF3D71]' : 'text-[#94A3B8] hover:text-white'
      }`}
      onClick={handleClick}
    >
      <motion.div
        animate={animated ? { scale: [1, 1.4, 1], rotate: [0, -8, 8, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart className={`h-4 w-4 transition-all duration-150 ${post.isLiked ? 'fill-[#FF3D71] stroke-[#FF3D71]' : ''} group-hover:scale-110`} />
      </motion.div>
      <span className="font-mono">{formatNumber(post._count?.likes || 0)}</span>
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
    <div className="space-y-2 bg-[#0B1220] rounded-2xl p-4 border border-white/[0.08] my-3 shadow-inner">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="h-4 w-4 text-[#7C3AED]" />
        <p className="text-sm font-bold text-white font-inter">{poll.question}</p>
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
                "relative w-full text-left p-3 rounded-xl border transition-all overflow-hidden group select-none cursor-pointer",
                isSelected
                  ? "border-[#7C3AED] bg-[#7C3AED]/20 font-bold"
                  : "border-white/[0.08] bg-[#111827] hover:border-[#7C3AED]/50"
              )}
            >
              {(hasVoted || totalVotes > 0) && (
                <motion.div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 opacity-25",
                    isSelected ? "bg-[#7C3AED]" : "bg-white/10"
                  )}
                  initial={{ width: '0%' }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              )}
              <div className="relative flex items-center justify-between z-10 text-xs sm:text-sm">
                <span className="flex items-center gap-2">
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-[#7C3AED] shrink-0" />}
                  <span className="text-white font-medium">{option.text}</span>
                </span>
                {(hasVoted || totalVotes > 0) && (
                  <span className="text-xs text-[#94A3B8] font-mono font-bold ml-2 shrink-0">
                    {pct}% ({optionVotes})
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-[#94A3B8] font-medium pt-1 font-mono">
        {totalVotes} {totalVotes === 1 ? 'total vote' : 'total votes'}
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
      <div className="gaming-card p-5 space-y-4 relative overflow-hidden group">
        {/* Post Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <Link href={`/profile/${post.user?.profile?.username}`}>
              <Avatar className="h-12 w-12 border-2 border-white/10 shadow-md transition-transform duration-200 group-hover:scale-105">
                <AvatarImage src={post.user?.profile?.avatar || ''} />
                <AvatarFallback className="bg-gradient-to-br from-[#7C3AED] to-[#FF6B00] text-white font-bold text-base">
                  {getInitials(post.user?.profile?.username || 'U')}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/profile/${post.user?.profile?.username}`} className="font-bold text-white hover:text-[#7C3AED] transition-colors text-sm font-inter">
                  {post.user?.profile?.displayName || post.user?.profile?.username}
                </Link>
                {post.user?.profile?.rank && (
                  <Badge variant="outline" className="text-[10px] font-mono bg-[#7C3AED]/15 text-[#7C3AED] border-[#7C3AED]/30 px-2 py-0.5 font-bold">
                    <Sparkles className="h-2.5 w-2.5 mr-1 text-[#FF6B00]" />
                    {post.user.profile.rank}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5 font-mono">{formatRelativeTime(post.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            {isOwner && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#94A3B8] hover:text-[#FF3D71]" onClick={() => deleteMutation.mutate()}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#94A3B8]">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Post Content */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-white/95 font-inter">{post.content}</p>

        {/* Media Attachments */}
        {post.media && post.media.length > 0 && (
          <motion.div
            className="rounded-2xl overflow-hidden bg-[#05070E] border border-white/[0.08] shadow-inner"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`grid gap-1.5 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {post.media.map((imgUrl: string, imgIdx: number) => {
                const isVideo = imgUrl.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i) || imgUrl.includes('/video/upload/');
                return (
                  <div key={imgIdx} className="relative overflow-hidden bg-black/40 rounded-xl max-h-96">
                    {isVideo ? (
                      <video
                        src={getMediaUrl(imgUrl)}
                        controls
                        preload="metadata"
                        className="w-full max-h-96 object-contain bg-black rounded-xl"
                      />
                    ) : (
                      <img 
                        src={getOptimizedMediaUrl(imgUrl, 1080)} 
                        alt="Post media" 
                        loading="lazy"
                        className="w-full max-h-96 object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300 rounded-xl" 
                        onClick={() => {
                          setSelectedImageIndex(imgIdx);
                          setPreviewOpen(true);
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {post.poll && <PollDisplay poll={post.poll} />}

        {/* Hashtags */}
        {post.tags?.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {post.tags.map((tag: string, j: number) => (
              <Link key={j} href={`/feed?hashtag=${tag}`}>
                <Badge variant="secondary" className="cursor-pointer bg-[#0B1220] hover:bg-[#7C3AED]/20 text-[#7C3AED] border border-white/[0.08] text-xs font-mono font-bold transition-all duration-200">
                  #{tag}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Post Action Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-3.5">
          <div className="flex items-center gap-1">
            <LikeButton post={post} />
            <Button variant="ghost" size="sm" aria-label="Comment on post" title="Comment" className={`gap-1.5 h-8 text-xs text-[#94A3B8] hover:text-white hover:bg-[#7C3AED]/10 rounded-xl ${showComments ? 'text-[#7C3AED] bg-[#7C3AED]/15 font-bold' : ''}`} onClick={() => setShowComments(!showComments)}>
              <MessageCircle className="h-4 w-4" />
              <span className="font-mono">{formatNumber(post._count?.comments || 0)}</span>
            </Button>
            <Button variant="ghost" size="sm" aria-label="Share post link" title="Share" className="gap-1.5 h-8 text-xs text-[#94A3B8] hover:text-white hover:bg-white/[0.06] rounded-xl"
              onClick={() => {
                const url = `${window.location.origin}/feed?post=${post.id}`;
                navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard');
              }}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" aria-label={saved ? "Unsave post" : "Save post"} title={saved ? "Unsave" : "Save"}
            className={`gap-1.5 h-8 text-xs transition-all duration-200 rounded-xl ${saved ? 'text-[#7C3AED] hover:text-[#7C3AED]' : 'text-[#94A3B8] hover:text-white'}`}
            onClick={() => { toggleSave(post.id); toast.success(saved ? 'Post unsaved' : 'Post saved'); }}>
            <Bookmark className={`h-4 w-4 transition-all duration-200 ${saved ? 'fill-[#7C3AED] drop-shadow-[0_0_6px_rgba(124,58,237,0.5)]' : ''}`} />
          </Button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3 border-t border-white/[0.08] pt-3">
              <div className="flex gap-2.5">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={user?.profile?.avatar || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-[#7C3AED] to-[#FF6B00] text-white text-xs font-bold">{getInitials(user?.profile?.username || 'U')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-0 h-10 py-2.5 text-xs bg-[#0B1220] border-white/[0.08] rounded-xl resize-none focus:border-[#7C3AED]"
                  />
                  <Button
                    variant="gradient"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl"
                    disabled={!commentText.trim() || commentMutation.isPending}
                    onClick={() => commentMutation.mutate()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {commentsData?.map((comment: any) => (
                <motion.div key={comment.id} className="flex gap-2.5" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <Link href={`/profile/${comment.user?.profile?.username}`}>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={comment.user?.profile?.avatar || ''} />
                      <AvatarFallback className="text-xs">{getInitials(comment.user?.profile?.username || 'U')}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 bg-[#0B1220] rounded-2xl px-3.5 py-2.5 border border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <Link href={`/profile/${comment.user?.profile?.username}`} className="text-xs font-bold text-white hover:text-[#7C3AED]">
                        {comment.user?.profile?.username}
                      </Link>
                      <span className="text-[10px] text-[#94A3B8] font-mono">{formatRelativeTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-xs text-white/90 mt-1 font-inter">{comment.content}</p>
                  </div>
                </motion.div>
              ))}
              {commentsData?.length === 0 && (
                <p className="text-xs text-[#94A3B8] text-center py-2">No comments yet. Be the first to comment!</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <ImagePreview 
          images={(post.media || []).filter((url: string) => !url.match(/\.(mp4|webm|ogg|mov)$/i) && !url.includes('/video/upload/'))} 
          initialIndex={selectedImageIndex} 
          isOpen={previewOpen} 
          onClose={() => setPreviewOpen(false)} 
        />
      </div>
    </motion.div>
  );
}
