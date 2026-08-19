'use client';

import { useCallback, useState } from 'react';

export function useHighScore(gameId: string) {
  const key = `gh-arcade:${gameId}`;
  const [best, setBest] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      return Number(window.localStorage.getItem(key)) || 0;
    } catch {
      return 0;
    }
  });

  const submit = useCallback(
    (score: number) => {
      setBest((prev) => {
        const next = Math.max(prev, Math.floor(score));
        try {
          window.localStorage.setItem(key, String(next));
        } catch {
          /* storage unavailable */
        }
        return next;
      });
    },
    [key]
  );

  return { best, submit };
}