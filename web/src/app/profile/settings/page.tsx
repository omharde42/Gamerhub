'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Shield, Bell, User, Gamepad2, X, Loader2, CheckCircle2, Circle, Sparkles, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [profile, setProfile] = useState({
    displayName: user?.profile?.displayName || '',
    bio: user?.profile?.bio || '',
    country: user?.profile?.country || '',
    city: user?.profile?.city || '',
    playStyle: user?.profile?.playStyle || '',
    communicationStyle: user?.profile?.communicationStyle || '',
    rank: user?.profile?.rank || '',
    role: user?.profile?.role || '',
    twitch: user?.profile?.twitch || '',
    youtube: user?.profile?.youtube || '',
    discord: user?.profile?.discord || '',
    twitter: user?.profile?.twitter || '',
    mainGames: user?.profile?.mainGames || [],
    languages: user?.profile?.languages || [],
    activeTime: user?.profile?.activeTime || '',
  });

  const [newGame, setNewGame] = useState('');
  const [newLang, setNewLang] = useState('');

  // Sync state if user rehydrates or loads
  useEffect(() => {
    if (user?.profile) {
      setProfile({
        displayName: user.profile.displayName || '',
        bio: user.profile.bio || '',
        country: user.profile.country || '',
        city: user.profile.city || '',
        playStyle: user.profile.playStyle || '',
        communicationStyle: user.profile.communicationStyle || '',
        rank: user.profile.rank || '',
        role: user.profile.role || '',
        twitch: user.profile.twitch || '',
        youtube: user.profile.youtube || '',
        discord: user.profile.discord || '',
        twitter: user.profile.twitter || '',
        mainGames: user.profile.mainGames || [],
        languages: user.profile.languages || [],
        activeTime: user.profile.activeTime || '',
      });
    }
  }, [user]);

  // Calculate setup checklist details
  const checklistItems = [
    { label: 'Profile Picture', checked: !!user?.profile?.avatar, weight: 15 },
    { label: 'Gaming Name / Tag', checked: !!profile.displayName.trim(), weight: 20 },
    { label: 'Bio / Bio Summary', checked: !!profile.bio.trim(), weight: 15 },
    { label: 'Country', checked: !!profile.country.trim(), weight: 15 },
    { label: 'Favorite Games', checked: profile.mainGames.length > 0, weight: 20 },
    { label: 'Social & Messaging Links', checked: !!(profile.discord || profile.twitch || profile.youtube || profile.twitter), weight: 15 },
  ];

  const totalProgress = checklistItems.reduce((acc, item) => acc + (item.checked ? item.weight : 0), 0);
  
  // Core setup items required to view feed
  const coreSetupCompleted = 
    !!profile.displayName.trim() && 
    !!profile.bio.trim() && 
    !!profile.country.trim() && 
    profile.mainGames.length > 0;

  const updateProfile = useMutation({
    mutationFn: () => api.put('/profiles', profile),
    onSuccess: async () => {
      try {
        const res = await api.get(`/profiles/${user?.profile?.username}`);
        const updated = res.data.data;
        setUser({ ...user, profile: updated });
        
        const nextCoreSetupCompleted = 
          !!updated.displayName?.trim() && 
          !!updated.bio?.trim() && 
          !!updated.country?.trim() && 
          updated.mainGames?.length > 0;

        if (nextCoreSetupCompleted) {
          toast.success('Gamer Passport Completed! Access granted.');
          router.push('/feed');
        } else {
          toast.success('Changes saved successfully!');
        }
      } catch {
        toast.success('Changes saved successfully!');
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update profile')
  });

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return api.post('/profiles/avatar', fd);
    },
    onSuccess: async (data) => {
      const avatarUrl = data.data.data.avatar;
      setUser({ ...user, profile: { ...user?.profile, avatar: avatarUrl } });
      toast.success('Avatar updated!');
    },
    onError: () => toast.error('Failed to upload avatar')
  });

  const addGame = () => {
    if (newGame && !profile.mainGames.includes(newGame)) {
      setProfile({ ...profile, mainGames: [...profile.mainGames, newGame] });
      setNewGame('');
    }
  };

  const addLang = () => {
    if (newLang && !profile.languages.includes(newLang)) {
      setProfile({ ...profile, languages: [...profile.languages, newLang] });
      setNewLang('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Passport Settings</h1>
        {!coreSetupCompleted && (
          <Badge variant="neon" className="animate-pulse gap-1"><Sparkles className="h-3 w-3" /> Setup Mode</Badge>
        )}
      </div>

      {/* Gamified Setup Progress Card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass" className="border-primary/30 relative overflow-hidden shadow-lg shadow-primary/5">
          <div className="absolute top-0 right-0 w-36 h-36 bg-primary/[0.02] rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Gamer Passport Completion
              </span>
              <span className="text-primary font-extrabold">{totalProgress}%</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Complete your profile setup to activate your Gamer Passport and unlock the main community feed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full h-2.5 bg-muted/60 rounded-full overflow-hidden border border-border/50">
              <motion.div
                className="h-full bg-gradient-to-r from-gaming-purple via-gaming-cyan to-gaming-pink rounded-full"
                animate={{ width: `${totalProgress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {checklistItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-colors duration-200 ${
                    item.checked 
                      ? 'bg-success/5 border-success/20 text-success' 
                      : 'bg-muted/10 border-border/30 text-muted-foreground'
                  }`}
                >
                  {item.checked ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                  )}
                  <span className="truncate font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="w-full justify-start border-b border-border/50 rounded-none bg-transparent h-12 p-0 gap-6">
          <TabsTrigger value="profile" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 py-3 bg-transparent hover:text-foreground text-sm gap-1.5"><User className="h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="gaming" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 py-3 bg-transparent hover:text-foreground text-sm gap-1.5"><Gamepad2 className="h-4 w-4" />Gaming</TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 py-3 bg-transparent hover:text-foreground text-sm gap-1.5"><Shield className="h-4 w-4" />Social</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 py-3 bg-transparent hover:text-foreground text-sm gap-1.5"><Bell className="h-4 w-4" />Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card variant="glass">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-md">
                  <AvatarImage src={user?.profile?.avatar || ''} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-gaming-purple to-gaming-pink text-white">{getInitials(user?.profile?.username || 'U')}</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm" className="relative h-9 px-4 rounded-xl cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                      onChange={(e) => e.target.files?.[0] && uploadAvatar.mutate(e.target.files[0])} 
                      disabled={uploadAvatar.isPending}
                    />
                    {uploadAvatar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                    Change Avatar
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="displayName" className="text-xs font-semibold">Gaming Username / Display Name *</Label>
                  <Input 
                    id="displayName"
                    value={profile.displayName} 
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} 
                    placeholder="Enter your in-game alias"
                    variant="neon"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country" className="text-xs font-semibold">Country *</Label>
                  <Input 
                    id="country"
                    value={profile.country} 
                    onChange={(e) => setProfile({ ...profile, country: e.target.value })} 
                    placeholder="e.g. United States, India"
                    variant="neon"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio" className="text-xs font-semibold">Bio / Gamer Summary *</Label>
                <Textarea 
                  id="bio"
                  value={profile.bio} 
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })} 
                  placeholder="Introduce yourself! Let players know your schedule, achievements, or favorite genres."
                  rows={3} 
                  className="resize-none"
                />
              </div>

              <Button 
                variant="gradient" 
                onClick={() => updateProfile.mutate()} 
                disabled={updateProfile.isPending}
                className="h-11 px-6 rounded-xl gap-2 font-bold shadow-md shadow-primary/10"
                animate
              >
                {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaming">
          <Card variant="glass">
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Favorite / Connected Games *</Label>
                <div className="flex flex-wrap gap-1.5">
                  {profile.mainGames.length === 0 ? (
                    <span className="text-xs text-muted-foreground/60 italic">No games selected. Add at least one game.</span>
                  ) : (
                    profile.mainGames.map((g: string, i: number) => (
                      <Badge key={i} variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs">
                        {g}
                        <button 
                          type="button"
                          onClick={() => setProfile({ ...profile, mainGames: profile.mainGames.filter((_: string, j: number) => j !== i) })}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
                <div className="flex gap-2 max-w-md mt-2">
                  <Select value={newGame} onValueChange={setNewGame}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Add game" /></SelectTrigger>
                    <SelectContent>
                      {GAMES.filter((game: string) => !profile.mainGames.includes(game)).map((game: string) => (
                        <SelectItem key={game} value={game}>{game}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={addGame} className="h-10 px-4 rounded-xl shrink-0">Add</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Languages</Label>
                <div className="flex flex-wrap gap-1.5">
                  {profile.languages.map((lang: string, i: number) => (
                    <Badge key={i} variant="outline" className="gap-1.5 px-2.5 py-1 text-xs">
                      {lang}
                      <button 
                        type="button"
                        onClick={() => setProfile({ ...profile, languages: profile.languages.filter((_: string, j: number) => j !== i) })}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 max-w-md mt-2">
                  <Select value={newLang} onValueChange={setNewLang}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Add language" /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.filter((lang: string) => !profile.languages.includes(lang)).map((lang: string) => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={addLang} className="h-10 px-4 rounded-xl shrink-0">Add</Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Role / Position</Label>
                  <Select value={profile.role} onValueChange={(v) => setProfile({ ...profile, role: v })}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Play Style</Label>
                  <Select value={profile.playStyle} onValueChange={(v) => setProfile({ ...profile, playStyle: v })}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select style" /></SelectTrigger>
                    <SelectContent>
                      {PLAY_STYLES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Communication Style</Label>
                  <Select value={profile.communicationStyle} onValueChange={(v) => setProfile({ ...profile, communicationStyle: v })}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select style" /></SelectTrigger>
                    <SelectContent>
                      {COMMUNICATION_STYLES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rank" className="text-xs font-semibold">Rank (Overall / Main Game)</Label>
                  <Input 
                    id="rank"
                    value={profile.rank} 
                    onChange={(e) => setProfile({ ...profile, rank: e.target.value })} 
                    placeholder="e.g. Gold, Platinum, Diamond"
                    variant="neon"
                  />
                </div>
              </div>

              <Button 
                variant="gradient" 
                onClick={() => updateProfile.mutate()} 
                disabled={updateProfile.isPending}
                className="h-11 px-6 rounded-xl gap-2 font-bold shadow-md shadow-primary/10"
                animate
              >
                {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Gaming Details
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card variant="glass">
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="twitch" className="text-xs font-semibold">Twitch Channel</Label>
                  <Input 
                    id="twitch"
                    value={profile.twitch} 
                    onChange={(e) => setProfile({ ...profile, twitch: e.target.value })} 
                    placeholder="twitch.tv/yourname" 
                    variant="neon"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="youtube" className="text-xs font-semibold">YouTube Channel</Label>
                  <Input 
                    id="youtube"
                    value={profile.youtube} 
                    onChange={(e) => setProfile({ ...profile, youtube: e.target.value })} 
                    placeholder="youtube.com/@yourname" 
                    variant="neon"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="discord" className="text-xs font-semibold">Discord Username</Label>
                  <Input 
                    id="discord"
                    value={profile.discord} 
                    onChange={(e) => setProfile({ ...profile, discord: e.target.value })} 
                    placeholder="username#0000" 
                    variant="neon"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="twitter" className="text-xs font-semibold">Twitter / X handle</Label>
                  <Input 
                    id="twitter"
                    value={profile.twitter} 
                    onChange={(e) => setProfile({ ...profile, twitter: e.target.value })} 
                    placeholder="@yourname" 
                    variant="neon"
                  />
                </div>
              </div>

              <Button 
                variant="gradient" 
                onClick={() => updateProfile.mutate()} 
                disabled={updateProfile.isPending}
                className="h-11 px-6 rounded-xl gap-2 font-bold shadow-md shadow-primary/10"
                animate
              >
                {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Socials
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card variant="glass">
            <CardContent className="p-6 space-y-4">
              {[
                { label: 'Push Notifications', desc: 'Receive push notifications' },
                { label: 'Email Notifications', desc: 'Receive email notifications' },
                { label: 'Messages', desc: 'New message alerts' },
                { label: 'Team Invites', desc: 'Team invitation alerts' },
                { label: 'Tournament Updates', desc: 'Tournament status changes' },
                { label: 'Job Alerts', desc: 'New job postings' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/20 transition-colors">
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}