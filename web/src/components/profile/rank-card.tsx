'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Swords, Target, TrendingUp, Star, Flame } from 'lucide-react';

interface RankCardProps {
  game: string;
  rank: string;
  rankIcon?: string;
  tier?: string;
  lp?: number;
  winRate?: number;
  matches?: number;
  streak?: number;
  color?: string;
}

export function RankCard({
  game,
  rank,
  rankIcon,
  tier,
  lp,
  winRate,
  matches,
  streak,
  color = 'text-primary',
}: RankCardProps) {
  return (
    <Card variant="glass" hover>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">{game}</span>
          {streak && streak > 0 && (
            <span className="flex items-center gap-1 text-xs text-orange-400">
              <Flame className="h-3 w-3" />
              {streak}W streak
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {rankIcon && <span className="text-3xl">{rankIcon}</span>}
          <div>
            <p className={`text-lg font-bold ${color}`}>{rank}</p>
            {tier && <p className="text-xs text-muted-foreground">{tier}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {lp !== undefined && (
            <div>
              <p className="text-sm font-bold">{lp} LP</p>
              <p className="text-[10px] text-muted-foreground">Points</p>
            </div>
          )}
          {winRate !== undefined && (
            <div>
              <p className="text-sm font-bold">{winRate}%</p>
              <p className="text-[10px] text-muted-foreground">Win Rate</p>
            </div>
          )}
          {matches !== undefined && (
            <div>
              <p className="text-sm font-bold">{matches}</p>
              <p className="text-[10px] text-muted-foreground">Matches</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
