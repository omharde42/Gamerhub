'use client';

import { useEffect, useRef, useState } from 'react';
import { formatRelativeTime, formatAbsoluteDateTime } from '@/lib/utils';

interface RelativeTimeProps {
  date: string | Date;
  className?: string;
}

/**
 * Renders a relative timestamp ("2m ago") that stays fresh without a global
 * ticking loop: each instance schedules its own refresh at a cadence that
 * matches its age (frequent while recent, sparse later, none after a week),
 * so stale timestamps self-correct with a minimal number of re-renders.
 *
 * - `dateTime` attribute exposes the exact timestamp to machines (a11y/SEO).
 * - `title` shows the absolute date + time on hover.
 * - `suppressHydrationWarning` tolerates the tiny client/server clock skew
 *   inherent to relative-time rendering.
 */
export function RelativeTime({ date, className }: RelativeTimeProps) {
  const [, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const schedule = () => {
      const diffMs = Date.now() - new Date(date).getTime();
      let delay: number;
      if (diffMs < 60_000) delay = 30_000; // just now → refresh every 30s
      else if (diffMs < 3_600_000) delay = 60_000; // minutes → every minute
      else if (diffMs < 86_400_000) delay = 300_000; // hours → every 5 min
      else if (diffMs < 604_800_000) delay = 1_800_000; // days → every 30 min
      else return; // older than a week — the label never changes again

      timerRef.current = setTimeout(() => {
        setTick((t) => t + 1);
        schedule();
      }, delay);
    };

    schedule();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [date]);

  const iso = new Date(date).toISOString();

  return (
    <time
      dateTime={iso}
      title={formatAbsoluteDateTime(date)}
      className={className}
      suppressHydrationWarning
    >
      {formatRelativeTime(date)}
    </time>
  );
}
