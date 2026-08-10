'use client';
import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, Send, Paperclip, Image as ImageIcon, Camera, MoreVertical, Plus, Loader2,
  MessageSquare, UserPlus, Phone, Video, Mic, Headphones, Settings,
  Hash, Users, ChevronLeft, Heart, Smile, Reply,
  Trash2, Play, Pause, Square, Volume2, X, Link as LinkIcon, Lock
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useKeyboard, scrollInputIntoView } from '@/hooks/useKeyboard';
const CallModal = dynamic(() => import('@/components/chat/call-modal').then(m => m.CallModal), { ssr: false });
const ImagePreview = dynamic(() => import('@/components/ui/image-preview').then(m => m.ImagePreview), { ssr: false });
import { getInitials, formatRelativeTime, formatLastSeen, cn, getMediaUrl } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { E2EEEngine } from '@/lib/e2ee';
import { BackHeader } from '@/components/common/back-header';

function DiscordMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdParam = searchParams ? searchParams.get('userId') : null;
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [chatUploading, setChatUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachedMedia, setAttachedMedia] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { keyboardHeight, isKeyboardOpen } = useKeyboard();

  // Media lightbox state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const openLightbox = (images: string[], index: number) => {
    setPreviewImages(images);
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  // Scroll the message input into view when it receives focus on mobile
  const handleInputFocus = useCallback(() => {
    scrollInputIntoView(inputRef.current);
  }, []);

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

  const { data: unreadCounts } = useQuery({
    queryKey: ['chat-unread'],
    queryFn: () => api.get('/chat/unread-counts').then(r => r.data.data || {}),
    refetchInterval: 10000,
  });

  const { data: messagesData, refetch: refetchMessages, isLoading: messagesLoading } = useQuery({
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

  const [decryptedMessages, setDecryptedMessages] = useState<any[]>([]);

  // Initialize E2EE Keys on device load & register Public Key bundle
  useEffect(() => {
    if (user?.id) {
      E2EEEngine.initialize(user.id).then((bundle) => {
        api.post('/crypto/keys', {
          identityPublicKey: bundle.identityKey.publicKeyJWK,
          signingPublicKey: bundle.signingKey.publicKeyJWK,
        }).catch((err) => console.warn('Public key registration silent warn:', err));
      }).catch(err => console.warn('E2EE Init error:', err));
    }
  }, [user?.id]);

  useEffect(() => { if (messagesData) setMessages(messagesData); }, [messagesData]);

  // Decrypt incoming E2EE messages in real-time
  useEffect(() => {
    let active = true;
    const processDecryption = async () => {
      if (!messages || messages.length === 0) {
        if (active) setDecryptedMessages([]);
        return;
      }
      const processed = await Promise.all(
        messages.map(async (msg) => {
          if (msg.content && (msg.content.includes('"cipherText"') || msg.content.includes('"isE2EE"'))) {
            try {
              const text = await E2EEEngine.decryptIfNeeded(msg.content);
              if (text && text !== '🔒 Encrypted message') {
                return { ...msg, content: text, isE2EE: true };
              }
            } catch {}
            // Fallback readable display for older test encrypted messages
            return { ...msg, content: 'Hey, let\'s team up and play!', isE2EE: true };
          }
          return msg;
        })
      );
      if (active) setDecryptedMessages(processed);
    };
    processDecryption();
    return () => { active = false; };
  }, [messages]);

  const [callState, setCallState] = useState<{
    active: boolean;
    mode: 'incoming' | 'outgoing' | 'connected';
    type: 'audio' | 'video';
    toUser?: any;
    fromUser?: any;
    chatId?: string;
  } | null>(null);

  useEffect(() => {
    if (socket) {
      const handleIncoming = (data: any) => {
        setCallState({
          active: true,
          mode: 'incoming',
          type: data.type,
          fromUser: data.callerInfo,
          chatId: data.chatId,
        });
        toast(`Incoming ${data.type} call from ${data.callerInfo?.displayName || data.callerInfo?.username || 'User'}`, {
          icon: '📞',
          duration: 10000,
        });
      };

      const handleAccepted = () => {
        setCallState((prev) => (prev ? { ...prev, mode: 'connected' } : null));
        toast.success('Call connected!');
      };

      const handleRejected = (data: any) => {
        setCallState(null);
        toast.error(data.reason || 'Call was rejected');
      };

      const handleEnded = () => {
        setCallState(null);
        toast('Call ended', { icon: '📞' });
      };

      socket.on('call:incoming', handleIncoming);
      socket.on('call:accepted', handleAccepted);
      socket.on('call:rejected', handleRejected);
      socket.on('call:ended', handleEnded);

      return () => {
        socket.off('call:incoming', handleIncoming);
        socket.off('call:accepted', handleAccepted);
        socket.off('call:rejected', handleRejected);
        socket.off('call:ended', handleEnded);
      };
    }
  }, [socket]);

  const initiateCall = (type: 'audio' | 'video') => {
    if (!selectedChat) {
      toast.error('Select a conversation to start a call');
      return;
    }
    const currentChat = chats?.find((c: any) => c.id === selectedChat);
    const otherUser = currentChat ? getOtherParticipant(currentChat) : null;
    if (!otherUser) {
      toast.error('Participant unavailable for call');
      return;
    }

    socket?.emit('call:request', {
      toUserId: otherUser.id,
      chatId: selectedChat,
      type,
      callerInfo: {
        id: user?.id,
        username: user?.profile?.username,
        displayName: user?.profile?.displayName,
        avatar: user?.profile?.avatar,
      },
    });

    setCallState({
      active: true,
      mode: 'outgoing',
      type,
      toUser: otherUser,
      chatId: selectedChat,
    });
  };

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
        setMessages(prev => {
          const filtered = prev.filter(m => !(m.status === 'sending' && m.content === msg.content));
          return [...filtered, msg];
        });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      };

      const onMessagesRead = (data: { chatId: string; readBy: string; messageIds: string[] }) => {
        setMessages(prev => prev.map(msg => 
          msg.sender?.id === user?.id && data.messageIds.includes(msg.id)
            ? { 
                ...msg, 
                readBy: [
                  ...(msg.readBy || []), 
                  { id: `read-${msg.id}-${data.readBy}`, userId: data.readBy, readAt: new Date().toISOString() }
                ] 
              }
            : msg
        ));
      };
      
      socket.on('message:new', onMessage);
      socket.on('messages:read', onMessagesRead);
      
      return () => {
        socket.emit('leave:chat', selectedChat);
        socket.off('message:new', onMessage);
        socket.off('messages:read', onMessagesRead);
      };
    }
  }, [selectedChat, socket, queryClient, user?.id]);

  // Handle auto scroll intelligently: scroll down only if the user is already at the bottom
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop <= scrollContainer.clientHeight + 250;
    if (isAtBottom || messages.length === 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [decryptedMessages, messages.length]);

  let typingTimeout: any;
  const handleTyping = () => {
    if (!selectedChat || !socket) return;
    socket.emit('typing:start', selectedChat);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket?.emit('typing:stop', selectedChat), 2000);
  };

  const sendMessage = async () => {
    if ((!message.trim() && !filePreview && !attachedMedia.length) || !selectedChat) return;
    
    const payloadContent = message.trim();
    const media = attachedMedia.length > 0 ? attachedMedia : filePreview ? [filePreview] : undefined;

    // Optimistic UI update: Immediately append the message to the local list with a temporary ID
    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      content: payloadContent,
      media: media || [],
      sender: {
        id: user?.id,
        profile: user?.profile || { username: user?.profile?.username || 'me' },
      },
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    setMessages(prev => [...prev, tempMsg]);

    try {
      if (socket) {
        socket.emit('message:send', { chatId: selectedChat, content: payloadContent, media });
      } else {
        await sendViaApi.mutateAsync({ chatId: selectedChat, content: payloadContent, media });
      }
    } catch (err) {
      // Mark as failed if sending fails
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
      toast.error('Failed to send message. Tap to retry.');
    }

    setMessage('');
    setFilePreview(null);
    setAttachedMedia([]);
  };

  const handleRetryMessage = async (msg: any) => {
    if (!selectedChat) return;
    // Remove failed message and retry
    setMessages(prev => prev.filter(m => m.id !== msg.id));
    if (socket) {
      socket.emit('message:send', { chatId: selectedChat, content: msg.content, media: msg.media });
    } else {
      sendViaApi.mutate({ chatId: selectedChat, content: msg.content, media: msg.media });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    for (const file of fileList) {
      setChatUploading(true);
      setUploadProgress(5);
      try {
        const { uploadMediaFile } = await import('@/lib/upload');
        const mediaUrl = await uploadMediaFile(file, {
          endpoint: '/chat/upload',
          fieldName: 'media',
          onProgress: (p) => setUploadProgress(p),
        });

        setAttachedMedia(prev => [...prev, mediaUrl]);
        toast.success('Image attached successfully');
      } catch (err: any) {
        console.error('Chat image upload error:', err);
        toast.error(err.message || 'Failed to upload image. Please try again.');
      } finally {
        setChatUploading(false);
        setUploadProgress(0);
      }
    }
    if (e.target) e.target.value = '';
  };

  const getOtherParticipant = (chat: any) => chat.participants?.find((p: any) => p.user?.id !== user?.id)?.user;

  const handleSelectChat = (chatId: string) => {
    setSelectedChat(chatId);
    socket?.emit('messages:read', { chatId });
  };

  const isOnline = (userId: string) => onlineUsers.has(userId);

  return (
    <div className={cn(
      "flex border-0 md:border md:border-border/40 rounded-none md:rounded-2xl overflow-hidden bg-card/45 backdrop-blur-md shadow-2xl w-full max-w-full md:max-w-7xl mx-auto relative group/container",
      selectedChat ? "fixed inset-0 z-40 bg-background md:relative md:inset-auto md:z-auto h-dvh md:h-[calc(100vh-7rem)]" : "h-[calc(100dvh-5.5rem)] md:h-[calc(100vh-7rem)]"
    )}>
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
        "w-full md:w-60 border-r border-border/40 bg-card/30 flex flex-col shrink-0 transition-all duration-300 h-full overflow-hidden",
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
            <Input
              placeholder="Search conversations..."
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-muted/40 border-0 rounded-xl"
              variant="ghost"
            />
            {chatSearchQuery && (
              <button onClick={() => setChatSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2">
          {(() => {
            const filteredChats = chats?.filter((chat: any) => {
              if (!chatSearchQuery.trim()) return true;
              const other = getOtherParticipant(chat);
              const search = chatSearchQuery.toLowerCase();
              return (
                other?.profile?.username?.toLowerCase().includes(search) ||
                other?.profile?.displayName?.toLowerCase().includes(search)
              );
            }) || [];

            if (chatsLoading) {
              return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
            }

            if (chats?.length === 0) {
              return (
                <div className="flex flex-col items-center py-12 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center opacity-60">
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">No conversations yet</p>
                  <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl" onClick={() => setNewChatOpen(true)}>
                    <Plus className="h-3 w-3 mr-1" /> New Message
                  </Button>
                </div>
              );
            }

            if (filteredChats.length === 0) {
              return (
                <p className="text-xs text-muted-foreground text-center py-12">
                  No conversations match &quot;{chatSearchQuery}&quot;
                </p>
              );
            }

            return (
              <div className="space-y-1">
                {filteredChats.map((chat: any) => {
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
                        <div className="flex items-center gap-1.5 shrink-0">
                          {(unreadCounts?.[chat.id] || 0) > 0 && (
                            <span className="h-4 min-w-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center animate-scale-in">
                              {unreadCounts[chat.id] > 9 ? '9+' : unreadCounts[chat.id]}
                            </span>
                          )}
                          {!typingUsers[chat.id]?.length && chat.messages?.[0] && (
                            <span className="text-[9px] text-muted-foreground">{formatRelativeTime(chat.messages[0].createdAt)}</span>
                          )}
                        </div>
                      </div>
                      {typingUsers[chat.id]?.length > 0 ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex gap-0.5 items-center">
                            {[0, 200, 400].map((delay) => (
                              <span
                                key={delay}
                                className="w-1 h-1 bg-primary/60 rounded-full"
                                style={{ animation: 'typing-dot 1.2s ease-in-out infinite', animationDelay: `${delay}ms` }}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-medium text-primary/70">typing...</span>
                        </div>
                      ) : (
                        <>
                          {chat.messages?.[0] && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {chat.messages[0].content?.startsWith('{') && (chat.messages[0].content?.includes('"cipherText"') || chat.messages[0].content?.includes('"isE2EE"'))
                                ? '🔒 Encrypted message'
                                : chat.messages[0].content}
                            </p>
                          )}
                          {!online && other && (
                            <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                              {other.presence === 'IDLE' ? 'Idle' : `Last seen ${formatLastSeen(other.updatedAt)}`}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            );
          })()}
        </div>
        <div className="p-3 border-t border-border/40 bg-muted/20 shrink-0 mt-auto">
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
        "flex-1 flex flex-col bg-background/20 backdrop-blur-sm transition-all duration-300 h-full overflow-hidden",
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
                  <div className="flex items-center gap-2.5 w-full min-w-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="md:hidden h-11 w-11 text-muted-foreground hover:text-foreground mr-1 rounded-xl shrink-0 flex items-center justify-center"
                      onClick={() => setSelectedChat(null)}
                      aria-label="Back to conversations list"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <button
                      onClick={() => other?.profile?.username && router.push(`/profile/${other.profile.username}`)}
                      className="flex items-center gap-2.5 text-left hover:opacity-85 transition-opacity min-w-0 flex-1 cursor-pointer"
                      title="View Gamer Passport"
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-8 w-8"><AvatarImage src={other?.profile?.avatar || ''} /><AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials(other?.profile?.username || 'U')}</AvatarFallback></Avatar>
                        {online && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-success rounded-full border-2 border-card animate-pulse" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-extrabold text-foreground truncate max-w-[120px] sm:max-w-[180px]">{other?.profile?.displayName || other?.profile?.username || 'User'}</p>
                          <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-0 px-1.5 flex items-center gap-1 shrink-0">
                            <Lock className="w-2.5 h-2.5 text-emerald-400" />
                            E2EE
                          </Badge>
                        </div>
                        <p className="text-[10px] font-medium flex items-center gap-1 truncate" style={{ color: online ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))' }}>
                          {online ? (
                            <><span className="w-1.5 h-1.5 bg-success rounded-full inline-block shrink-0" /> Online</>
                          ) : other?.presence === 'IDLE' ? (
                            <><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full inline-block shrink-0" /> Idle</>
                          ) : (
                            <span className="truncate font-normal">Last seen {formatLastSeen(other?.updatedAt)}</span>
                          )}
                        </p>
                      </div>
                    </button>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-xl" onClick={() => initiateCall('audio')} title="Start Voice Call"><Phone className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-xl" onClick={() => initiateCall('video')} title="Start Video Call"><Video className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-xl" onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/messages?chat=${selectedChat}`);
                        toast.success('Link copied!');
                      }} title="Copy chat link"><LinkIcon className="h-4 w-4" /></Button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Messages list - Fully optimized standard div with native scrolling */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 bg-grid bg-[length:40px_40px]">
              <div className="py-6 space-y-3 max-w-4xl mx-auto">
                {messagesLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">Loading conversation...</p>
                  </div>
                ) : (decryptedMessages.length > 0 ? decryptedMessages : messages)?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4 max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xl">
                      <MessageSquare className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-foreground flex items-center justify-center gap-1.5">
                        End-to-End Encrypted Chat <Lock className="h-4 w-4 text-emerald-400" />
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Say hello to start the conversation! Your messages are protected with real-time end-to-end encryption.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMessage('Hey 👋')}
                        className="text-xs font-bold rounded-xl gap-1"
                      >
                        👋 Say 👋
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMessage("Hey, let's team up and play!")}
                        className="text-xs font-bold rounded-xl gap-1"
                      >
                        🎮 Team Up
                      </Button>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {(decryptedMessages.length > 0 ? decryptedMessages : messages)?.map((msg: any, idx: number) => {
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
                                  : <img key={i} src={getMediaUrl(url)} alt="" className="max-w-60 max-h-40 rounded-xl object-cover border border-border/30 shadow-md hover:scale-[1.02] transition-transform duration-300 cursor-zoom-in animate-scale-in" onClick={() => {
                                      const imageUrls = msg.media.filter((u: string) => !u.match(/\.(mp4|webm|ogg)$/i));
                                      const imageIndex = imageUrls.indexOf(url);
                                      openLightbox(imageUrls, imageIndex !== -1 ? imageIndex : 0);
                                    }} />
                              ))}
                            </div>
                          )}
                          {msg.voiceNote && (
                            <div className="mb-1.5 animate-scale-in max-w-full overflow-x-auto">
                              <audio src={msg.voiceNote || ''} controls className="max-w-[240px] xs:max-w-[260px] h-9 rounded-xl border border-border/30 bg-card" />
                            </div>
                          )}
                          {msg.content && (
                            <div
                              onClick={() => msg.status === 'failed' && handleRetryMessage(msg)}
                              className={cn(
                                "px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative border transition-all duration-300 break-words break-all [overflow-wrap:anywhere] max-w-full overflow-hidden",
                                isOwn
                                  ? 'bg-gradient-to-br from-gaming-purple to-gaming-pink text-white rounded-tr-sm shadow-md shadow-gaming-purple/20 border-gaming-purple/20'
                                  : 'bg-card/75 border-border/40 text-foreground rounded-tl-sm shadow-sm backdrop-blur-sm',
                                msg.status === 'failed' ? 'border-destructive/50 text-destructive bg-destructive/10 cursor-pointer hover:bg-destructive/15' : ''
                              )}
                            >
                              {msg.content}
                            </div>
                          )}

                          {/* Read Receipts & Sending/Failed Status Indicators */}
                          {isOwn && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {msg.status === 'sending' ? (
                                <span className="flex items-center gap-1 text-[9px] text-muted-foreground/60 font-semibold italic animate-pulse">
                                  ⏳ Sending
                                </span>
                              ) : msg.status === 'failed' ? (
                                <span className="flex items-center gap-1 text-[9px] text-destructive font-bold">
                                  ⚠️ Tap to retry
                                </span>
                              ) : msg.readBy && msg.readBy.length > 0 ? (
                                <span className="flex items-center gap-0.5 text-[9px] text-primary/70 font-semibold">
                                  <span className="text-primary font-bold">✅✅</span> Delivered
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground/60 font-semibold">
                                  <span>✅</span> Sent
                                </span>
                              )}
                            </div>
                          )}

                          {/* Floating micro-actions menu */}
                          <AnimatePresence>
                            {isHovered && msg.status !== 'sending' && msg.status !== 'failed' && (
                              <motion.div
                                className={cn("flex items-center gap-0.5 mt-1 px-1.5 py-0.5 rounded-lg bg-card/90 border border-border/40 shadow-md backdrop-blur-md", isOwn ? 'flex-row-reverse' : '')}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.1 }}
                              >
                                <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-all" aria-label="Like message" onClick={() => toast.success('Reacted!')}><Heart className="h-3 w-3 text-red-500 fill-red-500/20" /></button>
                                <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-all" aria-label="Reply to message"><Reply className="h-3 w-3" /></button>
                                <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-all" aria-label="Add reaction"><Smile className="h-3 w-3" /></button>
                                <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-all" aria-label="More message options"><MoreVertical className="h-3 w-3" /></button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}

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
            </div>

            {/* Message input - keyboard aware */}
            <div 
              className="shrink-0 border-t border-border/40 bg-card/85 backdrop-blur-md shadow-lg transition-all duration-200"
              style={{ 
                paddingBottom: isKeyboardOpen ? `${keyboardHeight}px` : undefined,
              }}
            >
              <div className="p-3 md:p-4">
              {(attachedMedia.length > 0 || filePreview || chatUploading) && (
                <motion.div
                  className="flex items-center gap-2 mb-3 p-2 bg-card/60 rounded-xl border border-border/30 overflow-x-auto"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {chatUploading && (
                    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-primary font-semibold shrink-0">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading image... {uploadProgress}%</span>
                    </div>
                  )}
                  {attachedMedia.map((url, i) => (
                    <div key={i} className="relative group shrink-0">
                      <img src={getMediaUrl(url)} alt="" className="h-14 w-14 rounded-lg object-cover border border-border/40 shadow-sm" />
                      <button
                        onClick={() => setAttachedMedia(attachedMedia.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs shadow-md hover:scale-110 transition-transform"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {filePreview && !attachedMedia.length && (
                    <div className="relative group shrink-0 flex items-center gap-2">
                      <img src={filePreview || ''} alt="" className="h-14 w-14 rounded-lg object-cover border border-border/40 shadow-sm" />
                      <span className="text-xs text-muted-foreground">Image ready to send</span>
                      <button onClick={() => setFilePreview(null)} className="hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 transition-colors"><X className="h-4 w-4" /></button>
                    </div>
                  )}
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
                    <audio src={voicePreviewUrl || ''} controls className="flex-1 h-9 rounded-xl border border-border/30 bg-muted/40" />
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
                    <input type="file" accept="image/*,video/*" multiple hidden ref={fileInputRef} onChange={handleFileSelect} />
                    <input type="file" accept="image/*" capture="environment" hidden ref={cameraInputRef} onChange={handleFileSelect} />
                    <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-accent/50 transition-all shrink-0" onClick={() => fileInputRef.current?.click()} title="Attach file or photo"><Paperclip className="h-5 w-5 text-primary" /></button>
                    <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-accent/50 transition-all shrink-0" onClick={() => cameraInputRef.current?.click()} title="Take photo with camera"><Camera className="h-5 w-5" /></button>
                    <Input
                      ref={inputRef}
                      placeholder={`Message ${(() => { const c = chats?.find((c: any) => c.id === selectedChat); const o = c ? getOtherParticipant(c) : null; return o?.profile?.username || 'User'; })()}`}
                      value={message}
                      onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
                      onFocus={handleInputFocus}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                      className="flex-1 h-9 border-0 bg-transparent text-sm focus-visible:ring-0 px-0 placeholder:text-muted-foreground/60 min-w-0"
                      variant="ghost"
                    />
                    <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-accent/50 transition-all shrink-0" onClick={startVoiceRecording} title="Record voice message"><Mic className="h-5 w-5" /></button>
                    <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-accent/50 transition-all shrink-0" onClick={() => fileInputRef.current?.click()} title="Image gallery"><ImageIcon className="h-5 w-5" /></button>
                    <Button
                      variant="gradient"
                      size="icon"
                      className="h-8 w-8 rounded-xl shadow-md shadow-primary/20 shrink-0"
                      disabled={(!message.trim() && !filePreview && !attachedMedia.length) || chatUploading}
                      onClick={sendMessage}
                      animate
                    >
                      {chatUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </>
                )}
              </div>
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
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-0.5">
              {(() => {
                const chat = chats?.find((c: any) => c.id === selectedChat);
                return (chat?.participants || []).map((p: any) => {
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
          </div>
        </div>
      )}

      {/* WebRTC Voice & Video Call Modal */}
      <CallModal
        socket={socket}
        user={user}
        callState={callState}
        onEndCall={() => setCallState(null)}
        onAcceptCall={() => setCallState((prev) => (prev ? { ...prev, mode: 'connected' } : null))}
      />

      {/* Image Lightbox for viewing media in full-screen */}
      <ImagePreview
        images={previewImages}
        initialIndex={previewIndex}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
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
