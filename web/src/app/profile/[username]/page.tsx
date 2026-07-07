'use client';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Globe, Trophy, Target, TrendingUp, Gamepad2, Twitch, Youtube, MessageCircle, ExternalLink, Star, Shield, Users, Calendar, Award, Swords } from 'lucide-react';
import { formatDate, formatNumber, getInitials, getRankColor } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useQuery({ queryKey: ['profile', username], queryFn: () => api.get(`/profiles/${username}`).then(r => r.data.data) });
  const { data: posts } = useQuery({ queryKey: ['profile-posts', username], queryFn: () => api.get(`/posts?userId=${profile?.user?.id}`).then(r => r.data.data).catch(() => []), enabled: !!profile?.user?.id });
  const followMut = useMutation({ mutationFn: () => api.post(`/feed/follow/${profile?.user?.id}`), onSuccess: () => toast.success('Followed!') });

  if (isLoading) return <div className="max-w-4xl mx-auto space-y-6"><Skeleton className="h-64" /><Skeleton className="h-96" /></div>;
  if (!profile) return <div className="text-center py-20"><h2 className="text-2xl font-bold">Profile not found</h2></div>;

  const isOwn = user?.profile?.username === username;
  const socialLinks = [
    { icon: Twitch, href: profile.twitch, label: 'Twitch' },
    { icon: Youtube, href: profile.youtube, label: 'YouTube' },
    { icon: MessageCircle, href: profile.discord ? `https://discord.com/users/${profile.discord}` : null, label: 'Discord' },
    { icon: ExternalLink, href: profile.steam ? `https://steamcommunity.com/profiles/${profile.steam}` : null, label: 'Steam' },
  ].filter(s => s.href);

  return (<div className="max-w-4xl mx-auto space-y-6">
    <Card className="glass-card overflow-hidden">
      <div className="h-48 md:h-64 bg-gradient-to-r from-gaming-purple via-gaming-pink to-gaming-blue relative">{profile.banner && <img src={profile.banner} alt="" className="w-full h-full object-cover" />}</div>
      <CardContent className="relative px-6 pb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-20 mb-4"><Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-background ring-2 ring-gaming-purple"><AvatarImage src={profile.avatar || ''} /><AvatarFallback className="text-4xl bg-primary/10 text-primary">{getInitials(profile.username)}</AvatarFallback></Avatar><div className="flex-1 pt-14 md:pt-0"><div className="flex flex-col md:flex-row md:items-center gap-2"><h1 className="text-2xl md:text-3xl font-bold">{profile.displayName || profile.username}</h1><span className="text-muted-foreground">@{profile.username}</span></div><div className="flex flex-wrap items-center gap-2 mt-1"><Badge variant="secondary" className={getRankColor(profile.rank)}><Trophy className="h-3 w-3 mr-1" />{profile.rank || 'Unranked'}</Badge><Badge variant="outline">{profile.role || 'Flex'}</Badge>{profile.country && <Badge variant="outline"><MapPin className="h-3 w-3 mr-1" />{profile.country}</Badge>}</div></div>{!isOwn && (<div className="flex gap-2"><Button variant="gradient" size="sm" onClick={() => followMut.mutate()}>Follow</Button><Link href={`/messages?user=${profile.user?.id}`}><Button variant="outline" size="sm">Message</Button></Link></div>)}</div>
        {profile.bio && <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>}
        <div className="flex flex-wrap gap-4">{profile.mainGames?.map((game: string, i: number) => (<Badge key={i} variant="secondary" className="gap-1"><Gamepad2 className="h-3 w-3" />{game}</Badge>))}{profile.languages?.map((lang: string, i: number) => (<Badge key={i} variant="outline">{lang}</Badge>))}</div>
        {socialLinks.length > 0 && (<div className="flex gap-2 mt-4">{socialLinks.map((link, i) => (<a key={i} href={link.href} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="gap-1.5"><link.icon className="h-4 w-4" />{link.label}</Button></a>))}</div>)}
      </CardContent>
    </Card>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="glass-card"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-500">{profile.winRate}%</p><p className="text-xs text-muted-foreground">Win Rate</p></CardContent></Card>
      <Card className="glass-card"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-500">{profile.kd}</p><p className="text-xs text-muted-foreground">K/D Ratio</p></CardContent></Card>
      <Card className="glass-card"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gaming-purple">{profile.accuracy}%</p><p className="text-xs text-muted-foreground">Accuracy</p></CardContent></Card>
      <Card className="glass-card"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-500">{profile.totalMatches}</p><p className="text-xs text-muted-foreground">Total Matches</p></CardContent></Card>
    </div>

    <Tabs defaultValue="achievements" className="w-full">
      <TabsList className="w-full justify-start"><TabsTrigger value="achievements"><Award className="h-4 w-4 mr-1" />Achievements</TabsTrigger><TabsTrigger value="history"><Swords className="h-4 w-4 mr-1" />History</TabsTrigger><TabsTrigger value="posts"><Star className="h-4 w-4 mr-1" />Posts</TabsTrigger><TabsTrigger value="about"><Shield className="h-4 w-4 mr-1" />About</TabsTrigger></TabsList>
      <TabsContent value="achievements"><Card className="glass-card"><CardContent className="p-6">{profile.achievements?.length > 0 ? (<div className="grid grid-cols-2 md:grid-cols-3 gap-4">{profile.achievements.map((a: any, i: number) => (<div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border"><Award className="h-8 w-8 text-yellow-500" /><div><p className="text-sm font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{a.description}</p></div></div>))}</div>) : <p className="text-muted-foreground text-center py-8">No achievements yet</p>}</CardContent></Card></TabsContent>
      <TabsContent value="history"><Card className="glass-card"><CardContent className="p-6">{profile.tournamentHistory?.length > 0 ? (<div className="space-y-3">{profile.tournamentHistory.map((h: any, i: number) => (<div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border"><div><p className="text-sm font-medium">{h.tournamentName}</p><p className="text-xs text-muted-foreground">{formatDate(h.date)}</p></div><Badge variant={h.placement === '1st' ? 'default' : 'secondary'}>{h.placement}</Badge></div>))}</div>) : <p className="text-muted-foreground text-center py-8">No tournament history</p>}</CardContent></Card></TabsContent>
      <TabsContent value="posts"><Card className="glass-card"><CardContent className="p-6 space-y-4">{posts?.map((post: any, i: number) => (<div key={i} className="p-4 rounded-lg border border-border"><p className="text-sm">{post.content}</p><p className="text-xs text-muted-foreground mt-2">{post._count?.likes} likes • {post._count?.comments} comments</p></div>))}</CardContent></Card></TabsContent>
      <TabsContent value="about"><Card className="glass-card"><CardContent className="p-6 space-y-4"><div className="grid md:grid-cols-2 gap-4"><div className="space-y-3"><h3 className="font-semibold">Gaming Info</h3><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Play Style</span><span>{profile.playStyle || 'N/A'}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Communication</span><span>{profile.communicationStyle || 'N/A'}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Active Time</span><span>{profile.activeTime || 'N/A'}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Experience</span><span>{profile.experienceLevel || 'N/A'}</span></div></div></div><div className="space-y-3"><h3 className="font-semibold">Stats</h3><div className="space-y-3"><div><div className="flex justify-between text-sm mb-1"><span>Win Rate</span><span>{profile.winRate}%</span></div><Progress value={profile.winRate} className="h-2" /></div><div><div className="flex justify-between text-sm mb-1"><span>K/D</span><span>{profile.kd}</span></div><Progress value={Math.min((profile.kd / 5) * 100, 100)} className="h-2" /></div><div><div className="flex justify-between text-sm mb-1"><span>Accuracy</span><span>{profile.accuracy}%</span></div><Progress value={profile.accuracy} className="h-2" /></div></div></div></div></CardContent></Card></TabsContent>
    </Tabs>
  </div>);
}
