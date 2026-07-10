'use client';
import { useState, useEffect, useRef } from 'react';
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
  Hash, Users, ChevronDown, ChevronRight, Heart, Smile, Reply,
  Trash2, Edit3, Pin, Flag, X, Link as LinkIcon, ExternalLink,
  Sparkles, Volume2
} from 'lucide-react';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

function DiscordMessagesPage() {
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

  const sendViaApi = useMutation({
    mutationFn: (data: { chatId: string; content: string; media?: string[] }) =>
      api.post(`/chat/${data.chatId}/messages`, { content: data.content, media: data.media }),
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
    <div className="h-[calc(100vh-8rem)] flex border border-border/50 rounded-xl overflow-hidden bg-card shadow-lg">
      {/* Server sidebar */}
      <div className="w-16 bg-muted/30 border-r border-border/50 hidden md:flex flex-col items-center py-3 gap-2">
        <Link href="/dashboard">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gaming-purple to-gaming-pink flex items-center justify-center cursor-pointer hover:rounded-xl transition-all duration-200 shadow-lg shadow-gaming-purple/20">
            <MessageSquare className="h-5 w-5 text-white" />
          </motion.div>
        </Link>
        <Separator className="w-8 bg-border/50" />
        {chats?.slice(0, 6).map((chat: any) => {
          const other = getOtherParticipant(chat);
          const short = other?.profile?.username?.charAt(0).toUpperCase() || 'G';
          const isSel = selectedChat === chat.id;
          const online = other ? isOnline(other.id) : false;
          return (
            <div key={chat.id} className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectChat(chat.id)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-200 hover:rounded-xl
                  ${isSel ? 'bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary'}`}
                title={other?.profile?.username}
              >
                {short}
              </motion.button>
              {online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-card" />}
            </div>
          );
        })}
        <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
          <DialogTrigger asChild>
            <motion.button whileHover={{ scale: 1.05, rotate: 90 }} className="w-10 h-10 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all duration-200 hover:rounded-xl">
              <Plus className="h-5 w-5" />
            </motion.button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Search players..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} autoFocus variant="neon" />
              <ScrollArea className="max-h-72">
                {searchResults?.filter((p: any) => p.userId !== user?.id).map((profile: any) => (
                  <motion.div key={profile.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer"
                    onClick={() => createDirectChat.mutate(profile.userId)}
                    whileHover={{ x: 4 }}>
                    <Avatar className="h-9 w-9"><AvatarImage src={profile.avatar || ''} /><AvatarFallback className="text-xs">{getInitials(profile.username)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{profile.displayName || profile.username}</p><p className="text-xs text-muted-foreground">@{profile.username}</p></div>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                ))}
                {userSearch && searchResults?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No players found</p>}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Channel list */}
      <div className="w-60 border-r border-border/50 bg-muted/10 hidden md:flex flex-col">
        <div className="p-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
              <Hash className="h-4 w-4 text-muted-foreground" />
              Direct Messages
            </h2>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Find chat..." className="pl-8 h-8 text-xs bg-muted/30 border-0" variant="ghost" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {chatsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : chats?.length === 0 ? (
            <div className="flex flex-col items-center py-8 px-3 text-center space-y-2">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No conversations</p>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setNewChatOpen(true)}>
                <Plus className="h-3 w-3 mr-1" /> New
              </Button>
            </div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              {chats?.map((chat: any) => {
                const other = getOtherParticipant(chat);
                const isSelected = selectedChat === chat.id;
                const online = other ? isOnline(other.id) : false;
                return (
                  <motion.div
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={`flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer text-sm transition-all duration-200 animate-card-enter
                      ${isSelected ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}
                    whileHover={{ x: 2 }}
                    layout
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-8 w-8"><AvatarImage src={other?.profile?.avatar || ''} /><AvatarFallback className="text-[10px]">{getInitials(other?.profile?.username || 'G')}</AvatarFallback></Avatar>
                      {online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-card animate-ping-slow" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{other?.profile?.username || 'Unknown'}</p>
                      {chat.messages?.[0] && <p className="text-[11px] text-muted-foreground truncate">{chat.messages[0].content}</p>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t border-border/50 bg-muted/20">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
            <Avatar className="h-7 w-7" status="online">
              <AvatarImage src={user?.profile?.avatar || ''} />
              <AvatarFallback className="text-[9px]">{getInitials(user?.profile?.username || 'U')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.profile?.username}</p>
              <p className="text-[10px] text-success">Online</p>
            </div>
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary"><Mic className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary"><Headphones className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary"><Settings className="h-3 w-3" /></Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedChat ? (
          <>
            {/* Channel header */}
            <div className="h-12 border-b border-border/50 flex items-center px-4 shrink-0 bg-muted/10">
              {(() => {
                const chat = chats?.find((c: any) => c.id === selectedChat);
                const other = chat ? getOtherParticipant(chat) : null;
                const online = other ? isOnline(other.id) : false;
                return (
                  <div className="flex items-center gap-2.5 w-full">
                    <div className="relative">
                      <Avatar className="h-7 w-7"><AvatarImage src={other?.profile?.avatar || ''} /><AvatarFallback className="text-[9px]">{getInitials(other?.profile?.username || 'U')}</AvatarFallback></Avatar>
                      {online && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-success rounded-full border-2 border-card" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{other?.profile?.username || 'User'}</p>
                      <p className="text-[10px]" style={{ color: online ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))' }}>{online ? 'Online' : 'Offline'}</p>
                    </div>
                    <div className="flex-1" />
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"><Phone className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => copyLink(selectedChat)} title="Copy chat link"><LinkIcon className="h-4 w-4" /></Button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 bg-grid bg-[length:40px_40px]">
              <div className="py-4 space-y-0.5 max-w-4xl mx-auto">
                <AnimatePresence>
                  {messages?.map((msg: any, idx: number) => {
                    const isOwn = msg.sender?.id === user?.id;
                    const prev = messages[idx - 1];
                    const showHeader = !prev || prev.sender?.id !== msg.sender?.id;
                    const isHovered = hoveredMsgId === msg.id;
                    const online = isOnline(msg.sender?.id);
                    return (
                      <motion.div
                        key={msg.id}
                        className={`group flex gap-3 ${showHeader ? 'mt-4' : 'mt-0.5'} ${isOwn ? 'flex-row-reverse' : ''}`}
                        onHoverStart={() => setHoveredMsgId(msg.id)}
                        onHoverEnd={() => setHoveredMsgId(null)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        layout
                      >
                        {showHeader && (
                          <div className={`shrink-0 ${isOwn ? 'order-2' : ''}`}>
                            <Avatar className="h-9 w-9 mt-0.5" status={online ? 'online' : undefined}>
                              <AvatarImage src={msg.sender?.profile?.avatar || ''} />
                              <AvatarFallback className="text-[10px]">{getInitials(msg.sender?.profile?.username || 'U')}</AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        {!showHeader && <div className="w-9 shrink-0" />}
                        <div className={`flex flex-col min-w-0 max-w-[75%] ${isOwn ? 'items-end' : ''}`}>
                          {showHeader && (
                            <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                              <span className="text-sm font-semibold hover:text-primary cursor-pointer transition-colors">{msg.sender?.profile?.username}</span>
                              <span className="text-[10px] text-muted-foreground">{formatRelativeTime(msg.createdAt)}</span>
                            </div>
                          )}
                          {msg.media?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {msg.media.map((url: string, i: number) => (
                                url.match(/\.(mp4|webm|ogg)$/i)
                                  ? <video key={i} src={url} controls className="max-w-60 max-h-40 rounded-xl border border-border/30" />
                                  : <img key={i} src={url} alt="" className="max-w-60 max-h-40 rounded-xl object-cover border border-border/30" />
                              ))}
                            </div>
                          )}
                          {msg.content && (
                            <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-sm'
                                : 'bg-muted/70 border border-border/30 rounded-tl-sm'
                            }`}>
                              {msg.content}
                            </div>
                          )}
                          {/* Hover actions */}
                          <AnimatePresence>
                            {isHovered && (
                              <motion.div
                                className={`flex items-center gap-0.5 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.15 }}
                              >
                                <button className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all" onClick={() => toast.success('Reacted!')}><Heart className="h-3.5 w-3.5" /></button>
                                <button className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all"><Reply className="h-3.5 w-3.5" /></button>
                                <button className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all"><Smile className="h-3.5 w-3.5" /></button>
                                <button className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all"><MoreVertical className="h-3.5 w-3.5" /></button>
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
                    className="flex items-center gap-2 text-xs text-muted-foreground py-1 ml-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex gap-1">
                      {[0, 150, 300].map((delay, i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full"
                          style={{ animation: 'typing-dot 1.4s ease-in-out infinite', animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                    <span>{typingUsers[selectedChat].length} player{typingUsers[selectedChat].length > 1 ? 's' : ''} typing...</span>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="p-3 border-t border-border/50 bg-muted/10">
              {filePreview && (
                <motion.div
                  className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded-xl border border-border/30"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <img src={filePreview} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  <span className="text-xs text-muted-foreground flex-1">Image ready to send</span>
                  <button onClick={() => setFilePreview(null)} className="hover:text-destructive transition-colors"><X className="h-4 w-4" /></button>
                </motion.div>
              )}
              <div className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-1.5 border border-border/30 transition-all duration-200 focus-within:border-primary/30 focus-within:shadow-sm">
                <input type="file" accept="image/*,video/*" hidden ref={fileInputRef} onChange={handleFileSelect} />
                <button className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent/50 transition-all" onClick={() => fileInputRef.current?.click()}><Plus className="h-5 w-5" /></button>
                <Input
                  placeholder={`Message ${(() => { const c = chats?.find((c: any) => c.id === selectedChat); const o = c ? getOtherParticipant(c) : null; return o?.profile?.username || 'User'; })()}`}
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  className="flex-1 h-9 border-0 bg-transparent text-sm focus-visible:ring-0 px-0"
                  variant="ghost"
                />
                <button className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent/50 transition-all"><Smile className="h-5 w-5" /></button>
                <button className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent/50 transition-all" onClick={() => fileInputRef.current?.click()}><ImageIcon className="h-5 w-5" /></button>
                <Button variant="gradient" size="icon" className="h-8 w-8 rounded-xl" disabled={!message.trim() && !filePreview} onClick={sendMessage} animate>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-muted/5 to-muted/20">
            <motion.div className="text-center space-y-4 max-w-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gaming-purple/20 to-gaming-cyan/20 flex items-center justify-center mx-auto border border-border/30">
                <MessageSquare className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Welcome to Messages</h2>
              <p className="text-sm text-muted-foreground">Select a conversation from the left or start a new one</p>
              <div className="flex justify-center gap-2">
                <Button variant="gradient" size="sm" className="gap-1.5" onClick={() => setNewChatOpen(true)} animate>
                  <UserPlus className="h-4 w-4" /> New Message
                </Button>
                <Link href="/friends"><Button variant="outline" size="sm" className="gap-1.5"><Search className="h-4 w-4" /> Find Players</Button></Link>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Right panel: member list / voice */}
      {selectedChat && (
        <div className="w-56 border-l border-border/50 bg-muted/10 hidden xl:flex flex-col">
          <div className="p-3 border-b border-border/50">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="h-3 w-3" /> Voice
            </h3>
          </div>
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-success/10 text-success text-xs border border-success/20">
              <Phone className="h-3 w-3" />
              <span>Voice Connected</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className="w-0.5 h-3 bg-muted-foreground/30 rounded-full animate-pulse" style={{ height: `${4 + Math.random() * 12}px`, animationDelay: `${i * 200}ms` }} />
                ))}
              </div>
              <span>No one is speaking</span>
            </div>
          </div>
          <Separator className="bg-border/50" />
          <div className="p-3 border-b border-border/50">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-3 w-3" /> Members
            </h3>
          </div>
          <ScrollArea className="flex-1 p-2">
            {(() => {
              const chat = chats?.find((c: any) => c.id === selectedChat);
              return chat?.participants?.map((p: any) => {
                const prof = p.user?.profile;
                const online = isOnline(p.user?.id);
                return prof ? (
                  <motion.div
                    key={p.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/50 cursor-pointer text-sm transition-all"
                    whileHover={{ x: 2 }}
                  >
                    <div className="relative">
                      <Avatar className="h-6 w-6"><AvatarImage src={prof.avatar || ''} /><AvatarFallback className="text-[8px]">{getInitials(prof.username)}</AvatarFallback></Avatar>
                      {online && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-success rounded-full border-2 border-card" />}
                    </div>
                    <span className="text-xs truncate">{prof.username}</span>
                  </motion.div>
                ) : null;
              });
            })()}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

export default DiscordMessagesPage;
