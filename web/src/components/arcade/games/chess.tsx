'use client';

import { useEffect, useRef, useState } from 'react';
import { useHighScore } from '@/components/arcade/use-high-score';

type Color = 'w' | 'b';
type Type = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';

interface Piece {
  type: Type;
  color: Color;
}

type Board = (Piece | null)[][];

interface Move {
  from: [number, number];
  to: [number, number];
  castle?: 'K' | 'Q';
  enPassant?: boolean;
}

const INITIAL: Board = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'].map((c) => ({ type: c.toUpperCase() as Type, color: 'b' as Color })),
  Array.from({ length: 8 }, () => ({ type: 'P' as Type, color: 'b' as Color })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array.from({ length: 8 }, () => ({ type: 'P' as Type, color: 'w' as Color })),
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'].map((c) => ({ type: c.toUpperCase() as Type, color: 'w' as Color })),
];

const VALUE: Record<Type, number> = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };

function clone(b: Board): Board {
  return b.map((row) => row.map((p) => (p ? { ...p } : null)));
}

function findKing(b: Board, color: Color): [number, number] | null {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (p && p.type === 'K' && p.color === color) return [r, c];
    }
  return null;
}

function onBoard(r: number, c: number) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function attacks(b: Board, r: number, c: number, color: Color): boolean {
  const inBounds = onBoard(r, c);
  if (!inBounds) return false;
  const dirs = [
    [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1],
  ];
  const kn = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (!onBoard(nr, nc)) continue;
    const p = b[nr][nc];
    if (p && p.color === color) {
      if (p.type === 'K') return true;
      if (p.type === 'P' && dr === (color === 'w' ? -1 : 1) && dc !== 0) return true;
    }
    let rr = nr + dr;
    let cc = nc + dc;
    while (onBoard(rr, cc)) {
      const pp = b[rr][cc];
      if (pp) {
        if (pp.color === color && (pp.type === 'R' || pp.type === 'Q' || (pp.type === 'B' && Math.abs(dr) === Math.abs(dc)))) return true;
        break;
      }
      rr += dr;
      cc += dc;
    }
  }
  for (const [dr, dc] of kn) {
    const nr = r + dr;
    const nc = c + dc;
    if (onBoard(nr, nc)) {
      const p = b[nr][nc];
      if (p && p.color === color && p.type === 'N') return true;
    }
  }
  return false;
}

function inCheck(b: Board, color: Color): boolean {
  const k = findKing(b, color);
  if (!k) return true;
  return attacks(b, k[0], k[1], color === 'w' ? 'b' : 'w');
}

interface Castling {
  wK: boolean;
  wQ: boolean;
  bK: boolean;
  bQ: boolean;
  ep: [number, number] | null;
}

function pseudoMoves(b: Board, color: Color, castling: Castling): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (!p || p.color !== color) continue;
      const add = (to: [number, number], extra?: Partial<Move>) =>
        moves.push({ from: [r, c], to, ...extra });
      if (p.type === 'P') {
        const dir = color === 'w' ? -1 : 1;
        const start = color === 'w' ? 6 : 1;
        const promo = r + dir === 0 || r + dir === 7;
        if (onBoard(r + dir, c) && !b[r + dir][c]) {
          if (promo) add([r + dir, c], {});
          else add([r + dir, c]);
          if (r === start && !b[r + 2 * dir][c]) add([r + 2 * dir, c]);
        }
        for (const dc of [-1, 1]) {
          const nc = c + dc;
          if (!onBoard(r + dir, nc)) continue;
          const target = b[r + dir][nc];
          if (target && target.color !== color) add([r + dir, nc]);
          if (castling.ep && castling.ep[0] === r + dir && castling.ep[1] === nc) {
            add([r + dir, nc], { enPassant: true });
          }
        }
      } else if (p.type === 'N') {
        for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (onBoard(nr, nc)) {
            const t = b[nr][nc];
            if (!t || t.color !== color) add([nr, nc]);
          }
        }
      } else if (p.type === 'K') {
        for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (onBoard(nr, nc)) {
            const t = b[nr][nc];
            if (!t || t.color !== color) add([nr, nc]);
          }
        }
        const opp = color === 'w' ? 'b' : 'w';
        if (color === 'w' ? castling.wK : castling.bK) {
          if (!b[7][5] && !b[7][6] && !attacks(b, 7, 5, opp) && !attacks(b, 7, 6, opp)) add([7, 6], { castle: 'K' });
        }
        if (color === 'w' ? castling.wQ : castling.bQ) {
          if (!b[7][3] && !b[7][2] && !b[7][1] && !attacks(b, 7, 3, opp) && !attacks(b, 7, 2, opp)) add([7, 2], { castle: 'Q' });
        }
      } else {
        const rays =
          p.type === 'B'
            ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            : p.type === 'R'
            ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
            : [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        for (const [dr, dc] of rays) {
          let nr = r + dr;
          let nc = c + dc;
          while (onBoard(nr, nc)) {
            const t = b[nr][nc];
            if (!t) add([nr, nc]);
            else {
              if (t.color !== color) add([nr, nc]);
              break;
            }
            nr += dr;
            nc += dc;
          }
        }
      }
    }
  }
  return moves;
}

