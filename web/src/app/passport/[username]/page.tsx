'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Gamepad2, Trophy, Target, TrendingUp, Star, Shield,
  Zap, Crosshair, Swords, Medal, Award, Sparkles,
  ExternalLink, Share2, Download, Camera, Plus,
  Youtube, Twitch as TwitchIcon, MessageCircle, MapPin, Globe,
  Clock, Calendar, Loader2, Verified,
  Edit3, Trash2, Search, Brain, Activity, Radio, Users
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { GAMES_BY_PLATFORM } from '@/lib/constants';

const DEFAULT_BANNER = 'https://files.idyllic.app/files/static/2039559?width=1920&optimizer=image';

const SCORE_GRADIENTS = [
  { from: '#ef4444', to: '#f97316' },
  { from: '#f97316', to: '#eab308' },
  { from: '#eab308', to: '#22c55e' },
  { from: '#22c55e', to: '#06b6d4' },
  { from: '#06b6d4', to: '#3b82f6' },
  { from: '#3b82f6', to: '#8b5cf6' },
];

function getScoreGradient(score: number) {
  if (score >= 90) return SCORE_GRADIENTS[5];
  if (score >= 75) return SCORE_GRADIENTS[4];
  if (score >= 60) return SCORE_GRADIENTS[3];
  if (score >= 40) return SCORE_GRADIENTS[2];
  if (score >= 20) return SCORE_GRADIENTS[1];
  return SCORE_GRADIENTS[0];
}

function RadialScore({ score, size = 96 }: { score: number; size?: number }) {
  const g = getScoreGradient(score);
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (circ * score) / 100;
  return (
    <svg width={size} height={size} className="drop-shadow-lg">
      <defs>
        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={g.from} />
          <stop offset="100%" stopColor={g.to} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="url(#scoreGrad)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        className="fill-foreground" fontSize={size * 0.28} fontWeight={800}>
        {score}
      </text>
    </svg>
  );
}

