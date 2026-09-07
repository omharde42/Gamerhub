'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Minus, RotateCcw, Maximize2, ChevronRight, Clock, Trophy, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import { getInitials, getMediaUrl } from '@/lib/utils';

interface Match {
  id: string;
  round: number;
  position: number;
  team1?: { id: string; name: string; avatar?: string; seed?: number };
  team2?: { id: string; name: string; avatar?: string; seed?: number };
  score1?: number;
  score2?: number;
  winner?: 'team1' | 'team2';
  status: 'upcoming' | 'live' | 'completed';
  scheduledAt?: string;
  bestOf?: number;
}

interface BracketViewerProps {
  matches: Match[];
  totalRounds: number;
  tournamentName: string;
  onMatchClick?: (match: Match) => void;
}

export function BracketViewer({ matches, totalRounds, tournamentName, onMatchClick }: BracketViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.3, Math.min(2, z + delta)));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    },
    [isDragging]
  );

  const handleMouseUp = () => setIsDragging(false);

  // Group matches by round
  const rounds: Match[][] = [];
  for (let r = 1; r <= totalRounds; r++) {
    rounds.push(matches.filter((m) => m.round === r));
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          {tournamentName}
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.min(2, z + 0.2))}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}>
            <Minus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bracket */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-border/50 bg-card/30 cursor-grab active:cursor-grabbing"
        style={{ height: 500 }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="absolute inset-0 p-6 flex gap-8"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          {rounds.map((round, ri) => (
            <div key={ri} className="flex flex-col justify-around gap-4 shrink-0" style={{ minWidth: 220 }}>
              <p className="text-xs font-bold text-muted-foreground text-center mb-2">
                {ri === rounds.length - 1 ? 'Final' : ri === rounds.length - 2 ? 'Semi-Final' : `Round ${ri + 1}`}
              </p>
              {round.map((match) => (
                <MatchCard key={match.id} match={match} onClick={() => onMatchClick?.(match)} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match, onClick }: { match: Match; onClick: () => void }) {
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Card
        className={`cursor-pointer transition-all ${
          isLive ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-border/50 hover:border-primary/30'
        }`}
        onClick={onClick}
      >
        <CardContent className="p-2.5 space-y-1.5">
          {match.bestOf && (
            <p className="text-[9px] text-muted-foreground text-center">BO{match.bestOf}</p>
          )}
          <TeamRow
            team={match.team1}
            score={match.score1}
            isWinner={match.winner === 'team1'}
            seed={match.team1?.seed}
          />
          <div className="h-px bg-border/40" />
          <TeamRow
            team={match.team2}
            score={match.score2}
            isWinner={match.winner === 'team2'}
            seed={match.team2?.seed}
          />
          {isLive && (
            <div className="flex items-center justify-center gap-1 pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-bold text-red-500">LIVE</span>
            </div>
          )}
          {match.scheduledAt && !isCompleted && !isLive && (
            <div className="flex items-center justify-center gap-1 pt-0.5">
              <Clock className="h-2.5 w-2.5 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">
                {new Date(match.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TeamRow({
  team,
  score,
  isWinner,
  seed,
}: {
  team?: { name: string; avatar?: string };
  score?: number;
  isWinner?: boolean;
  seed?: number;
}) {
  if (!team) {
    return (
      <div className="flex items-center gap-2 py-1 px-1">
        <span className="text-[10px] text-muted-foreground italic">TBD</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 py-1 px-1 rounded ${isWinner ? 'bg-primary/5' : ''}`}>
      <Avatar className="h-5 w-5">
        <AvatarImage src={getMediaUrl(team.avatar)} />
        <AvatarFallback className="text-[8px]">{getInitials(team.name)}</AvatarFallback>
      </Avatar>
      {seed && <span className="text-[9px] text-muted-foreground">#{seed}</span>}
      <span className={`text-xs font-medium truncate flex-1 ${isWinner ? 'text-primary' : ''}`}>
        {team.name}
      </span>
      {score !== undefined && (
        <span className={`text-xs font-bold ${isWinner ? 'text-primary' : 'text-muted-foreground'}`}>
          {score}
        </span>
      )}
    </div>
  );
}
