'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trophy, Search, Gamepad2, Users, DollarSign, Calendar, Sparkles, Zap, Shield, Star, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FEATURED_TOURNAMENTS = [
  {
    id: 't-1',
    title: 'Wox Sorning Team Masters',
    game: 'Valorant',
    status: 'REGISTRATION_OPEN',
    prizePool: 50000,
    teams: 16,
    maxTeams: 16,
    startDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    rating: '4.9 ⭐ (237 reviews)',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 't-2',
    title: 'Recetese Spots Global League',
    game: 'CS2',
    status: 'IN_PROGRESS',
    prizePool: 25000,
    teams: 32,
    maxTeams: 32,
    startDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    rating: '4.8 ⭐ (195 reviews)',
    banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 't-3',
    title: 'GamerZ Hub Featured Masters',
    game: 'PUBG PC',
    status: 'REGISTRATION_OPEN',
    prizePool: 15000,
    teams: 24,
    maxTeams: 32,
    startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    rating: '5.0 ⭐ (310 reviews)',
    banner: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500&auto=format&fit=crop&q=80'
  }
];

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Upcoming', value: 'REGISTRATION_OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

export default function TournamentsPage() {
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { data: tournamentsData } = useQuery({
    queryKey: ['tournaments', search, gameFilter, statusFilter],
    queryFn: () => api.get(`/tournaments?search=${encodeURIComponent(search)}&game=${encodeURIComponent(gameFilter)}&status=${statusFilter}`).then((r) => r.data),
    refetchInterval: 30000,
  });

  const displayList = (tournamentsData?.data && tournamentsData.data.length > 0) ? tournamentsData.data : FEATURED_TOURNAMENTS;

  return (
    <div className="space-y-6 overflow-x-hidden max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" />
            Tournaments & Arena Leagues
          </h1>
          <p className="text-xs text-muted-foreground">Compete in official tournaments, win prize pools, and gain global ranking points.</p>
        </div>

        <Link href="/tournaments/create">
          <Button variant="gradient" size="sm" className="gap-2 text-sm font-extrabold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 h-10 px-4">
            <Trophy className="h-4 w-4" /> Create Tournament
          </Button>
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`shrink-0 px-4 h-9 rounded-2xl text-xs font-bold transition-all border ${
              statusFilter === tab.value
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                : 'bg-card/60 text-muted-foreground border-white/10 hover:border-white/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tournaments by title or game..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-2xl bg-card/60 border-white/10"
          />
        </div>
        <Select value={gameFilter} onValueChange={setGameFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-2xl bg-card/60 border-white/10">
            <SelectValue placeholder="All Games" />
          </SelectTrigger>
          <SelectContent className="glass-popup border-emerald-500/30">
            <SelectItem value="">All Games</SelectItem>
            <SelectItem value="Valorant">Valorant</SelectItem>
            <SelectItem value="CS2">CS2</SelectItem>
            <SelectItem value="PUBG PC">PUBG PC</SelectItem>
            <SelectItem value="League of Legends">League of Legends</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayList.map((t: any, i: number) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card variant="glass" className="hover:border-emerald-500/50 transition-all rounded-[28px] overflow-hidden group">
              {t.banner && (
                <div className="h-36 relative overflow-hidden">
                  <img src={t.banner} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17] via-transparent to-transparent" />
                  <Badge className="absolute top-3 right-3 bg-emerald-500/90 text-black font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-md">
                    ${formatNumber(t.prizePool)} PRIZE POOL
                  </Badge>
                </div>
              )}
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-base truncate text-foreground group-hover:text-emerald-400 transition-colors">{t.title}</h3>
                    <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-2 py-0.5 shrink-0">
                      {t.status?.replace('_', ' ') || 'OPEN'}
                    </Badge>
                  </div>
                  <p className="text-xs text-emerald-400 font-mono font-bold">{t.game}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-white/10">
                  <span className="flex items-center gap-1 font-semibold text-foreground"><Users className="h-3.5 w-3.5 text-emerald-400" />{t.teams || t._count?.teams || 0}/{t.maxTeams || 16} Squads</span>
                  <span className="flex items-center gap-1 font-semibold text-foreground"><Clock className="h-3.5 w-3.5 text-amber-400" />{t.startDate ? formatDate(t.startDate) : '3 Days left'}</span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-mono">{t.rating || '4.9 ⭐ Top Rated'}</span>
                  <Link href={`/tournaments/${t.id}`}>
                    <Button variant="gradient" size="sm" className="h-8 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md">
                      Register Team
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {displayList.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-bold text-foreground">No tournaments found</p>
          <p className="text-xs mt-1">Try a different filter, or create your own tournament.</p>
        </div>
      )}
    </div>
  );
}