function apply(b: Board, m: Move, castling: Castling): { board: Board; castling: Castling } {
  const nb = clone(b);
  const p = nb[m.from[0]][m.from[1]]!;
  nb[m.to[0]][m.to[1]] = { ...p };
  nb[m.from[0]][m.from[1]] = null;
  const nc: Castling = { ...castling };
  if (p.type === 'P' && m.enPassant) {
    nb[m.from[0]][m.to[1]] = null;
  }
  if (p.type === 'P' && (m.to[0] === 0 || m.to[0] === 7)) {
    nb[m.to[0]][m.to[1]] = { type: 'Q', color: p.color };
  }
  if (p.type === 'K') {
    if (p.color === 'w') {
      nc.wK = false;
      nc.wQ = false;
      if (m.castle === 'K') {
        nb[7][5] = nb[7][7];
        nb[7][7] = null;
      }
      if (m.castle === 'Q') {
        nb[7][3] = nb[7][0];
        nb[7][0] = null;
      }
    } else {
      nc.bK = false;
      nc.bQ = false;
      if (m.castle === 'K') {
        nb[0][5] = nb[0][7];
        nb[0][7] = null;
      }
      if (m.castle === 'Q') {
        nb[0][3] = nb[0][0];
        nb[0][0] = null;
      }
    }
  }
  if (p.type === 'R') {
    if (m.from[0] === 7 && m.from[1] === 0) nc.wQ = false;
    if (m.from[0] === 7 && m.from[1] === 7) nc.wK = false;
    if (m.from[0] === 0 && m.from[1] === 0) nc.bQ = false;
    if (m.from[0] === 0 && m.from[1] === 7) nc.bK = false;
  }
  nc.ep = null;
  if (p.type === 'P' && Math.abs(m.from[0] - m.to[0]) === 2) {
    nc.ep = [(m.from[0] + m.to[0]) / 2, m.from[1]];
  }
  return { board: nb, castling: nc };
}

function legalMoves(b: Board, color: Color, castling: Castling): Move[] {
  return pseudoMoves(b, color, castling).filter((m) => {
    const { board: nb, castling: nc } = apply(b, m, castling);
    return !inCheck(nb, color);
  });
}

function evaluate(b: Board): number {
  let score = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (!p) continue;
      const v = VALUE[p.type];
      score += p.color === 'w' ? v : -v;
    }
  return score;
}

function bestMove(b: Board, castling: Castling): Move | null {
  const moves = legalMoves(b, 'b', castling);
  if (moves.length === 0) return null;
  let best: Move[] = [];
  let bestScore = -Infinity;
  for (const m of moves) {
    const { board: nb, castling: nc } = apply(b, m, castling);
    let score = -evaluate(nb);
    const captured = b[m.to[0]][m.to[1]];
    if (captured) score += VALUE[captured.type] * 10;
    if (inCheck(nb, 'w')) score += 60;
    if (legalMoves(nb, 'w', nc).length === 0) score += inCheck(nb, 'w') ? 100000 : 50000;
    if (score > bestScore) {
      bestScore = score;
      best = [m];
    } else if (score === bestScore) {
      best.push(m);
    }
  }
  return best[Math.floor(Math.random() * best.length)] ?? null;
}

const GLYPH: Record<Type, string> = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' };
const BLACK_GLYPH: Record<Type, string> = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' };

