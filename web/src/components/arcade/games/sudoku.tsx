'use client';

import { useEffect, useRef, useState } from 'react';
import { Timer, Lightbulb } from 'lucide-react';
import { useHighScore } from '@/components/arcade/use-high-score';

type Grid = (number | null)[][];

function empty(): Grid {
  return Array.from({ length: 9 }, () => Array<number | null>(9).fill(null));
}

function fillGrid(grid: Grid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== null) continue;
      const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let i = nums.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]];
      }
      for (const n of nums) {
        if (valid(grid, r, c, n)) {
          grid[r][c] = n;
          if (fillGrid(grid)) return true;
          grid[r][c] = null;
        }
      }
      return false;
    }
  }
  return true;
}

function valid(grid: Grid, r: number, c: number, n: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[r][i] === n || grid[i][c] === n) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      if (grid[br + i][bc + j] === n) return false;
    }
  return true;
}

function generatePuzzle(): { puzzle: Grid; solution: Grid } {
  const solution = empty();
  fillGrid(solution);
  const puzzle = solution.map((row) => [...row]);
  const cells = Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9]);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  let removed = 0;
  for (const [r, c] of cells) {
    if (removed >= 45) break;
    const backup = puzzle[r][c];
    puzzle[r][c] = null;
    let solutions = 0;
    const count = (g: Grid): void => {
      for (let rr = 0; rr < 9; rr++)
        for (let cc = 0; cc < 9; cc++) {
          if (g[rr][cc] !== null) continue;
          for (let n = 1; n <= 9; n++) {
            if (valid(g, rr, cc, n)) {
              g[rr][cc] = n;
              count(g);
              g[rr][cc] = null;
              if (solutions > 1) return;
            }
          }
          return;
        }
      solutions += 1;
    };
    count(puzzle.map((row) => [...row]));
    if (solutions === 1) removed += 1;
    else puzzle[r][c] = backup;
  }
  return { puzzle, solution };
}

