'use client';

import { useRef, useState } from 'react';
import { Dices } from 'lucide-react';
import { useHighScore } from '@/components/arcade/use-high-score';

type Color = 'red' | 'yellow';

interface PieceState {
  color: Color;
  id: number;
  pos: number; // -1 home, 0..51 track, 52..57 home run, 57 = done
  done: boolean;
}

// 52-cell ring on a 13x13 grid (r,c): 48 border cells + 4 inner cells.
// Red corner: r,c in 0..5 · Yellow corner: r 0..5, c 7..12
const TRACK: [number, number][] = [
  [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [0, 10], [0, 11], [0, 12],
  [1, 12], [2, 12], [3, 12], [4, 12], [5, 12], [6, 12], [7, 12], [8, 12], [9, 12], [10, 12], [11, 12], [12, 12],
  [12, 11], [12, 10], [12, 9], [12, 8], [12, 7], [12, 6], [12, 5], [12, 4], [12, 3], [12, 2], [12, 1], [12, 0],
  [11, 0], [10, 0], [9, 0], [8, 0], [7, 0], [6, 0], [5, 0], [4, 0], [3, 0], [2, 0], [1, 0],
  [1, 1], [1, 2], [1, 3], [1, 4],
];

const RED_START = 6;
const YELLOW_START = 18;
// 8 safe cells (4 starts + 4 star cells) on the 52-cell ring
const SAFE = new Set([6, 12, 18, 24, 30, 36, 42, 48]);

const HOME_RUNS: Record<Color, [number, number][]> = {
  red: [[1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5]],
  yellow: [[5, 11], [4, 11], [3, 11], [2, 11], [1, 11], [0, 11]],
};

const HOME_CELLS: Record<Color, [number, number][]> = {
  red: [[1, 1], [2, 1], [1, 2], [2, 2]],
  yellow: [[10, 1], [11, 1], [10, 2], [11, 2]],
};

function cellAt(color: Color, pos: number): { x: number; y: number } {
  if (pos >= 52) {
    const run = HOME_RUNS[color][pos - 52];
    return { x: run[1], y: run[0] };
  }
  const start = color === 'red' ? RED_START : YELLOW_START;
  const t = TRACK[(start + pos) % 52];
  return { x: t[1], y: t[0] };
}

function isSafe(color: Color, pos: number): boolean {
  if (pos >= 52) return true;
  const start = color === 'red' ? RED_START : YELLOW_START;
  return SAFE.has((start + pos) % 52);
}

function makePieces(): PieceState[] {
  return [
    ...Array.from({ length: 4 }, (_, i) => ({ color: 'red' as Color, id: i, pos: -1, done: false })),
    ...Array.from({ length: 4 }, (_, i) => ({ color: 'yellow' as Color, id: i, pos: -1, done: false })),
  ];
}

export default function Ludo() {
  const [pieces, setPieces] = useState<PieceState[]>(makePieces);
  const [turn, setTurn] = useState<Color>('red');
  const [dice, setDice] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [canRoll, setCanRoll] = useState(true);
  const [status, setStatus] = useState<'play' | 'over'>('play');
  const [winner, setWinner] = useState('');
  const [message, setMessage] = useState('');
  const { best, submit } = useHighScore('ludo');
  const statusRef = useRef(status);
  statusRef.current = status;
  const piecesRef = useRef(pieces);
  piecesRef.current = pieces;
  const turnRef = useRef(turn);
  turnRef.current = turn;

  const roll = () => {
    if (!canRoll || statusRef.current !== 'play') return;
    const value = 1 + Math.floor(Math.random() * 6);
    setDice(value);
    setSelectedId(null);
    const mine = piecesRef.current.filter((p) => p.color === turnRef.current && !p.done);
    const canMove = mine.filter((p) => {
      if (p.pos === -1) return value === 6;
      return p.pos + value <= 57;
    });
    if (canMove.length === 0) {
      setMessage('No piece can move — turn passes.');
      setCanRoll(false);
      setTimeout(() => {
        setTurn((t) => (t === 'red' ? 'yellow' : 'red'));
        setCanRoll(true);
        setMessage('');
      }, 1000);
      return;
    }
    setCanRoll(false);
    if (value === 6) {
      setTimeout(() => setCanRoll(true), 500);
    }
  };

  const movePiece = (id: number) => {
    if (canRoll || dice === null || status !== 'play') return;
    const piece = piecesRef.current.find((p) => p.id === id);
    if (!piece || piece.color !== turn || piece.done) return;
    const value = dice;
    if (piece.pos === -1 && value !== 6) return;
    const nextPos = piece.pos === -1 ? value : piece.pos + value;
    if (nextPos > 57) {
      setMessage('Not enough to reach home.');
      return;
    }

    const updated = piecesRef.current.map((p) => ({ ...p }));
    const target = updated.find((p) => p.id === id)!;
    target.pos = nextPos;
    if (nextPos === 57) target.done = true;

    if (target.pos > 0 && target.pos < 52 && !isSafe(turn, target.pos)) {
      updated.forEach((p) => {
        if (p.color !== turn && !p.done && p.pos > 0 && p.pos < 52) {
          if (p.pos === target.pos) {
            p.pos = -1;
            setMessage(`${p.color === 'red' ? 'Red' : 'Yellow'} piece sent home!`);
          }
        }
      });
    }

    setPieces(updated);
    setSelectedId(null);
    setDice(null);

    const doneCount = updated.filter((p) => p.color === turn && p.done).length;
    if (doneCount === 4) {
      setStatus('over');
      setWinner(turn === 'red' ? 'Red' : 'Yellow');
      submit(1);
      return;
    }

    if (value === 6) {
      setCanRoll(true);
      setMessage('Rolled a 6 — go again!');
    } else {
      setTurn((t) => (t === 'red' ? 'yellow' : 'red'));
      setCanRoll(true);
      setTimeout(() => setMessage(''), 800);
    }
  };

  const reset = () => {
    setPieces(makePieces());
    setTurn('red');
    setDice(null);
    setSelectedId(null);
    setCanRoll(true);
    setStatus('play');
    setWinner('');
    setMessage('');
  };

  const corners = [
    { x: 0, y: 0, w: 6, h: 6, color: '#fda4af', label: 'R' },
    { x: 7, y: 0, w: 6, h: 6, color: '#fde68a', label: 'Y' },
    { x: 7, y: 7, w: 6, h: 6, color: '#86efac', label: '' },
    { x: 0, y: 7, w: 6, h: 6, color: '#93c5fd', label: '' },
  ];

  return (
    <div className="flex w-full max-w-[440px] flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between text-sm">
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
          turn === 'red'
            ? 'border-red-400/50 bg-red-400/10 text-red-300'
            : 'border-yellow-400/50 bg-yellow-400/10 text-yellow-300'
        }`}>
          {turn === 'red' ? 'Red to play' : 'Yellow to play'}
        </span>
        <span className="text-muted-foreground">
          Wins <b className="ml-1 text-yellow-400">{best}</b>
        </span>
      </div>
      {message && <p className="text-xs text-fuchsia-400">{message}</p>}

      <div
        className="relative w-full overflow-hidden rounded-xl border-2 border-border/70 bg-[#0b0d16] shadow-[0_0_30px_rgba(139,92,246,0.2)]"
        style={{ aspectRatio: '1 / 1' }}
      >
        <div
          className="absolute inset-0 grid"
          style={{ gridTemplateColumns: 'repeat(13, 1fr)', gridTemplateRows: 'repeat(13, 1fr)' }}
        >
          {Array.from({ length: 169 }).map((_, i) => (
            <div key={i} className="border border-white/[0.03]" />
          ))}
        </div>
        {corners.map((corner, i) => (
          <div
            key={i}
            className="absolute grid place-items-center text-sm font-black"
            style={{
              left: `${(corner.x / 13) * 100}%`,
              top: `${(corner.y / 13) * 100}%`,
              width: `${(corner.w / 13) * 100}%`,
              height: `${(corner.h / 13) * 100}%`,
              backgroundColor: corner.color,
              color: '#0b0d16',
              opacity: 0.9,
            }}
          >
            {corner.label}
          </div>
        ))}

        {pieces.map((p) => {
          const homeCell = HOME_CELLS[p.color][p.id];
          const pos = p.pos === -1 ? { x: homeCell[1], y: homeCell[0] } : cellAt(p.color, p.pos);
          const isSelected = selectedId === p.id;
          return (
            <button
              key={`${p.color}-${p.id}`}
              onClick={() => movePiece(p.id)}
              className="absolute z-10 grid place-items-center rounded-full transition-transform"
              style={{
                left: `${((pos.x + 0.5) / 13) * 100}%`,
                top: `${((pos.y + 0.5) / 13) * 100}%`,
                width: '5.5%',
                height: '5.5%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: p.color === 'red' ? '#f43f5e' : '#eab308',
                border: isSelected ? '3px solid #a78bfa' : '2px solid rgba(255,255,255,0.35)',
                boxShadow: `0 0 ${isSelected ? 18 : 8}px ${
                  p.color === 'red' ? 'rgba(244,63,94,0.6)' : 'rgba(234,179,8,0.6)'
                }`,
                opacity: p.done ? 0.25 : 1,
              }}
            >
              <span className="text-[9px] font-bold text-white">{p.done ? '🏁' : p.id + 1}</span>
            </button>
          );
        })}
      </div>

      <div className="flex w-full items-center justify-center gap-4">
        <button
          onClick={roll}
          disabled={!canRoll || status !== 'play'}
          className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl border border-primary/50 bg-primary/10 text-primary shadow-[0_0_20px_rgba(139,92,246,0.3)] transition active:scale-95 disabled:opacity-40"
        >
          <Dices className="h-6 w-6" />
          <span className="text-xs font-bold">{dice ?? 'Roll'}</span>
        </button>
        {status === 'over' && (
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-card p-3">
            <p className="font-bold text-primary">{winner} wins!</p>
            <button onClick={reset} className="rounded-lg bg-gradient-to-r from-primary to-fuchsia-500 px-4 py-1.5 text-xs font-semibold text-white">
              Rematch
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Roll a 6 to leave home (and roll again) · land on an enemy to send it back · star cells are safe · tap a piece to move it
      </p>
    </div>
  );
}