export default function Chess() {
  const [board, setBoard] = useState<Board>(INITIAL);
  const [turn, setTurn] = useState<Color>('w');
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [legal, setLegal] = useState<Move[]>([]);
  const [status, setStatus] = useState<'play' | 'over'>('play');
  const [result, setResult] = useState('');
  const [checkAlert, setCheckAlert] = useState(false);
  const { best, submit } = useHighScore('chess');

  const gameRef = useRef({ castling: { wK: true, wQ: true, bK: true, bQ: true, ep: null as [number, number] | null }, over: false, aiThinking: false });
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const afterMove = (m: Move) => {
    const g = gameRef.current;
    const { board: nb, castling: nc } = apply(board, m, g.castling);
    g.castling = nc;
    const nextTurn: Color = turn === 'w' ? 'b' : 'w';
    setBoard(nb);
    setSelected(null);
    setLegal([]);
    const moves = legalMoves(nb, nextTurn, nc);
    if (moves.length === 0) {
      const mate = inCheck(nb, nextTurn);
      g.over = true;
      setStatus('over');
      setResult(mate ? (turn === 'w' ? 'Checkmate — You win!' : 'Checkmate — CPU wins') : 'Stalemate — draw');
      if (mate && turn === 'w') submit(1);
      return;
    }
    setCheckAlert(inCheck(nb, nextTurn));
    setTurn(nextTurn);
    if (nextTurn === 'b' && !g.over) {
      g.aiThinking = true;
      aiTimerRef.current = setTimeout(() => {
        const mv = bestMove(nb, nc);
        g.aiThinking = false;
        if (!mv) return;
        const { board: nb2, castling: nc2 } = apply(nb, mv, nc);
        g.castling = nc2;
        setBoard(nb2);
        const moves2 = legalMoves(nb2, 'w', nc2);
        if (moves2.length === 0) {
          g.over = true;
          setStatus('over');
          setResult(inCheck(nb2, 'w') ? 'Checkmate — CPU wins' : 'Stalemate — draw');
          return;
        }
        setCheckAlert(inCheck(nb2, 'w'));
        setTurn('w');
      }, 550);
    }
  };

  const onSquare = (r: number, c: number) => {
    if (turn !== 'w' || status === 'over' || gameRef.current.aiThinking) return;
    const p = board[r][c];
    if (selected) {
      const mv = legal.find((m) => m.to[0] === r && m.to[1] === c);
      if (mv) {
        afterMove(mv);
        return;
      }
    }
    if (p && p.color === 'w') {
      setSelected([r, c]);
      setLegal(legalMoves(board, 'w', gameRef.current.castling).filter((m) => m.from[0] === r && m.from[1] === c));
    } else {
      setSelected(null);
      setLegal([]);
    }
  };

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, []);

  const restart = () => {
    gameRef.current = { castling: { wK: true, wQ: true, bK: true, bQ: true, ep: null }, over: false, aiThinking: false };
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    setBoard(INITIAL);
    setTurn('w');
    setSelected(null);
    setLegal([]);
    setStatus('play');
    setResult('');
    setCheckAlert(false);
  };

  const lastMoveTo = legal.length > 0 && selected ? selected : null;

  return (
    <div className="flex w-full max-w-[420px] flex-col items-center gap-3">
      <div className="flex items-center gap-5 text-sm">
        <span className="text-muted-foreground">
          Turn <b className={`ml-1 ${turn === 'w' ? 'text-primary' : 'text-fuchsia-400'}`}>{turn === 'w' ? 'You (White)' : 'CPU (Black)'}</b>
        </span>
        <span className="text-muted-foreground">
          Best <b className="ml-1 text-yellow-400">{best}</b>
        </span>
      </div>
      {checkAlert && status === 'play' && (
        <p className="animate-pulse text-xs font-semibold text-red-400">Check!</p>
      )}
      <div className="grid grid-cols-8 overflow-hidden rounded-xl border-2 border-border/70 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
        {board.map((row, r) =>
          row.map((p, c) => {
            const dark = (r + c) % 2 === 1;
            const isSel = selected?.[0] === r && selected?.[1] === c;
            const isTarget = legal.some((m) => m.to[0] === r && m.to[1] === c);
            const isKingInCheck =
              p?.type === 'K' && p.color === turn && checkAlert && status === 'play';
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => onSquare(r, c)}
                className="relative flex items-center justify-center text-[34px] leading-none transition"
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: isSel
                    ? '#7c3aed'
                    : dark
                    ? '#171a26'
                    : '#262a3a',
                }}
              >
                {isTarget && (
                  <span
                    className="absolute h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: p ? 'transparent' : '#a78bfa',
                      boxShadow: p ? '0 0 0 3px #a78bfa' : '0 0 8px #a78bfa',
                      opacity: 0.9,
                    }}
                  />
                )}
                {p && (
                  <span
                    className={p.color === 'b' ? 'text-[#e2e8f0]' : 'text-white'}
                    style={{
                      textShadow: isKingInCheck
                        ? '0 0 12px #ef4444'
                        : p.color === 'b'
                        ? '0 0 8px rgba(226,232,240,0.35)'
                        : '0 0 8px rgba(255,255,255,0.25)',
                    }}
                  >
                    {p.color === 'w' ? GLYPH[p.type] : BLACK_GLYPH[p.type]}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        Tap a white piece, then tap a highlighted square · castling & en passant supported · pawns auto-promote to Queen
      </p>
      {status === 'over' && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-4">
          <p className="text-lg font-bold text-primary">{result}</p>
          <button
            onClick={restart}
            className="rounded-lg bg-gradient-to-r from-primary to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Rematch
          </button>
        </div>
      )}
    </div>
  );
}