export default function Sudoku() {
  const [grid, setGrid] = useState<Grid>(empty);
  const [solution, setSolution] = useState<Grid>(empty);
  const [initial, setInitial] = useState<Grid>(empty);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState<'play' | 'win' | 'lose'>('play');
  const { best, submit } = useHighScore('sudoku');
  const statusRef = useRef(status);
  statusRef.current = status;
  const gridRef = useRef(grid);
  gridRef.current = grid;
  const solutionRef = useRef(solution);
  solutionRef.current = solution;

  const newGame = () => {
    const { puzzle, solution } = generatePuzzle();
    setGrid(puzzle);
    setSolution(solution);
    setInitial(puzzle.map((row) => [...row]));
    setSelected(null);
    setMistakes(0);
    setSeconds(0);
    setStatus('play');
  };

  useEffect(() => {
    newGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === 'play') {
      const id = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => clearInterval(id);
    }
  }, [status]);

  const conflicts = (r: number, c: number): boolean => {
    const n = grid[r][c];
    if (n === null) return false;
    for (let i = 0; i < 9; i++) {
      if (i !== c && grid[r][i] === n) return true;
      if (i !== r && grid[i][c] === n) return true;
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        const rr = br + i;
        const cc = bc + j;
        if ((rr !== r || cc !== c) && grid[rr][cc] === n) return true;
      }
    return false;
  };

  const enter = (n: number) => {
    if (!selected || status !== 'play') return;
    const [r, c] = selected;
    if (gridRef.current[r][c] !== null) return;
    if (n !== solutionRef.current[r][c]) {
      const next = mistakes + 1;
      setMistakes(next);
      if (next >= 3) {
        setStatus('lose');
        return;
      }
      return;
    }
    const next = gridRef.current.map((row, ri) =>
      row.map((v, ci) => (ri === r && ci === c ? n : v))
    );
    setGrid(next);
    const solved = next.every((row) => row.every((v) => v !== null));
    if (solved) {
      setStatus('win');
      submit(1);
    }
  };

  const hint = () => {
    if (!selected || status !== 'play') return;
    const [r, c] = selected;
    if (gridRef.current[r][c] !== null) return;
    const next = gridRef.current.map((row, ri) =>
      row.map((v, ci) => (ri === r && ci === c ? solutionRef.current[r][c] : v))
    );
    setGrid(next);
    const solved = next.every((row) => row.every((v) => v !== null));
    if (solved) {
      setStatus('win');
      submit(1);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[1-9]$/.test(e.key)) enter(Number(e.key));
      if (e.key === 'Backspace' && selected) {
        const [r, c] = selected;
        if (gridRef.current[r][c] !== null) return;
        const next = gridRef.current.map((row, ri) =>
          row.map((v, ci) => (ri === r && ci === c ? null : v))
        );
        setGrid(next);
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selected) {
        e.preventDefault();
        const [r, c] = selected;
        const map: Record<string, [number, number]> = {
          ArrowUp: [Math.max(0, r - 1), c],
          ArrowDown: [Math.min(8, r + 1), c],
          ArrowLeft: [r, Math.max(0, c - 1)],
          ArrowRight: [r, Math.min(8, c + 1)],
        };
        setSelected(map[e.key]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, mistakes, status]);

  return (
    <div className="flex w-full max-w-[420px] flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Timer className="h-4 w-4 text-fuchsia-400" /> <b>{seconds}s</b>
        </span>
        <span className="text-muted-foreground">
          Mistakes <b className={`ml-1 ${mistakes >= 2 ? 'text-red-400' : 'text-primary'}`}>{mistakes}/3</b>
        </span>
        <span className="text-muted-foreground">
          Solved <b className="ml-1 text-yellow-400">{best}</b>
        </span>
      </div>

      <div
        className="grid overflow-hidden rounded-xl border-2 border-border/70 shadow-[0_0_30px_rgba(139,92,246,0.15)]"
        style={{ gridTemplateColumns: 'repeat(9, 38px)' }}
      >
        {grid.map((row, r) =>
          row.map((v, c) => {
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const isGiven = initial[r][c] !== null;
            const hasConflict = conflicts(r, c);
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => setSelected([r, c])}
                className="flex h-[38px] w-[38px] items-center justify-center text-base font-bold transition"
                style={{
                  backgroundColor: isSelected ? '#7c3aed' : '#141724',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderLeft: c % 3 === 0 ? '2px solid rgba(139,92,246,0.5)' : undefined,
                  borderTop: r % 3 === 0 ? '2px solid rgba(139,92,246,0.5)' : undefined,
                  color: hasConflict ? '#f87171' : isGiven ? '#c4b5fd' : v !== null ? '#e2e8f0' : 'transparent',
                }}
              >
                {v ?? ''}
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <button
            key={i}
            onClick={() => enter(i + 1)}
            className="h-10 w-9 rounded-lg border border-border/60 bg-card font-bold text-foreground transition hover:border-primary hover:text-primary"
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={hint}
          disabled={!selected || status !== 'play'}
          className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:text-primary disabled:opacity-40"
        >
          <Lightbulb className="h-3.5 w-3.5" /> Hint
        </button>
        <button
          onClick={newGame}
          className="rounded-lg bg-gradient-to-r from-primary to-fuchsia-500 px-4 py-2 text-xs font-semibold text-white"
        >
          New puzzle
        </button>
      </div>

      {status !== 'play' && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-4">
          <p className={`text-lg font-bold ${status === 'win' ? 'text-primary' : 'text-red-400'}`}>
            {status === 'win' ? `Solved in ${seconds}s!` : 'Too many mistakes'}
          </p>
          <button
            onClick={newGame}
            className="rounded-lg bg-gradient-to-r from-primary to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Play again
          </button>
        </div>
      )}
    </div>
  );
}