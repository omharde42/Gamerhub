'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trophy, Search, Gamepad2, Users, DollarSign, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TournamentsPage() {
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState('');
  const { data: tournamentsData } = useQuery({ queryKey: ['tournaments', search, gameFilter], queryFn: () => api.get(`/tournaments?search=${search}&game=${gameFilter}`).then(r => r.data) });

  return (<div className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Tournaments</h1><Link href="/tournaments/create"><Button variant="gradient" className="gap-2"><Trophy className="h-4 w-4" />Create Tournament</Button></Link></div><div className="flex flex-col md:flex-row gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search tournaments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div><Select value={gameFilter} onValueChange={setGameFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder="All Games" /></SelectTrigger><SelectContent><SelectItem value="">All Games</SelectItem><SelectItem value="Valorant">Valorant</SelectItem><SelectItem value="CS2">CS2</SelectItem><SelectItem value="League of Legends">League of Legends</SelectItem><SelectItem value="Apex Legends">Apex Legends</SelectItem></SelectContent></Select></div>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{tournamentsData?.data?.map((t: any, i: number) => (<motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}><Link href={`/tournaments/${t.id}`}><Card className="glass-card hover:border-gaming-purple/50 transition-all"><CardContent className="p-6 space-y-4"><div className="flex items-start justify-between"><div className="space-y-1"><h3 className="font-semibold text-lg">{t.title}</h3><Badge variant={t.status === 'REGISTRATION_OPEN' ? 'success' : t.status === 'IN_PROGRESS' ? 'warning' : 'secondary'}>{t.status?.replace('_', ' ')}</Badge></div><div className="w-12 h-12 rounded-xl bg-gaming-purple/10 flex items-center justify-center"><Trophy className="h-6 w-6 text-gaming-purple" /></div></div><div className="flex flex-wrap gap-3 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Gamepad2 className="h-4 w-4" />{t.game}</span><span className="flex items-center gap-1"><Users className="h-4 w-4" />{t._count?.teams || 0}/{t.maxTeams}</span><span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{formatNumber(t.prizePool)}</span><span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(t.startDate)}</span></div></CardContent></Card></Link></motion.div>))}</div></div>);
}
