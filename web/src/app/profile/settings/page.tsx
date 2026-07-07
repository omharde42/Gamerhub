'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { GAMES, ROLES, PLAY_STYLES, COMMUNICATION_STYLES, REGIONS, LANGUAGES } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Shield, Bell, User, Gamepad2, X } from 'lucide-react';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState({
    displayName: user?.profile?.displayName || '', bio: user?.profile?.bio || '', country: user?.profile?.country || '', city: user?.profile?.city || '', playStyle: user?.profile?.playStyle || '', communicationStyle: user?.profile?.communicationStyle || '', rank: user?.profile?.rank || '', role: user?.profile?.role || '', twitch: user?.profile?.twitch || '', youtube: user?.profile?.youtube || '', discord: user?.profile?.discord || '', twitter: user?.profile?.twitter || '', mainGames: user?.profile?.mainGames || [], languages: user?.profile?.languages || [], activeTime: user?.profile?.activeTime || '',
  });
  const [newGame, setNewGame] = useState(''); const [newLang, setNewLang] = useState('');

  const updateProfile = useMutation({ mutationFn: () => api.put('/profiles', profile), onSuccess: () => { toast.success('Profile updated!'); }, onError: (err: any) => toast.error(err.response?.data?.message || 'Failed') });
  const uploadAvatar = useMutation({ mutationFn: (file: File) => { const fd = new FormData(); fd.append('avatar', file); return api.post('/profiles/avatar', fd); }, onSuccess: (data) => { setUser({ ...user, profile: { ...user?.profile, avatar: data.data.data.avatar } }); toast.success('Avatar updated!'); } });

  const addGame = () => { if (newGame && !profile.mainGames.includes(newGame)) { setProfile({ ...profile, mainGames: [...profile.mainGames, newGame] }); setNewGame(''); } };
  const addLang = () => { if (newLang && !profile.languages.includes(newLang)) { setProfile({ ...profile, languages: [...profile.languages, newLang] }); setNewLang(''); } };

  return (<div className="max-w-3xl mx-auto space-y-6"><h1 className="text-2xl font-bold">Settings</h1>
    <Tabs defaultValue="profile"><TabsList><TabsTrigger value="profile"><User className="h-4 w-4 mr-1" />Profile</TabsTrigger><TabsTrigger value="gaming"><Gamepad2 className="h-4 w-4 mr-1" />Gaming</TabsTrigger><TabsTrigger value="social"><Shield className="h-4 w-4 mr-1" />Social</TabsTrigger><TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1" />Notifications</TabsTrigger></TabsList>

      <TabsContent value="profile"><Card className="glass-card"><CardContent className="p-6 space-y-6"><div className="flex items-center gap-4"><Avatar className="h-20 w-20"><AvatarImage src={user?.profile?.avatar || ''} /><AvatarFallback className="text-2xl">{getInitials(user?.profile?.username || 'U')}</AvatarFallback></Avatar><div><Button variant="outline" size="sm" className="relative"><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && uploadAvatar.mutate(e.target.files[0])} />Change Avatar</Button></div></div>
        <div className="grid md:grid-cols-2 gap-4"><div><Label>Display Name</Label><Input value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} /></div><div><Label>Country</Label><Input value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} /></div></div>
        <div><Label>Bio</Label><Textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} /></div>
        <Button variant="gradient" onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>Save Changes</Button></CardContent></Card></TabsContent>

      <TabsContent value="gaming"><Card className="glass-card"><CardContent className="p-6 space-y-4">
        <div><Label>Main Games</Label><div className="flex gap-2 mt-1">{(profile.mainGames as string[]).map((g: string, i: number) => (<Badge key={i} variant="secondary" className="gap-1">{g}<button onClick={() => setProfile({ ...profile, mainGames: profile.mainGames.filter((_: string, j: number) => j !== i) })}><X className="h-3 w-3" /></button></Badge>))}</div><div className="flex gap-2 mt-2"><Select value={newGame} onValueChange={setNewGame}><SelectTrigger><SelectValue placeholder="Add game" /></SelectTrigger><SelectContent>{(GAMES as string[]).filter((game: string) => !(profile.mainGames as string[]).includes(game)).map((game: string) => (<SelectItem key={game} value={game}>{game}</SelectItem>))}</SelectContent></Select><Button variant="outline" size="sm" onClick={addGame}>Add</Button></div></div>
        <div><Label>Languages</Label><div className="flex gap-2 mt-1">{(profile.languages as string[]).map((lang: string, i: number) => (<Badge key={i} variant="outline" className="gap-1">{lang}<button onClick={() => setProfile({ ...profile, languages: profile.languages.filter((_: string, j: number) => j !== i) })}><X className="h-3 w-3" /></button></Badge>))}</div><div className="flex gap-2 mt-2"><Select value={newLang} onValueChange={setNewLang}><SelectTrigger><SelectValue placeholder="Add language" /></SelectTrigger><SelectContent>{(LANGUAGES as string[]).filter((lang: string) => !(profile.languages as string[]).includes(lang)).map((lang: string) => (<SelectItem key={lang} value={lang}>{lang}</SelectItem>))}</SelectContent></Select><Button variant="outline" size="sm" onClick={addLang}>Add</Button></div></div>
        <div className="grid md:grid-cols-2 gap-4"><div><Label>Role</Label><Select value={profile.role} onValueChange={(v) => setProfile({ ...profile, role: v })}><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger><SelectContent>{ROLES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent></Select></div><div><Label>Play Style</Label><Select value={profile.playStyle} onValueChange={(v) => setProfile({ ...profile, playStyle: v })}><SelectTrigger><SelectValue placeholder="Select style" /></SelectTrigger><SelectContent>{PLAY_STYLES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select></div></div>
        <div className="grid md:grid-cols-2 gap-4"><div><Label>Communication Style</Label><Select value={profile.communicationStyle} onValueChange={(v) => setProfile({ ...profile, communicationStyle: v })}><SelectTrigger><SelectValue placeholder="Select style" /></SelectTrigger><SelectContent>{COMMUNICATION_STYLES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select></div><div><Label>Rank</Label><Input value={profile.rank} onChange={(e) => setProfile({ ...profile, rank: e.target.value })} placeholder="e.g. Gold, Platinum" /></div></div>
        <Button variant="gradient" onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>Save Changes</Button></CardContent></Card></TabsContent>

      <TabsContent value="social"><Card className="glass-card"><CardContent className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4"><div><Label>Twitch</Label><Input value={profile.twitch} onChange={(e) => setProfile({ ...profile, twitch: e.target.value })} placeholder="twitch.tv/yourname" /></div><div><Label>YouTube</Label><Input value={profile.youtube} onChange={(e) => setProfile({ ...profile, youtube: e.target.value })} placeholder="youtube.com/@yourname" /></div></div>
        <div className="grid md:grid-cols-2 gap-4"><div><Label>Discord</Label><Input value={profile.discord} onChange={(e) => setProfile({ ...profile, discord: e.target.value })} placeholder="username#0000" /></div><div><Label>Twitter</Label><Input value={profile.twitter} onChange={(e) => setProfile({ ...profile, twitter: e.target.value })} placeholder="@yourname" /></div></div>
        <Button variant="gradient" onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>Save Changes</Button></CardContent></Card></TabsContent>

      <TabsContent value="notifications"><Card className="glass-card"><CardContent className="p-6 space-y-4">
        {[{ label: 'Push Notifications', desc: 'Receive push notifications' }, { label: 'Email Notifications', desc: 'Receive email notifications' }, { label: 'Messages', desc: 'New message alerts' }, { label: 'Team Invites', desc: 'Team invitation alerts' }, { label: 'Tournament Updates', desc: 'Tournament status changes' }, { label: 'Job Alerts', desc: 'New job postings' }].map((item, i) => (<div key={i} className="flex items-center justify-between"><div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div><Switch /></div>))}
      </CardContent></Card></TabsContent>
    </Tabs>
  </div>);
}
