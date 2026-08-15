import { leaderboardService } from './leaderboard.service';
import { ValidationError } from '../utils/errors';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    gameAccount: { findMany: jest.fn() },
    challenge: { findMany: jest.fn() },
    user: { findMany: jest.fn() },
  },
}));

const db = require('../config/database').default as any;

const account = (overrides: any = {}) => ({
  id: 'acc-1',
  game: 'PUBG',
  inGameUid: 'PlayerOne',
  inGameName: 'PlayerOne',
  rank: 'K/D 2.1',
  level: 100,
  kdRatio: 2.1,
  winRate: 55,
  totalMatches: 40,
  verified: true,
  syncStatus: 'SUCCESS',
  lastSyncedAt: new Date(),
  user: { id: 'user-1', profile: { username: 'playerone', displayName: 'Player One', avatar: null } },
  ...overrides,
});

describe('LeaderboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the internal cache between tests so rankings recompute.
    leaderboardService.clearCache();
  });

  it('lists supported games with metric labels', () => {
    const games = leaderboardService.getGames();
    const ids = games.map((g) => g.id);
    expect(ids).toContain('clashofclans');
    expect(ids).toContain('pubg');
    expect(ids).toContain('smashkarts');
  });

  it('rejects unsupported games', async () => {
    await expect(leaderboardService.getLeaderboard('valorant', {})).rejects.toBeInstanceOf(ValidationError);
  });

  it('ranks PUBG by K/D and excludes players below the minimum match threshold', async () => {
    db.gameAccount.findMany.mockResolvedValue([
      account({ user: { id: 'u1', profile: { username: 'alpha', displayName: null, avatar: null } }, kdRatio: 2.5, totalMatches: 30 }),
      account({ user: { id: 'u2', profile: { username: 'beta', displayName: null, avatar: null } }, kdRatio: 3.0, totalMatches: 25 }),
      // Not enough matches — must not be ranked even though K/D is high.
      account({ user: { id: 'u3', profile: { username: 'gamma', displayName: null, avatar: null } }, kdRatio: 9.9, totalMatches: 2 }),
    ]);

    const result = await leaderboardService.getLeaderboard('pubg', { userId: 'u1' });

    expect(result.data).toHaveLength(2);
    expect(result.data[0].username).toBe('beta');
    expect(result.data[0].rank).toBe(1);
    expect(result.data[1].username).toBe('alpha');
    expect(result.data[1].rank).toBe(2);
    // Low-sample player is excluded entirely (not shown as 0 or fabricated).
    expect(result.data.some((e) => e.username === 'gamma')).toBe(false);
    expect(result.myEntry?.username).toBe('alpha');
  });

  it('handles ties with competition ranking (1, 2, 2, 4)', async () => {
    db.gameAccount.findMany.mockResolvedValue([
      account({ user: { id: 'u1', profile: { username: 'tiea', displayName: null, avatar: null } }, kdRatio: 2.0, totalMatches: 20 }),
      account({ user: { id: 'u2', profile: { username: 'tieb', displayName: null, avatar: null } }, kdRatio: 2.0, totalMatches: 20 }),
      account({ user: { id: 'u3', profile: { username: 'tiec', displayName: null, avatar: null } }, kdRatio: 1.5, totalMatches: 20 }),
    ]);

    const result = await leaderboardService.getLeaderboard('pubg', {});

    // tiea/tieb share rank 1; tiec is rank 3 (skip of rank 2).
    expect(result.data[0].rank).toBe(1);
    expect(result.data[1].rank).toBe(1);
    expect(result.data[2].rank).toBe(3);
  });

  it('ranks Smash Karts (community) by verified challenge wins only', async () => {
    db.challenge.findMany.mockResolvedValue([
      // u1 beats u2
      { challengerId: 'u1', opponentId: 'u2', result: 'CHALLENGER_WIN' },
      // u1 beats u3 (u3 was challenger, u1 was opponent)
      { challengerId: 'u3', opponentId: 'u1', result: 'OPPONENT_WIN' },
      // u2 beats u3
      { challengerId: 'u2', opponentId: 'u3', result: 'CHALLENGER_WIN' },
    ]);
    db.user.findMany.mockResolvedValue([
      { id: 'u1', profile: { username: 'alice', displayName: null, avatar: null } },
      { id: 'u2', profile: { username: 'bob', displayName: null, avatar: null } },
      { id: 'u3', profile: { username: 'carol', displayName: null, avatar: null } },
    ]);

    const result = await leaderboardService.getLeaderboard('smashkarts', {});

    // u1: 2 wins → #1; u2: 1 win → #2; u3: 0 wins → #3.
    expect(result.data).toHaveLength(3);
    expect(result.data[0]).toMatchObject({ username: 'alice', rank: 1 });
    expect(result.data[1]).toMatchObject({ username: 'bob', rank: 2 });
    expect(result.data[2]).toMatchObject({ username: 'carol', rank: 3 });
    expect(result.metricLabel).toBe('Challenge Wins');
  });

  it('returns an empty leaderboard when no verified data exists', async () => {
    db.gameAccount.findMany.mockResolvedValue([]);
    const result = await leaderboardService.getLeaderboard('clashofclans', {});
    expect(result.data).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });
});