function SectionHeader({ icon: Icon, title, action }: { icon: any; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      </div>
      {action}
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function GamerPassportPage() {
  const params = useParams();
  const username = params.username as string;
  const { user } = useAuthStore();
  const isOwn = user?.profile?.username === username;

  const { data: passport, isLoading, refetch } = useQuery({
    queryKey: ['passport', username],
    queryFn: () => api.get(`/passport/${username}`).then(r => r.data.data),
  });

  const [showAddGame, setShowAddGame] = useState(false);
  const [uploading, setUploading] = useState<'avatar' | 'banner' | null>(null);
  const [gameForm, setGameForm] = useState({ gameName: '', publisher: '', playerId: '', rank: '', hoursPlayed: 0, winRate: 0, kdRatio: 0, preferredRole: '', dataSource: 'Manual' as string });

  const addGame = useMutation({
    mutationFn: () => api.post('/passport/games', gameForm),
    onSuccess: () => { refetch(); setShowAddGame(false); setGameForm({ gameName: '', publisher: '', playerId: '', rank: '', hoursPlayed: 0, winRate: 0, kdRatio: 0, preferredRole: '', dataSource: 'Manual' }); toast.success('Game added!'); },
    onError: () => toast.error('Failed to add game'),
  });

  const deleteGame = useMutation({
    mutationFn: (id: string) => api.delete(`/passport/games/${id}`),
    onSuccess: () => { refetch(); toast.success('Game removed'); },
  });

  const uploadPhoto = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: 'avatar' | 'banner' }) => {
      const form = new FormData();
      form.append(type === 'avatar' ? 'avatar' : 'banner', file);
      return api.post(`/profiles/${type}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
    },
    onSuccess: () => { refetch(); setUploading(null); toast.success('Photo updated!'); },
    onError: () => { setUploading(null); toast.error('Upload failed'); },
  });

  const handlePhotoUpload = (type: 'avatar' | 'banner') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) { setUploading(type); uploadPhoto.mutate({ file, type }); }
    };
    input.click();
  };

  const generateSummary = useMutation({
    mutationFn: () => api.post('/passport/generate-summary'),
    onSuccess: () => { refetch(); toast.success('AI summary generated!'); },
    onError: () => toast.error('Failed to generate summary'),
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-28 gap-3">
      <div className="relative">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-primary/20 animate-ping" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">Loading passport...</p>
    </div>
  );
  if (!passport) return (
    <div className="flex flex-col items-center justify-center py-28 gap-3">
      <Shield className="h-16 w-16 text-muted-foreground/30" />
      <p className="text-lg font-medium text-muted-foreground">Passport not found</p>
      <Button variant="outline" size="sm" onClick={() => window.history.back()}>Go back</Button>
    </div>
  );

  const p = passport;
  const gamerScore = p.gamerScore || Math.min(100, Math.round((p.winRate || 0) * 0.3 + (p.kd || 0) * 10 + (p.totalMatches || 0) * 0.05 + (p.skillScore || 0) * 0.2));
  const platformList = Object.entries(GAMES_BY_PLATFORM);

  const statCards = [
    { label: 'Skill', value: p.skillScore || Math.round((p.kd || 0) * 25), color: 'from-blue-500 to-cyan-500', icon: Brain },
    { label: 'Competitive', value: p.competitiveScore || Math.min(100, Math.round((p.winRate || 0) * 0.5 + (p.totalMatches || 0) * 0.02)), color: 'from-purple-500 to-pink-500', icon: Trophy },
    { label: 'Teamwork', value: p.teamworkScore || Math.min(100, Math.round((p.accuracy || 0) * 2 + (p.communicationScore || 0) * 0.3)), color: 'from-green-500 to-emerald-500', icon: Users },
  ];

  return (
    <motion.div className="space-y-5" variants={containerVariants} initial="hidden" animate="visible">
      {/* Profile Header */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-0 shadow-md">
          <div className={`h-36 md:h-48 relative overflow-hidden ${isOwn ? 'group cursor-pointer' : ''}`} onClick={() => isOwn && handlePhotoUpload('banner')}>
            <img src={p.banner || DEFAULT_BANNER} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            {!p.banner && (
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-purple-900/30 mix-blend-overlay" />
            )}
            {isOwn && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center gap-1">
                  <Camera className={`h-6 w-6 text-white ${uploading === 'banner' ? 'animate-pulse' : ''}`} />
                  <span className="text-xs text-white font-medium drop-shadow-md">Change cover</span>
                </div>
              </div>
            )}
          </div>
          <CardContent className="relative px-6 pb-6 -mt-14">
            <div className="flex flex-col md:flex-row md:items-end gap-5 mb-4">
              <div className="relative group">
                <div className={`relative ${isOwn ? 'cursor-pointer' : ''}`} onClick={() => isOwn && handlePhotoUpload('avatar')}>
                  <Avatar className="h-28 w-28 md:h-32 md:w-32 border-[3px] border-background shadow-xl ring-2 ring-primary/20">
                    <AvatarImage src={p.avatar || ''} />
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold">{getInitials(p.username)}</AvatarFallback>
                  </Avatar>
                  {isOwn && (
                    <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <Camera className={`h-7 w-7 text-white opacity-0 group-hover:opacity-100 transition-all ${uploading === 'avatar' ? 'animate-pulse' : ''}`} />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-[3px] border-background rounded-full" />
              </div>
              <div className="flex-1 pt-14 md:pt-0">
                <div className="flex flex-col md:flex-row md:items-center gap-2.5">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{p.displayName || p.username}</h1>
                  {p.verified && <Verified className="h-5 w-5 text-primary fill-primary" />}
                  <span className="text-sm text-muted-foreground/70">@{p.username}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {p.rank && <Badge variant="secondary" className="gap-1 px-2.5 py-0.5"><Trophy className="h-3 w-3" />{p.rank}</Badge>}
                  {p.role && <Badge variant="outline" className="px-2.5 py-0.5">{p.role}</Badge>}
                  {p.country && <Badge variant="outline" className="px-2.5 py-0.5 gap-1"><MapPin className="h-3 w-3" />{p.country}</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                {isOwn && (
                  <Link href="/profile/settings">
                    <Button variant="outline" size="sm" className="gap-1.5 shadow-sm">
                      <Edit3 className="h-4 w-4" /> Edit
                    </Button>
                  </Link>
                )}
                <Button variant="outline" size="sm" className="gap-1.5 shadow-sm" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}>
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>
            </div>
            {p.bio && <p className="text-sm text-muted-foreground/80 max-w-2xl leading-relaxed">{p.bio}</p>}
          </CardContent>
        </Card>
      </motion.div>

      {/* Score + Stats Row */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-0 shadow-md bg-gradient-to-br from-background to-primary/[0.02]">
            <CardContent className="p-5 flex flex-col items-center gap-2">
              <RadialScore score={gamerScore} />
              <div className="text-center">
                <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground/70">Gamer Score</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i <= Math.ceil(gamerScore / 20) ? 'bg-primary' : 'bg-muted'}`} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          {statCards.map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">{stat.label}</p>
                  <stat.icon className="h-4 w-4 text-muted-foreground/40" />
                </div>
                <div>
                  <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
                  <span className="text-xs text-muted-foreground/50 ml-1">/ 100</span>
                </div>
                <div className="relative">
                  <Progress value={stat.value} className={`h-1.5 bg-muted/50 [&>div]:bg-gradient-to-r ${stat.color} [&>div]:shadow-sm`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Connected Games */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-0">
                <SectionHeader
                  icon={Gamepad2}
                  title={`Connected Games (${p.connectedGames?.length || 0})`}
                  action={isOwn && (
                    <Dialog open={showAddGame} onOpenChange={setShowAddGame}>
                      <DialogTrigger asChild>
                        <Button variant="default" size="sm" className="gap-1.5 shadow-sm">
                          <Plus className="h-4 w-4" /> Add Game
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader><DialogTitle>Connect a Game</DialogTitle></DialogHeader>
                        <Tabs defaultValue="search">
                          <TabsList className="w-full bg-muted/50 p-1">
                            <TabsTrigger value="search" className="flex-1 text-xs data-[state=active]:shadow-sm"><Search className="h-3.5 w-3.5 mr-1" /> Browse</TabsTrigger>
                            <TabsTrigger value="api" className="flex-1 text-xs data-[state=active]:shadow-sm"><Shield className="h-3.5 w-3.5 mr-1" /> API</TabsTrigger>
                            <TabsTrigger value="screenshot" className="flex-1 text-xs data-[state=active]:shadow-sm"><Camera className="h-3.5 w-3.5 mr-1" /> Screenshot</TabsTrigger>
                            <TabsTrigger value="manual" className="flex-1 text-xs data-[state=active]:shadow-sm"><Edit3 className="h-3.5 w-3.5 mr-1" /> Manual</TabsTrigger>
                          </TabsList>
                          <TabsContent value="search" className="space-y-3 pt-3">
                            <Input placeholder="Search any game..." className="h-9 text-sm" />
                            <ScrollArea className="h-72 pr-1">
                              {platformList.map(([platform, data]) => (
                                <div key={platform} className="mb-4">
                                  <p className="text-[11px] font-semibold text-muted-foreground/60 mb-2 uppercase tracking-widest">{platform}</p>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                                    {data.games.map(game => (
                                      <button key={game} onClick={() => { setGameForm({ ...gameForm, gameName: game, publisher: platform === 'Riot Games' ? 'Riot Games' : platform === 'Blizzard' ? 'Blizzard' : '' }); setShowAddGame(false); setTimeout(() => setShowAddGame(true), 100); }}
                                        className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-primary/[0.03] transition-all text-left group">
                                        <div className="w-7 h-7 rounded-md bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                          <Gamepad2 className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary" />
                                        </div>
                                        <span className="text-xs font-medium truncate">{game}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </ScrollArea>
                          </TabsContent>
                          <TabsContent value="api" className="space-y-4 pt-3">
                            <div className="p-5 rounded-xl bg-gradient-to-br from-primary/[0.03] to-primary/[0.06] border border-primary/10 text-center space-y-2">
                              <Shield className="h-8 w-8 mx-auto text-primary" />
                              <p className="text-sm font-semibold">Automatic API Connection</p>
                              <p className="text-xs text-muted-foreground/70">Riot Games, Steam, Blizzard + any game with an official developer API</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {[{ name: 'Riot Games', icon: Swords, color: 'text-red-500' }, { name: 'Steam', icon: Gamepad2, color: 'text-blue-500' }, { name: 'Blizzard', icon: Shield, color: 'text-purple-500' }].map((p) => (
                                <button key={p.name} onClick={() => { setGameForm({ ...gameForm, dataSource: p.name }); }} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/[0.03] transition-all group">
                                  <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <p.icon className={`h-5 w-5 ${p.color}`} />
                                  </div>
                                  <span className="text-xs font-medium">{p.name}</span>
                                </button>
                              ))}
                            </div>
                            <Button variant="outline" size="sm" className="w-full gap-1.5 shadow-sm">
                              <ExternalLink className="h-4 w-4" /> Connect with API
                            </Button>
                          </TabsContent>
                          <TabsContent value="screenshot" className="space-y-4 pt-3">
                            <div className="p-5 rounded-xl bg-gradient-to-br from-primary/[0.03] to-primary/[0.06] border border-primary/10 text-center space-y-2">
                              <Camera className="h-8 w-8 mx-auto text-primary" />
                              <p className="text-sm font-semibold">AI Screenshot Verification</p>
                              <p className="text-xs text-muted-foreground/70">Great for Free Fire, BGMI, COD Mobile & any game without a public API</p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-1.5">
                              {['Free Fire', 'BGMI', 'COD Mobile'].map(g => (
                                <Badge key={g} variant="secondary" className="text-[10px] px-2 py-0.5">{g}</Badge>
                              ))}
                              <Badge variant="outline" className="text-[10px] px-2 py-0.5">+ any game</Badge>
                            </div>
                            <label className="block border-2 border-dashed border-border/60 rounded-xl p-8 text-center hover:border-primary/40 hover:bg-primary/[0.02] transition-all cursor-pointer group">
                              <Camera className="h-10 w-10 mx-auto text-muted-foreground/40 group-hover:text-primary/60 mb-2 transition-colors" />
                              <p className="text-sm font-medium">Upload Screenshot</p>
                              <p className="text-xs text-muted-foreground/60 mt-1">AI will extract stats automatically</p>
                              <input type="file" accept="image/*" className="hidden" />
                            </label>
                          </TabsContent>
                          <TabsContent value="manual" className="space-y-4 pt-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Game Name</Label>
                                <Input value={gameForm.gameName} onChange={(e) => setGameForm({ ...gameForm, gameName: e.target.value })} placeholder="e.g. Valorant" className="h-9 text-sm" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Publisher</Label>
                                <Input value={gameForm.publisher} onChange={(e) => setGameForm({ ...gameForm, publisher: e.target.value })} placeholder="e.g. Riot Games" className="h-9 text-sm" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Player ID</Label>
                                <Input value={gameForm.playerId} onChange={(e) => setGameForm({ ...gameForm, playerId: e.target.value })} className="h-9 text-sm" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Rank</Label>
                                <Input value={gameForm.rank} onChange={(e) => setGameForm({ ...gameForm, rank: e.target.value })} className="h-9 text-sm" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Hours Played</Label>
                                <Input type="number" value={gameForm.hoursPlayed} onChange={(e) => setGameForm({ ...gameForm, hoursPlayed: +e.target.value })} className="h-9 text-sm" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Win Rate %</Label>
                                <Input type="number" value={gameForm.winRate} onChange={(e) => setGameForm({ ...gameForm, winRate: +e.target.value })} className="h-9 text-sm" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">K/D Ratio</Label>
                                <Input type="number" step="0.1" value={gameForm.kdRatio} onChange={(e) => setGameForm({ ...gameForm, kdRatio: +e.target.value })} className="h-9 text-sm" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Role</Label>
                                <Input value={gameForm.preferredRole} onChange={(e) => setGameForm({ ...gameForm, preferredRole: e.target.value })} className="h-9 text-sm" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Data Source</Label>
                                <Select value={gameForm.dataSource} onValueChange={(v) => setGameForm({ ...gameForm, dataSource: v })}>
                                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Manual">Manual Entry</SelectItem>
                                    <SelectItem value="API">API Connection</SelectItem>
                                    <SelectItem value="AI Verified">AI Screenshot Verified</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <Button variant="default" className="w-full shadow-sm" onClick={() => addGame.mutate()} disabled={!gameForm.gameName || addGame.isPending}>
                              {addGame.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                              Connect Game
                            </Button>
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                  )}
                />
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                {p.connectedGames?.length === 0 ? (
                  <div className="text-center py-10 text-sm text-muted-foreground/60">
                    <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <Gamepad2 className="h-7 w-7 text-muted-foreground/30" />
                    </div>
                    <p className="font-medium">No games connected yet</p>
                    <p className="text-xs mt-1">Connect your first game to build your passport</p>
                  </div>
                ) : (
                  p.connectedGames?.map((game: any, i: number) => (
                    <motion.div key={game.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <div className="group relative rounded-xl border border-border/40 hover:border-primary/20 hover:shadow-sm transition-all duration-200">
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shadow-sm">
                                <Gamepad2 className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm">{game.gameName}</h4>
                                <p className="text-[11px] text-muted-foreground/60">{game.publisher || 'Unknown Publisher'} {game.rank && <span className="ml-1.5 text-primary/70 font-medium">{game.rank}</span>}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${game.dataSource === 'API' ? 'bg-blue-500/10 text-blue-600' : game.dataSource === 'AI Verified' ? 'bg-green-500/10 text-green-600' : 'bg-muted/50 text-muted-foreground/70'}`}>
                                {game.dataSource}
                              </span>
                              {isOwn && (
                                <button onClick={() => deleteGame.mutate(game.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
                            {game.hoursPlayed > 0 && <div className="bg-muted/30 rounded-lg p-2 text-center"><p className="text-[10px] text-muted-foreground/60">Hours</p><p className="text-sm font-semibold">{game.hoursPlayed}</p></div>}
                            {game.winRate > 0 && <div className="bg-muted/30 rounded-lg p-2 text-center"><p className="text-[10px] text-muted-foreground/60">Win Rate</p><p className="text-sm font-semibold text-green-600">{game.winRate}%</p></div>}
                            {game.kdRatio > 0 && <div className="bg-muted/30 rounded-lg p-2 text-center"><p className="text-[10px] text-muted-foreground/60">K/D</p><p className="text-sm font-semibold">{game.kdRatio}</p></div>}
                            {game.matchesPlayed > 0 && <div className="bg-muted/30 rounded-lg p-2 text-center"><p className="text-[10px] text-muted-foreground/60">Matches</p><p className="text-sm font-semibold">{game.matchesPlayed}</p></div>}
                            {game.mvpCount > 0 && <div className="bg-muted/30 rounded-lg p-2 text-center"><p className="text-[10px] text-muted-foreground/60">MVP</p><p className="text-sm font-semibold text-yellow-600">{game.mvpCount}x</p></div>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Analysis */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-0">
                <SectionHeader icon={Sparkles} title="AI Player Analysis" />
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {p.aiSummary ? (
                  <div className="relative p-5 rounded-xl bg-gradient-to-br from-primary/[0.03] to-primary/[0.06] border border-primary/10 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <Sparkles className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm leading-relaxed text-muted-foreground/90 italic">&ldquo;{p.aiSummary}&rdquo;</p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground/60">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p>No AI summary yet</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {isOwn && (
                    <Button variant="outline" size="sm" className="gap-1.5 shadow-sm" onClick={() => generateSummary.mutate()}>
                      <Sparkles className="h-4 w-4" /> Generate AI Summary
                    </Button>
                  )}
                  {(p.skillScore || p.accuracy) && (
                    <Badge variant="secondary" className="text-[10px]">Last analyzed recently</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: 'Aim', value: p.accuracy || 75, icon: Crosshair, color: 'text-red-500' },
                    { label: 'Strategy', value: p.skillScore || 70, icon: Swords, color: 'text-blue-500' },
                    { label: 'Leadership', value: p.leadershipScore || 65, icon: Star, color: 'text-yellow-500' },
                    { label: 'Game Sense', value: p.communicationScore || 80, icon: Brain, color: 'text-purple-500' },
                  ].map((skill, i) => (
                    <div key={i} className="relative p-3.5 rounded-xl bg-muted/30 border border-border/40 hover:border-primary/20 transition-all group">
                      <div className="flex items-center gap-2 mb-2">
                        <skill.icon className={`h-4 w-4 ${skill.color}`} />
                        <span className="text-[11px] font-medium">{skill.label}</span>
                      </div>
                      <p className="text-2xl font-bold tracking-tight">{skill.value}%</p>
                      <Progress value={skill.value} className="h-1 mt-2 bg-muted/50" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Skills & Endorsements */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-0">
                <SectionHeader icon={Star} title="Skills & Endorsements" />
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['Aim', 'Strategy', 'Leadership', 'Communication', 'Game Sense', 'Reaction Time', 'Decision Making', 'Map Awareness', 'Team Coordination'].map((skill, i) => {
                    const existing = p.skills?.find((s: any) => s.name === skill);
                    const value = existing?.score || Math.floor(Math.random() * 40) + 60;
                    return (
                      <div key={skill} className="p-3 rounded-xl border border-border/40 hover:border-primary/20 hover:shadow-sm transition-all group">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-medium">{skill}</p>
                          <span className="text-[10px] font-semibold text-primary/70">{value}%</span>
                        </div>
                        <Progress value={value} className="h-1.5 bg-muted/50 [&>div]:bg-gradient-to-r [&>div]:from-primary/80 [&>div]:to-primary" />
                      </div>
                    );
                  })}
                </div>
                {p.endorsements?.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-border/40">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <p className="text-xs font-semibold text-muted-foreground/70">Endorsements ({p._count?.endorsements || 0})</p>
                    </div>
                    <div className="space-y-1.5">
                      {p.endorsements.slice(0, 5).map((e: any) => (
                        <div key={e.id} className="flex items-center gap-2.5 text-xs p-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                          <Avatar className="h-7 w-7 ring-1 ring-border/40">
                            <AvatarImage src={e.endorser?.profile?.avatar || ''} />
                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary/70">{getInitials(e.endorser?.profile?.username || 'U')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium">{e.endorser?.profile?.username}</span>
                            <span className="text-muted-foreground/60 ml-1">endorsed <strong className="text-primary/80">{e.skill}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Quick Info */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><SectionHeader icon={Activity} title="Quick Info" /></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { icon: MapPin, label: p.country, val: p.city && `, ${p.city}` },
                  { icon: Globe, label: p.languages?.length > 0 && p.languages.join(', ') },
                  { icon: Clock, label: p.timezone },
                  { icon: Calendar, label: p.activeTime && `Active: ${p.activeTime}` },
                  { icon: Zap, label: p.availability },
                  { icon: Target, label: `${p.winRate || 0}% Win Rate` },
                  { icon: TrendingUp, label: `${p.kd || 0} K/D Ratio` },
                  { icon: Activity, label: `${p.totalMatches || 0} Matches` },
                ].filter(i => i.label).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center">
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </div>
                    <span className="text-xs">{item.label}{item.val}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Social Links */}
          {(p.twitch || p.youtube || p.discord || p.twitter || p.instagram || p.kick) && (
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><SectionHeader icon={Radio} title="Social & Streaming" /></CardHeader>
                <CardContent className="space-y-1.5">
                  {[
                    { key: p.twitch, icon: TwitchIcon, href: `https://twitch.tv/${p.twitch}`, color: 'text-purple-500' },
                    { key: p.youtube, icon: Youtube, href: `https://youtube.com/@${p.youtube}`, color: 'text-red-500' },
                    { key: p.kick, icon: MessageCircle, href: `https://kick.com/${p.kick}`, color: 'text-green-500' },
                    { key: p.twitter, icon: MessageCircle, href: `https://x.com/${p.twitter}`, color: 'text-sky-500', prefix: '@' },
                  ].filter(s => s.key).map((s, i) => (
                    <a key={i} href={s.href} target="_blank" className="flex items-center gap-2.5 text-xs p-2.5 rounded-lg hover:bg-muted/40 transition-all group">
                      <div className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                      </div>
                      <span>{s.prefix || ''}{s.key}</span>
                      <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground/30 group-hover:text-muted-foreground/60" />
                    </a>
                  ))}
                  {p.discord && (
                    <div className="flex items-center gap-2.5 text-xs p-2.5 rounded-lg">
                      <div className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center">
                        <MessageCircle className="h-3.5 w-3.5 text-indigo-500" />
                      </div>
                      <span>{p.discord}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Achievements */}
          {p.achievements?.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><SectionHeader icon={Award} title="Achievements" /></CardHeader>
                <CardContent className="space-y-1.5">
                  {p.achievements.slice(0, 5).map((a: any) => (
                    <div key={a.id} className="flex items-center gap-2.5 text-xs p-2.5 rounded-lg bg-gradient-to-r from-yellow-500/[0.04] to-transparent border border-yellow-500/10">
                      <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <Medal className="h-3.5 w-3.5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-[12px]">{a.title}</p>
                        {a.description && <p className="text-[10px] text-muted-foreground/60">{a.description}</p>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Export */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/[0.02] to-primary/[0.04]">
              <CardHeader className="pb-2"><SectionHeader icon={Download} title="Export" /></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2.5 shadow-sm">
                  <Download className="h-4 w-4" /> Download PDF Resume
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2.5 shadow-sm" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}>
                  <Share2 className="h-4 w-4" /> Copy Share Link
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
