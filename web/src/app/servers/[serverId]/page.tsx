'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  Hash, Volume2, Bell, Plus, ChevronDown, MessageCircle, Users,
  Shield, Settings, LogOut, Copy, Check, Loader2, Send, Trash2, Pin,
  Smile, MoreVertical, X, UserPlus, Calendar, Lock, Mic, MicOff,
  Video, VideoOff, Monitor, PhoneOff, ShieldAlert
} from 'lucide-react';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = { 
  ONLINE: 'bg-green-500', 
  IDLE: 'bg-yellow-500', 
  DND: 'bg-red-500', 
  INVISIBLE: 'bg-gray-400', 
  OFFLINE: 'bg-gray-400' 
};

const EMOJI_LIST = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '😢', '🙏', '💯', '⚡', '🚀', '👏', '💪', '🎮', '🏆', '👾'];

// Mock voice participants
const MOCK_PARTICIPANTS = [
  { id: 'mock-1', name: 'GhostRider_99', avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=60', isSpeaking: true, micMuted: false, cameraOn: false },
  { id: 'mock-2', name: 'CyberQueen', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60', isSpeaking: false, micMuted: true, cameraOn: false },
  { id: 'mock-3', name: 'RetroPixel', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60', isSpeaking: false, micMuted: false, cameraOn: true, cameraFeed: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60' }
];

export default function ServerPage() {
  const { serverId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const socket = useSocket();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  
  const [showMembers, setShowMembers] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  
  // Server customize states
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editBanner, setEditBanner] = useState('');

  // Event form states
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventStart, setEventStart] = useState('');
  
  // Voice call states
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>('mock-1');

  // Query Server Info
  const { data: server, refetch: refetchServer } = useQuery({ 
    queryKey: ['server', serverId], 
    queryFn: () => api.get(`/servers/${serverId}`).then(r => r.data.data), 
    enabled: !!serverId 
  });
  
  // Query Channel Messages
  const { data: channelMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['server-messages', selectedChannel],
    queryFn: () => api.get(`/servers/channels/${selectedChannel}/messages`).then(r => r.data.data),
    enabled: !!selectedChannel && selectedChannel !== '__events',
  });

  // Query Server Events
  const { data: events, refetch: refetchEvents } = useQuery({
    queryKey: ['server-events', serverId],
    queryFn: () => api.get(`/servers/${serverId}/events`).then(r => r.data.data),
    enabled: !!serverId && selectedChannel === '__events',
  });

  // Sync edit states when server loads
  useEffect(() => {
    if (server) {
      setEditName(server.name || '');
      setEditDesc(server.description || '');
      setEditAvatar(server.avatar || '');
      setEditBanner(server.banner || '');
    }
  }, [server]);

  useEffect(() => { 
    if (server?.channels?.length > 0 && !selectedChannel) {
      setSelectedChannel(server.channels[0].id); 
    }
  }, [server, selectedChannel]);

  useEffect(() => { 
    if (channelMessages) setMessages(channelMessages); 
  }, [channelMessages]);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  // Socket sync
  useEffect(() => {
    if (socket && serverId) {
      socket.emit('server:join', serverId);
      
      const handler = (msg: any) => { 
        if (msg.channelId === selectedChannel) {
          setMessages(prev => [...prev, msg]); 
        }
      };
      const delHandler = (data: any) => { 
        setMessages(prev => prev.filter(m => m.id !== data.id)); 
      };
      const pinHandler = (data: any) => { 
        setMessages(prev => prev.map(m => m.id === data.id ? { ...m, isPinned: data.isPinned } : m)); 
      };
      const reactHandler = (data: any) => { 
        setMessages(prev => prev.map(m => m.id === data.messageId ? { 
          ...m, 
          reactions: [...(m.reactions || []).filter((r: any) => !(r.userId === data.reaction?.userId && r.emoji === data.reaction?.emoji)), data.reaction].filter(Boolean) 
        } : m)); 
      };

      socket.on('server:message', handler);
      socket.on('server:message:deleted', delHandler);
      socket.on('server:message:pinned', pinHandler);
      socket.on('server:reaction:added', reactHandler);
      
      return () => { 
        socket.emit('server:leave', serverId); 
        socket.off('server:message', handler); 
        socket.off('server:message:deleted', delHandler); 
        socket.off('server:message:pinned', pinHandler); 
        socket.off('server:reaction:added', reactHandler); 
      };
    }
  }, [socket, serverId, selectedChannel]);

  // Voice speaker mock rotation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const selectedChannelData = server?.channels?.find((c: any) => c.id === selectedChannel);
    if (selectedChannelData?.type === 'VOICE') {
      interval = setInterval(() => {
        const speakers = ['mock-1', 'local-user', 'mock-3', null];
        const nextSpeaker = speakers[Math.floor(Math.random() * speakers.length)];
        setActiveSpeaker(nextSpeaker);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [selectedChannel, server]);

  // Webcam stream capture
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setVideoStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Camera capture failed or denied:', err);
        setCameraOn(false);
      }
    };

    const stopCamera = () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
    };

    if (cameraOn) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [cameraOn]);

  // Mutations
  const sendMessage = useMutation({
    mutationFn: () => api.post('/servers/messages', { channelId: selectedChannel, content: message }).then(r => r.data.data),
    onSuccess: () => { setMessage(''); if (!socket) refetchMessages(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to send'),
  });

  const deleteMessage = useMutation({ 
    mutationFn: (id: string) => api.delete(`/servers/messages/${id}`), 
    onError: () => toast.error('Failed to delete') 
  });
  
  const pinMessage = useMutation({ 
    mutationFn: (id: string) => api.post(`/servers/messages/${id}/pin`), 
    onError: () => toast.error('Failed to pin') 
  });
  
  const addReaction = useMutation({ 
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) => api.post(`/servers/messages/${id}/react`, { emoji }) 
  });
  
  const leaveServer = useMutation({ 
    mutationFn: () => api.post(`/servers/${serverId}/leave`), 
    onSuccess: () => { toast.success('Left server'); router.push('/servers'); }, 
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to leave') 
  });
  
  const regenerateInvite = useMutation({ 
    mutationFn: () => api.post(`/servers/${serverId}/regenerate-invite`), 
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['server', serverId] }); toast.success('New invite code generated!'); }, 
    onError: () => toast.error('Failed') 
  });

  const updateServerSettings = useMutation({
    mutationFn: () => api.put(`/servers/${serverId}`, { name: editName, description: editDesc, avatar: editAvatar, banner: editBanner }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', serverId] });
      queryClient.invalidateQueries({ queryKey: ['my-servers'] });
      toast.success('Server settings updated successfully!');
      setShowSettings(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update settings'),
  });

  const createEvent = useMutation({
    mutationFn: () => api.post(`/servers/${serverId}/events`, { title: eventTitle, description: eventDesc, location: eventLocation, startDate: eventStart }),
    onSuccess: () => {
      refetchEvents();
      toast.success('Server event scheduled!');
      setShowCreateEvent(false);
      setEventTitle('');
      setEventDesc('');
      setEventLocation('');
      setEventStart('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to schedule event'),
  });

  const deleteEvent = useMutation({
    mutationFn: (id: string) => api.delete(`/servers/${serverId}/events/${id}`),
    onSuccess: () => {
      refetchEvents();
      toast.success('Event deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete event')
  });

  const promoteMember = useMutation({
    mutationFn: ({ userId, role }: { userId: string, role: string }) => api.put(`/servers/${serverId}/members/${userId}/role`, { role }),
    onSuccess: () => {
      refetchServer();
      toast.success('Member role updated!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to change role')
  });

  const kickMember = useMutation({
    mutationFn: (userId: string) => api.delete(`/servers/${serverId}/members/${userId}`),
    onSuccess: () => {
      refetchServer();
      toast.success('Member kicked');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to kick')
  });

  const selectedChannelData = server?.channels?.find((c: any) => c.id === selectedChannel);
  const isOwner = server?.ownerId === user?.id;
  const myMember = server?.members?.find((m: any) => m.userId === user?.id);
  const isAdmin = myMember?.role === 'ADMIN' || isOwner;
  const isMod = myMember?.role === 'MODERATOR' || isAdmin;

  const copyInviteLink = () => {
    const fullLink = `${window.location.origin}/servers/join?code=${server?.inviteCode}`;
    navigator.clipboard.writeText(fullLink);
    toast.success('Invite link copied!');
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-background">
      {/* Servers icon list sidebar */}
      <div className="w-16 bg-muted/40 border-r flex flex-col items-center py-3 gap-2.5 shrink-0 overflow-y-auto">
        <button onClick={() => router.push('/servers')} className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary hover:bg-primary/20 transition-all shrink-0">
          <MessageCircle className="h-5 w-5" />
        </button>
        <div className="w-8 h-px bg-border my-1" />
        {user?.servers?.map((ms: any) => (
          <button key={ms.serverId} onClick={() => router.push(`/servers/${ms.serverId}`)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xs font-bold transition-all shrink-0 overflow-hidden relative ${ms.serverId === serverId ? 'rounded-xl bg-primary text-primary-foreground border-2 border-primary' : 'bg-muted hover:bg-muted-foreground/20 hover:rounded-xl text-muted-foreground hover:text-foreground'}`}
            title={ms.server?.name || ''}>
            {ms.server?.avatar ? (
              <img src={ms.server?.avatar} alt={ms.server?.name} className="w-full h-full object-cover" />
            ) : (
              (ms.server?.name || 'S').charAt(0).toUpperCase()
            )}
          </button>
        ))}
        <button onClick={() => router.push('/servers')} className="w-11 h-11 rounded-2xl bg-muted hover:bg-green-500/20 hover:text-green-500 flex items-center justify-center transition-all shrink-0 text-muted-foreground">
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Channels & Events Sidebar */}
      <div className="w-56 bg-muted/20 border-r flex flex-col shrink-0">
        {/* Server Header Card */}
        <div className="relative h-28 border-b flex flex-col justify-end p-3 overflow-hidden group shrink-0">
          {/* Banner overlay */}
          <div className="absolute inset-0 z-0 bg-primary/10">
            {server?.banner ? (
              <img src={server.banner} alt={server.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-gaming-purple/30 to-primary/30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>

          <div className="relative z-10 flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 rounded-lg border border-white/20">
                <AvatarImage src={server?.avatar || ''} className="object-cover" />
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                  {getInitials(server?.name || 'S')}
                </AvatarFallback>
              </Avatar>
              <h2 className="font-bold text-sm text-white truncate drop-shadow-md">{server?.name || 'Loading...'}</h2>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-white hover:text-primary transition-all p-1 rounded-md hover:bg-white/10 focus:outline-none">
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 p-1" align="end">
                <DropdownMenuItem onClick={() => setShowInvite(true)} className="text-xs font-semibold text-primary focus:bg-primary/10 focus:text-primary flex items-center justify-between cursor-pointer">
                  <span>Invite Friends</span>
                  <UserPlus className="h-3.5 w-3.5" />
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => setShowSettings(true)} className="text-xs font-semibold text-foreground flex items-center justify-between cursor-pointer">
                    <span>Server Settings</span>
                    <Settings className="h-3.5 w-3.5" />
                  </DropdownMenuItem>
                )}
                <div className="h-px bg-border my-1" />
                <DropdownMenuItem onClick={() => leaveServer.mutate()} className="text-xs font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center justify-between cursor-pointer">
                  <span>Leave Server</span>
                  <LogOut className="h-3.5 w-3.5" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <ScrollArea className="flex-1 p-2">
          <div className="space-y-4">
            {/* Special Global Channels */}
            <div className="space-y-0.5">
              <button 
                onClick={() => setSelectedChannel('__events')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedChannel === '__events' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
              >
                <Calendar className="h-4 w-4 shrink-0 text-gaming-pink" />
                <span>Events</span>
                {events?.length > 0 && (
                  <Badge variant="secondary" className="ml-auto bg-gaming-pink/10 text-gaming-pink text-[9px] px-1.5 py-0">
                    {events.length}
                  </Badge>
                )}
              </button>
            </div>

            {/* Channels Header list */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Channels</span>
                {isAdmin && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground transition-all">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Channel</DialogTitle>
                        <DialogDescription>Create a text, voice, or announcement channel inside your server.</DialogDescription>
                      </DialogHeader>
                      <ChannelCreateForm serverId={serverId as string} onCreated={() => queryClient.invalidateQueries({ queryKey: ['server', serverId] })} />
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {server?.channels?.map((ch: any) => (
                <button key={ch.id} onClick={() => setSelectedChannel(ch.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-sm transition-all ${selectedChannel === ch.id ? 'bg-muted-foreground/10 text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                  {ch.type === 'VOICE' ? (
                    <Volume2 className="h-4 w-4 shrink-0" />
                  ) : ch.type === 'ANNOUNCEMENT' ? (
                    <Bell className="h-4 w-4 shrink-0 text-gaming-purple" />
                  ) : (
                    <Hash className="h-4 w-4 shrink-0" />
                  )}
                  
                  <span className="truncate flex-1 text-left">{ch.name}</span>
                  
                  {ch.isPrivate && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* User status info tray */}
        <div className="p-2 border-t flex items-center gap-2 bg-muted/10 shrink-0">
          <Avatar className="h-8 w-8 shrink-0 border border-primary/20">
            <AvatarImage src={user?.profile?.avatar || ''} />
            <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
              {getInitials(user?.profile?.username || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-foreground">{user?.profile?.username}</p>
            <p className="text-[10px] text-muted-foreground truncate uppercase font-medium">{myMember?.role || 'MEMBER'}</p>
          </div>
          <div className="flex gap-0.5">
            <button onClick={() => router.push('/profile/settings')} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content display area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChannel === '__events' ? (
          /* Events Panel Page */
          <div className="flex-1 flex flex-col min-h-0 bg-background">
            <div className="h-12 border-b flex items-center px-4 justify-between shrink-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Calendar className="h-4 w-4 text-gaming-pink" />
                <span>Upcoming Server Events</span>
              </div>
              {isMod && (
                <Button onClick={() => setShowCreateEvent(true)} size="sm" className="bg-gaming-pink hover:bg-gaming-pink/90 text-white gap-1.5">
                  <Plus className="h-4 w-4" /> Schedule Event
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="max-w-3xl mx-auto space-y-4">
                {!events || events.length === 0 ? (
                  <div className="border-2 border-dashed border-gaming-pink/20 bg-muted/5 py-12 text-center rounded-2xl">
                    <Calendar className="h-10 w-10 text-gaming-pink/30 mx-auto mb-3" />
                    <p className="font-semibold text-foreground">No events scheduled</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">There are no upcoming activities scheduled. Keep an eye out or schedule one if you have privileges.</p>
                  </div>
                ) : (
                  events.map((ev: any) => (
                    <div key={ev.id} className="border border-primary/10 rounded-2xl overflow-hidden shadow-md bg-muted/5 hover:border-primary/30 transition-all duration-200">
                      <div className="p-5 flex flex-col md:flex-row gap-5">
                        <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-gaming-pink/10 border border-gaming-pink/20 text-gaming-pink text-center shrink-0 w-20 h-20">
                          <span className="text-[10px] font-extrabold uppercase">
                            {new Date(ev.startDate).toLocaleString('default', { month: 'short' })}
                          </span>
                          <span className="text-2xl font-extrabold tracking-tight">
                            {new Date(ev.startDate).getDate()}
                          </span>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-foreground">{ev.title}</h3>
                            {(ev.creatorId === user?.id || isMod) && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full"
                                onClick={() => deleteEvent.mutate(ev.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          {ev.description && <p className="text-sm text-muted-foreground leading-relaxed">{ev.description}</p>}
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1.5 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1"><Volume2 className="h-3.5 w-3.5 text-primary" /> Location: {ev.location}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-gaming-pink" /> 
                              Time: {new Date(ev.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {ev.endDate && ` - ${new Date(ev.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        ) : selectedChannel ? (
          /* Text, Voice, or Announcement Channel */
          <>
            <div className="h-12 border-b flex items-center px-4 gap-2 text-sm font-semibold shrink-0">
              {selectedChannelData?.type === 'VOICE' ? (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              ) : selectedChannelData?.type === 'ANNOUNCEMENT' ? (
                <Bell className="h-4 w-4 text-gaming-purple" />
              ) : (
                <Hash className="h-4 w-4 text-muted-foreground" />
              )}
              
              <span>{selectedChannelData?.name}</span>
              {selectedChannelData?.description && (
                <>
                  <div className="w-[1px] h-4 bg-border mx-2" />
                  <span className="text-xs text-muted-foreground font-normal truncate max-w-sm">{selectedChannelData?.description}</span>
                </>
              )}
              
              <div className="flex-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowMembers(!showMembers)}>
                <Users className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowInvite(true)}>
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>

            {/* Render Voice call UI if channel type is VOICE */}
            {selectedChannelData?.type === 'VOICE' ? (
              <div className="flex-1 bg-zinc-950 flex flex-col p-6 overflow-hidden relative">
                {/* Simulated webcam/voice participants grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto w-full items-center justify-center">
                  
                  {/* Local User Card */}
                  <div className={`relative aspect-video rounded-2xl bg-zinc-900 border overflow-hidden flex items-center justify-center transition-all duration-300 ${activeSpeaker === 'local-user' ? 'border-green-500 shadow-lg shadow-green-500/10' : 'border-zinc-800'}`}>
                    {cameraOn ? (
                      <video ref={localVideoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay playsInline muted />
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Avatar className="h-16 w-16 border-2 border-primary">
                          <AvatarImage src={user?.profile?.avatar || ''} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                            {getInitials(user?.profile?.username || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold text-white">{user?.profile?.username} (You)</span>
                      </div>
                    )}

                    {/* Speaker waveform animation */}
                    {activeSpeaker === 'local-user' && !micMuted && (
                      <div className="absolute top-3 right-3 flex gap-0.5 h-4 items-end bg-black/60 px-2 py-1 rounded-full border border-green-500/30">
                        <span className="w-0.5 bg-green-500 animate-bounce h-2" style={{ animationDelay: '0.1s' }} />
                        <span className="w-0.5 bg-green-500 animate-bounce h-3" style={{ animationDelay: '0.3s' }} />
                        <span className="w-0.5 bg-green-500 animate-bounce h-1.5" style={{ animationDelay: '0.5s' }} />
                      </div>
                    )}

                    {/* Audio Status Overlay */}
                    <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 backdrop-blur-md">
                      {micMuted ? <MicOff className="h-3 w-3 text-red-500" /> : <Mic className="h-3 w-3 text-green-500" />}
                      <span>{user?.profile?.username}</span>
                    </div>
                  </div>

                  {/* Mock voice participant slots */}
                  {MOCK_PARTICIPANTS.map((part) => (
                    <div key={part.id} className={`relative aspect-video rounded-2xl bg-zinc-900 border overflow-hidden flex items-center justify-center transition-all duration-300 ${activeSpeaker === part.id ? 'border-green-500 shadow-lg shadow-green-500/10' : 'border-zinc-800'}`}>
                      {part.cameraOn && part.cameraFeed ? (
                        <img src={part.cameraFeed} alt={part.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Avatar className="h-16 w-16 border-2 border-zinc-700">
                            <AvatarImage src={part.avatar} className="object-cover" />
                            <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xl font-bold">
                              {getInitials(part.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-semibold text-white">{part.name}</span>
                        </div>
                      )}

                      {/* Speaking indicator overlay */}
                      {activeSpeaker === part.id && !part.micMuted && (
                        <div className="absolute top-3 right-3 flex gap-0.5 h-4 items-end bg-black/60 px-2 py-1 rounded-full border border-green-500/30">
                          <span className="w-0.5 bg-green-500 animate-bounce h-3" style={{ animationDelay: '0.2s' }} />
                          <span className="w-0.5 bg-green-500 animate-bounce h-1.5" style={{ animationDelay: '0.4s' }} />
                          <span className="w-0.5 bg-green-500 animate-bounce h-2.5" style={{ animationDelay: '0.6s' }} />
                        </div>
                      )}

                      {/* Status overlay */}
                      <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 backdrop-blur-md">
                        {part.micMuted ? <MicOff className="h-3 w-3 text-red-500" /> : <Mic className="h-3 w-3 text-zinc-400" />}
                        <span>{part.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Call Action Bar Controls */}
                <div className="h-20 shrink-0 flex items-center justify-center gap-4 border-t border-zinc-800/80 bg-zinc-950/80 backdrop-blur-lg rounded-3xl mt-4 px-6 max-w-xl mx-auto w-full">
                  <Button 
                    variant={micMuted ? 'destructive' : 'secondary'} 
                    size="icon" 
                    className="h-11 w-11 rounded-full" 
                    onClick={() => setMicMuted(!micMuted)}
                    title={micMuted ? 'Unmute' : 'Mute'}
                  >
                    {micMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  
                  <Button 
                    variant={cameraOn ? 'secondary' : 'outline'} 
                    size="icon" 
                    className={`h-11 w-11 rounded-full ${!cameraOn && 'border-zinc-700 text-zinc-400 hover:text-white'}`} 
                    onClick={() => setCameraOn(!cameraOn)}
                    title={cameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
                  >
                    {cameraOn ? <Video className="h-5 w-5 text-green-500" /> : <VideoOff className="h-5 w-5" />}
                  </Button>

                  <Button 
                    variant={screenSharing ? 'secondary' : 'outline'} 
                    size="icon" 
                    className={`h-11 w-11 rounded-full ${!screenSharing && 'border-zinc-700 text-zinc-400 hover:text-white'}`} 
                    onClick={() => {
                      setScreenSharing(!screenSharing);
                      toast.success(screenSharing ? 'Screen sharing stopped' : 'Screen sharing started (simulated)');
                    }}
                    title={screenSharing ? 'Stop Presenting' : 'Share Screen'}
                  >
                    <Monitor className={`h-5 w-5 ${screenSharing ? 'text-primary' : ''}`} />
                  </Button>
                  
                  <div className="w-[1px] h-6 bg-zinc-800" />

                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="h-11 w-11 rounded-full" 
                    onClick={() => {
                      setCameraOn(false);
                      setSelectedChannel(server?.channels?.[0]?.id || null);
                      toast('Left voice channel');
                    }}
                    title="Disconnect"
                  >
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Text and Announcement channel listing */
              <>
                <ScrollArea className="flex-1 p-4 bg-muted/5">
                  <div className="space-y-1.5 max-w-4xl mx-auto">
                    {messages.length === 0 ? (
                      <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
                        <MessageCircle className="h-10 w-10 text-primary/30" />
                        <h4 className="font-semibold text-foreground">Welcome to #{selectedChannelData?.name}!</h4>
                        <p className="text-xs text-muted-foreground max-w-xs">This is the start of the channel's message history.</p>
                      </div>
                    ) : (
                      messages.map((msg: any, idx: number) => {
                        const prev = messages[idx - 1];
                        const showHeader = !prev || prev.senderId !== msg.senderId || (new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime()) > 300000;
                        return (
                          <div key={msg.id} className={`group flex gap-3 ${showHeader ? 'mt-4' : 'mt-0.5'}`}>
                            {showHeader ? (
                              <Avatar className="h-9 w-9 mt-0.5 shrink-0 border border-primary/10">
                                <AvatarImage src={msg.sender?.profile?.avatar || ''} />
                                <AvatarFallback className="text-[10px] bg-primary/20 text-primary">{getInitials(msg.sender?.profile?.username || 'U')}</AvatarFallback>
                              </Avatar>
                            ) : <div className="w-9 shrink-0" />}
                            
                            <div className="flex-1 min-w-0">
                              {showHeader && (
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-sm font-semibold hover:underline cursor-pointer text-foreground">{msg.sender?.profile?.username}</span>
                                  <span className="text-[10px] text-muted-foreground">{formatRelativeTime(msg.createdAt)}</span>
                                  {msg.isPinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                                </div>
                              )}
                              
                              <div className="text-sm leading-relaxed text-foreground">{msg.content}</div>
                              
                              {msg.reactions?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {Array.from(new Map(msg.reactions.map((r: any) => [r.emoji, r])).values()).map((r: any) => (
                                    <button key={r.emoji} onClick={() => addReaction.mutate({ id: msg.id, emoji: r.emoji })}
                                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${msg.reactions.some((re: any) => re.userId === user?.id && re.emoji === r.emoji) ? 'bg-primary/10 border-primary/30 text-primary' : 'hover:bg-muted border-border text-muted-foreground'}`}>
                                      <span>{r.emoji}</span>
                                      <span className="text-[10px] font-bold">{msg.reactions.filter((re: any) => re.emoji === r.emoji).length}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                              
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 mt-1 transition-opacity duration-200">
                                {EMOJI_LIST.slice(0, 6).map(emoji => (
                                  <button key={emoji} onClick={() => addReaction.mutate({ id: msg.id, emoji })} className="p-1 rounded hover:bg-muted text-xs transition-all hover:scale-110">{emoji}</button>
                                ))}
                                {(msg.senderId === user?.id || isAdmin) && (
                                  <button onClick={() => deleteMessage.mutate(msg.id)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-all" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                                )}
                                {(isOwner || isAdmin) && (
                                  <button onClick={() => pinMessage.mutate(msg.id)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-all" title="Pin"><Pin className="h-3.5 w-3.5" /></button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Input box */}
                <div className="p-4 border-t bg-background shrink-0">
                  {selectedChannelData?.type === 'ANNOUNCEMENT' && !isMod ? (
                    <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-4 py-3 max-w-4xl mx-auto border border-border text-xs text-muted-foreground font-semibold justify-center">
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                      <span>Only owners, admins, and moderators can send messages in this channel.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-2 max-w-4xl mx-auto relative border border-primary/5">
                      <Input placeholder={`Message #${selectedChannelData?.name || 'channel'}`} value={message} onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), message.trim() && sendMessage.mutate())}
                        className="flex-1 h-10 border-0 bg-transparent text-sm focus-visible:ring-0 px-0 focus-visible:ring-offset-0" />
                      <div className="relative">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground shrink-0" onClick={() => setShowEmoji(!showEmoji)}>
                          <Smile className="h-4 w-4" />
                        </Button>
                        {showEmoji && (
                          <div className="absolute bottom-full right-0 mb-3 p-2 bg-popover border rounded-xl shadow-lg grid grid-cols-4 gap-1.5 z-20">
                            {EMOJI_LIST.map(emoji => (
                              <button key={emoji} onClick={() => { setMessage(prev => prev + emoji); setShowEmoji(false); }} className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded text-lg">{emoji}</button>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button variant="default" size="icon" className="h-9 w-9 rounded-full shrink-0" disabled={!message.trim() || sendMessage.isPending} onClick={() => sendMessage.mutate()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30 text-primary" />
              <h3 className="font-semibold text-foreground">Select a channel</h3>
              <p className="text-xs">Choose a channel from the left sidebar to start chatting.</p>
            </div>
          </div>
        )}
      </div>

      {/* Members list sidebar */}
      {showMembers && (
        <div className="w-56 bg-muted/20 border-l shrink-0 hidden lg:block">
          <div className="h-12 border-b flex items-center px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider justify-between shrink-0">
            <span>Members — {server?.members?.length || 0}</span>
          </div>
          <ScrollArea className="h-[calc(100%-3rem)] p-2">
            <div className="space-y-0.5">
              {server?.members?.map((member: any) => (
                <div key={member.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-all duration-200 group">
                  <div className="relative shrink-0">
                    <Avatar className="h-8 w-8 border border-primary/5">
                      <AvatarImage src={member.user?.profile?.avatar || ''} className="object-cover" />
                      <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                        {getInitials(member.user?.profile?.username || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${STATUS_COLORS[member.user?.presence || 'OFFLINE']}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">{member.user?.profile?.username}</p>
                    <p className="text-[9px] text-muted-foreground truncate uppercase font-medium">{member.role}</p>
                  </div>
                  
                  {member.role !== 'MEMBER' && (
                    <Shield className={`h-3.5 w-3.5 shrink-0 ${member.role === 'OWNER' ? 'text-yellow-500' : 'text-blue-500'}`} />
                  )}

                  {/* Owner/Admin actions dropdown trigger */}
                  {isAdmin && member.userId !== user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-opacity focus:outline-none">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-40 p-1" align="end">
                        {isOwner && (
                          <>
                            {member.role !== 'ADMIN' && (
                              <DropdownMenuItem onClick={() => promoteMember.mutate({ userId: member.userId, role: 'ADMIN' })} className="text-xs font-semibold cursor-pointer">
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            {member.role !== 'MODERATOR' && (
                              <DropdownMenuItem onClick={() => promoteMember.mutate({ userId: member.userId, role: 'MODERATOR' })} className="text-xs font-semibold cursor-pointer">
                                Make Moderator
                              </DropdownMenuItem>
                            )}
                            {member.role !== 'MEMBER' && (
                              <DropdownMenuItem onClick={() => promoteMember.mutate({ userId: member.userId, role: 'MEMBER' })} className="text-xs font-semibold cursor-pointer">
                                Demote to Member
                              </DropdownMenuItem>
                            )}
                            <div className="h-px bg-border my-1" />
                          </>
                        )}
                        
                        {/* Kick validation */}
                        {(isOwner || (isAdmin && member.role !== 'OWNER' && member.role !== 'ADMIN')) && (
                          <DropdownMenuItem onClick={() => kickMember.mutate(member.userId)} className="text-xs font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                            Kick Member
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Invite Friends Modal */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Friends</DialogTitle>
            <DialogDescription>Share this code or click to copy the direct invite link.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-primary/10">
              <code className="flex-1 text-sm font-semibold font-mono tracking-tight truncate">{server?.inviteCode}</code>
              <Button size="sm" variant="ghost" className="shrink-0 gap-1" onClick={copyInviteLink}>
                <Copy className="h-4 w-4" /> Copy
              </Button>
            </div>
            {isAdmin && (
              <Button variant="outline" size="sm" className="w-full h-10 border-primary/20 hover:bg-primary/5 text-xs font-semibold" onClick={() => regenerateInvite.mutate()}>
                Regenerate Invite Code
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Server Settings Modal (Admin only) */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Server Settings</DialogTitle>
            <DialogDescription>Modify community details, banner headers, and avatar icons.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Server Name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="border-primary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
              <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="border-primary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Avatar URL</label>
              <Input value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} className="border-primary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Banner URL</label>
              <Input value={editBanner} onChange={(e) => setEditBanner(e.target.value)} className="border-primary/20" />
            </div>
            <Button onClick={() => updateServerSettings.mutate()} disabled={updateServerSettings.isPending || !editName.trim()} className="w-full h-11 bg-primary text-white mt-2">
              {updateServerSettings.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Event Modal */}
      <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Server Event</DialogTitle>
            <DialogDescription>Create a new server activity. Notifications will be sent to members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Event Title *</label>
              <Input placeholder="e.g. Scrim vs Team Liquid" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="border-primary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
              <Input placeholder="Details, links or instructions" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} className="border-primary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Location / Channel *</label>
              <Input placeholder="e.g. Voice Channel: general, Discord, external link" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} className="border-primary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Start Date & Time *</label>
              <Input type="datetime-local" value={eventStart} onChange={(e) => setEventStart(e.target.value)} className="border-primary/20" />
            </div>
            <Button onClick={() => createEvent.mutate()} disabled={createEvent.isPending || !eventTitle.trim() || !eventLocation.trim() || !eventStart} className="w-full h-11 bg-gaming-pink hover:bg-gaming-pink/95 text-white mt-2">
              {createEvent.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Schedule Event'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChannelCreateForm({ serverId, onCreated }: { serverId: string; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'TEXT' | 'VOICE' | 'ANNOUNCEMENT'>('TEXT');
  const [isPrivate, setIsPrivate] = useState(false);
  
  const create = useMutation({
    mutationFn: () => api.post(`/servers/${serverId}/channels`, { name: name.toLowerCase().replace(/\s+/g, '-'), type, isPrivate }),
    onSuccess: () => { onCreated(); toast.success('Channel created!'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase">Channel Name *</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. general" className="border-primary/20" />
      </div>
      
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase">Channel Type</label>
        <div className="flex gap-2">
          {(['TEXT', 'VOICE', 'ANNOUNCEMENT'] as const).map(t => (
            <button key={t} type="button" onClick={() => setType(t)} 
              className={`flex-1 py-3 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 transition-all ${type === t ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/5' : 'border-border hover:bg-muted text-muted-foreground'}`}>
              {t === 'TEXT' ? (
                <><Hash className="h-4 w-4" />Text</>
              ) : t === 'VOICE' ? (
                <><Volume2 className="h-4 w-4" />Voice</>
              ) : (
                <><Bell className="h-4 w-4" />Announce</>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-primary/5 mt-2">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1">
            <Lock className="h-3.5 w-3.5" /> Private Channel
          </p>
          <p className="text-[10px] text-muted-foreground max-w-[240px]">Only selected members, admins, and moderators can view this channel.</p>
        </div>
        <input 
          type="checkbox" 
          checked={isPrivate} 
          onChange={(e) => setIsPrivate(e.target.checked)} 
          className="rounded border-primary/30 text-primary focus:ring-primary h-4.5 w-4.5"
        />
      </div>

      <Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending} className="w-full h-11 bg-primary text-white mt-2">
        {create.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create'}
      </Button>
    </div>
  );
}
