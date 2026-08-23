'use client';

import { useEffect, useRef, useState } from 'react';
import { useHighScore } from '@/components/arcade/use-high-score';

const COLS = 10;
const ROWS = 20;
const CELL = 22;

const SHAPES: { cells: [number, number][]; color: string }[] = [
  { cells: [[0, 1], [1, 1], [2, 1], [3, 1]], color: '#22d3ee' }, // I
  { cells: [[1, 0], [0, 1], [1, 1], [2, 1]], color: '#a78bfa' }, // T
  { cells: [[0, 0], [1, 0], [0, 1], [1, 1]], color: '#facc15' }, // O
  { cells: [[0, 0], [0, 1], [1, 1], [2, 1]], color: '#4ade80' }, // L
  { cells: [[2, 0], [0, 1], [1, 1], [2, 1]], color: '#fb923c' }, // J
  { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], color: '#f472b6' }, // S
  { cells: [[1, 0], [2, 0], [0, 1], [1, 1]], color: '#ef4444' }, // Z
];

type Board = (string | null)[][];

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<string | null>(COLS).fill(null));
}

interface Piece {
  cells: [number, number][];
  color: string;
  x: number;
  y: number;
}

function randomPiece(): Piece {
  const s = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return { cells: s.cells, color: s.color, x: 3, y: 0 };
}

function collide(board: Board, p: Piece): boolean {
  return p.cells.some(([cx, cy]) => {
    const x = p.x + cx;
    const y = p.y + cy;
    return x < 0 || x >= COLS || y >= ROWS || (y >= 0 && board[y][x] !== null);
  });
}

function merge(board: Board, p: Piece): Board {
  const b = board.map((r) => [...r]);
  p.cells.forEach(([cx, cy]) => {
    const x = p.x + cx;
    const y = p.y + cy;
    if (y >= 0 && x >= 0 && x < COLS && y < ROWS) b[y][x] = p.color;
  });
  return b;
}

function clearLines(board: Board): { board: Board; lines: number } {
  const kept = board.filter((row) => row.some((c) => c === null));
  const lines = ROWS - kept.length;
  const empty = Array.from({ length: lines }, () => Array<string | null>(COLS).fill(null));
  return { board: [...empty, ...kept], lines };
}

const KEYMAP: Record<string, () => void> = {};

export default function Tetris() {
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [piece, setPiece] = useState<Piece>(randomPiece);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [over, setOver] = useState(false);
  const { best, submit } = useHighScore('tetris');

  const boardRef = useRef(board);
  const pieceRef = useRef(piece);
  const scoreRef = useRef(0);
  const overRef = useRef(false);
  const levelRef = useRef(1);
  boardRef.current = board;
  pieceRef.current = piece;
  scoreRef.current = score;
  overRef.current = over;
  levelRef.current = level;

  const drop = () => {
    if (overRef.current) return;
    const b = boardRef.current;
    const p = pieceRef.current;
    const moved = { ...p, y: p.y + 1 };
    if (collide(b, moved)) {
      const merged = merge(b, p);
      const { board: cleared, lines } = clearLines(merged);
      if (lines > 0) {
        const gained = [0, 100, 300, 500, 800][lines] * levelRef.current;
        scoreRef.current += gained;
        setScore(scoreRef.current);
        const lv = Math.floor(scoreRef.current / 1000) + 1;
        if (lv !== levelRef.current) {
          levelRef.current = lv;
          setLevel(lv);
        }
      }
      if (p.y <= 0) {
        overRef.current = true;
        setOver(true);
        submit(scoreRef.current);
        return;
      }
      setBoard(cleared);
      const next = randomPiece();
      setPiece(next);
      pieceRef.current = next;
    } else {
      setPiece(moved);
    }
  };

  const move = (dx: number) => {
    const p = pieceRef.current;
    const moved = { ...p, x: p.x + dx };
    if (!collide(boardRef.current, moved)) {
      setPiece(moved);
    }
  };

  const rotate = () => {
    const p = pieceRef.current;
    const rotated: [number, number][] = p.cells.map(([cx, cy]) => [-cy, cx]);
    for (const kick of [0, -1, 1, -2, 2]) {
      const moved = { ...p, cells: rotated, x: p.x + kick };
      if (!collide(boardRef.current, moved)) {
        setPiece(moved);
        return;
      }
    }
  };

  const hardDrop = () => {
    if (overRef.current) return;
    let p = pieceRef.current;
    while (!collide(boardRef.current, { ...p, y: p.y + 1 })) {
      p = { ...p, y: p.y + 1 };
    }
    scoreRef.current += 2;
    setScore(scoreRef.current);
    setPiece(p);
    drop();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) e.preventDefault();
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowDown') drop();
      if (e.key === 'ArrowUp') rotate();
      if (e.key === ' ') hardDrop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const speed = Math.max(60, 800 - (levelRef.current - 1) * 70);
    const id = setInterval(drop, speed);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, over]);

  const restart = () => {
    boardRef.current = emptyBoard();
    scoreRef.current = 0;
    overRef.current = false;
    levelRef.current = 1;
    setBoard(boardRef.current);
    setScore(0);
    setLevel(1);
    setOver(false);
    const p = randomPiece();
    setPiece(p);
    pieceRef.current = p;
  };

  const preview = merge(board, piece);

  return (
    <div className="flex w-full max-w-[520px] flex-col items-center gap-3">
      <div className="flex items-center gap-5 text-sm">
        <span className="text-muted-foreground">
          Score <b className="ml-1 text-primary">{score}</b>
        </span>
        <span className="text-muted-foreground">
          Level <b className="ml-1 text-fuchsia-400">{level}</b>
        </span>
        <span className="text-muted-foreground">
          Best <b className="ml-1 text-yellow-400">{best}</b>
        </span>
      </div>
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-black/60 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${COLS}, ${CELL}px)` }}
        >
          {preview.flatMap((row, y) =>
            row.map((c, x) => (
              <div
                key={`${x}-${y}`}
                className="border border-white/[0.04]"
                style={{
                  width: CELL,
                  height: CELL,
                  backgroundColor: c || undefined,
                  boxShadow: c ? `0 0 8px ${c}66` : undefined,
                }}
              />
            ))
          )}
        </div>
        {over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 backdrop-blur-sm">
            <p className="text-xl font-bold text-primary">Game Over</p>
            <p className="text-sm text-muted-foreground">Score: {score}</p>
            <button
              onClick={restart}
              className="rounded-lg bg-gradient-to-r from-primary to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white"
            >
              Play again
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:hidden">
        <button onPointerDown={() => move(-1)} className="rounded-lg border border-border/60 bg-card px-4 py-2 text-lg">←</button>
        <button onPointerDown={() => rotate()} className="rounded-lg border border-border/60 bg-card px-4 py-2 text-lg">↻</button>
        <button onPointerDown={() => move(1)} className="rounded-lg border border-border/60 bg-card px-4 py-2 text-lg">→</button>
        <button onPointerDown={hardDrop} className="col-span-2 rounded-lg border border-border/60 bg-card px-4 py-2 text-lg">Drop ⤓</button>
        <button onPointerDown={drop} className="rounded-lg border border-border/60 bg-card px-4 py-2 text-lg">↓</button>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        ← → move · ↑ rotate · ↓ soft drop · Space hard drop
      </p>
    </div>
  );
}