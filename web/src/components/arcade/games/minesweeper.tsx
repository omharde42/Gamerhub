'use client';

import { useEffect, useRef, useState } from 'react';
import { Flag, Timer } from 'lucide-react';
import { useHighScore } from '@/components/arcade/use-high-score';

const SIZE = 9;
const MINES = 10;

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

function emptyCells(): Cell[][] {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
  );
}

function neighbors(r: number, c: number): [number, number][] {
  const out: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) out.push([nr, nc]);
    }
  return out;
}

function placeMines(cells: Cell[][], safeR: number, safeC: number) {
  const safe = new Set(neighbors(safeR, safeC).map(([r, c]) => `${r},${c}`));
  safe.add(`${safeR},${safeC}`);
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    if (cells[r][c].mine || safe.has(`${r},${c}`)) continue;
    cells[r][c].mine = true;
    placed++;
  }
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      cells[r][c].adjacent = neighbors(r, c).filter(([nr, nc]) => cells[nr][nc].mine).length;
    }
}

export default function Minesweeper() {
  const [cells, setCells] = useState<Cell[][]>(emptyCells);
  const [minesPlaced, setMinesPlaced] = useState(false);
  const [flags, setFlags] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState<'play' | 'win' | 'lose'>('play');
  const { best, submit } = useHighScore('minesweeper');
  const cellsRef = useRef(cells);
  cellsRef.current = cells;
  const statusRef = useRef(status);
  statusRef.current = status;
  const timerRef = useRef(0);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flood = (cells: Cell[][], r: number, c: number) => {
    const stack: [number, number][] = [[r, c]];
    while (stack.length) {
      const [cr, cc] = stack.pop()!;
      const cell = cells[cr][cc];
      if (cell.revealed || cell.flagged) continue;
      cell.revealed = true;
      if (cell.mine) continue;
      if (cell.adjacent === 0) {
        for (const [nr, nc] of neighbors(cr, cc)) {
          if (!cells[nr][nc].revealed) stack.push([nr, nc]);
        }
      }
    }
  };

  useEffect(() => {
    if (status === 'play') {
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  const checkWin = (cells: Cell[][]) => {
    const won = cells.every((row) => row.every((cell) => cell.mine || cell.revealed));
    if (won) {
      setStatus('win');
      submit(1);
    }
    return won;
  };

  const reveal = (r: number, c: number) => {
    if (statusRef.current !== 'play') return;
    const cells = cellsRef.current.map((row) => row.map((cell) => ({ ...cell })));
    const cell = cells[r][c];
    if (cell.revealed || cell.flagged) return;
    if (!minesPlaced) {
      placeMines(cells, r, c);
      setMinesPlaced(true);
    }
    if (cell.mine) {
      cells.forEach((row) => row.forEach((cc) => cc.revealed = cc.mine || cc.revealed));
      setCells(cells);
      setStatus('lose');
      return;
    }
    flood(cells, r, c);
    setCells(cells);
    checkWin(cells);
  };

  const toggleFlag = (r: number, c: number) => {
    if (statusRef.current !== 'play') return;
    const cells = cellsRef.current.map((row) => row.map((cell) => ({ ...cell })));
    const cell = cells[r][c];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    setCells(cells);
    setFlags(cells.flat().filter((cc) => cc.flagged).length);
  };

  const onPointerDown = (r: number, c: number) => {
    pressTimerRef.current = setTimeout(() => {
      toggleFlag(r, c);
      pressTimerRef.current = null;
    }, 350);
  };

  const onPointerUp = (r: number, c: number) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
      reveal(r, c);
    }
  };

  const onContext = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    toggleFlag(r, c);
  };

  const restart = () => {
    setCells(emptyCells());
    setMinesPlaced(false);
    setFlags(0);
    setSeconds(0);
    setStatus('play');
  };

  return (
    <div className="flex w-full max-w-[420px] flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Flag className="h-4 w-4 text-red-400" /> <b className="text-primary">{MINES - flags}</b>
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Timer className="h-4 w-4 text-fuchsia-400" /> <b>{seconds}s</b>
        </span>
        <span className="text-muted-foreground">
          Wins <b className="ml-1 text-yellow-400">{best}</b>
        </span>
      </div>

      <div
        className="grid overflow-hidden rounded-xl border border-border/70 shadow-[0_0_30px_rgba(139,92,246,0.15)]"
        style={{ gridTemplateColumns: `repeat(${SIZE}, 38px)` }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {cells.map((row, r) =>
          row.map((cell, c) => {
            const n = neighbors(r, c).filter(([nr, nc]) => cells[nr][nc].mine).length;
            const danger = cell.adjacent > 0 && cell.revealed && n === cell.adjacent;
            return (
              <button
                key={`${r}-${c}`}
                onPointerDown={() => onPointerDown(r, c)}
                onPointerUp={() => onPointerUp(r, c)}
                onContextMenu={(e) => onContext(e, r, c)}
                className="flex h-[38px] w-[38px] items-center justify-center border border-white/[0.05] text-sm font-bold transition"
                style={{
                  backgroundColor: cell.revealed ? (cell.mine ? '#3f1d2b' : '#141724') : '#1e2233',
                  boxShadow: cell.revealed ? 'none' : 'inset 0 2px 0 rgba(255,255,255,0.06)',
                }}
              >
                {cell.flagged ? (
                  <Flag className="h-4 w-4 text-red-400" />
                ) : cell.revealed && cell.mine ? (
                  <span className="text-sm">💣</span>
                ) : cell.revealed && cell.adjacent > 0 ? (
                  <span
                    className={
                      cell.adjacent === 1 ? 'text-cyan-300' :
                      cell.adjacent === 2 ? 'text-emerald-300' :
                      cell.adjacent === 3 ? 'text-amber-300' : 'text-red-300'
                    }
                  >
                    {cell.adjacent}
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>

      {status !== 'play' && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-4">
          <p className={`text-lg font-bold ${status === 'win' ? 'text-primary' : 'text-red-400'}`}>
            {status === 'win' ? `Cleared in ${seconds}s — nice!` : 'Boom!'}
          </p>
          <button
            onClick={restart}
            className="rounded-lg bg-gradient-to-r from-primary to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Play again
          </button>
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        Tap to reveal · long-press or right-click to flag · {MINES} mines
      </p>
    </div>
  );
}