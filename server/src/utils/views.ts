import { createHash } from 'crypto';

/** Views are deduped per viewer (or IP for anonymous) within this window. */
export const VIEW_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Hash a raw IP so addresses are never stored in plain text. Returns undefined
 * when no IP is available (the caller should then skip dedup/recording).
 */
export function hashIp(ip: string | undefined | null): string | undefined {
  if (!ip) return undefined;
  return createHash('sha256').update(ip).digest('hex');
}
