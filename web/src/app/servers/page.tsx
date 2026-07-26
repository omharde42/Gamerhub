'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Users, Hash, Loader2, Search, Globe, Lock, Copy, Check, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

export default function ServersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: myServers, isLoading: myLoading } = useQuery({ 
    queryKey: ['my-servers'], 
    queryFn: () => api.get('/servers').then(r => r.data.data) 
  });
  
  const { data: discover, isLoading: discoverLoading } = useQuery({ 
    queryKey: ['discover-servers'], 
    queryFn: () => api.get('/servers/discover').then(r => r.data.data) 
  });

  const createServer = useMutation({
    mutationFn: () => api.post('/servers', { 
      name, 
      description: desc, 
      avatar: avatarUrl || undefined, 
      banner: bannerUrl || undefined, 
      isPublic: true 
    }),
    onSuccess: (data) => { 
      queryClient.invalidateQueries({ queryKey: ['my-servers'] }); 
      setCreateOpen(false); 
      setName(''); 
      setDesc(''); 
      setAvatarUrl('');
      setBannerUrl('');
      toast.success('Community Server created!'); 
      router.push(`/servers/${data.data.data.id}`); 
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create server'),
  });

  const joinServer = useMutation({
    mutationFn: () => api.post('/servers/join', { inviteCode }),
    onSuccess: (res: any) => { 
      queryClient.invalidateQueries({ queryKey: ['my-servers'] }); 
      setJoinOpen(false); 
      setInviteCode(''); 
      toast.success('Joined community successfully!'); 
      const serverId = res.data?.data?.serverId;
      if (serverId) {
        router.push(`/servers/${serverId}`);
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Invalid invite code'),
  });

  const copyInvite = (code: string, id: string) => {
    const fullLink = `${window.location.origin}/servers/join?code=${code}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Invite link copied!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6 md:p-8">
      {/* Header section */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-gaming-purple/20 via-background to-gaming-pink/10 p-6 md:p-8 shadow-xl shadow-primary/5">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-gaming-purple to-gaming-pink bg-clip-text text-transparent">
              Gaming Communities
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-lg">
              Create your own dedicated gaming guild, chat with friends via voice/text channels, schedule events, and join massive multiplayer servers.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-11 px-5 border-primary/30 hover:bg-primary/10 gap-2 font-medium">
                  <Search className="h-4 w-4 text-primary" /> Join Server
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Join a Server</DialogTitle>
                  <DialogDescription>Enter an invite code or link to join an existing gaming guild.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <Input 
                    value={inviteCode} 
                    onChange={(e) => setInviteCode(e.target.value)} 
                    placeholder="e.g. 5e7b23cf or paste the invite link" 
                    className="border-primary/20 focus-visible:ring-primary"
                  />
                  <Button 
                    onClick={() => {
                      // Extract inviteCode if full URL was pasted
                      let finalCode = inviteCode.trim();
                      if (finalCode.includes('code=')) {
                        const urlParams = new URLSearchParams(finalCode.split('?')[1]);
                        finalCode = urlParams.get('code') || finalCode;
                      } else if (finalCode.includes('/servers/join/')) {
                        finalCode = finalCode.substring(finalCode.lastIndexOf('/') + 1);
                      }
                      joinServer.mutate({ inviteCode: finalCode } as any);
                    }} 
                    disabled={!inviteCode.trim() || joinServer.isPending} 
                    className="w-full h-11 bg-primary hover:bg-primary/95 text-white"
                  >
                    {joinServer.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Join Server'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 px-5 bg-gradient-to-r from-primary to-gaming-purple hover:opacity-95 text-white gap-2 font-medium shadow-md shadow-primary/20">
                  <Plus className="h-4 w-4" /> Create Server
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Create Server</DialogTitle>
                  <DialogDescription>Establish a new gaming community. Customize it with a name, description, avatar logo, and banner.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Server Name *</label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="e.g. Alpha Squad" 
                      className="border-primary/20 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
                    <Input 
                      value={desc} 
                      onChange={(e) => setDesc(e.target.value)} 
                      placeholder="What is this community about?" 
                      className="border-primary/20 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Avatar Image URL</label>
                    <Input 
                      value={avatarUrl} 
                      onChange={(e) => setAvatarUrl(e.target.value)} 
                      placeholder="https://example.com/logo.png (optional)" 
                      className="border-primary/20 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Banner Image URL</label>
                    <Input 
                      value={bannerUrl} 
                      onChange={(e) => setBannerUrl(e.target.value)} 
                      placeholder="https://example.com/banner.png (optional)" 
                      className="border-primary/20 focus-visible:ring-primary"
                    />
                  </div>
                  <Button 
                    onClick={() => createServer.mutate()} 
                    disabled={!name.trim() || createServer.isPending} 
                    className="w-full h-11 bg-primary hover:bg-primary/95 text-white mt-2"
                  >
                    {createServer.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Server'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Your Servers */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Your Communties</h2>
        </div>
        {myLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-[180px] bg-muted/10 animate-pulse border-border/50" />
            ))}
          </div>
        ) : !myServers || myServers.length === 0 ? (
          <Card className="border-dashed border-primary/20 bg-muted/5">
            <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
              <Users className="h-12 w-12 text-primary/30" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">No servers joined yet</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">Create your own guild, or enter an invite code to join your friends' servers.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myServers.map((s: any) => (
              <Card 
                key={s.id} 
                className="group relative overflow-hidden cursor-pointer hover:border-primary/40 transition-all duration-300 bg-muted/10 border-primary/10 shadow-lg shadow-black/10 hover:shadow-primary/5 flex flex-col h-[180px] justify-between"
                onClick={() => router.push(`/servers/${s.id}`)}
              >
                {/* Banner section */}
                <div className="h-12 relative w-full bg-primary/10 shrink-0 border-b border-primary/5 overflow-hidden">
                  {s.banner ? (
                    <img src={s.banner} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-gaming-purple/20" />
                  )}
                </div>

                <CardContent className="p-4 pt-3 flex-1 flex flex-col justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 rounded-xl border-2 border-background shadow-md -mt-7 shrink-0 z-10">
                      <AvatarImage src={s.avatar || ''} className="object-cover" />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold text-base rounded-xl">
                        {getInitials(s.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 -mt-1">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors duration-200 truncate">{s.name}</h3>
                      {s.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{s.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium bg-muted/50 py-1 px-2.5 rounded-full">
                      <Users className="h-3 w-3 text-primary" />
                      {s._count?.members || s.memberCount} members
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full border border-primary/10 hover:bg-primary/10 hover:text-primary transition-all duration-200 shrink-0" 
                      onClick={(e) => { e.stopPropagation(); copyInvite(s.inviteCode, s.id); }}
                    >
                      {copiedId === s.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Discover Public Servers */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Discover Communities</h2>
        </div>
        {discoverLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-[180px] bg-muted/10 animate-pulse border-border/50" />
            ))}
          </div>
        ) : !discover || discover.length === 0 ? (
          <Card className="bg-muted/5 border-dashed border-border">
            <CardContent className="p-8 text-center text-muted-foreground flex items-center gap-2 justify-center">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span>No public servers found. Check back later!</span>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {discover.map((s: any) => (
              <Card 
                key={s.id} 
                className="group relative overflow-hidden cursor-pointer hover:border-primary/40 transition-all duration-300 bg-muted/10 border-primary/10 shadow-lg shadow-black/10 hover:shadow-primary/5 flex flex-col h-[180px] justify-between"
                onClick={() => router.push(`/servers/${s.id}`)}
              >
                {/* Banner section */}
                <div className="h-12 relative w-full bg-primary/10 shrink-0 border-b border-primary/5 overflow-hidden">
                  {s.banner ? (
                    <img src={s.banner} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-gaming-purple/20 to-gaming-pink/20" />
                  )}
                </div>

                <CardContent className="p-4 pt-3 flex-1 flex flex-col justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 rounded-xl border-2 border-background shadow-md -mt-7 shrink-0 z-10">
                      <AvatarImage src={s.avatar || ''} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-gaming-purple to-gaming-pink text-white font-bold text-base rounded-xl">
                        {getInitials(s.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 -mt-1">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors duration-200 truncate">{s.name}</h3>
                      {s.description ? (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{s.description}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5">Click to join and explore channels.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium bg-muted/50 py-1 px-2.5 rounded-full">
                      <Users className="h-3 w-3 text-gaming-purple" />
                      {s._count?.members || s.memberCount} members
                    </span>
                    <Button 
                      size="sm" 
                      className="bg-primary hover:bg-primary/95 text-white h-8 px-4 rounded-lg font-semibold text-xs"
                    >
                      Join Guild
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
