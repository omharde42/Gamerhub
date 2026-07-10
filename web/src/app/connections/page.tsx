'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, UserCheck, UserX, Loader2, Gamepad2, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

export default function ConnectionsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('following');

  const { data: followingData, isLoading: followingLoading } = useQuery({
    queryKey: ['following'],
    queryFn: () => api.get('/feed/following').then(r => r.data.data),
  });

  const { data: followersData, isLoading: followersLoading } = useQuery({
    queryKey: ['followers'],
    queryFn: () => api.get('/feed/followers').then(r => r.data.data),
  });

  const unfollowMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/feed/unfollow/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      toast.success('Unfollowed');
    },
    onError: () => toast.error('Failed to unfollow'),
  });

  const isLoading = tab === 'following' ? followingLoading : followersLoading;
  const data = tab === 'following' ? followingData : followersData;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/friends">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Connections</h1>
          <p className="text-sm text-muted-foreground">Manage your network</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="following" className="gap-2">
                <UserCheck className="h-4 w-4" /> Following ({followingData?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="followers" className="gap-2">
                <Users className="h-4 w-4" /> Followers ({followersData?.length || 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : data?.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-lg font-medium">
                {tab === 'following' ? 'Not following anyone yet' : 'No followers yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {tab === 'following'
                  ? 'Search for players to connect with'
                  : 'Share your profile to gain followers'}
              </p>
              {tab === 'following' && (
                <Link href="/friends">
                  <Button variant="default" size="sm" className="mt-2 gap-2">
                    <UserPlus className="h-4 w-4" /> Find Friends
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {data?.map((item: any) => {
                const profile = tab === 'following' ? item.following?.profile : item.follower?.profile;
                const personId = tab === 'following' ? item.followingId : item.followerId;
                return profile ? (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-all">
                    <Link href={`/profile/${profile.username}`}>
                      <Avatar className="h-10 w-10 border-2 border-border hover:border-primary transition-colors">
                        <AvatarImage src={profile.avatar || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary">{getInitials(profile.username)}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${profile.username}`} className="hover:underline">
                        <p className="font-medium truncate">{profile.displayName || profile.username}</p>
                      </Link>
                      <p className="text-xs text-muted-foreground">@{profile.username}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {profile.mainGames?.slice(0, 2).map((g: string) => (
                          <Badge key={g} variant="secondary" className="text-[10px] gap-1">
                            <Gamepad2 className="h-3 w-3" />{g}
                          </Badge>
                        ))}
                        {profile.rank && <Badge variant="outline" className="text-[10px]">{profile.rank}</Badge>}
                      </div>
                    </div>
                    {tab === 'following' && (
                      <Button variant="outline" size="sm" className="shrink-0 gap-1"
                        onClick={() => unfollowMutation.mutate(personId)}
                        disabled={unfollowMutation.isPending}>
                        <UserX className="h-4 w-4" /> Unfollow
                      </Button>
                    )}
                    {tab === 'followers' && (
                      <Link href={`/profile/${profile.username}`}>
                        <Button variant="outline" size="sm" className="shrink-0">
                          View Profile
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : null;
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
