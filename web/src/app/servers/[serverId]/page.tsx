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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Hash, Volume2, Bell, Plus, ChevronDown, MessageCircle, Users,
  Shield, Settings, LogOut, Copy, Check, Loader2, Send, Trash2, Pin,
  Smile, MoreVertical, X, UserPlus, ChevronRight, Search
} from 'lucide-react';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = { ONLINE: 'bg-green-500', IDLE: 'bg-yellow-500', DND: 'bg-red-500', INVISIBLE: 'bg-gray-400', OFFLINE: 'bg-gray-400' };

const EMOJI_LIST = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '😢', '🙏', '💯', '⚡', '🚀', '👏', '💪', '🤣', '✨', '🎮', '🏆', '💀', '🤝', '👾'];

export default function ServerPage() {
  const { serverId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const socketRef = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [showMembers, setShowMembers] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  const { data: server } = useQuery({ queryKey: ['server', serverId], queryFn: () => api.get(`/servers/${serverId}`).then(r => r.data.data), enabled: !!serverId });
  const { data: channelMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['server-messages', selectedChannel],
    queryFn: () => api.get(`/servers/channels/${selectedChannel}/messages`).then(r => r.data.data),
    enabled: !!selectedChannel,
  });

  useEffect(() => { if (server?.channels?.length > 0 && !selectedChannel) setSelectedChannel(server.channels[0].id); }, [server]);
  useEffect(() => { if (channelMessages) setMessages(channelMessages); }, [channelMessages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (socketRef.current && serverId) {
      socketRef.current.emit('server:join', serverId);
      const handler = (msg: any) => { if (msg.channelId === selectedChannel) setMessages(prev => [...prev, msg]); };
      const delHandler = (data: any) => { setMessages(prev => prev.filter(m => m.id !== data.id)); };
      const pinHandler = (data: any) => { setMessages(prev => prev.map(m => m.id === data.id ? { ...m, isPinned: data.isPinned } : m)); };
      const reactHandler = (data: any) => { setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, reactions: [...(m.reactions || []).filter((r: any) => !(r.userId === data.reaction?.userId && r.emoji === data.reaction?.emoji)), data.reaction].filter(Boolean) } : m)); };
      socketRef.current.on('server:message', handler);
      socketRef.current.on('server:message:deleted', delHandler);
      socketRef.current.on('server:message:pinned', pinHandler);
      socketRef.current.on('server:reaction:added', reactHandler);
      return () => { socketRef.current?.emit('server:leave', serverId); socketRef.current?.off('server:message', handler); };
    }
  }, [socketRef, serverId, selectedChannel]);

  const sendMessage = useMutation({
    mutationFn: () => api.post('/servers/messages', { channelId: selectedChannel, content: message }).then(r => r.data.data),
    onSuccess: () => { setMessage(''); if (!socketRef.current) refetchMessages(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMessage = useMutation({ mutationFn: (id: string) => api.delete(`/servers/messages/${id}`), onError: (err: any) => toast.error('Failed to delete') });
  const pinMessage = useMutation({ mutationFn: (id: string) => api.post(`/servers/messages/${id}/pin`), onError: (err: any) => toast.error('Failed to pin') });
  const addReaction = useMutation({ mutationFn: ({ id, emoji }: { id: string; emoji: string }) => api.post(`/servers/messages/${id}/react`, { emoji }) });
  const leaveServer = useMutation({ mutationFn: () => api.post(`/servers/${serverId}/leave`), onSuccess: () => { toast.success('Left server'); router.push('/servers'); }, onError: (err: any) => toast.error(err.response?.data?.message || 'Failed') });
  const regenerateInvite = useMutation({ mutationFn: () => api.post(`/servers/${serverId}/regenerate-invite`), onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['server', serverId] }); toast.success('New invite code generated!'); }, onError: (err: any) => toast.error('Failed') });

  const selectedChannelData = server?.channels?.find((c: any) => c.id === selectedChannel);
  const isOwner = server?.ownerId === user?.id;
  const isAdmin = server?.members?.find((m: any) => m.userId === user?.id)?.role === 'ADMIN' || isOwner;
  const myMember = server?.members?.find((m: any) => m.userId === user?.id);

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-background">
      {/* Server sidebar */}
      <div className="w-16 bg-muted/40 border-r flex flex-col items-center py-3 gap-2 shrink-0 overflow-y-auto">
        <button onClick={() => router.push('/servers')} className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary hover:bg-primary/20 transition-all shrink-0">
          <MessageCircle className="h-5 w-5" />
        </button>
        <div className="w-8 h-px bg-border my-1" />
        {user?.servers?.map((ms: any) => (
          <button key={ms.serverId} onClick={() => router.push(`/servers/${ms.serverId}`)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold transition-all shrink-0 ${ms.serverId === serverId ? 'rounded-xl bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted-foreground/20 hover:rounded-xl text-muted-foreground hover:text-foreground'}`}
            title={ms.server?.name || ''}>
            {(ms.server?.name || 'S').charAt(0).toUpperCase()}
          </button>
        ))}
        <button onClick={() => router.push('/servers')} className="w-11 h-11 rounded-2xl bg-muted hover:bg-green-500/20 hover:text-green-500 flex items-center justify-center transition-all shrink-0 text-muted-foreground">
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Channel sidebar */}
      <div className="w-56 bg-muted/20 border-r flex flex-col shrink-0">
        <div className="h-12 border-b flex items-center px-4 font-semibold text-sm gap-2 cursor-pointer hover:bg-muted/50">
          {server?.name || 'Loading...'} <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-0.5">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Channels</span>
              {(isOwner || isAdmin) && (
                <Dialog>
                  <DialogTrigger asChild><button className="text-muted-foreground hover:text-foreground"><Plus className="h-3.5 w-3.5" /></button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Create Channel</DialogTitle></DialogHeader>
                    <ChannelCreateForm serverId={serverId as string} onCreated={() => queryClient.invalidateQueries({ queryKey: ['server', serverId] })} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {server?.channels?.map((ch: any) => (
              <button key={ch.id} onClick={() => setSelectedChannel(ch.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-all ${selectedChannel === ch.id ? 'bg-muted-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                {ch.type === 'VOICE' ? <Volume2 className="h-4 w-4 shrink-0" /> : ch.type === 'ANNOUNCEMENT' ? <Bell className="h-4 w-4 shrink-0" /> : <Hash className="h-4 w-4 shrink-0" />}
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="p-2 border-t flex items-center gap-2">
          <Avatar className="h-8 w-8 shrink-0"><AvatarImage src={user?.profile?.avatar || ''} /><AvatarFallback className="text-[9px]">{getInitials(user?.profile?.username || 'U')}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0"><p className="text-xs font-semibold truncate">{user?.profile?.username}</p></div>
          <div className="flex gap-0.5">
            <button onClick={() => router.push('/profile/settings')} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Settings className="h-3.5 w-3.5" /></button>
            <button onClick={() => leaveServer.mutate()} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive"><LogOut className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChannel ? (
          <>
            <div className="h-12 border-b flex items-center px-4 gap-2 text-sm font-semibold shrink-0">
              {selectedChannelData?.type === 'VOICE' ? <Volume2 className="h-4 w-4 text-muted-foreground" /> : selectedChannelData?.type === 'ANNOUNCEMENT' ? <Bell className="h-4 w-4 text-muted-foreground" /> : <Hash className="h-4 w-4 text-muted-foreground" />}
              {selectedChannelData?.name}
              <div className="flex-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowMembers(!showMembers)}><Users className="h-4 w-4" /></Button>
              {(isOwner || isAdmin) && (
                <Dialog open={showInvite} onOpenChange={setShowInvite}>
                  <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><UserPlus className="h-4 w-4" /></Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Invite to Server</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted"><code className="flex-1 text-sm font-mono">{server?.inviteCode}</code>
                        <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(server?.inviteCode); toast.success('Copied!'); }}><Copy className="h-4 w-4" /></Button>
                      </div>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => regenerateInvite.mutate()}>Regenerate Code</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-1 max-w-4xl mx-auto">
                {messages.map((msg: any, idx: number) => {
                  const prev = messages[idx - 1];
                  const showHeader = !prev || prev.senderId !== msg.senderId || (new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime()) > 300000;
                  return (
                    <div key={msg.id} className={`group flex gap-3 ${showHeader ? 'mt-4' : 'mt-0.5'}`}>
                      {showHeader ? (
                        <Avatar className="h-9 w-9 mt-0.5 shrink-0"><AvatarImage src={msg.sender?.profile?.avatar || ''} /><AvatarFallback className="text-[10px]">{getInitials(msg.sender?.profile?.username || 'U')}</AvatarFallback></Avatar>
                      ) : <div className="w-9 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        {showHeader && (
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold hover:underline cursor-pointer">{msg.sender?.profile?.username}</span>
                            <span className="text-[10px] text-muted-foreground">{formatRelativeTime(msg.createdAt)}</span>
                            {msg.isPinned && <Pin className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        )}
                        <div className="text-sm leading-relaxed">{msg.content}</div>
                        {msg.reactions?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Array.from(new Map(msg.reactions.map((r: any) => [r.emoji, r])).values()).map((r: any) => (
                              <button key={r.emoji} onClick={() => addReaction.mutate({ id: msg.id, emoji: r.emoji })}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border ${msg.reactions.some((re: any) => re.userId === user?.id && re.emoji === r.emoji) ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted border-border'}`}>
                                {r.emoji} {msg.reactions.filter((re: any) => re.emoji === r.emoji).length}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="hidden group-hover:flex items-center gap-0.5 mt-0.5">
                          {EMOJI_LIST.slice(0, 5).map(emoji => (
                            <button key={emoji} onClick={() => addReaction.mutate({ id: msg.id, emoji })} className="p-0.5 rounded hover:bg-muted text-xs">{emoji}</button>
                          ))}
                          {(msg.senderId === user?.id || isAdmin) && (
                            <button onClick={() => deleteMessage.mutate(msg.id)} className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                          )}
                          {(isOwner || isAdmin) && (
                            <button onClick={() => pinMessage.mutate(msg.id)} className="p-0.5 rounded hover:bg-muted text-muted-foreground"><Pin className="h-3 w-3" /></button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            {selectedChannelData?.type !== 'VOICE' && (
              <div className="p-4 border-t bg-background">
                <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-2 max-w-4xl mx-auto relative">
                  <Input placeholder={`Message #${selectedChannelData?.name || 'channel'}`} value={message} onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), message.trim() && sendMessage.mutate())}
                    className="flex-1 h-10 border-0 bg-transparent text-sm focus-visible:ring-0 px-0" />
                  <div className="relative">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground" onClick={() => setShowEmoji(!showEmoji)}><Smile className="h-4 w-4" /></Button>
                    {showEmoji && (
                      <div className="absolute bottom-full right-0 mb-2 p-2 bg-popover border rounded-xl shadow-lg grid grid-cols-5 gap-1">
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
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center"><MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Select a channel to start chatting</p></div>
          </div>
        )}
      </div>

      {/* Members sidebar */}
      {showMembers && (
        <div className="w-56 bg-muted/20 border-l shrink-0 hidden lg:block">
          <div className="h-12 border-b flex items-center px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Members — {server?.members?.length || 0}
          </div>
          <ScrollArea className="h-[calc(100%-3rem)] p-2">
            <div className="space-y-0.5">
              {server?.members?.map((member: any) => (
                <div key={member.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer">
                  <div className="relative">
                    <Avatar className="h-8 w-8"><AvatarImage src={member.user?.profile?.avatar || ''} /><AvatarFallback className="text-[9px]">{getInitials(member.user?.profile?.username || 'U')}</AvatarFallback></Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${STATUS_COLORS[member.user?.presence || 'OFFLINE']}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.user?.profile?.username}</p>
                  </div>
                  {member.role !== 'MEMBER' && <Shield className={`h-3 w-3 ${member.role === 'OWNER' ? 'text-yellow-500' : 'text-blue-500'}`} />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

function ChannelCreateForm({ serverId, onCreated }: { serverId: string; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'TEXT' | 'VOICE' | 'ANNOUNCEMENT'>('TEXT');
  const create = useMutation({
    mutationFn: () => api.post(`/servers/${serverId}/channels`, { name, type }),
    onSuccess: () => { onCreated(); toast.success('Channel created!'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });
  return (
    <div className="space-y-3">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="channel-name" />
      <div className="flex gap-2">
        {(['TEXT', 'VOICE', 'ANNOUNCEMENT'] as const).map(t => (
          <button key={t} onClick={() => setType(t)} className={`flex-1 py-2 rounded-lg text-xs font-medium border ${type === t ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>
            {t === 'TEXT' ? <><Hash className="h-3 w-3 inline mr-1" />Text</> : t === 'VOICE' ? <><Volume2 className="h-3 w-3 inline mr-1" />Voice</> : <><Bell className="h-3 w-3 inline mr-1" />Announce</>}
          </button>
        ))}
      </div>
      <Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending} className="w-full">{create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}</Button>
    </div>
  );
}
