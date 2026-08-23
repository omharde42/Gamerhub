import { analyticsService } from './analytics.service';
import { ValidationError, NotFoundError } from '../utils/errors';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    matchHistory: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
    profile: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

const db = require('../config/database').default as any;

describe('AnalyticsService.logMatch', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a match and recomputes profile aggregates', async () => {
    db.matchHistory.create.mockResolvedValue({ id: 'm1', game: 'Valorant', result: 'WIN' });
    db.matchHistory.findMany.mockResolvedValue([
      { result: 'WIN', kills: 10, deaths: 5, accuracy: 50 },
      { result: 'LOSS', kills: 2, deaths: 8, accuracy: 30 },
    ]);
    db.profile.update.mockResolvedValue({});

    const match = await analyticsService.logMatch('u1', {
      game: 'Valorant',
      result: 'WIN',
      kills: 10,
      deaths: 5,
      assists: 2,
      accuracy: 50,
    });

    expect(db.matchHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'u1', game: 'Valorant', result: 'WIN', kills: 10, deaths: 5, assists: 2, accuracy: 50 }),
      })
    );
    expect(db.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1' },
        data: expect.objectContaining({ winRate: 50, totalMatches: 2, wins: 1, losses: 1 }),
      })
    );
    expect(match.id).toBe('m1');
  });

  it('rejects a missing game', async () => {
    await expect(analyticsService.logMatch('u1', { result: 'WIN' })).rejects.toBeInstanceOf(ValidationError);
    expect(db.matchHistory.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid result value', async () => {
    await expect(analyticsService.logMatch('u1', { game: 'Valorant', result: 'TIE' })).rejects.toBeInstanceOf(ValidationError);
    expect(db.matchHistory.create).not.toHaveBeenCalled();
  });

  it('normalizes result casing and clamps invalid stats', async () => {
    db.matchHistory.create.mockResolvedValue({ id: 'm1' });
    db.matchHistory.findMany.mockResolvedValue([]);
    db.profile.update.mockResolvedValue({});

    await analyticsService.logMatch('u1', {
      game: 'CS2',
      result: 'loss',
      kills: -3,
      deaths: 999,
      assists: 1.7,
      accuracy: 150,
    });

    expect(db.matchHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ result: 'LOSS', kills: 0, deaths: 999, assists: 1, accuracy: 100 }),
      })
    );
  });

  it('deletes a match owned by the user and recomputes stats', async () => {
    db.matchHistory.findFirst.mockResolvedValue({ id: 'm1', userId: 'u1' });
    db.matchHistory.findMany.mockResolvedValue([]);
    db.profile.update.mockResolvedValue({});

    const result = await analyticsService.deleteMatch('u1', 'm1');

    expect(db.matchHistory.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
    expect(db.profile.update).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('blocks deleting another user’s match', async () => {
    db.matchHistory.findFirst.mockResolvedValue(null);

    await expect(analyticsService.deleteMatch('u1', 'm1')).rejects.toBeInstanceOf(NotFoundError);
    expect(db.matchHistory.delete).not.toHaveBeenCalled();
  });
});
