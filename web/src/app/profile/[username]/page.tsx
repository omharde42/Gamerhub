'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Globe, Trophy, Target, TrendingUp, Gamepad2, Twitch, Youtube, MessageCircle, ExternalLink, Star, Shield, Users, Calendar, Award, Swords, X, Send, Plus, Hash, Search, Loader2, Heart, Reply, MoreVertical, Smile, Paperclip, Image as ImageIcon, UserCheck, UserPlus, Phone, Link as LinkIcon, Sparkles, Settings } from 'lucide-react';
import { formatDate, formatNumber, getInitials, getRankColor, formatRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

function StatCard({ value, label, color, delay = 0 }: { value: string | number; label: string; color: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card variant="glass" hover={false}>
        <CardContent className="p-4 text-center">
          <motion.p
            className={`text-2xl font-bold ${color}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.2, type: 'spring', stiffness: 100 }}
          >
            {value}
          </motion.p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data: profile, isLoading } = useQuery({ queryKey: ['profile', username], queryFn: () => api.get(`/profiles/${username}`).then(r => r.data.data) });
  const { data: posts } = useQuery({ queryKey: ['profile-posts', username], queryFn: () => api.get(`/posts?userId=${profile?.user?.id}`).then(r => r.data.data).catch(() => []), enabled: !!profile?.user?.id });

  const [following, setFollowing] = useState(false);
  const [friendStatus, setFriendStatus] = useState<string | null>(null);
  const { data: followingList } = useQuery({ queryKey: ['following-me'], queryFn: () => api.get('/feed/following').then(r => r.data.data.map((f: any) => f.following?.id)).catch(() => []), enabled: !!user });
  useEffect(() => { if (followingList && profile?.user?.id) setFollowing(followingList.includes(profile.user.id)); }, [followingList, profile?.user?.id]);
  const { data: friendList } = useQuery({ queryKey: ['friends'], queryFn: () => api.get('/friends').then(r => r.data.data.map((f: any) => f.id)).catch(() => []), enabled: !!user });
  const { data: friendRequests } = useQuery({ queryKey: ['friend-requests'], queryFn: () => api.get('/friends/requests').then(r => r.data.data.map((r: any) => r.sender?.id)).catch(() => []), enabled: !!user });
  useEffect(() => {
    if (!profile?.user?.id || !user) return;
    if (friendList?.includes(profile.user.id)) setFriendStatus('friends');
    else if (friendRequests?.includes(profile.user.id)) setFriendStatus('pending');
    else setFriendStatus(null);
  }, [friendList, friendRequests, profile?.user?.id, user]);

  const toggleFollow = useMutation({
    mutationFn: () => following ? api.post(`/feed/unfollow/${profile?.user?.id}`) : api.post(`/feed/follow/${profile?.user?.id}`),
    onSuccess: () => { setFollowing(!following); queryClient.invalidateQueries({ queryKey: ['following-me'] }); toast.success(following ? 'Unfollowed' : `Following @${profile?.username}`); },
  });

  const sendFriendReq = useMutation({
    mutationFn: () => api.post('/friends/request', { userId: profile!.user!.id }),
    onSuccess: () => { setFriendStatus('pending'); toast.success('Friend request sent!'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  // Modal State for Followers, Following, Connections
  const [listModalOpen, setListModalOpen] = useState(false);
  const [listType, setListType] = useState<'connections' | 'followers' | 'following' | null>(null);
  const [listSearch, setListSearch] = useState('');

  const { data: rawListData, isLoading: listLoading } = useQuery({
    queryKey: ['profile-social-list', listType, profile?.userId],
    queryFn: async () => {
      if (!listType || !profile?.userId) return [];
      if (listType === 'connections') {
        return api.get(`/friends?userId=${profile.userId}`).then(r => r.data.data);
      }
      if (listType === 'followers') {
        const res = await api.get(`/feed/followers?userId=${profile.userId}`);
        return res.data.data.map((item: any) => item.follower).filter(Boolean);
      }
      if (listType === 'following') {
        const res = await api.get(`/feed/following?userId=${profile.userId}`);
        return res.data.data.map((item: any) => item.following).filter(Boolean);
      }
      return [];
    },
    enabled: !!listType && !!profile?.userId && listModalOpen,
  });

  const listData = rawListData || [];

  const filteredList = listData.filter((item: any) => {
    if (!item) return false;
    const username = item.profile?.username?.toLowerCase() || '';
    const displayName = item.profile?.displayName?.toLowerCase() || '';
    const search = listSearch.toLowerCase();
    return username.includes(search) || displayName.includes(search);
  });

  const listToggleFollow = useMutation({
    mutationFn: (targetId: string) => {
      const isCurrentlyFollowing = followingList?.includes(targetId);
      return isCurrentlyFollowing 
        ? api.post(`/feed/unfollow/${targetId}`) 
        : api.post(`/feed/follow/${targetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following-me'] });
      queryClient.invalidateQueries({ queryKey: ['profile-social-list'] });
      toast.success('Updated follow status');
    },
  });

  const listConnect = useMutation({
    mutationFn: (targetId: string) => api.post('/friends/request', { userId: targetId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['profile-social-list'] });
      toast.success('Connection request sent!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to connect'),
  });

  const openSocialList = (type: 'connections' | 'followers' | 'following') => {
    setListType(type);
    setListSearch('');
    setListModalOpen(true);
  };

  // Full-screen chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgText, setMsgText] = useState('');
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);

  const { data: chatData } = useQuery({
    queryKey: ['chat-with', profile?.user?.id],
    queryFn: () => api.post('/chat/direct', { userId: profile.user.id }).then(r => r.data.data),
    enabled: chatOpen && !!profile?.user?.id,
  });
  useEffect(() => { if (chatData?.id) setChatId(chatData.id); }, [chatData]);

  const { data: messagesData } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => api.get(`/chat/${chatId}/messages`).then(r => r.data.data),
    enabled: !!chatId,
  });
  useEffect(() => { if (messagesData) setMessages(messagesData); }, [messagesData]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (socket) {
      const onOnline = (userId: string) => setOnlineUsers(p => new Set(p).add(userId));
      const onOffline = (userId: string) => setOnlineUsers(p => { const n = new Set(p); n.delete(userId); return n; });
      socket.on('user:online', onOnline);
      socket.on('user:offline', onOffline);
      return () => { socket.off('user:online', onOnline); socket.off('user:offline', onOffline); };
    }
  }, [socket]);

  useEffect(() => {
    if (socket && chatId) {
      socket.emit('join:chat', chatId);
      const onMessage = (msg: any) => setMessages(prev => [...prev, msg]);
      socket.on('message:new', onMessage);
      return () => { socket.emit('leave:chat', chatId); socket.off('message:new', onMessage); };
    }
  }, [chatId, socket]);

  const sendMessage = () => {
    if (!msgText.trim() || !chatId) return;
    if (socket) {
      socket.emit('message:send', { chatId, content: msgText });
    } else {
      api.post(`/chat/${chatId}/messages`, { content: msgText }).then(() => queryClient.invalidateQueries({ queryKey: ['messages', chatId] }));
    }
    setMsgText('');
  };

  const isOnline = (userId: string) => onlineUsers.has(userId);

  if (isLoading) return <div className="max-w-4xl mx-auto space-y-6"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>;
  if (!profile) return <div className="text-center py-20"><h2 className="text-2xl font-bold">Profile not found</h2></div>;

  const isOwn = user?.profile?.username === username;
  const socialLinks = [
    { icon: Twitch, href: profile.twitch, label: 'Twitch' },
    { icon: Youtube, href: profile.youtube, label: 'YouTube' },
    { icon: MessageCircle, href: profile.discord ? `https://discord.com/users/${profile.discord}` : null, label: 'Discord' },
    { icon: ExternalLink, href: profile.steam ? `https://steamcommunity.com/profiles/${profile.steam}` : null, label: 'Steam' },
  ].filter(s => s.href);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Full-screen chat overlay */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-2xl flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between px-4 h-14 border-b border-border/50 shrink-0 bg-muted/10">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9" status={profile?.user?.id && isOnline(profile.user.id) ? 'online' : undefined}>
                  <AvatarImage src={profile?.avatar || ''} />
                  <AvatarFallback className="text-xs">{getInitials(profile?.username || '')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{profile?.displayName || profile?.username}</p>
                  <p className="text-[10px]" style={{ color: isOnline(profile?.user?.id) ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))' }}>
                    {profile?.user?.id && isOnline(profile.user.id) ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setChatOpen(false); setChatId(null); setMessages([]); }}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1 px-4 bg-grid bg-[length:40px_40px]">
              <div className="py-4 space-y-0.5 max-w-3xl mx-auto">
                <AnimatePresence>
                  {messages?.map((msg: any, idx: number) => {
                    const isOwnMsg = msg.sender?.id === user?.id;
                    const prev = messages[idx - 1];
                    const showHeader = !prev || prev.sender?.id !== msg.sender?.id;
                    const isHovered = hoveredMsgId === msg.id;
                    return (
                      <motion.div
                        key={msg.id}
                        className={`flex gap-3 ${showHeader ? 'mt-4' : 'mt-0.5'} ${isOwnMsg ? 'flex-row-reverse' : ''}`}
                        onHoverStart={() => setHoveredMsgId(msg.id)}
                        onHoverEnd={() => setHoveredMsgId(null)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        layout
                      >
                        {showHeader && (
                          <Avatar className="h-9 w-9 mt-0.5 shrink-0">
                            <AvatarImage src={msg.sender?.profile?.avatar || ''} />
                            <AvatarFallback className="text-[10px]">{getInitials(msg.sender?.profile?.username || 'U')}</AvatarFallback>
                          </Avatar>
                        )}
                        {!showHeader && <div className="w-9 shrink-0" />}
                        <div className={`flex flex-col min-w-0 max-w-[70%] ${isOwnMsg ? 'items-end' : ''}`}>
                          {showHeader && (
                            <div className={`flex items-center gap-2 mb-1 ${isOwnMsg ? 'flex-row-reverse' : ''}`}>
                              <span className="text-sm font-semibold">{msg.sender?.profile?.username}</span>
                              <span className="text-[10px] text-muted-foreground">{formatRelativeTime(msg.createdAt)}</span>
                            </div>
                          )}
                          {msg.media?.length > 0 && msg.media.map((url: string, i: number) => (
                            url.match(/\.(mp4|webm|ogg)$/i)
                              ? <video key={i} src={url} controls className="max-w-60 max-h-40 rounded-xl border border-border/30" />
                              : <img key={i} src={url} alt="" className="max-w-60 max-h-40 rounded-xl object-cover border border-border/30" />
                          ))}
                          {msg.content && (
                            <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${isOwnMsg ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted/70 border border-border/30 rounded-tl-sm'}`}>
                              {msg.content}
                            </div>
                          )}
                          <AnimatePresence>
                            {isHovered && (
                              <motion.div className={`flex items-center gap-0.5 mt-1 ${isOwnMsg ? 'flex-row-reverse' : ''}`} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                                <button className="p-1 rounded-lg hover:bg-accent text-muted-foreground transition-all"><Heart className="h-3 w-3" /></button>
                                <button className="p-1 rounded-lg hover:bg-accent text-muted-foreground transition-all"><MoreVertical className="h-3 w-3" /></button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {chatId && typingUsers[chatId]?.length > 0 && (
                  <motion.div className="flex items-center gap-2 text-xs text-muted-foreground py-1 ml-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex gap-1">
                      {[0, 150, 300].map((delay, i) => (
                        <span key={i} className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full" style={{ animation: 'typing-dot 1.4s ease-in-out infinite', animationDelay: `${delay}ms` }} />
                      ))}
                    </div>
                    Typing...
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-border/50 bg-muted/10">
              <div className="max-w-3xl mx-auto flex items-center gap-2 bg-muted/30 rounded-xl px-4 py-2 border border-border/30">
                <Input
                  placeholder={`Message @${profile?.username}`}
                  value={msgText}
                  onChange={(e) => {
                    setMsgText(e.target.value);
                    if (socket && chatId) socket.emit('typing:start', chatId);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  className="flex-1 h-10 border-0 bg-transparent text-sm focus-visible:ring-0 px-0"
                  variant="ghost"
                />
                <Button variant="gradient" size="icon" className="h-9 w-9 rounded-xl" disabled={!msgText.trim()} onClick={sendMessage} animate>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile header */}
      <Card variant="glass" className="overflow-hidden border-border/60" hover={false}>
        <motion.div
          className="h-48 md:h-64 bg-gradient-to-br from-indigo-950 via-slate-950 to-violet-950 relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {profile.banner && <img src={profile.banner} alt="" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-grid opacity-5" />
        </motion.div>
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-20 mb-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}>
              <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-background ring-2 ring-indigo-500 shadow-md" hover>
                <AvatarImage src={profile.avatar || ''} />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">{getInitials(profile.username)}</AvatarFallback>
              </Avatar>
            </motion.div>
            <div className="flex-1 pt-14 md:pt-0">
              <motion.div className="flex flex-col md:flex-row md:items-center gap-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{profile.displayName || profile.username}</h1>
                <span className="text-muted-foreground">@{profile.username}</span>
              </motion.div>
              <motion.div className="flex flex-wrap items-center gap-2 mt-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <Badge variant="rank" className={getRankColor(profile.rank)}><Trophy className="h-3 w-3 mr-1" />{profile.rank || 'Unranked'}</Badge>
                <Badge variant="outline">{profile.role || 'Flex'}</Badge>
                {profile.country && <Badge variant="outline"><MapPin className="h-3 w-3 mr-1" />{profile.country}</Badge>}
                
                {/* Dynamically derived gaming style/status badges */}
                {profile.winRate >= 60 && (
                  <Badge variant="neon" className="bg-success/5 border-success/30 text-success gap-1 text-[10px] py-0.5 px-2">
                    <Sparkles className="h-2.5 w-2.5 animate-pulse" /> Dominator
                  </Badge>
                )}
                {profile.kd >= 2.0 && (
                  <Badge variant="neon" className="bg-primary/5 border-primary/30 text-primary gap-1 text-[10px] py-0.5 px-2">
                    <Target className="h-2.5 w-2.5" /> Sharp Shooter
                  </Badge>
                )}
                {profile.achievements?.length >= 5 && (
                  <Badge variant="neon" className="bg-yellow-500/5 border-yellow-500/30 text-yellow-500 gap-1 text-[10px] py-0.5 px-2">
                    <Award className="h-2.5 w-2.5 text-yellow-500" /> Completionist
                  </Badge>
                )}
              </motion.div>
            </div>
            {!isOwn ? (
              <motion.div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <Button
                  variant={friendStatus === 'friends' ? 'secondary' : friendStatus === 'pending' ? 'outline' : 'gradient'}
                  size="sm"
                  className="gap-1.5 w-full sm:w-auto h-11"
                  onClick={() => sendFriendReq.mutate()}
                  disabled={sendFriendReq.isPending || !!friendStatus}
                  animate
                >
                  {friendStatus === 'friends' ? <UserCheck className="h-4 w-4" /> : friendStatus === 'pending' ? <Loader2 className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {friendStatus === 'friends' ? 'Friends' : friendStatus === 'pending' ? 'Pending' : 'Add Friend'}
                </Button>
                <Button
                  variant={following ? 'secondary' : 'gradient'}
                  size="sm"
                  className="gap-1.5 min-w-[100px] w-full sm:w-auto h-11"
                  onClick={() => toggleFollow.mutate()}
                  disabled={toggleFollow.isPending}
                  animate
                >
                  {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {following ? 'Following' : 'Follow'}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 w-full sm:w-auto h-11" onClick={() => setChatOpen(true)}>
                  <MessageCircle className="h-4 w-4" /> Message
                </Button>
              </motion.div>
            ) : (
              <motion.div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <Link href="/profile/settings" className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="gap-1.5 w-full sm:w-auto h-11">
                    <Settings className="h-4 w-4" /> Edit Profile
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
          {profile.bio && <motion.p className="text-sm text-muted-foreground mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>{profile.bio}</motion.p>}

          {/* Social Counts Row */}
          <motion.div 
            className="flex flex-wrap items-center gap-5 py-3 my-4 border-t border-b border-border/30 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <button 
              onClick={() => openSocialList('connections')}
              className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer group"
            >
              <Users className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-bold">{profile.connectionsCount || 0}</span>
              <span className="text-muted-foreground text-xs">Connections</span>
            </button>
            <button 
              onClick={() => openSocialList('followers')}
              className="flex items-center gap-1.5 hover:text-gaming-pink transition-colors cursor-pointer group"
            >
              <Heart className="h-4 w-4 text-gaming-pink group-hover:scale-110 transition-transform" />
              <span className="font-bold">{profile.user?._count?.followers || 0}</span>
              <span className="text-muted-foreground text-xs">Followers</span>
            </button>
            <button 
              onClick={() => openSocialList('following')}
              className="flex items-center gap-1.5 hover:text-gaming-cyan transition-colors cursor-pointer group"
            >
              <UserCheck className="h-4 w-4 text-gaming-cyan group-hover:scale-110 transition-transform" />
              <span className="font-bold">{profile.user?._count?.following || 0}</span>
              <span className="text-muted-foreground text-xs">Following</span>
            </button>
            <div className="flex items-center gap-1.5 cursor-default group">
              <Sparkles className="h-4 w-4 text-yellow-500 group-hover:rotate-12 transition-transform" />
              <span className="font-bold">{profile.profileViews || 0}</span>
              <span className="text-muted-foreground text-xs">Views</span>
            </div>
            <div className="flex items-center gap-1.5 cursor-default group">
              <Star className="h-4 w-4 text-gaming-purple group-hover:scale-110 transition-transform" />
              <span className="font-bold">{profile.user?._count?.posts || 0}</span>
              <span className="text-muted-foreground text-xs">Posts</span>
            </div>
          </motion.div>

          <motion.div className="flex flex-wrap gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            {profile.mainGames?.map((game: string, i: number) => (<Badge key={i} variant="secondary" className="gap-1"><Gamepad2 className="h-3 w-3" />{game}</Badge>))}
            {profile.languages?.map((lang: string, i: number) => (<Badge key={i} variant="outline">{lang}</Badge>))}
          </motion.div>
          {socialLinks.length > 0 && (
            <motion.div className="flex gap-2 mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              {socialLinks.map((link, i) => (
                <a key={i} href={link.href} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1.5 hover:border-primary/50"><link.icon className="h-4 w-4" />{link.label}</Button>
                </a>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard value={`${profile.winRate}%`} label="Win Rate" color="text-success" delay={0} />
        <StatCard value={profile.kd} label="K/D Ratio" color="text-primary" delay={0.1} />
        <StatCard value={`${profile.accuracy}%`} label="Accuracy" color="text-gaming-purple" delay={0.2} />
        <StatCard value={profile.totalMatches} label="Total Matches" color="text-yellow-500" delay={0.3} />
      </div>

      {/* Content tabs */}
      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="w-full justify-start bg-muted/30 p-1 rounded-xl">
          <TabsTrigger value="achievements" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"><Award className="h-4 w-4 mr-1" />Achievements ({profile.achievements?.length || 0})</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"><Swords className="h-4 w-4 mr-1" />History ({profile.tournamentHistory?.length || 0})</TabsTrigger>
          <TabsTrigger value="posts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"><Star className="h-4 w-4 mr-1" />Posts ({profile.user?._count?.posts || 0})</TabsTrigger>
          <TabsTrigger value="about" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"><Shield className="h-4 w-4 mr-1" />About</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements">
          <Card variant="glass">
            <CardContent className="p-6">
              {profile.achievements?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.achievements.map((a: any, i: number) => (
                    <motion.div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-all bg-muted/10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                        <Award className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-center py-8">No achievements yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card variant="glass">
            <CardContent className="p-6">
              {profile.tournamentHistory?.length > 0 ? (
                <div className="space-y-3">
                  {profile.tournamentHistory.map((h: any, i: number) => (
                    <motion.div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-all" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <div>
                        <p className="text-sm font-medium">{h.tournamentName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(h.date)}</p>
                      </div>
                      <Badge variant={h.placement === '1st' ? 'default' : 'secondary'}>{h.placement}</Badge>
                    </motion.div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-center py-8">No tournament history</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts">
          <Card variant="glass">
            <CardContent className="p-6 space-y-4">
              {posts?.map((post: any, i: number) => (
                <motion.div key={i} className="p-4 rounded-xl border border-border/50 hover:border-primary/20 transition-all" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <p className="text-sm">{post.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{post._count?.likes}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{post._count?.comments}</span>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card variant="glass">
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold">Gaming Info</h3>
                  <div className="space-y-2 text-sm bg-muted/20 rounded-xl p-4 border border-border/30">
                    {[
                      { label: 'Play Style', value: profile.playStyle },
                      { label: 'Communication', value: profile.communicationStyle },
                      { label: 'Active Time', value: profile.activeTime },
                      { label: 'Experience', value: profile.experienceLevel },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{item.value || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold">Stats Breakdown</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1.5"><span>Win Rate</span><span className="font-semibold text-success">{profile.winRate}%</span></div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <motion.div className="h-full bg-gradient-to-r from-success/70 to-success rounded-full" initial={{ width: 0 }} animate={{ width: `${profile.winRate}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1.5"><span>K/D Ratio</span><span className="font-semibold text-primary">{profile.kd}</span></div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <motion.div className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min((profile.kd / 5) * 100, 100)}%` }} transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1.5"><span>Accuracy</span><span className="font-semibold text-gaming-purple">{profile.accuracy}%</span></div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <motion.div className="h-full bg-gradient-to-r from-gaming-purple/70 to-gaming-purple rounded-full" initial={{ width: 0 }} animate={{ width: `${profile.accuracy}%` }} transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Social List Modal (Connections, Followers, Following) */}
      <AnimatePresence>
        {listModalOpen && listType && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-background border border-border/50 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl relative overflow-hidden"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/50 bg-muted/10 shrink-0">
                <div>
                  <h3 className="font-bold text-base capitalize">{listType}</h3>
                  <p className="text-xs text-muted-foreground">
                    {filteredList.length} {filteredList.length === 1 ? 'user' : 'users'} found
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setListModalOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Local Search input */}
              <div className="p-3 border-b border-border/30 bg-muted/5 shrink-0 flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search user..."
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  className="h-8 border-0 bg-transparent text-xs focus-visible:ring-0 px-0"
                  variant="ghost"
                />
              </div>

              {/* List Content */}
              <ScrollArea className="flex-1 p-4">
                {listLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Loading list...</span>
                  </div>
                ) : filteredList.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">No users found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredList.map((item: any) => {
                      if (!item) return null;
                      const isMe = item.id === user?.id;
                      const isFriend = friendList?.includes(item.id);
                      const isFollowingItem = followingList?.includes(item.id);

                      return (
                        <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/15 border border-transparent hover:border-border/30 transition-all duration-200">
                          {/* User Info */}
                          <Link 
                            href={`/profile/${item.profile?.username}`}
                            onClick={() => setListModalOpen(false)}
                            className="flex items-center gap-3 min-w-0"
                          >
                            <Avatar className="h-9 w-9 border border-border/30">
                              <AvatarImage src={item.profile?.avatar || ''} />
                              <AvatarFallback className="text-xs">{getInitials(item.profile?.username || '')}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate hover:text-primary transition-colors">
                                {item.profile?.displayName || item.profile?.username}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                @{item.profile?.username}
                              </p>
                            </div>
                          </Link>

                          {/* Action buttons */}
                          {!isMe && (
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Follow / Unfollow */}
                              <Button
                                variant={isFollowingItem ? 'outline' : 'secondary'}
                                onClick={() => listToggleFollow.mutate(item.id)}
                                disabled={listToggleFollow.isPending}
                                className="h-7 text-[10px] px-2 rounded-lg font-bold"
                              >
                                {isFollowingItem ? 'Unfollow' : 'Follow'}
                              </Button>

                              {/* Connect / Connected */}
                              <Button
                                variant={isFriend ? 'default' : 'outline'}
                                onClick={() => !isFriend && listConnect.mutate(item.id)}
                                disabled={isFriend || listConnect.isPending}
                                className={`h-7 text-[10px] px-2 rounded-lg font-bold ${isFriend ? 'bg-success/10 text-success hover:bg-success/15 border-success/30' : ''}`}
                              >
                                {isFriend ? 'Connected' : 'Connect'}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
