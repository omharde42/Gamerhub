'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search, Send, Paperclip, Image as ImageIcon, MoreVertical, Plus, Loader2,
  MessageSquare, UserPlus, Phone, Mic, Headphones, Settings,
  Hash, Users, ChevronDown, ChevronRight, ChevronLeft, Heart, Smile, Reply,
  Trash2, Edit3, Pin, Flag, X, Link as LinkIcon, ExternalLink,
  Sparkles, Volume2, Pause, Play, Square
} from 'lucide-react';
import { getInitials, formatRelativeTime, cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

function DiscordMessagesPage() {
  const searchParams = useSearchParams();
  const userIdParam = searchParams ? searchParams.get('userId') : null;
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [shareOpen, setShareOpen] = useState<string | null>(null);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);

  // Voice recording state variables
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voicePaused, setVoicePaused] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null);

  // Voice recording reference values
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<any>(null);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceStreamRef.current = stream;
      voiceChunksRef.current = [];
      
      const recorder = new MediaRecorder(stream);
      voiceRecorderRef.current = recorder;
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) voiceChunksRef.current.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
        setVoiceBlob(blob);
        const url = URL.createObjectURL(blob);
        setVoicePreviewUrl(url);
        setIsRecordingVoice(false);
        
        // Release tracks
        stream.getTracks().forEach(t => t.stop());
        voiceStreamRef.current = null;
      };
      
      recorder.start(100);
      setIsRecordingVoice(true);
      setVoicePaused(false);
      setVoiceDuration(0);
      
      voiceTimerRef.current = setInterval(() => {
        setVoiceDuration(d => d + 1);
      }, 1000);
      
      toast.success('Voice recording started');
    } catch (err) {
      toast.error('Microphone access denied or not available');
    }
  };

  const pauseVoiceRecording = () => {
    if (voiceRecorderRef.current && voiceRecorderRef.current.state === 'recording') {
      voiceRecorderRef.current.pause();
      clearInterval(voiceTimerRef.current);
      setVoicePaused(true);
    }
  };

  const resumeVoiceRecording = () => {
    if (voiceRecorderRef.current && voiceRecorderRef.current.state === 'paused') {
      voiceRecorderRef.current.resume();
      voiceTimerRef.current = setInterval(() => {
        setVoiceDuration(d => d + 1);
      }, 1000);
      setVoicePaused(false);
    }
  };

  const cancelVoiceRecording = () => {
    clearInterval(voiceTimerRef.current);
    if (voiceRecorderRef.current && voiceRecorderRef.current.state !== 'inactive') {
      voiceRecorderRef.current.stop();
    }
    voiceStreamRef.current?.getTracks().forEach(t => t.stop());
    voiceStreamRef.current = null;
    voiceRecorderRef.current = null;
    setVoiceBlob(null);
    if (voicePreviewUrl) {
      URL.revokeObjectURL(voicePreviewUrl);
    }
    setVoicePreviewUrl(null);
    setIsRecordingVoice(false);
    setVoicePaused(false);
    setVoiceDuration(0);
  };

  const sendVoiceRecording = () => {
    if (!voiceBlob || !selectedChat) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      if (socket) {
        socket.emit('message:send', {
          chatId: selectedChat,
          content: '',
          voiceNote: base64Data,
        });
      } else {
        sendViaApi.mutate({
          chatId: selectedChat,
          content: '',
          voiceNote: base64Data,
        });
      }
      cancelVoiceRecording();
      queryClient.invalidateQueries({ queryKey: ['messages', selectedChat] });
      toast.success('Voice message sent');
    };
    reader.readAsDataURL(voiceBlob);
  };

  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: () => api.get('/chat').then(r => r.data.data),
    refetchInterval: 10000,
  });

  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedChat],
    queryFn: () => api.get(`/chat/${selectedChat}/messages`).then(r => r.data.data),
    enabled: !!selectedChat,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['search-users-chat', userSearch],
    queryFn: () => api.get(`/profiles/search?q=${encodeURIComponent(userSearch)}&limit=10`).then(r => r.data.data),
    enabled: userSearch.trim().length > 0,
  });

  const createDirectChat = useMutation({
    mutationFn: (userId: string) => api.post('/chat/direct', { userId }),
    onSuccess: (res) => {
      const chat = res.data.data;
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      setSelectedChat(chat.id);
      setNewChatOpen(false);
      setUserSearch('');
    },
    onError: () => toast.error('Failed to create chat'),
  });

  useEffect(() => {
    if (userIdParam) {
      createDirectChat.mutate(userIdParam);
    }
  }, [userIdParam]);

  const sendViaApi = useMutation({
    mutationFn: (data: { chatId: string; content: string; media?: string[]; voiceNote?: string }) =>
      api.post(`/chat/${data.chatId}/messages`, { content: data.content, media: data.media, voiceNote: data.voiceNote }),
    onSuccess: () => { refetchMessages(); queryClient.invalidateQueries({ queryKey: ['chats'] }); setFilePreview(null); },
    onError: () => toast.error('Failed to send message'),
  });

  useEffect(() => { if (messagesData) setMessages(messagesData); }, [messagesData]);

  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        if (user?.id) socket?.emit('user:online', user.id);
      });
      socket.on('user:online', (userId: string) => setOnlineUsers(p => new Set(p).add(userId)));
      socket.on('user:offline', (userId: string) => setOnlineUsers(p => { const n = new Set(p); n.delete(userId); return n; }));
      socket.on('typing:start', ({ userId: uid, chatId }: { userId: string; chatId: string }) => {
        if (uid !== user?.id) setTypingUsers(p => ({ ...p, [chatId]: [...(p[chatId] || []).filter(id => id !== uid), uid] }));
      });
      socket.on('typing:stop', ({ userId: uid, chatId }: { userId: string; chatId: string }) => {
        setTypingUsers(p => ({ ...p, [chatId]: (p[chatId] || []).filter(id => id !== uid) }));
      });
      if (user?.id) socket.emit('user:online', user.id);
    }
  }, [socket, user?.id]);

  useEffect(() => {
    if (socket && selectedChat) {
      socket.emit('join:chat', selectedChat);
      const onMessage = (msg: any) => {
        setMessages(prev => [...prev, msg]);
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      };
      socket.on('message:new', onMessage);
      return () => {
        socket.emit('leave:chat', selectedChat);
        socket.off('message:new', onMessage);
      };
    }
  }, [selectedChat, socket, queryClient]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  let typingTimeout: any;
  const handleTyping = () => {
    if (!selectedChat || !socket) return;
    socket.emit('typing:start', selectedChat);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket?.emit('typing:stop', selectedChat), 2000);
  };

  const sendMessage = () => {
    if ((!message.trim() && !filePreview) || !selectedChat) return;
    const media = filePreview ? [filePreview] : undefined;
    if (socket) {
      socket.emit('message:send', { chatId: selectedChat, content: message, media });
    } else {
      sendViaApi.mutate({ chatId: selectedChat, content: message, media });
    }
    setMessage('');
    setFilePreview(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10MB)'); return; }
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const getOtherParticipant = (chat: any) => chat.participants?.find((p: any) => p.user?.id !== user?.id)?.user;

  const handleSelectChat = (chatId: string) => {
    setSelectedChat(chatId);
    api.post(`/chat/${chatId}/read`).catch(() => {});
  };

  const isOnline = (userId: string) => onlineUsers.has(userId);

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/messages?chat=${id}`);
    toast.success('Link copied');
    setShareOpen(null);
  };

  return (
    <div className="h-[calc(100vh-9.5rem)] md:h-[calc(100vh-7rem)] flex border border-border/40 rounded-none md:rounded-2xl overflow-hidden bg-card/45 backdrop-blur-md shadow-2xl w-full max-w-full md:max-w-7xl mx-auto relative group/container">
      {/* Server sidebar (Desktop only) */}
      <div className="w-16 bg-muted/40 border-r border-border/40 hidden md:flex flex-col items-center py-4 gap-3 shrink-0">
        <Link href="/dashboard">
          <motion.div 
            whileHover={{ scale: 1.1, borderRadius: "12px" }} 
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gaming-purple to-gaming-pink flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md shadow-gaming-purple/20"
          >
            <MessageSquare className="h-5 w-5 text-white" />
          </motion.div>
        </Link>
        <Separator className="w-8 bg-border/40" />
        {chats?.slice(0, 6).map((chat: any) => {
          const other = getOtherParticipant(chat);
          const short = other?.profile?.username?.charAt(0).toUpperCase() || 'G';
          const isSel = selectedChat === chat.id;
          const online = other ? isOnline(other.id) : false;
          return (
            <div key={chat.id} className="relative">
              <motion.button
                whileHover={{ scale: 1.08, borderRadius: "12px" }} 
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectChat(chat.id)}
                className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300",
                  isSel 
                    ? "bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20" 
                    : "bg-muted/60 text-muted-foreground hover:bg-primary/20 hover:text-primary"
                )}
                title={other?.profile?.username}
              >
                {short}
              </motion.button>
              {online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-card animate-pulse" />}
            </div>
          );
        })}
        <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
          <DialogTrigger asChild>
            <motion.button 
              whileHover={{ scale: 1.08, rotate: 90, borderRadius: "12px" }} 
              className="w-10 h-10 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all duration-300"
            >
              <Plus className="h-5 w-5" />
            </motion.button>
          </DialogTrigger>
          <DialogContent className="glass-strong border-primary/30">
            <DialogHeader><DialogTitle className="text-lg font-bold bg-gradient-to-r from-gaming-purple to-gaming-cyan bg-clip-text text-transparent">New Message</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search players..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} autoFocus className="pl-9" variant="neon" />
              </div>
              <ScrollArea className="max-h-72 pr-2">
                <div className="space-y-1">
                  {searchResults?.filter((p: any) => p.userId !== user?.id).map((profile: any) => (
                    <motion.div 
                      key={profile.id} 
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary/10 hover:border-primary/10 border border-transparent cursor-pointer transition-colors"
                      onClick={() => createDirectChat.mutate(profile.userId)}
                      whileHover={{ x: 4 }}
                    >
                      <Avatar className="h-9 w-9"><AvatarImage src={profile.avatar || ''} /><AvatarFallback className="text-xs">{getInitials(profile.username)}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate text-foreground">{profile.displayName || profile.username}</p><p className="text-xs text-muted-foreground">@{profile.username}</p></div>
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </motion.div>
                  ))}
                </div>
                {userSearch && searchResults?.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No players found</p>}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Channel list (DM list) */}
      <div className={cn(
        "w-full md:w-60 border-r border-border/40 bg-card/30 flex flex-col shrink-0 transition-all duration-300",
        selectedChat ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-border/40 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm flex items-center gap-1.5 text-foreground uppercase tracking-wider">
              <Hash className="h-4 w-4 text-primary animate-pulse" />
              Direct Messages
            </h2>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-xl" onClick={() => setNewChatOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Find player..." className="pl-9 h-9 text-xs bg-muted/40 border-0 rounded-xl" variant="ghost" />
          </div>
        </div>
        <ScrollArea className="flex-1 px-2 py-2">
          {chatsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : chats?.length === 0 ? (
            <div className="flex flex-col items-center py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center opacity-60">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">No conversations yet</p>
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl" onClick={() => setNewChatOpen(true)}>
                <Plus className="h-3 w-3 mr-1" /> New Message
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {chats?.map((chat: any) => {
                const other = getOtherParticipant(chat);
                const isSelected = selectedChat === chat.id;
                const online = other ? isOnline(other.id) : false;
                return (
                  <motion.div
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all duration-200 border",
                      isSelected 
                        ? "bg-primary/10 text-primary border-primary/20 shadow-sm" 
                        : "text-muted-foreground hover:bg-accent/40 hover:text-foreground border-transparent"
                    )}
                    whileHover={{ x: 3 }}
                    layout
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-9 w-9"><AvatarImage src={other?.profile?.avatar || ''} /><AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials(other?.profile?.username || 'G')}</AvatarFallback></Avatar>
                      {online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-card" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold truncate text-foreground">{other?.profile?.username || 'Unknown'}</p>
                        {chat.messages?.[0] && (
                          <span className="text-[9px] text-muted-foreground shrink-0">{formatRelativeTime(chat.messages[0].createdAt)}</span>
                        )}
                      </div>
                      {chat.messages?.[0] && <p className="text-xs text-muted-foreground truncate mt-0.5">{chat.messages[0].content}</p>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="p-3 border-t border-border/40 bg-muted/20">
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-card/40 border border-border/30 shadow-sm transition-colors">
            <Avatar className="h-8 w-8" status="online">
              <AvatarImage src={user?.profile?.avatar || ''} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials(user?.profile?.username || 'U')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-foreground">{user?.profile?.username}</p>
              <p className="text-[9px] text-success font-medium">Online</p>
            </div>
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg"><Mic className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg"><Headphones className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg"><Settings className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className={cn(
        "flex-1 flex flex-col bg-background/20 backdrop-blur-sm transition-all duration-300",
        selectedChat ? "flex" : "hidden md:flex"
      )}>
        {selectedChat ? (
          <>
            {/* Channel header */}
            <div className="h-14 border-b border-border/40 flex items-center px-4 shrink-0 bg-muted/10">
              {(() => {
                const chat = chats?.find((c: any) => c.id === selectedChat);
                const other = chat ? getOtherParticipant(chat) : null;
                const online = other ? isOnline(other.id) : false;
                return (
                  <div className="flex items-center gap-2.5 w-full">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground mr-1 rounded-xl" 
                      onClick={() => setSelectedChat(null)}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="relative">
                      <Avatar className="h-8 w-8"><AvatarImage src={other?.profile?.avatar || ''} /><AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials(other?.profile?.username || 'U')}</AvatarFallback></Avatar>
                      {online && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-success rounded-full border-2 border-card animate-pulse" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{other?.profile?.username || 'User'}</p>
                      <p className="text-[10px] font-medium" style={{ color: online ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))' }}>
                        {online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                    <div className="flex-1" />
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-xl"><Phone className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-xl" onClick={() => copyLink(selectedChat)} title="Copy chat link"><LinkIcon className="h-4 w-4" /></Button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Messages list */}
            <ScrollArea className="flex-1 px-4 bg-grid bg-[length:40px_40px]">
              <div className="py-6 space-y-3 max-w-4xl mx-auto">
                <AnimatePresence initial={false}>
                  {messages?.map((msg: any, idx: number) => {
                    const isOwn = msg.sender?.id === user?.id;
                    const prev = messages[idx - 1];
                    const showHeader = !prev || prev.sender?.id !== msg.sender?.id;
                    const isHovered = hoveredMsgId === msg.id;
                    const online = isOnline(msg.sender?.id);
                    return (
                      <motion.div
                        key={msg.id}
                        className={cn(
                          "group flex gap-3 transition-all duration-200", 
                          showHeader ? 'mt-4' : 'mt-1', 
                          isOwn ? 'flex-row-reverse' : ''
                        )}
                        onHoverStart={() => setHoveredMsgId(msg.id)}
                        onHoverEnd={() => setHoveredMsgId(null)}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, type: "spring", stiffness: 200, damping: 20 }}
                        layout
                      >
                        {showHeader && (
                          <div className={cn("shrink-0", isOwn ? 'order-2' : '')}>
                            <Avatar className="h-8 w-8 mt-0.5" status={online ? 'online' : undefined}>
                              <AvatarImage src={msg.sender?.profile?.avatar || ''} />
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials(msg.sender?.profile?.username || 'U')}</AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        {!showHeader && <div className="w-8 shrink-0" />}
                        <div className={cn("flex flex-col min-w-0 max-w-[70%]", isOwn ? 'items-end' : '')}>
                          {showHeader && (
                            <div className={cn("flex items-center gap-2 mb-1", isOwn ? 'flex-row-reverse' : '')}>
                              <span className="text-xs font-bold hover:text-primary cursor-pointer transition-colors text-foreground">{msg.sender?.profile?.username}</span>
                              <span className="text-[9px] text-muted-foreground">{formatRelativeTime(msg.createdAt)}</span>
                            </div>
                          )}
                          {msg.media?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {msg.media.map((url: string, i: number) => (
                                url.match(/\.(mp4|webm|ogg)$/i)
                                  ? <video key={i} src={url} controls className="max-w-60 max-h-40 rounded-xl border border-border/30 shadow-md animate-scale-in" />
                                  : <img key={i} src={url} alt="" className="max-w-60 max-h-40 rounded-xl object-cover border border-border/30 shadow-md hover:scale-[1.02] transition-transform duration-300 cursor-zoom-in animate-scale-in" />
                              ))}
                            </div>
                          )}
                          {msg.voiceNote && (
                            <div className="mb-1.5 animate-scale-in max-w-full overflow-x-auto">
                              <audio src={msg.voiceNote} controls className="max-w-[240px] xs:max-w-[260px] h-9 rounded-xl border border-border/30 bg-card" />
                            </div>
                          )}
                          {msg.content && (
                            <div className={cn(
                              "px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative border transition-all duration-300",
                              isOwn
                                ? 'bg-gradient-to-br from-gaming-purple to-gaming-pink text-white rounded-tr-sm shadow-md shadow-gaming-purple/20 border-gaming-purple/20'
                                : 'bg-card/75 border-border/40 text-foreground rounded-tl-sm shadow-sm backdrop-blur-sm'
                            )}>
                              {msg.content}
                            </div>
                          )}
                          
                          {/* Floating micro-actions menu */}
                          <AnimatePresence>
                            {isHovered && (
                              <motion.div
                                className={cn("flex items-center gap-0.5 mt-1 px-1.5 py-0.5 rounded-lg bg-card/90 border border-border/40 shadow-md backdrop-blur-md", isOwn ? 'flex-row-reverse' : '')}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.1 }}
                              >
                                <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-all" onClick={() => toast.success('Reacted!')}><Heart className="h-3 w-3 text-red-500 fill-red-500/20" /></button>
                                <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-all"><Reply className="h-3 w-3" /></button>
                                <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-all"><Smile className="h-3 w-3" /></button>
                                <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-all"><MoreVertical className="h-3 w-3" /></button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Typing indicator */}
                {selectedChat && typingUsers[selectedChat]?.length > 0 && (
                  <motion.div
                    className="flex items-center gap-2 text-xs text-muted-foreground py-1 ml-11"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex gap-1">
                      {[0, 150, 300].map((delay, i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 bg-primary/60 rounded-full"
                          style={{ animation: 'typing-dot 1.4s ease-in-out infinite', animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground/80">{typingUsers[selectedChat].length} gamer{typingUsers[selectedChat].length > 1 ? 's' : ''} typing...</span>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="p-4 border-t border-border/40 bg-muted/10">
              {filePreview && (
                <motion.div
                  className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-xl border border-border/30"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <img src={filePreview} alt="" className="h-10 w-10 rounded-lg object-cover shadow-sm" />
                  <span className="text-xs text-muted-foreground flex-1">Image ready to send</span>
                  <button onClick={() => setFilePreview(null)} className="hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 transition-colors"><X className="h-4 w-4" /></button>
                </motion.div>
              )}
              <div className="flex items-center gap-2 bg-card/65 rounded-2xl px-3 py-1.5 border border-border/40 transition-all duration-300 focus-within:border-primary/40 focus-within:shadow-md focus-within:shadow-primary/5 focus-within:ring-1 focus-within:ring-primary/10 min-h-[46px]">
                {isRecordingVoice ? (
                  // Recording Panel Overlay
                  <div className="flex items-center w-full justify-between animate-fade-in">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 bg-destructive rounded-full animate-pulse shrink-0" />
                      <span className="text-[11px] font-mono text-muted-foreground tracking-wider shrink-0">
                        {Math.floor(voiceDuration / 60).toString().padStart(2, '0')}:
                        {(voiceDuration % 60).toString().padStart(2, '0')}
                      </span>
                      {/* Animated Bouncing Voice Waves */}
                      <div className="flex items-center gap-0.5 px-3 h-5 overflow-hidden min-w-[60px] xs:min-w-[100px] shrink-0">
                        {[1, 2, 3, 4, 3, 2, 3, 4, 5, 4, 3, 2, 3, 4].map((h, i) => (
                          <motion.div
                            key={i}
                            className="w-[2px] bg-primary rounded-full shrink-0"
                            animate={{ height: voicePaused ? 3 : [3, h * 3, 3] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.04 }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={voicePaused ? resumeVoiceRecording : pauseVoiceRecording}
                        className="p-1.5 hover:bg-muted/80 rounded-xl text-muted-foreground hover:text-primary transition-all"
                        title={voicePaused ? "Resume recording" : "Pause recording"}
                      >
                        {voicePaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => voiceRecorderRef.current?.stop()}
                        className="p-1.5 hover:bg-muted/80 rounded-xl text-muted-foreground hover:text-primary transition-all"
                        title="Finish recording"
                      >
                        <Square className="h-4 w-4 text-primary fill-primary/10" />
                      </button>
                      <button
                        onClick={cancelVoiceRecording}
                        className="p-1.5 hover:bg-destructive/10 rounded-xl text-muted-foreground hover:text-destructive transition-all"
                        title="Cancel recording"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : voicePreviewUrl ? (
                  // Preview Player Overlay
                  <div className="flex items-center w-full justify-between gap-3 animate-fade-in">
                    <audio src={voicePreviewUrl} controls className="flex-1 h-9 rounded-xl border border-border/30 bg-muted/40" />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={cancelVoiceRecording}
                        className="p-2 hover:bg-destructive/10 rounded-xl text-muted-foreground hover:text-destructive transition-all"
                        title="Delete voice message"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Button
                        variant="gradient"
                        size="icon"
                        className="h-8 w-8 rounded-xl shadow-md shadow-primary/20 shrink-0"
                        onClick={sendVoiceRecording}
                        animate
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Standard Chat Input Bar
                  <>
                    <input type="file" accept="image/*,video/*" hidden ref={fileInputRef} onChange={handleFileSelect} />
                    <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-accent/50 transition-all shrink-0" onClick={() => fileInputRef.current?.click()}><Plus className="h-5 w-5 text-primary" /></button>
                    <Input
                      placeholder={`Message ${(() => { const c = chats?.find((c: any) => c.id === selectedChat); const o = c ? getOtherParticipant(c) : null; return o?.profile?.username || 'User'; })()}`}
                      value={message}
                      onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                      className="flex-1 h-9 border-0 bg-transparent text-sm focus-visible:ring-0 px-0 placeholder:text-muted-foreground/60 min-w-0"
                      variant="ghost"
                    />
                    <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-accent/50 transition-all shrink-0" onClick={startVoiceRecording} title="Record voice message"><Mic className="h-5 w-5" /></button>
                    <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-accent/50 transition-all shrink-0" onClick={() => fileInputRef.current?.click()}><ImageIcon className="h-5 w-5" /></button>
                    <Button variant="gradient" size="icon" className="h-8 w-8 rounded-xl shadow-md shadow-primary/20 shrink-0" disabled={!message.trim() && !filePreview} onClick={sendMessage} animate>
                      <Send className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-muted/5 to-muted/20 p-6">
            <motion.div className="text-center space-y-4 max-w-sm" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gaming-purple/20 to-gaming-cyan/20 flex items-center justify-center mx-auto border border-primary/20 shadow-inner relative group-hover/container:animate-pulse">
                <MessageSquare className="h-10 w-10 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text">Welcome to Messages</h2>
              <p className="text-sm text-muted-foreground">Select an existing conversation from the list or send a message to start a new chat with fellow gamers.</p>
              <div className="flex justify-center gap-3 pt-2">
                <Button variant="gradient" size="sm" className="gap-1.5 rounded-xl shadow-md shadow-primary/10" onClick={() => setNewChatOpen(true)} animate>
                  <UserPlus className="h-4 w-4" /> New Message
                </Button>
                <Link href="/friends"><Button variant="outline" size="sm" className="gap-1.5 rounded-xl"><Search className="h-4 w-4" /> Find Players</Button></Link>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Right panel: member list / voice (Desktop only) */}
      {selectedChat && (
        <div className="w-56 border-l border-border/40 bg-card/20 hidden xl:flex flex-col">
          <div className="p-4 border-b border-border/40">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-success" /> Voice Setup
            </h3>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-success/10 text-success text-xs border border-success/20 shadow-sm animate-pulse-glow">
              <Phone className="h-3.5 w-3.5" />
              <span className="font-semibold">Voice Connected</span>
            </div>
            <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground px-1 py-1">
              <div className="flex gap-0.5 items-end h-3 w-4 shrink-0">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className="w-0.5 bg-success rounded-full" style={{ height: `${4 + Math.random() * 8}px`, animation: 'typing-dot 1.2s infinite ease-in-out', animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
              <span>No one is speaking</span>
            </div>
          </div>
          <Separator className="bg-border/40" />
          <div className="p-4 border-b border-border/40">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" /> Chat Members
            </h3>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-0.5">
              {(() => {
                const chat = chats?.find((c: any) => c.id === selectedChat);
                return chat?.participants?.map((p: any) => {
                  const prof = p.user?.profile;
                  const online = isOnline(p.user?.id);
                  return prof ? (
                    <motion.div
                      key={p.id}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-accent/40 cursor-pointer text-sm transition-colors border border-transparent hover:border-border/30"
                      whileHover={{ x: 2 }}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-7 w-7"><AvatarImage src={prof.avatar || ''} /><AvatarFallback className="text-[9px] bg-primary/10 text-primary">{getInitials(prof.username)}</AvatarFallback></Avatar>
                        {online && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-success rounded-full border-2 border-card" />}
                      </div>
                      <span className="text-xs font-semibold truncate text-foreground">{prof.username}</span>
                    </motion.div>
                  ) : null;
                });
              })()}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

function MessagesPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <DiscordMessagesPage />
    </Suspense>
  );
}

export default MessagesPageWrapper;
