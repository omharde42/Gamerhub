'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Gamepad2, Trophy, Clock, ExternalLink, Sparkles, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface SteamShowcaseProps {
  userId: string;
}

export function SteamShowcase({ userId }: SteamShowcaseProps) {
  const { data: steam, isLoading } = useQuery({
    queryKey: ['steam-profile', userId],
    queryFn: async () => {
      const res = await api.get(`/steam/user/${userId}`);
      return res.data.data;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card variant="glass" className="animate-pulse">
        <CardContent className="p-6 h-48 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Gamepad2 className="h-5 w-5 animate-bounce text-primary" />
            <span>Loading Steam Gaming Stats...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!steam || !steam.steamId) {
    return null;
  }

  return (
    <Card variant="glass" className="border-primary/20 bg-card/60 overflow-hidden shadow-xl">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-[#171A21] via-[#1b2838] to-[#2a475e] p-5 border-b border-border/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border-2 border-primary/50 shadow-lg shrink-0">
              <AvatarImage src={steam.avatar} alt={steam.username} />
              <AvatarFallback className="bg-primary/20 font-bold text-primary">{getInitials(steam.username)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg text-white tracking-wide">{steam.username}</h3>
                <Badge variant="outline" className="bg-[#5c7e10]/30 border-[#a4d007]/50 text-[#a4d007] text-xs font-mono font-bold px-2 py-0.5">
                  Level {steam.level} 🎮
                </Badge>
              </div>
              <p className="text-xs text-blue-200/80 font-mono mt-0.5">Steam ID: {steam.steamId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right hidden xs:block">
              <p className="text-xs text-blue-200/70 font-semibold uppercase tracking-wider">Total Playtime</p>
              <p className="text-base font-bold text-white font-mono">{steam.totalPlaytimeHours} hrs</p>
            </div>
            <a
              href={steam.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-400/30 hover:bg-blue-500/30 text-blue-200 text-xs font-semibold transition-all shadow-md"
            >
              <span>Steam Profile</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      <CardContent className="p-5 space-y-6">
        {/* Recently Played Games */}
        {steam.recentlyPlayed?.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-amber-400" /> Recently Played (Past 2 Weeks)
              </h4>
              <Badge variant="outline" className="text-[10px] bg-card/60">
                {steam.recentlyPlayed.length} Games
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {steam.recentlyPlayed.map((game: any) => (
                <motion.div
                  key={game.appId}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-background/50 border border-border/40 hover:border-primary/40 transition-all shadow-sm"
                >
                  <img
                    src={game.headerUrl}
                    alt={game.name}
                    className="h-12 w-24 rounded-lg object-cover border border-border/40 shadow-sm shrink-0"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs truncate text-foreground">{game.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                      <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                        <Clock className="h-3 w-3" /> {Math.round((game.playtime2WeeksMinutes || 0) / 60)}h last 2w
                      </span>
                      <span>•</span>
                      <span className="font-mono text-muted-foreground/80">{game.playtimeForeverHours}h total</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Top Owned Games Library */}
        {steam.topGames?.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Gamepad2 className="h-4 w-4 text-primary" /> Top Owned Games & Hours
              </h4>
              <span className="text-xs text-muted-foreground font-mono">{steam.totalGames} Total Owned</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {steam.topGames.slice(0, 4).map((game: any) => (
                <div key={game.appId} className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/40 hover:border-primary/40 transition-all">
                  <img src={game.headerUrl} alt={game.name} className="h-20 w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async" />
                  <div className="p-2 bg-background/80 backdrop-blur-sm">
                    <p className="font-semibold text-[11px] truncate text-foreground">{game.name}</p>
                    <p className="text-[10px] text-primary font-mono font-bold mt-0.5">{game.playtimeForeverHours} hrs played</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Steam Achievements */}
        {steam.achievements?.length > 0 && (
          <div className="space-y-3 pt-1 border-t border-border/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-yellow-400" /> Featured Achievements & Badges
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {steam.achievements.map((ach: any, i: number) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-background/40 border border-border/40">
                  <div className="h-9 w-9 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-lg shrink-0 shadow-inner">
                    {ach.icon || '🏆'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-xs text-foreground truncate">{ach.name}</p>
                      <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shrink-0">Unlocked</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
