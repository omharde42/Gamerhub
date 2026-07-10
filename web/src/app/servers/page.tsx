'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Users, Hash, Loader2, Search, Globe, Lock, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ServersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: myServers } = useQuery({ queryKey: ['my-servers'], queryFn: () => api.get('/servers').then(r => r.data.data) });
  const { data: discover } = useQuery({ queryKey: ['discover-servers'], queryFn: () => api.get('/servers/discover').then(r => r.data.data) });

  const createServer = useMutation({
    mutationFn: () => api.post('/servers', { name, description: desc, isPublic: true }),
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['my-servers'] }); setCreateOpen(false); setName(''); setDesc(''); toast.success('Server created!'); router.push(`/servers/${data.data.data.id}`); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const joinServer = useMutation({
    mutationFn: () => api.post('/servers/join', { inviteCode }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-servers'] }); setJoinOpen(false); setInviteCode(''); toast.success('Joined server!'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Invalid invite code'),
  });

  const copyInvite = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Invite code copied!');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Servers</h1>
          <p className="text-sm text-muted-foreground">Create or join gaming communities</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild><Button variant="outline" className="gap-1.5"><Search className="h-4 w-4" /> Join</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Join a Server</DialogTitle></DialogHeader><div className="space-y-4"><Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Enter invite code" /><Button onClick={() => joinServer.mutate()} disabled={!inviteCode.trim() || joinServer.isPending} className="w-full">{joinServer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join'}</Button></div></DialogContent>
          </Dialog>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button className="gap-1.5"><Plus className="h-4 w-4" /> Create</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Create a Server</DialogTitle></DialogHeader><div className="space-y-4"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Server name" /><Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" /><Button onClick={() => createServer.mutate()} disabled={!name.trim() || createServer.isPending} className="w-full">{createServer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Server'}</Button></div></DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Your Servers</h2>
        {!myServers || myServers.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground"><Users className="h-8 w-8 mx-auto mb-2 opacity-50" />No servers yet. Create or join one!</CardContent></Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {myServers.map((s: any) => (
              <Card key={s.id} className="cursor-pointer hover:border-primary/50 transition-all" onClick={() => router.push(`/servers/${s.id}`)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">{s.name.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s._count?.members || s.memberCount} members</p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={(e) => { e.stopPropagation(); copyInvite(s.inviteCode, s.id); }}>
                    {copiedId === s.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {discover && discover.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Discover</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {discover.map((s: any) => (
              <Card key={s.id} className="cursor-pointer hover:border-primary/50 transition-all" onClick={() => router.push(`/servers/${s.id}`)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gaming-purple to-gaming-pink flex items-center justify-center text-lg font-bold text-white shrink-0">{s.name.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground"><Users className="h-3 w-3 inline mr-0.5" />{s._count?.members || s.memberCount} members</p>
                  </div>
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
