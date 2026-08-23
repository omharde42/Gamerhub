'use client';

import { useEffect, useRef, useState } from 'react';
import { useHighScore } from '@/components/arcade/use-high-score';

const W = 640;
const H = 400;
const R = 14;

interface Puck {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function AirHockey() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'ai' | 'local'>('ai');
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [over, setOver] = useState(false);
  const { best, submit } = useHighScore('air-hockey');
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const stateRef = useRef<{
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    puck: Puck;
    s1: number;
    s2: number;
    paused: boolean;
    win: 0 | 1 | 2;
  }>({ p1: { x: 60, y: H / 2 }, p2: { x: W - 60, y: H / 2 }, puck: { x: W / 2, y: H / 2, vx: 0, vy: 0 }, s1: 0, s2: 0, paused: true, win: 0 });
  const keysRef = useRef({ up: false, down: false, w: false, s: false });
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const touchRef = useRef<{ id: number; x: number; y: number } | null>(null);

  const resetPuck = () => {
    const st = stateRef.current;
    const a = Math.random() * Math.PI * 2;
    st.puck = { x: W / 2, y: H / 2, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6 };
  };

  const setup = () => {
    const st = stateRef.current;
    st.p1 = { x: 60, y: H / 2 };
    st.p2 = { x: W - 60, y: H / 2 };
    st.s1 = 0;
    st.s2 = 0;
    st.win = 0;
    st.paused = true;
    setScore([0, 0]);
    setOver(false);
  };

