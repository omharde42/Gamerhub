'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import { UserPlus, UserX, Check, X, Loader2, Users, MessageCircle, Search, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const STATUS_COLORS: Record<string, string> = { ONLINE: 'bg-success', IDLE: 'bg-warning', DND: 'bg-destructive', INVISIBLE: 'bg-muted-foreground', OFFLINE: 'bg-muted-foreground' };

export default function FriendsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: friends } = useQuery({ queryKey: ['friends'], queryFn: () => api.get('/friends').then(r => r.data.data) });
  const { data: requests } = useQuery({ queryKey: ['friend-requests'], queryFn: () => api.get('/friends/requests').then(r => r.data.data) });
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['search-profiles', debouncedQuery],
    queryFn: () => api.get(`/profiles/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`).then(r => r.data.data),
    enabled: debouncedQuery.trim().length >= 2,
  });

  const sendRequest = useMutation({
    mutationFn: (userId: string) => api.post('/friends/request', { userId }),
    onSuccess: () => { toast.success('Friend request sent!'); setSearchQuery(''); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to send request'),
  });

  const acceptRequest = useMutation({
    mutationFn: (id: string) => api.post(`/friends/accept/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['friends'] }); queryClient.invalidateQueries({ queryKey: ['friend-requests'] }); toast.success('Friend request accepted!'); },
  });

  const rejectRequest = useMutation({
    mutationFn: (id: string) => api.post(`/friends/reject/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['friend-requests'] }); toast.success('Request rejected'); },
  });

  const removeFriend = useMutation({
    mutationFn: (userId: string) => api.post('/friends/remove', { userId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['friends'] }); toast.success('Friend removed'); },
  });

  const friendIds = new Set(friends?.map((f: any) => f.id) || []);
  const requestIds = new Set(requests?.map((r: any) => r.sender?.id) || []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <motion.div className="flex items-center justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> Friends</h1>
          <p className="text-sm text-muted-foreground">{friends?.length || 0} friends in your network</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search players by username..." className="pl-9" variant="neon" />
              </div>
            </div>
            {debouncedQuery.trim().length >= 2 && (
              <div className="rounded-xl border border-border/30 bg-muted/20 overflow-hidden">
                {searching ? (
                  <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : searchResults?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No players found for &quot;{debouncedQuery}&quot;</p>
                ) : (
                  <div className="divide-y divide-border/20 max-h-64 overflow-y-auto">
                    {searchResults?.filter((p: any) => p.userId !== user?.id).map((profile: any) => {
                      const isFriend = friendIds.has(profile.userId);
                      const hasPending = requestIds.has(profile.userId);
                      return (
                        <div key={profile.id} className="flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile.avatar || ''} />
                            <AvatarFallback className="text-xs">{getInitials(profile.username)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{profile.displayName || profile.username}</p>
                            <p className="text-xs text-muted-foreground">@{profile.username}</p>
                          </div>
                          {isFriend ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><UserPlus className="h-3 w-3" /> Friends</span>
                          ) : hasPending ? (
                            <span className="text-xs text-muted-foreground">Request sent</span>
                          ) : (
                            <Button variant="gradient" size="sm" className="h-7 gap-1 text-xs" onClick={() => sendRequest.mutate(profile.userId)} disabled={sendRequest.isPending} animate>
                              {sendRequest.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                              Add
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="online">
        <TabsList className="bg-muted/30 p-1 rounded-xl">
          <TabsTrigger value="online" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">Online</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">All Friends</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg relative">
            Pending
            {requests?.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-primary text-primary-foreground">{requests.length}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="online" className="mt-3">
          <Card variant="glass">
            <CardContent className="p-4 space-y-1">
              {friends?.filter((f: any) => f.presence === 'ONLINE').length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No friends online</p>
              ) : friends?.filter((f: any) => f.presence === 'ONLINE').map((friend: any) => (
                <FriendRow key={friend.id} friend={friend} onRemove={removeFriend.mutate} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-3">
          <Card variant="glass">
            <CardContent className="p-4 space-y-1">
              {friends?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No friends yet. Add some!</p>
              ) : friends?.map((friend: any) => (
                <FriendRow key={friend.id} friend={friend} onRemove={removeFriend.mutate} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-3">
          <Card variant="glass">
            <CardContent className="p-4 space-y-2">
              {requests?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending requests</p>
              ) : requests?.map((req: any) => (
                <motion.div key={req.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-all border border-border/30" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={req.sender?.profile?.avatar || ''} />
                    <AvatarFallback className="text-xs">{getInitials(req.sender?.profile?.username || 'U')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{req.sender?.profile?.username}</p>
                    <p className="text-xs text-muted-foreground">Sent you a friend request</p>
                  </div>
                  <Button variant="gradient" size="sm" className="gap-1" onClick={() => acceptRequest.mutate(req.id)} animate><Check className="h-3.5 w-3.5" /> Accept</Button>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => rejectRequest.mutate(req.id)}><X className="h-3.5 w-3.5" /> Reject</Button>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FriendRow({ friend, onRemove }: { friend: any; onRemove: (id: string) => void }) {
  return (
    <motion.div className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-all group border border-transparent hover:border-border/30" whileHover={{ x: 2 }}>
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={friend.profile?.avatar || ''} />
          <AvatarFallback className="text-xs">{getInitials(friend.profile?.username || 'U')}</AvatarFallback>
        </Avatar>
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${STATUS_COLORS[friend.presence || 'OFFLINE']}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{friend.profile?.username}</p>
        <p className="text-xs text-muted-foreground capitalize">{friend.presence?.toLowerCase() || 'Offline'}</p>
      </div>
      <div className="hidden group-hover:flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><MessageCircle className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onRemove(friend.id)}><UserX className="h-4 w-4" /></Button>
      </div>
    </motion.div>
  );
}
