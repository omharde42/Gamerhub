import prisma from '../config/database';
import { ValidationError } from '../utils/errors';

/**
 * Global Leaderboard — real data only.
 *
 * Ranking is computed server-side from verified data (GameAccount rows with
 * `verified = true` and real statistics; community games rank by completed
 * challenge wins). Clients can never submit or manipulate values — they only
 * pick a game and paginate. Each game defines its own metric; there is no
 * single universal formula.
 */

export interface LeaderboardRawEntry {
  userId: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  /** Numeric sort key. null = unranked (excluded from ranking). */
  score: number | null;
  metricValue: string;
  detail: Record<string, any>;
}

export interface LeaderboardEntry extends LeaderboardRawEntry {
  rank: number;
}

export interface LeaderboardGameConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  metricLabel: string;
  /** Shown when a player has too little data to rank. */
  minSampleHint?: string;
  load: () => Promise<LeaderboardRawEntry[]>;
}

const MIN_PUBG_MATCHES = 10;

function parseTownHall(rank?: string | null): number | null {
  if (!rank) return null;
  const m = rank.match(/Town Hall\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

const GAME_CONFIGS: LeaderboardGameConfig[] = [
  {
    id: 'clashofclans',
    name: 'Clash of Clans',
    icon: '🏰',
    description: 'Ranked by Town Hall level from verified Supercell accounts.',
    metricLabel: 'Town Hall',
    load: async () => {
      const accounts = await prisma.gameAccount.findMany({
        where: { game: 'CLASH_OF_CLANS', verified: true, syncStatus: 'SUCCESS' },
        include: { user: { select: { id: true, profile: { select: { username: true, displayName: true, avatar: true } } } } },
      });
      return accounts.map((acc) => {
        const townHall = parseTownHall(acc.rank) ?? acc.level ?? null;
        return {
          userId: acc.user.id,
          username: acc.user.profile?.username || acc.inGameName || 'Unknown',
          displayName: acc.user.profile?.displayName || null,
          avatar: acc.user.profile?.avatar || null,
          score: townHall,
          metricValue: townHall != null ? `Town Hall ${townHall}` : 'Unavailable',
          detail: {
            playerName: acc.inGameName,
            expLevel: acc.level ?? null,
            lastSyncedAt: acc.lastSyncedAt,
          },
        };
      });
    },
  },
  {
    id: 'pubg',
    name: 'PUBG (PC / Console)',
    icon: '🪖',
    description: `Ranked by K/D ratio among verified PUBG PC accounts with at least ${MIN_PUBG_MATCHES} matches.`,
    metricLabel: 'K/D',
    minSampleHint: `Needs at least ${MIN_PUBG_MATCHES} matches to rank`,
    load: async () => {
      const accounts = await prisma.gameAccount.findMany({
        where: { game: 'PUBG', verified: true, syncStatus: 'SUCCESS' },
        include: { user: { select: { id: true, profile: { select: { username: true, displayName: true, avatar: true } } } } },
      });
      return accounts.map((acc) => {
        const kd = acc.kdRatio;
        const matches = acc.totalMatches ?? 0;
        const rankable = kd != null && matches >= MIN_PUBG_MATCHES;
        return {
          userId: acc.user.id,
          username: acc.user.profile?.username || acc.inGameName || 'Unknown',
          displayName: acc.user.profile?.displayName || null,
          avatar: acc.user.profile?.avatar || null,
          score: rankable ? Math.round(kd * 100) / 100 : null,
          metricValue: kd != null ? `${kd} K/D` : 'Unavailable',
          detail: {
            playerName: acc.inGameName,
            totalMatches: matches,
            winRate: acc.winRate ?? null,
            lastSyncedAt: acc.lastSyncedAt,
          },
        };
      });
    },
  },
  {
    id: 'smashkarts',
    name: 'Smash Karts',
    icon: '🏎️',
    description: 'Community game — ranked by verified challenge wins. No official stats API exists, so no fabricated statistics are shown.',
    metricLabel: 'Challenge Wins',
    load: async () => {
      // Real community data: completed Smash Karts challenges with a winner.
      const challenges = await prisma.challenge.findMany({
        where: { game: 'smashkarts', status: 'COMPLETED', result: { in: ['CHALLENGER_WIN', 'OPPONENT_WIN'] } },
        select: { challengerId: true, opponentId: true, result: true },
      });
      const wins = new Map<string, number>();
      const userIds = new Set<string>();
      challenges.forEach((c) => {
        const winnerId = c.result === 'CHALLENGER_WIN' ? c.challengerId : c.opponentId;
        userIds.add(c.challengerId);
        userIds.add(c.opponentId);
        wins.set(winnerId, (wins.get(winnerId) || 0) + 1);
      });
      if (userIds.size === 0) return [];
      const profiles = await prisma.user.findMany({
        where: { id: { in: [...userIds] } },
        select: { id: true, profile: { select: { username: true, displayName: true, avatar: true } } },
      });
      return profiles.map((u) => ({
        userId: u.id,
        username: u.profile?.username || 'Unknown',
        displayName: u.profile?.displayName || null,
        avatar: u.profile?.avatar || null,
        score: wins.get(u.id) || 0,
        metricValue: `${wins.get(u.id) || 0} win${wins.get(u.id) === 1 ? '' : 's'}`,
        detail: {},
      }));
    },
  },
];

/** In-memory cache with a short TTL so repeated page loads don't re-query the DB. */
const cache = new Map<string, { at: number; entries: LeaderboardEntry[] }>();
const CACHE_TTL_MS = 60_000;

export class LeaderboardService {
  /** Test hook: drop the in-memory cache so the next read recomputes rankings. */
  clearCache(): void {
    cache.clear();
  }

  getGames(): Omit<LeaderboardGameConfig, 'load'>[] {
    return GAME_CONFIGS.map(({ id, name, icon, description, metricLabel, minSampleHint }) => ({
      id,
      name,
      icon,
      description,
      metricLabel,
      minSampleHint,
    }));
  }

  private getConfig(game: string): LeaderboardGameConfig {
    const config = GAME_CONFIGS.find((g) => g.id === game);
    if (!config) {
      throw new ValidationError({ game: ['Unsupported leaderboard. Available games: ' + GAME_CONFIGS.map((g) => g.id).join(', ')] });
    }
    return config;
  }

  private async rankedEntries(config: LeaderboardGameConfig): Promise<LeaderboardEntry[]> {
    const cached = cache.get(config.id);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.entries;

    const raw = await config.load();
    // Sort: score desc, ties broken deterministically by username asc so ranks are stable.
    const rankable = raw
      .filter((e) => e.score != null)
      .sort((a, b) => {
        if (b.score! - a.score! !== 0) return b.score! - a.score!;
        return a.username.localeCompare(b.username);
      });

    // Competition ranking: equal scores share a rank, the next rank skips ahead (1,2,2,4).
    const entries: LeaderboardEntry[] = [];
    let prevRank = 0;
    let prevScore: number | null = null;
    rankable.forEach((e, i) => {
      const rank = prevScore === e.score ? prevRank : i + 1;
      entries.push({ ...e, rank });
      prevRank = rank;
      prevScore = e.score;
    });

    cache.set(config.id, { at: Date.now(), entries });
    return entries;
  }

  async getLeaderboard(game: string, query: { page?: number; limit?: number; userId?: string }) {
    const config = this.getConfig(game);
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const entries = await this.rankedEntries(config);

    const total = entries.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const data = entries.slice(start, start + limit);

    let myEntry: LeaderboardEntry | null = null;
    if (query.userId) {
      myEntry = entries.find((e) => e.userId === query.userId) || null;
    }

    return {
      game: config.id,
      name: config.name,
      icon: config.icon,
      description: config.description,
      metricLabel: config.metricLabel,
      minSampleHint: config.minSampleHint || null,
      data,
      myEntry,
      meta: { page, limit, total, totalPages, hasNext: start + limit < total, hasPrev: page > 1 },
    };
  }
}

export const leaderboardService = new LeaderboardService();
