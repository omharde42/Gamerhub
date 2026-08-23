'use client';

import { useEffect, useRef, useState } from 'react';
import { useHighScore } from '@/components/arcade/use-high-score';

const PASSAGES = [
  'Every gamer knows the feeling of a perfectly timed headshot, the clutch round that turns a losing match around, and the grind of ranked queues that never seem to end. Practice, patience, and a little luck are the real meta.',
  'Speed is nothing without control. A good player knows when to push hard and when to fall back, when to save their ultimate and when to spend it all. Reading the game is half the skill, reflexes are the other half.',
  'The keyboard clicks like rain in the night, each keystroke a tiny battle. Words fly across the screen faster than thought, and the cursor races toward the finish line of a paragraph that has become an arena.',
];

const BOT_WPM = 45;

function wpmOf(chars: number, ms: number): number {
  const minutes = ms / 60000;
  if (minutes <= 0) return 0;
  return Math.round(chars / 5 / minutes);
}

export default function TypingRace() {
  const [passage, setPassage] = useState(PASSAGES[0]);
  const [typed, setTyped] = useState('');
  const [errors, setErrors] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'run' | 'done'>('idle');
  const [result, setResult] = useState<{ wpm: number; acc: number; time: number; won: boolean } | null>(null);
  const [playerPct, setPlayerPct] = useState(0);
  const [botPct, setBotPct] = useState(0);
  const { best, submit } = useHighScore('typing-race');
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const passageRef = useRef(passage);
  passageRef.current = passage;
  const botStartRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef(false);

  const finish = (finalTyped: string, finalErrors: number, startMs: number) => {
    const time = (performance.now() - startMs) / 1000;
    const chars = finalTyped.trim().length;
    const wpm = wpmOf(chars, time * 1000);
    const acc = chars > 0 ? Math.round(((chars - finalErrors) / chars) * 100) : 0;
    const botChars = Math.min(chars, Math.round((BOT_WPM / 12) * time));
    const won = chars >= botChars;
    setResult({ wpm, acc, time: Number(time.toFixed(1)), won });
    setPhase('done');
    submit(wpm);
    doneRef.current = true;
  };

  const start = () => {
    const p = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
    setPassage(p);
    passageRef.current = p;
    setTyped('');
    setErrors(0);
    setResult(null);
    setPlayerPct(0);
    setBotPct(0);
    startRef.current = 0;
    botStartRef.current = null;
    doneRef.current = false;
    setPhase('run');
  };

  useEffect(() => {
    if (phase === 'run') {
      inputRef.current?.focus();
      const loop = () => {
        const passage = passageRef.current;
        const chars = passage.length;
        if (startRef.current > 0) {
          const elapsed = performance.now() - startRef.current;
          if (botStartRef.current !== null) {
            const botChars = Math.min(chars, Math.round((BOT_WPM / 12) * ((performance.now() - botStartRef.current) / 1000)));
            setBotPct(Math.min(100, (botChars / chars) * 100));
          }
          setPlayerPct(Math.min(100, (typed.length / chars) * 100));
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, typed]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (phase !== 'run' || doneRef.current) return;
    const value = e.target.value;
    if (startRef.current === 0 && value.length > 0) {
      startRef.current = performance.now();
      botStartRef.current = performance.now();
    }
    let errs = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== passage[i]) errs++;
    }
    setErrors(errs);
    setTyped(value);
    if (value.length >= passage.length) {
      finish(value, errs, startRef.current);
    }
  };

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const renderPassage = () => {
    return passage.split('').map((ch, i) => {
      let cls = 'text-muted-foreground/60';
      if (i < typed.length) {
        cls = typed[i] === ch ? 'text-emerald-400' : 'text-red-400 bg-red-500/10';
      }
      if (i === typed.length) cls = 'rounded bg-primary/30 text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]';
      return (
        <span key={i} className={cls}>
          {ch}
        </span>
      );
    });
  };

  return (
    <div className="flex w-full max-w-[560px] flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between text-sm">
        <span className="text-muted-foreground">
          You <b className="ml-1 text-primary">{playerPct.toFixed(0)}%</b>
        </span>
        <span className="text-muted-foreground">
          Bot <b className="ml-1 text-fuchsia-400">{botPct.toFixed(0)}%</b>
        </span>
        <span className="text-muted-foreground">
          Best WPM <b className="ml-1 text-yellow-400">{best}</b>
        </span>
      </div>

      <div className="flex w-full items-center gap-2 text-xs">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-emerald-500/20">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-150"
            style={{ width: `${playerPct}%` }}
          />
        </div>
        <span className="w-8 text-right text-emerald-400">🏁</span>
      </div>
      <div className="flex w-full items-center gap-2 text-xs">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-fuchsia-500/20">
          <div
            className="h-full bg-gradient-to-r from-fuchsia-400 to-fuchsia-500 transition-all duration-150"
            style={{ width: `${botPct}%` }}
          />
        </div>
        <span className="w-8 text-right">🤖</span>
      </div>

      {phase === 'idle' ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-muted-foreground">Race a {BOT_WPM} WPM bot. Type fast, stay accurate!</p>
          <button
            onClick={start}
            className="rounded-lg bg-gradient-to-r from-primary to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-white"
          >
            Start race
          </button>
        </div>
      ) : phase === 'run' ? (
        <div className="w-full rounded-xl border border-border/60 bg-card p-4 text-sm leading-7">
          {renderPassage()}
          <input
            ref={inputRef}
            value={typed}
            onChange={onChange}
            className="mt-3 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-transparent caret-white focus:outline-none focus:border-primary"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <div className="mt-2 flex justify-between text-xs">
            <span className="text-muted-foreground">
              Errors: <b className={errors > 0 ? 'text-red-400' : 'text-primary'}>{errors}</b>
            </span>
            <span className="text-muted-foreground">
              {typed.length}/{passage.length} chars
            </span>
          </div>
        </div>
      ) : (
        result && (
          <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-6">
            <p className={`text-2xl font-black ${result.won ? 'text-primary' : 'text-red-400'}`}>
              {result.won ? 'You beat the bot!' : 'The bot wins'}
            </p>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-3xl font-black text-primary">{result.wpm}</p>
                <p className="text-xs text-muted-foreground">WPM</p>
              </div>
              <div>
                <p className="text-3xl font-black text-fuchsia-400">{result.acc}%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <div>
                <p className="text-3xl font-black text-yellow-400">{result.time}s</p>
                <p className="text-xs text-muted-foreground">Time</p>
              </div>
            </div>
            <button
              onClick={start}
              className="rounded-lg bg-gradient-to-r from-primary to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-white"
            >
              Race again
            </button>
          </div>
        )
      )}
    </div>
  );
}