  const goal = (who: 1 | 2) => {
    const st = stateRef.current;
    if (who === 1) st.s1 += 1;
    else st.s2 += 1;
    setScore([st.s1, st.s2]);
    if (st.s1 >= 5 || st.s2 >= 5) {
      st.win = st.s1 >= 5 ? 1 : 2;
      setOver(true);
      submit(Math.max(st.s1, st.s2));
    } else {
      st.p1 = { x: 60, y: H / 2 };
      st.p2 = { x: W - 60, y: H / 2 };
      st.paused = true;
      setTimeout(() => {
        if (!stateRef.current.win) {
          stateRef.current.paused = false;
          resetPuck();
        }
      }, 900);
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
    const mousemove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || modeRef.current !== 'ai') return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width) * W,
        y: ((e.clientY - rect.top) / rect.height) * H,
      };
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('mousemove', mousemove);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('mousemove', mousemove);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min((t - last) / 16.67, 3);
      last = t;
      const canvas = canvasRef.current;
      if (!canvas) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const st = stateRef.current;

      const k = keysRef.current;
      if (k.up) st.p2.y -= 7.5 * dt;
      if (k.down) st.p2.y += 7.5 * dt;
      if (k.w) st.p1.y -= 7.5 * dt;
      if (k.s) st.p1.y += 7.5 * dt;

      if (modeRef.current === 'ai' && mouseRef.current) {
        st.p1.x = Math.max(R + 4, Math.min(W / 2 - 30, mouseRef.current.x));
        st.p1.y = Math.max(R + 4, Math.min(H - R - 4, mouseRef.current.y));
      } else {
        st.p1.x = Math.max(R + 4, Math.min(W / 2 - 30, st.p1.x));
        st.p1.y = Math.max(R + 4, Math.min(H - R - 4, st.p1.y));
      }

      if (modeRef.current === 'ai') {
        const target = st.puck.y;
        const diff = target - st.p2.y;
        st.p2.y += Math.max(-8, Math.min(8, diff * 0.08)) * dt;
        if (st.puck.vx > 0) st.p2.x = W - 60;
        else st.p2.x = W - 60 + Math.sign(st.puck.vx || 1) * 0;
      }
      st.p2.x = Math.max(W / 2 + 30, Math.min(W - R - 4, st.p2.x));
      st.p2.y = Math.max(R + 4, Math.min(H - R - 4, st.p2.y));

      if (!st.paused && !st.win) {
        const puck = st.puck;
        puck.x += puck.vx * dt;
        puck.y += puck.vy * dt;
        if (puck.y < R + 6 || puck.y > H - R - 6) puck.vy *= -1;
        puck.vx *= 0.9995;

        const push = (pad: { x: number; y: number }, side: 1 | -1) => {
          const dx = puck.x - pad.x;
          const dy = puck.y - pad.y;
          const dist = Math.hypot(dx, dy);
          if (dist < R + 26 && dist > 0.01) {
            const nx = dx / dist;
            const ny = dy / dist;
            puck.x = pad.x + nx * (R + 26);
            puck.y = pad.y + ny * (R + 26);
            const speed = Math.hypot(puck.vx, puck.vy) + 2.5;
            puck.vx = nx * speed;
            puck.vy = ny * speed;
          }
        };
        push(st.p1, 1);
        push(st.p2, -1);

        if (puck.x < -30) goal(2);
        if (puck.x > W + 30) goal(1);
      }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0a0b12';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(139,92,246,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2, 20);
      ctx.lineTo(W / 2, H - 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(251,113,133,0.35)';
      ctx.fillRect(0, H / 2 - 44, 8, 88);
      ctx.fillStyle = 'rgba(34,211,238,0.35)';
      ctx.fillRect(W - 8, H / 2 - 44, 8, 88);

      const pad1 = st.p1;
      const pad2 = st.p2;
      ctx.fillStyle = '#fb7185';
      ctx.shadowColor = '#fb7185';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(pad1.x, pad1.y, R + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.beginPath();
      ctx.arc(pad2.x, pad2.y, R + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = '#f8fafc';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(st.puck.x, st.puck.y, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = 'bold 26px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${st.s1}  ${st.s2}`, W / 2, 52);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    if (modeRef.current === 'ai') {
      if (x < W / 2) {
        touchRef.current = { id: e.pointerId, x, y };
      }
    } else {
      const side = x < W / 2 ? 'p1' : 'p2';
      touchRef.current = { id: e.pointerId, x, y };
      if (side === 'p1') st.p1 = { x: Math.min(st.p1.x, W / 2 - 30), y: st.p1.y };
      else st.p2 = { x: Math.max(st.p2.x, W / 2 + 30), y: st.p2.y };
    }
    if (st.paused && !st.win) {
      st.paused = false;
      resetPuck();
    }
    canvas.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const st = stateRef.current;
    if (modeRef.current === 'ai') {
      if (touchRef.current && touchRef.current.id === e.pointerId) {
        st.p1.x = Math.max(R + 4, Math.min(W / 2 - 30, x));
        st.p1.y = Math.max(R + 4, Math.min(H - R - 4, y));
      }
    } else {
      if (touchRef.current && touchRef.current.id === e.pointerId) {
        if (x < W / 2) {
          st.p1.x = Math.max(R + 4, Math.min(W / 2 - 30, x));
          st.p1.y = Math.max(R + 4, Math.min(H - R - 4, y));
        } else {
          st.p2.x = Math.max(W / 2 + 30, Math.min(W - R - 4, x));
          st.p2.y = Math.max(R + 4, Math.min(H - R - 4, y));
        }
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (touchRef.current?.id === e.pointerId) touchRef.current = null;
  };

  return (
    <div className="flex w-full max-w-[680px] flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {(['ai', 'local'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setup(); }}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              mode === m
                ? 'border-primary bg-primary/20 text-primary shadow-[0_0_16px_rgba(139,92,246,0.4)]'
                : 'border-border/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            {m === 'ai' ? 'vs CPU' : '2 Player'}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="w-full max-w-[640px] touch-none rounded-xl border border-border/60 bg-black/60 shadow-[0_0_30px_rgba(139,92,246,0.15)]"
      />
      {over && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-4">
          <p className="text-lg font-bold text-primary">
            {stateRef.current.win === 1 ? (mode === 'ai' ? 'You win!' : 'Player 1 wins!') : mode === 'ai' ? 'CPU wins' : 'Player 2 wins!'}
          </p>
          <button
            onClick={setup}
            className="rounded-lg bg-gradient-to-r from-primary to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Play again
          </button>
        </div>
      )}
      <p className="text-center text-[11px] text-muted-foreground">
        Best: {best} · first to 5 · {mode === 'ai' ? 'mouse/touch to move · CPU auto-plays' : 'touch: each side = a player · keys W/S + ↑/↓'} · tap to serve
      </p>
    </div>
  );
}