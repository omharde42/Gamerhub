'use client';

import { useEffect, useRef, useState } from 'react';
import { useHighScore } from '@/components/arcade/use-high-score';

const W = 640;
const H = 400;

interface GameState {
  ball: { x: number; y: number; vx: number; vy: number };
  p1: number;
  p2: number;
  score1: number;
  score2: number;
  over: boolean;
}

const PADDLE = 70;

export default function Pong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'ai' | 'local'>('ai');
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [over, setOver] = useState(false);
  const [winner, setWinner] = useState('');
  const { best, submit } = useHighScore('pong');
  const stateRef = useRef<GameState>({
    ball: { x: W / 2, y: H / 2, vx: 5, vy: 3 },
    p1: H / 2,
    p2: H / 2,
    score1: 0,
    score2: 0,
    over: false,
  });
  const keysRef = useRef<{ up: boolean; down: boolean; w: boolean; s: boolean }>({
    up: false,
    down: false,
    w: false,
    s: false,
  });
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const runningRef = useRef(false);

  const resetBall = (dir: 1 | -1) => {
    const st = stateRef.current;
    st.ball = { x: W / 2, y: H / 2, vx: 5 * dir, vy: (Math.random() * 4 - 2) || 1 };
  };

  const scorePoint = (who: 1 | 2) => {
    const st = stateRef.current;
    if (who === 1) st.score1 += 1;
    else st.score2 += 1;
    setScore([st.score1, st.score2]);
    if (st.score1 >= 7 || st.score2 >= 7) {
      st.over = true;
      setOver(true);
      setWinner(st.score1 >= 7 ? 'You' : mode === 'ai' ? 'CPU' : 'Player 2');
      submit(Math.max(st.score1, st.score2));
    } else {
      resetBall(who === 1 ? 1 : -1);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = keysRef.current;
      if (e.key === 'ArrowUp') k.up = down;
      if (e.key === 'ArrowDown') k.down = down;
      if (e.key === 'w' || e.key === 'W') k.w = down;
      if (e.key === 's' || e.key === 'S') k.s = down;
    };
    const down = (e: KeyboardEvent) => onKey(e, true);
    const up = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    runningRef.current = true;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min((t - last) / 16.67, 3);
      last = t;
      const st = stateRef.current;
      const canvas = canvasRef.current;
      if (canvas && runningRef.current) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const k = keysRef.current;
          if (k.up) st.p2 -= 8 * dt;
          if (k.down) st.p2 += 8 * dt;
          if (k.w) st.p1 -= 8 * dt;
          if (k.s) st.p1 += 8 * dt;
          st.p1 = Math.max(PADDLE / 2, Math.min(H - PADDLE / 2, st.p1));
          st.p2 = Math.max(PADDLE / 2, Math.min(H - PADDLE / 2, st.p2));

          if (modeRef.current === 'ai') {
            const target = st.ball.y;
            const diff = target - st.p1;
            st.p1 += Math.max(-7, Math.min(7, diff * 0.09)) * dt;
            st.p1 = Math.max(PADDLE / 2, Math.min(H - PADDLE / 2, st.p1));
          }

          if (!st.over) {
            st.ball.x += st.ball.vx * dt;
            st.ball.y += st.ball.vy * dt;
            if (st.ball.y < 8 || st.ball.y > H - 8) st.ball.vy *= -1;
            const hit = (py: number) =>
              st.ball.x >= W - 14 && st.ball.x <= W - 8 && Math.abs(st.ball.y - py) <= PADDLE / 2 + 8;
            const hit2 = (py: number) =>
              st.ball.x <= 14 && st.ball.x >= 8 && Math.abs(st.ball.y - py) <= PADDLE / 2 + 8;
            if (hit(st.p2)) {
              st.ball.vx = -Math.abs(st.ball.vx) * 1.05;
              st.ball.vy += (st.ball.y - st.p2) * 0.08;
            }
            if (hit2(st.p1)) {
              st.ball.vx = Math.abs(st.ball.vx) * 1.05;
              st.ball.vy += (st.ball.y - st.p1) * 0.08;
            }
            if (st.ball.x > W + 20) scorePoint(1);
            if (st.ball.x < -20) scorePoint(2);
          }

          ctx.clearRect(0, 0, W, H);
          ctx.strokeStyle = 'rgba(139,92,246,0.35)';
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 12]);
          ctx.beginPath();
          ctx.moveTo(W / 2, 0);
          ctx.lineTo(W / 2, H);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#a78bfa';
          ctx.fillRect(12, st.p1 - PADDLE / 2, 10, PADDLE);
          ctx.fillRect(W - 22, st.p2 - PADDLE / 2, 10, PADDLE);
          ctx.beginPath();
          ctx.arc(st.ball.x, st.ball.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#e879f9';
          ctx.shadowColor = '#e879f9';
          ctx.shadowBlur = 16;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.font = 'bold 28px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${st.score1}  ${st.score2}`, W / 2, 44);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restart = () => {
    const st = stateRef.current;
    st.p1 = H / 2;
    st.p2 = H / 2;
    st.score1 = 0;
    st.score2 = 0;
    st.over = false;
    setOver(false);
    setScore([0, 0]);
    resetBall(1);
  };

  return (
    <div className="flex w-full max-w-[680px] flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {(['ai', 'local'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); restart(); }}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              mode === m
                ? 'border-primary bg-primary/20 text-primary shadow-[0_0_16px_rgba(139,92,246,0.4)]'
                : 'border-border/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            {m === 'ai' ? 'vs CPU' : 'vs Player 2'}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full max-w-[640px] rounded-xl border border-border/60 bg-black/60 shadow-[0_0_30px_rgba(139,92,246,0.15)]"
      />
      {over && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-4">
          <p className="text-lg font-bold text-primary">{winner} wins!</p>
          <button
            onClick={restart}
            className="rounded-lg bg-gradient-to-r from-primary to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Play again
          </button>
        </div>
      )}
      <p className="text-center text-[11px] text-muted-foreground">
        Best: {best} · {mode === 'ai' ? 'W/S to move · CPU auto-plays' : 'W/S = left · ↑/↓ = right'} · first to 7
      </p>
    </div>
  );
}