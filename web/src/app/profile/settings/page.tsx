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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { GAMES, ROLES, PLAY_STYLES, COMMUNICATION_STYLES, REGIONS, LANGUAGES, API_URL } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Shield, Bell, User, Gamepad2, X, Loader2, CheckCircle2, Circle, Sparkles, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
 
export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();

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
    // Wait, the API endpoint is PUT /profiles
    mutationFn: () => api.put('/profiles', profile),
    onSuccess: (res: any) => {
      const updated = res.data.data;
      setUser({ ...user, profile: updated });
      
      const username = updated.username || user?.profile?.username || user?.username;
      
      // Invalidate the cache for profile query so it reloads in real time without refreshing
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      toast.success('Profile updated successfully!', { id: 'profile-save-success', duration: 3000 });
      router.push(`/profile/${username}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update profile')
  });

  const { data: linkedAccounts, refetch: refetchAccounts } = useQuery({
    queryKey: ['linked-accounts'],
    queryFn: () => api.get('/auth/accounts').then((r) => r.data.data).catch(() => []),
    enabled: !!user,
  });

  const unlinkAccount = useMutation({
    mutationFn: (provider: string) => api.post('/auth/accounts/unlink', { provider }),
    onSuccess: (_, provider) => {
      refetchAccounts();
      toast.success(`${provider} account unlinked successfully`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to unlink account');
    },
  });

  const handleLinkSocial = async (provider: string) => {
    if (provider === 'steam') {
      window.location.href = `${API_URL}/auth/steam`;
      return;
    }
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || `Failed to link ${provider}`);
    }
  };

  const handleSave = () => {
    if (!profile.displayName.trim()) {
      toast.error('Gaming Display Name is required');
      return;
    }
    if (!profile.country.trim()) {
      toast.error('Country is required');
      return;
    }
    if (!profile.bio.trim()) {
      toast.error('Bio Summary is required');
      return;
    }
    if (profile.mainGames.length === 0) {
      toast.error('At least one connected game is required');
      return;
    }
    updateProfile.mutate();
  };

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
        <TabsList className="w-full border-b border-border/50 rounded-none bg-transparent h-12 p-0 gap-6 flex md:inline-flex overflow-x-auto whitespace-nowrap scrollbar-none justify-start">
          <TabsTrigger value="profile" className="shrink-0 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 py-3 bg-transparent hover:text-foreground text-sm gap-1.5"><User className="h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="gaming" className="shrink-0 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 py-3 bg-transparent hover:text-foreground text-sm gap-1.5"><Gamepad2 className="h-4 w-4" />Gaming</TabsTrigger>
          <TabsTrigger value="social" className="shrink-0 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 py-3 bg-transparent hover:text-foreground text-sm gap-1.5"><Sparkles className="h-4 w-4" />Social Links</TabsTrigger>
          <TabsTrigger value="accounts" className="shrink-0 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 py-3 bg-transparent hover:text-foreground text-sm gap-1.5"><Shield className="h-4 w-4" />Connected Accounts</TabsTrigger>
          <TabsTrigger value="notifications" className="shrink-0 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 py-3 bg-transparent hover:text-foreground text-sm gap-1.5"><Bell className="h-4 w-4" />Notifications</TabsTrigger>
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
                onClick={handleSave} 
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
                onClick={handleSave} 
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
                onClick={handleSave} 
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

        <TabsContent value="accounts">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Connected Social & Gaming Accounts
              </CardTitle>
              <CardDescription>
                Link your Google, Discord, and Steam accounts for single click sign-in and cross-platform gaming identity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  provider: 'GOOGLE',
                  name: 'Google',
                  icon: (
                    <svg className="h-6 w-6" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  ),
                },
                {
                  provider: 'DISCORD',
                  name: 'Discord',
                  icon: (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#5865F2">
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                    </svg>
                  ),
                },
                {
                  provider: 'STEAM',
                  name: 'Steam',
                  icon: (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#171A21">
                      <path d="M12 2C6.48 2 2 6.48 2 12c0 2.03.6 3.92 1.64 5.5l3.76-1.56a3.24 3.24 0 0 1-.28-1.3c0-1.79 1.45-3.24 3.24-3.24.94 0 1.79.4 2.38 1.04l5.7-2.27A6.96 6.96 0 0 0 12 2zm7.96 9.72l-5.46 2.18c.07.25.11.52.11.79 0 1.79-1.45 3.24-3.24 3.24-.5 0-.97-.12-1.39-.32l-3.78 1.57A6 6 0 0 0 12 22c5.52 0 10-4.48 10-10 0-.87-.11-1.72-.32-2.53-.06-.25-.13-.5-.22-.75zM7.08 14.4l-2.48 1.02A5.96 5.96 0 0 0 6 18.4c.48.73 1.1 1.34 1.83 1.82l-.75-2.5a1.26 1.26 0 0 1-.7-.22 1.32 1.32 0 0 1-.5-1.43c.11-.35.33-.65.63-.85.29-.2.64-.28.99-.23.19.03.37.1.52.2l.75-2.5a4.73 4.73 0 0 0-2.29-.08zm1.8-1.31c-.65 0-1.18-.53-1.18-1.18s.53-1.18 1.18-1.18 1.18.53 1.18 1.18-.53 1.18-1.18 1.18zm3.72 5.72c1.37 0 2.48-1.11 2.48-2.48s-1.11-2.48-2.48-2.48-2.48 1.11-2.48 2.48 1.11 2.48 2.48 2.48z" />
                    </svg>
                  ),
                },
              ].map((item) => {
                const linkedAcc = (linkedAccounts || []).find((a: any) => a.provider === item.provider);
                return (
                  <div key={item.provider} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/40">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted/40 shrink-0">{item.icon}</div>
                      <div>
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {linkedAcc ? `Connected as ${linkedAcc.providerUsername || linkedAcc.providerId}` : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    {linkedAcc ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-success border-success/30 bg-success/10">Connected</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => unlinkAccount.mutate(item.provider)}
                          disabled={unlinkAccount.isPending}
                        >
                          Unlink
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5 rounded-xl"
                        onClick={() => handleLinkSocial(item.provider.toLowerCase())}
                      >
                        Link {item.name}
                      </Button>
                    )}
                  </div>
                );
              })}
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