'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send, Paperclip, Smile, Image, Mic, MoreVertical, Phone, Video } from 'lucide-react';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export default function MessagesPage() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const { user } = useAuthStore();
  const socketRef = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chats, isLoading: chatsLoading } = useQuery({ queryKey: ['chats'], queryFn: () => api.get('/chat').then(r => r.data.data) });
  const { data: messagesData, refetch: refetchMessages } = useQuery({ queryKey: ['messages', selectedChat], queryFn: () => api.get(`/chat/${selectedChat}/messages`).then(r => r.data.data), enabled: !!selectedChat });
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => { if (messagesData) setMessages(messagesData); }, [messagesData]);

  useEffect(() => { if (socketRef.current && selectedChat) { socketRef.current.emit('join:chat', selectedChat); socketRef.current.on('message:new', (msg: any) => { setMessages(prev => [...prev, msg]); }); return () => { socketRef.current?.emit('leave:chat', selectedChat); }; } }, [selectedChat, socketRef]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = () => { if (!message.trim() || !selectedChat || !socketRef.current) return; socketRef.current.emit('message:send', { chatId: selectedChat, content: message }); setMessage(''); };

  const getOtherParticipant = (chat: any) => chat.participants?.find((p: any) => p.user?.id !== user?.id)?.user;

  return (<div className="h-[calc(100vh-8rem)] flex gap-0">
    <Card className="glass-card w-80 shrink-0 rounded-r-none border-r-0 hidden md:flex flex-col"><div className="p-3 border-b"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search messages..." className="pl-9" /></div></div><ScrollArea className="flex-1"><div className="p-2 space-y-1">{chats?.map((chat: any) => { const other = getOtherParticipant(chat); const isSelected = selectedChat === chat.id; return (<div key={chat.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-primary/10' : 'hover:bg-accent'}`} onClick={() => setSelectedChat(chat.id)}><Avatar className="h-10 w-10"><AvatarImage src={other?.profile?.avatar || chat.avatar || ''} /><AvatarFallback>{getInitials(other?.profile?.username || chat.name || 'G')}</AvatarFallback></Avatar><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{other?.profile?.username || chat.name || 'Unknown'}</p>{chat.messages?.[0] && <p className="text-xs text-muted-foreground truncate">{chat.messages[0].content}</p>}</div></div>); })}</div></ScrollArea></Card>
    <Card className="glass-card flex-1 flex flex-col">{selectedChat ? (<><div className="p-3 border-b flex items-center justify-between"><div className="flex items-center gap-3">{(() => { const chat = chats?.find((c: any) => c.id === selectedChat); const other = chat ? getOtherParticipant(chat) : null; return (<><Avatar className="h-10 w-10"><AvatarImage src={other?.profile?.avatar || ''} /><AvatarFallback>{getInitials(other?.profile?.username || 'U')}</AvatarFallback></Avatar><div><p className="font-medium text-sm">{other?.profile?.username || 'User'}</p><p className="text-xs text-muted-foreground">Online</p></div></>); })()}</div><div className="flex gap-1"><Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button><Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></div></div><ScrollArea className="flex-1 p-4"><div className="space-y-3">{messages?.map((msg: any, i: number) => { const isOwn = msg.sender?.id === user?.id; return (<div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[70%] p-3 rounded-2xl ${isOwn ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'}`}><p className="text-sm">{msg.content}</p><p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{formatRelativeTime(msg.createdAt)}</p></div></div>); })}<div ref={messagesEndRef} /></div></ScrollArea><div className="p-3 border-t"><div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="shrink-0"><Paperclip className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="shrink-0"><Image className="h-4 w-4" /></Button><Input placeholder="Type a message..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} className="flex-1" /><Button variant="ghost" size="icon" className="shrink-0"><Smile className="h-4 w-4" /></Button><Button variant="gradient" size="icon" onClick={sendMessage}><Send className="h-4 w-4" /></Button></div></div></>) : (<div className="flex-1 flex items-center justify-center"><div className="text-center space-y-2"><p className="text-4xl">💬</p><p className="text-muted-foreground">Select a conversation</p><p className="text-sm text-muted-foreground">Choose a chat from the sidebar</p></div></div>)}</Card></div>);
}
