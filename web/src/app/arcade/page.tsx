'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  Activity, Grid, Gamepad2, Flame, Crown, Dices, Puzzle, Target,
  Type, Zap, Brain, Keyboard, Trophy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/arcade/game-shell';

import Pong from '@/components/arcade/games/pong';
import Tetris from '@/components/arcade/games/tetris';
import Slither from '@/components/arcade/games/slither';
import AirHockey from '@/components/arcade/games/air-hockey';
import Chess from '@/components/arcade/games/chess';
import Ludo from '@/components/arcade/games/ludo';
import Sudoku from '@/components/arcade/games/sudoku';
import Minesweeper from '@/components/arcade/games/minesweeper';
import Wordle from '@/components/arcade/games/wordle';
import ClickSpeed from '@/components/arcade/games/click-speed';
import SimonSays from '@/components/arcade/games/simon-says';
import TypingRace from '@/components/arcade/games/typing-race';

interface GameMeta {
  id: string;
  title: string;
  tagline: string;
  category: string;
  accent: string;
  icon: React.ComponentType<{ className?: string; style?: CSSProperties }>;
  Component: React.ComponentType;
  hint: string;
}

const GAMES: GameMeta[] = [
  {
    id: 'pong', title: 'Neon Pong', tagline: 'First to 7 — vs CPU or a friend', category: '1v1',
    accent: '#22d3ee', icon: Activity, Component: Pong,
    hint: 'W/S move left paddle, ↑/↓ move right · first to 7',
  },
  {
    id: 'air-hockey', title: 'Air Hockey', tagline: 'Flick physics, slam the puck home', category: '1v1',
    accent: '#fb7185', icon: Flame, Component: AirHockey,
    hint: 'Move with mouse/touch or W/S + ↑/↓ · first to 5',
  },
  {
    id: 'chess', title: 'Blitz Chess', tagline: 'Full rules vs the CPU', category: 'Board',
    accent: '#facc15', icon: Crown, Component: Chess,
    hint: 'Tap a white piece, then a highlighted square',
  },
  {
    id: 'ludo', title: 'Ludo', tagline: '2-player classic roll & race', category: 'Board',
    accent: '#eab308', icon: Dices, Component: Ludo,
    hint: 'Roll a 6 to leave home · tap your piece to move',
  },
  {
    id: 'tetris', title: 'Tetris', tagline: 'Stack, clear, survive', category: 'Arcade',
    accent: '#a78bfa', icon: Grid, Component: Tetris,
    hint: '← → move · ↑ rotate · ↓ soft drop · Space hard drop',
  },
  {
    id: 'slither', title: 'Slither', tagline: 'Outlast two AI snakes', category: 'Arcade',
    accent: '#22d3ee', icon: Gamepad2, Component: Slither,
    hint: '← ↑ ↓ → or WASD · swipe on mobile · avoid walls & AI snakes',
  },
  {
    id: 'sudoku', title: 'Sudoku', tagline: 'Fresh puzzle every game', category: 'Puzzle',
    accent: '#34d399', icon: Grid, Component: Sudoku,
    hint: 'Tap a cell, then a number · 3 mistakes and it is over',
  },
  {
    id: 'minesweeper', title: 'Minesweeper', tagline: '9×9, 10 mines, steady hands', category: 'Puzzle',
    accent: '#f87171', icon: Target, Component: Minesweeper,
    hint: 'Tap to reveal · long-press or right-click to flag',
  },
  {
    id: 'wordle', title: 'Wordle', tagline: 'Daily word or free practice', category: 'Words',
    accent: '#4ade80', icon: Type, Component: Wordle,
    hint: 'Type 5-letter guesses · green = spot on, yellow = wrong spot',
  },
  {
    id: 'typing-race', title: 'Typing Race', tagline: 'Beat the 45 WPM bot', category: 'Words',
    accent: '#22d3ee', icon: Keyboard, Component: TypingRace,
    hint: 'Just start typing — accuracy beats speed',
  },
  {
    id: 'click-speed', title: 'Click Speed', tagline: 'Max CPS in 10 seconds', category: 'Reflex',
    accent: '#e879f9', icon: Zap, Component: ClickSpeed,
    hint: 'Click, tap, or smash the spacebar',
  },
  {
    id: 'simon-says', title: 'Simon Says', tagline: 'Memory sequence, growing fast', category: 'Reflex',
    accent: '#60a5fa', icon: Brain, Component: SimonSays,
    hint: 'Watch the flash, then repeat the sequence',
  },
];

const CATEGORY_ORDER = ['1v1', 'Board', 'Arcade', 'Puzzle', 'Words', 'Reflex'];

function readBest(id: string): number {
  try {
    return Number(window.localStorage.getItem(`gh-arcade:${id}`)) || 0;
  } catch {
    return 0;
  }
}

function GameHub() {
  const [active, setActive] = useState<GameMeta | null>(null);
  const [bests, setBests] = useState<Record<string, number>>({});

  useEffect(() => {
    const map: Record<string, number> = {};
    GAMES.forEach((g) => (map[g.id] = readBest(g.id)));
    setBests(map);
  }, [active]);

  return (
    <div className="relative">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
          <Gamepad2 className="h-7 w-7 text-primary" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.8))' }} />
          GAMERZ ARCADE
        </h1>
        <p className="text-sm text-muted-foreground">
          12 mini-games, one leaderboard mindset. High scores are saved on your device.
        </p>
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const games = GAMES.filter((g) => g.category === cat);
        if (games.length === 0) return null;
        return (
          <section key={cat} className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-px w-6 bg-primary/60" />
              {cat}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {games.map((g, i) => (
                <motion.button
                  key={g.id}
                  onClick={() => setActive(g)}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-4 text-left transition hover:border-primary/50"
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-25 transition-opacity group-hover:opacity-50"
                    style={{ background: `radial-gradient(ellipse at 50% 0%, ${g.accent}, transparent 70%)` }}
                  />
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 bg-background"
                    style={{ boxShadow: `0 0 16px ${g.accent}44` }}
                  >
                    <g.icon className="h-5 w-5" style={{ color: g.accent }} />
                  </div>
                  <div className="flex w-full flex-col gap-0.5">
                    <span className="text-sm font-bold">{g.title}</span>
                    <span className="text-[11px] leading-snug text-muted-foreground">{g.tagline}</span>
                    <span className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-yellow-400">
                      <Trophy className="h-3 w-3" />
                      {bests[g.id] ? `Best: ${bests[g.id]}` : 'No score yet'}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        );
      })}

      <AnimatePresence>
        {active && (
          <GameShell
            title={active.title}
            accent={active.accent}
            hint={active.hint}
            onClose={() => setActive(null)}
          >
            <active.Component />
          </GameShell>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ArcadePage() {
  return <GameHub />;
}