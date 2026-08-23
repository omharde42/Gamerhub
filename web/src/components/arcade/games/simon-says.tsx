'use client';

import { useEffect, useRef, useState } from 'react';
import { useHighScore } from '@/components/arcade/use-high-score';

const PADS = [
  { color: '#22d3ee', glow: 'rgba(34,211,238,0.45)' },
  { color: '#4ade80', glow: 'rgba(74,222,128,0.45)' },
  { color: '#facc15', glow: 'rgba(250,204,21,0.45)' },
  { color: '#fb7185', glow: 'rgba(251,113,133,0.45)' },
];

type Phase = 'idle' | 'playing' | 'input' | 'over';

export default function SimonSays() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [lit, setLit] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [level, setLevel] = useState(0);
  const [inputIdx, setInputIdx] = useState(0);
  const { best, submit } = useHighScore('simon-says');
  const seqRef = useRef<number[]>([]);
  const levelRef = useRef(0);
  const playingRef = useRef(false);

  const playSequence = () => {
    playingRef.current = true;
    setPhase('playing');
    const seq = seqRef.current;
    seq.forEach((pad, i) => {
      setTimeout(() => {
        if (!playingRef.current) return;
        setLit(pad);
        setTimeout(() => setLit(null), 320);
      }, 550 + i * 420);
    });
    setTimeout(() => {
      if (!playingRef.current) return;
      setPhase('input');
      setInputIdx(0);
    }, 550 + seq.length * 420);
  };

  const start = () => {
    seqRef.current = [Math.floor(Math.random() * 4)];
    levelRef.current = 1;
    setSequence(seqRef.current);
    setLevel(1);
    setInputIdx(0);
    playSequence();
  };

  useEffect(() => {
    return () => {
      playingRef.current = false;
    };
  }, []);

  const press = (pad: number) => {
    if (phase !== 'input') return;
    setLit(pad);
    setTimeout(() => setLit(null), 200);
    const seq = seqRef.current;
    if (pad !== seq[inputIdx]) {
      playingRef.current = false;
      setPhase('over');
      submit(levelRef.current);
      return;
    }
    const next = inputIdx + 1;
    if (next === seq.length) {
      const newSeq = [...seq, Math.floor(Math.random() * 4)];
      seqRef.current = newSeq;
      setSequence(newSeq);
      const newLevel = levelRef.current + 1;
      levelRef.current = newLevel;
      setLevel(newLevel);
      setTimeout(playSequence, 600);
    } else {
      setInputIdx(next);
    }
  };

  return (
    <div className="flex w-full max-w-[360px] flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Level <b className="ml-1 text-primary">{level}</b>
        </span>
        <span className="text-muted-foreground">
          Best <b className="ml-1 text-yellow-400">{best}</b>
        </span>
      </div>

      <div className="grid w-full max-w-[320px] grid-cols-2 gap-3">
        {PADS.map((p, i) => (
          <button
            key={i}
            onClick={() => press(i)}
            disabled={phase !== 'input'}
            className="aspect-square rounded-2xl transition-all duration-150"
            style={{
              backgroundColor: lit === i ? p.color : '#151824',
              boxShadow: lit === i
                ? `0 0 40px ${p.glow}, inset 0 0 20px ${p.glow}`
                : `inset 0 0 14px ${p.glow.replace('0.45', '0.08')}`,
              border: `1px solid ${p.color}55`,
              opacity: phase === 'input' ? 1 : 0.85,
            }}
          />
        ))}
      </div>

      {phase === 'over' ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-4">
          <p className="text-lg font-bold text-red-400">Messed up!</p>
          <p className="text-sm text-muted-foreground">You reached level {level}</p>
          <button
            onClick={start}
            className="rounded-lg bg-gradient-to-r from-primary to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Play again
          </button>
        </div>
      ) : phase === 'idle' ? (
        <button
          onClick={start}
          className="rounded-lg bg-gradient-to-r from-primary to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-white"
        >
          Start
        </button>
      ) : (
        <p className={`text-xs ${phase === 'playing' ? 'animate-pulse text-fuchsia-400' : 'text-primary'}`}>
          {phase === 'playing' ? 'Watch the sequence...' : `Repeat it — ${inputIdx + 1}/${sequence.length}`}
        </p>
      )}
    </div>
  );
}