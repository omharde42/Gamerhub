'use client';

import { useEffect, useRef, useState } from 'react';
import { useHighScore } from '@/components/arcade/use-high-score';

const COLS = 26;
const ROWS = 26;
const CELL = 16;

interface Snake {
  parts: { x: number; y: number }[];
  dir: { x: number; y: number };
  alive: boolean;
  color: string;
}

function randCell(): { x: number; y: number } {
  return { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
}

interface GameState {
  snakes: Snake[];
  food: { x: number; y: number };
  running: boolean;
  score: number;
}

export default function Slither() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [length, setLength] = useState(3);
  const { best, submit } = useHighScore('slither');

  const stateRef = useRef<GameState>({ snakes: [], food: randCell(), running: false, score: 0 });
  const dirRef = useRef({ x: 1, y: 0 });
  const lastDirRef = useRef({ x: 1, y: 0 });
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const occupied = (x: number, y: number, snakes: Snake[], ignore?: number): boolean => {
    return snakes.some((s, si) =>
      si !== ignore && s.alive && s.parts.some((p) => p.x === x && p.y === y)
    );
  };

  const spawnFood = (snakes: Snake[]) => {
    for (let i = 0; i < 200; i++) {
      const c = randCell();
      if (!occupied(c.x, c.y, snakes) && !(c.x === stateRef.current.food.x && c.y === stateRef.current.food.y)) {
        stateRef.current.food = c;
        return;
      }
    }
  };

  const setup = () => {
    const st = stateRef.current;
    st.score = 0;
    setScore(0);
    setLength(3);
    setOver(false);
    const center = { x: 8, y: 13 };
    const ai1 = { x: 18, y: 9 };
    const ai2 = { x: 18, y: 19 };
    st.snakes = [
      {
        parts: [center, { ...center, x: center.x - 1 }, { ...center, x: center.x - 2 }],
        dir: { x: 1, y: 0 },
        alive: true,
        color: '#22d3ee',
      },
      {
        parts: [ai1, { ...ai1, x: ai1.x - 1 }, { ...ai1, x: ai1.x - 2 }],
        dir: { x: -1, y: 0 },
        alive: true,
        color: '#f472b6',
      },
      {
        parts: [ai2, { ...ai2, x: ai2.x - 1 }, { ...ai2, x: ai2.x - 2 }],
        dir: { x: -1, y: 0 },
        alive: true,
        color: '#facc15',
      },
    ];
    st.running = true;
    dirRef.current = { x: 1, y: 0 };
    lastDirRef.current = { x: 1, y: 0 };
    spawnFood(st.snakes);
  };

  useEffect(() => {
    setup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, { x: number; y: number }> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };
      const d = map[e.key];
      if (d) {
        e.preventDefault();
        const cur = lastDirRef.current;
        if (!(d.x === -cur.x && d.y === -cur.y) && !(d.x === cur.x && d.y === cur.y)) {
          dirRef.current = d;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const aiDir = (s: Snake, st: GameState): { x: number; y: number } => {
    const head = s.parts[0];
    const options = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ].filter(
      (d) =>
        !(d.x === -s.dir.x && d.y === -s.dir.y) &&
        !(d.x === s.dir.x && d.y === s.dir.y) &&
        head.x + d.x >= 0 &&
        head.x + d.x < COLS &&
        head.y + d.y >= 0 &&
        head.y + d.y < ROWS &&
        !occupied(head.x + d.x, head.y + d.y, st.snakes)
    );
    if (options.length === 0) return s.dir;
    const dx = st.food.x - head.x;
    const dy = st.food.y - head.y;
    const sorted = [...options].sort((a, b) => {
      const da = Math.abs(a.x - (dx > 0 ? 1 : dx < 0 ? -1 : 0)) + Math.abs(a.y - (dy > 0 ? 1 : dy < 0 ? -1 : 0));
      const db = Math.abs(b.x - (dx > 0 ? 1 : dx < 0 ? -1 : 0)) + Math.abs(b.y - (dy > 0 ? 1 : dy < 0 ? -1 : 0));
      return da - db;
    });
    return sorted[0];
  };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const stepMs = 105;
    let acc = 0;

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const st = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas || !st.running) return;
      acc += t - last;
      last = t;
      while (acc >= stepMs) {
        acc -= stepMs;
        step(st);
      }
      draw(canvas, st);
    };

    const step = (st: GameState) => {
      lastDirRef.current = dirRef.current;
      st.snakes.forEach((s, i) => {
        if (!s.alive) return;
        const d = i === 0 ? dirRef.current : aiDir(s, st);
        s.dir = d;
        const head = { x: s.parts[0].x + d.x, y: s.parts[0].y + d.y };
        const hitWall = head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS;
        const hitSelf = s.parts.some((p, pi) => pi < s.parts.length - 1 && p.x === head.x && p.y === head.y);
        const hitOther = st.snakes.some(
          (o, oi) => oi !== i && o.parts.some((p) => p.x === head.x && p.y === head.y)
        );
        if (hitWall || hitSelf || hitOther) {
          s.alive = false;
          if (i === 0) {
            st.running = false;
            setOver(true);
            submit(st.score);
          }
          return;
        }
        s.parts.unshift(head);
        if (head.x === st.food.x && head.y === st.food.y) {
          if (i === 0) {
            st.score += 1;
            setScore(st.score);
            setLength(s.parts.length);
          }
          spawnFood(st.snakes);
        } else {
          s.parts.pop();
        }
      });
    };

    const draw = (canvas: HTMLCanvasElement, st: GameState) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#06070c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(139,92,246,0.07)';
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL + 0.5, 0);
        ctx.lineTo(x * CELL + 0.5, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL + 0.5);
        ctx.lineTo(canvas.width, y * CELL + 0.5);
        ctx.stroke();
      }
      st.snakes.forEach((s) => {
        if (!s.alive) return;
        s.parts.forEach((p, i) => {
          const alpha = 1 - i / (s.parts.length + 6);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = Math.max(alpha, 0.25);
          ctx.shadowColor = s.color;
          ctx.shadowBlur = i === 0 ? 14 : 6;
          ctx.fillRect(p.x * CELL + 1.5, p.y * CELL + 1.5, CELL - 3, CELL - 3);
        });
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });
      const f = st.food;
      ctx.fillStyle = '#fb7185';
      ctx.shadowColor = '#fb7185';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(f.x * CELL + CELL / 2, f.y * CELL + CELL / 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) touchRef.current = { x: t.clientX, y: t.clientY };
    };
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const s = touchRef.current;
      if (!t || !s) return;
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      touchRef.current = null;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      const d = Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
      const cur = lastDirRef.current;
      if (!(d.x === -cur.x && d.y === -cur.y) && !(d.x === cur.x && d.y === cur.y)) {
        dirRef.current = d;
      }
    };
    const canvas = canvasRef.current;
    canvas?.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas?.addEventListener('touchend', onTouchEnd, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      canvas?.removeEventListener('touchstart', onTouchStart);
      canvas?.removeEventListener('touchend', onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex w-full max-w-[440px] flex-col items-center gap-3">
      <div className="flex items-center gap-5 text-sm">
        <span className="text-muted-foreground">
          Length <b className="ml-1 text-primary">{length}</b>
        </span>
        <span className="text-muted-foreground">
          Score <b className="ml-1 text-fuchsia-400">{score}</b>
        </span>
        <span className="text-muted-foreground">
          Best <b className="ml-1 text-yellow-400">{best}</b>
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={COLS * CELL}
        height={ROWS * CELL}
        className="w-full rounded-xl border border-border/60 shadow-[0_0_30px_rgba(139,92,246,0.15)]"
      />
      {over && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-4">
          <p className="text-lg font-bold text-primary">Slither down!</p>
          <p className="text-sm text-muted-foreground">Score: {score}</p>
          <button
            onClick={setup}
            className="rounded-lg bg-gradient-to-r from-primary to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Play again
          </button>
        </div>
      )}
      <p className="text-center text-[11px] text-muted-foreground">
        Eat pellets, outlast the two AI snakes · ← ↑ ↓ → or WASD · swipe on mobile
      </p>
    </div>
  );
}
