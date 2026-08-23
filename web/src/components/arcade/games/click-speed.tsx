'use client';

import { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';
import { useHighScore } from '@/components/arcade/use-high-score';

type Phase = 'ready' | 'running' | 'done';

export default function ClickSpeed() {
  const [phase, setPhase] = useState<Phase>('ready');
  const [count, setCount] = useState(0);
  const [cps, setCps] = useState(0);
  const [remaining, setRemaining] = useState(10);
  const { best, submit } = useHighScore('click-speed');
  const startRef = useRef(0);
  const countRef = useRef(0);
  const rafRef = useRef(0);
  const phaseRef = useRef<Phase>('ready');
  phaseRef.current = phase;

  const end = () => {
    const elapsed = Math.max((performance.now() - startRef.current) / 1000, 0.1);
    const final = countRef.current / elapsed;
    setCps(Number(final.toFixed(2)));
    setCount(countRef.current);
    setPhase('done');
    submit(final);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const click = () => {
    const ph = phaseRef.current;
    if (ph === 'done') return;
    if (ph === 'ready') {
      startRef.current = performance.now();
      setPhase('running');
      countRef.current = 1;
      setCount(1);
      setRemaining(10);
      const loop = () => {
        const left = 10 - (performance.now() - startRef.current) / 1000;
        if (left <= 0) {
          end();
          return;
        }
        setRemaining(left);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return;
    }
    countRef.current += 1;
    setCount(countRef.current);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const reset = () => {
    countRef.current = 0;
    setCount(0);
    setCps(0);
    setRemaining(10);
    setPhase('ready');
  };

  return (
    <div className="flex w-full max-w-[420px] flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Clicks <b className="ml-1 text-primary">{count}</b>
        </span>
        <span className="text-muted-foreground">
          Time <b className="ml-1 text-fuchsia-400">{remaining.toFixed(1)}s</b>
        </span>
        <span className="text-muted-foreground">
          Best <b className="ml-1 text-yellow-400">{best}</b>
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-border/50">
        <div
          className="h-full bg-gradient-to-r from-primary to-fuchsia-500 transition-[width] duration-100"
          style={{ width: `${(remaining / 10) * 100}%` }}
        />
      </div>

      {phase === 'done' ? (
        <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-8">
          <Zap className="h-10 w-10 text-primary" />
          <p className="text-5xl font-black text-primary">{cps}</p>
          <p className="text-sm text-muted-foreground">
            CPS · {count} clicks in 10s
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-gradient-to-r from-primary to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      ) : (
        <button
          onClick={click}
          className="flex h-64 w-full select-none flex-col items-center justify-center gap-3 rounded-2xl border border-primary/40 bg-card text-center shadow-[0_0_30px_rgba(139,92,246,0.25)] transition active:scale-[0.98]"
        >
          <span className="text-4xl font-black text-primary">
            {phase === 'ready' ? 'CLICK TO START' : count}
          </span>
          <span className="text-xs text-muted-foreground">
            {phase === 'ready'
              ? 'Then keep clicking for 10 seconds'
              : 'Tap / click / spacebar — go go go!'}
          </span>
        </button>
      )}
    </div>
  );
}