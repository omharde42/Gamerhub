'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Zap, Users, Target, Shield } from 'lucide-react';
import { useState } from 'react';
import { getInitials, getRankColor } from '@/lib/utils';
import Link from 'next/link';

export default function MatchmakingPage() {
  const [game, setGame] = useState('');
  const { data: recommendations } = useQuery({ queryKey: ['matchmaking', game], queryFn: () => api.get(`/matchmaking/recommendations?game=${game}`).then(r => r.data.data).catch(() => []) });

  return (<div className="space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold"><Zap className="h-6 w-6 inline mr-2 text-gaming-purple" />AI Matchmaking</h1><p className="text-muted-foreground">Find your perfect teammates</p></div><Select value={game} onValueChange={setGame}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Game" /></SelectTrigger><SelectContent><SelectItem value="">All Games</SelectItem><SelectItem value="Valorant">Valorant</SelectItem><SelectItem value="CS2">CS2</SelectItem><SelectItem value="League of Legends">League of Legends</SelectItem></SelectContent></Select></div>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{recommendations?.map((rec: any, i: number) => (<Link key={i} href={`/profile/${rec.username}`}><Card className="glass-card hover:border-gaming-purple/50 transition-all relative overflow-hidden"><div className="absolute top-2 right-2"><Badge variant={rec.compatibility >= 80 ? 'success' : rec.compatibility >= 60 ? 'warning' : 'secondary'} className="text-xs">{rec.compatibility}% Match</Badge></div><CardContent className="p-6 space-y-4"><div className="flex items-center gap-3"><Avatar className="h-14 w-14 border-2 border-gaming-purple/50"><AvatarImage src={rec.avatar || ''} /><AvatarFallback className="text-lg">{getInitials(rec.username)}</AvatarFallback></Avatar><div><h3 className="font-semibold text-lg">{rec.username}</h3><p className={`text-sm ${getRankColor(rec.rank)}`}>{rec.rank || 'Unranked'} • {rec.role || 'Flex'}</p></div></div><div className="flex items-center gap-2 text-sm text-muted-foreground"><Target className="h-4 w-4" />{rec.winRate}% Win Rate</div><div className="flex flex-wrap gap-1.5">{rec.reasons?.map((reason: string, j: number) => (<Badge key={j} variant="outline" className="text-xs">{reason}</Badge>))}</div></CardContent></Card></Link>))}{recommendations?.length === 0 && <div className="col-span-full text-center py-20"><Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" /><h3 className="text-xl font-semibold mb-2">No recommendations yet</h3><p className="text-muted-foreground">Complete your profile with your games, rank, and role to get AI-powered teammate recommendations.</p></div>}</div></div>);
}
