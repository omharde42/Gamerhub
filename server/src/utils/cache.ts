export class MemoryCache<T> {
  private cache = new Map<string, { data: T; expiresAt: number }>();

  constructor(private defaultTtlMs: number = 5 * 60 * 1000) {} // 5 minutes default

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  set(key: string, data: T, ttlMs: number = this.defaultTtlMs): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cocCache = new MemoryCache<any>(5 * 60 * 1000); // 5 minutes cache
