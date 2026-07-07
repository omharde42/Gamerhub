'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ImagePlus, Video, BarChart3, Send, Heart, MessageCircle, Share2, Bookmark, Play, TrendingUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime, formatNumber, getInitials } from '@/lib/utils';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function FeedPage() {
  const [postContent, setPostContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: feedData, isLoading } = useQuery({ queryKey: ['feed'], queryFn: () => api.get('/feed').then(r => r.data) });
  const { data: trending } = useQuery({ queryKey: ['trending'], queryFn: () => api.get('/posts/trending').then(r => r.data.data).catch(() => []) });

  const createPost = useMutation({ mutationFn: () => api.post('/posts', { content: postContent, tags }), onSuccess: () => { setPostContent(''); setTags([]); queryClient.invalidateQueries({ queryKey: ['feed'] }); toast.success('Post created!'); }, onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to post') });
  const likePost = useMutation({ mutationFn: (postId: string) => api.post(`/posts/${postId}/like`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }) });
  const followUser = useMutation({ mutationFn: (userId: string) => api.post(`/feed/follow/${userId}`), onSuccess: () => toast.success('Followed!') });

  const addTag = () => { if (tagInput && !tags.includes(tagInput)) { setTags([...tags, tagInput]); setTagInput(''); } };

  return (<div className="max-w-4xl mx-auto space-y-6">
    <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Feed</h1><Link href="/feed/trending"><Button variant="outline" size="sm" className="gap-2"><TrendingUp className="h-4 w-4" />Trending</Button></Link></div>

    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="glass-card"><CardContent className="p-4"><div className="flex gap-3"><Avatar className="h-10 w-10"><AvatarImage src={user?.profile?.avatar || ''} /><AvatarFallback>{getInitials(user?.profile?.username || 'U')}</AvatarFallback></Avatar><div className="flex-1 space-y-3"><Textarea placeholder="Share something with the gaming community..." value={postContent} onChange={(e) => setPostContent(e.target.value)} className="min-h-[80px] resize-none border-0 bg-muted/50" /><div className="flex items-center gap-2 flex-wrap">{tags.map((tag, i) => (<Badge key={i} variant="secondary" className="gap-1">#{tag}<button onClick={() => setTags(tags.filter((_, j) => j !== i))} className="text-xs ml-1">&times;</button></Badge>))}</div><div className="flex items-center justify-between"><div className="flex gap-1"><Button variant="ghost" size="sm"><ImagePlus className="h-4 w-4" /></Button><Button variant="ghost" size="sm"><Video className="h-4 w-4" /></Button><Button variant="ghost" size="sm"><BarChart3 className="h-4 w-4" /></Button><div className="flex items-center gap-1"><Input placeholder="#tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTag()} className="h-8 w-20 text-xs" /><Button variant="ghost" size="sm" onClick={addTag}>+</Button></div></div><Button variant="gradient" size="sm" disabled={!postContent || createPost.isPending} onClick={() => createPost.mutate()} className="gap-2"><Send className="h-4 w-4" />Post</Button></div></div></div></CardContent></Card>

        {feedData?.data?.map((post: any, i: number) => (<motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}><Card className="glass-card"><CardContent className="p-4 space-y-4"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><Link href={`/profile/${post.user?.profile?.username}`}><Avatar className="h-10 w-10"><AvatarImage src={post.user?.profile?.avatar || ''} /><AvatarFallback>{getInitials(post.user?.profile?.username || 'U')}</AvatarFallback></Avatar></Link><div><Link href={`/profile/${post.user?.profile?.username}`} className="font-medium hover:underline">{post.user?.profile?.displayName || post.user?.profile?.username}</Link><p className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</p></div></div><Button variant="ghost" size="sm" onClick={() => followUser.mutate(post.user.id)}>Follow</Button></div><p className="text-sm leading-relaxed">{post.content}</p>{post.tags?.length > 0 && (<div className="flex gap-2 flex-wrap">{post.tags.map((tag: string, j: number) => (<Link key={j} href={`/feed?hashtag=${tag}`}><Badge variant="outline" className="cursor-pointer hover:bg-accent">#{tag}</Badge></Link>))}</div>)}<div className="flex items-center gap-4 text-muted-foreground"><Button variant="ghost" size="sm" className="gap-1.5" onClick={() => likePost.mutate(post.id)}><Heart className={`h-4 w-4 ${post.isLiked ? 'fill-red-500 text-red-500' : ''}`} />{formatNumber(post._count?.likes || 0)}</Button><Button variant="ghost" size="sm" className="gap-1.5"><MessageCircle className="h-4 w-4" />{formatNumber(post._count?.comments || 0)}</Button><Button variant="ghost" size="sm" className="gap-1.5"><Share2 className="h-4 w-4" /></Button><Button variant="ghost" size="sm" className="gap-1.5 ml-auto"><Bookmark className="h-4 w-4" /></Button></div></CardContent></Card></motion.div>))}
      </div>

      <div className="space-y-6">
        <Card className="glass-card"><CardHeader className="pb-2"><h3 className="font-semibold text-sm">Trending Topics</h3></CardHeader><CardContent className="space-y-2">{trending?.map((h: any, i: number) => (<Link key={i} href={`/feed?hashtag=${h.name}`}><div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-all cursor-pointer"><span className="text-sm font-medium">#{h.name}</span><Badge variant="secondary" className="text-xs">{h.count}</Badge></div></Link>))}</CardContent></Card>

        <Card className="glass-card"><CardHeader className="pb-2"><h3 className="font-semibold text-sm">Suggested Players</h3></CardHeader><CardContent className="space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="flex items-center gap-2"><Avatar className="h-8 w-8"><AvatarFallback className="text-xs">P{i}</AvatarFallback></Avatar><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">Player_{i}</p><p className="text-xs text-muted-foreground">Gold • Entry Fragger</p></div><Button variant="ghost" size="sm" className="text-xs">+</Button></div>))}</CardContent></Card>
      </div>
    </div>
  </div>);
}
