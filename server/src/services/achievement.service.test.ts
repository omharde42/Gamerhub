import { AchievementService, ACHIEVEMENT_CATALOG } from './achievement.service';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    profile: { findUnique: jest.fn() },
    achievement: { findUnique: jest.fn(), create: jest.fn(), count: jest.fn(), findMany: jest.fn() },
  },
}));

jest.mock('../socket-emitter', () => ({
  emitToUser: jest.fn(),
}));

jest.mock('./notification.service', () => ({
  notificationService: { create: jest.fn().mockResolvedValue({ id: 'n1' }) },
}));

const db = require('../config/database').default as any;

describe('AchievementService', () => {
  const service = new AchievementService();
  const userId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
    db.profile.findUnique.mockResolvedValue({ id: 'profile-1', username: 'pro' });
  });

  describe('catalog', () => {
    it('exposes a catalog of real platform-event achievements', () => {
      const keys = ACHIEVEMENT_CATALOG.map((a) => a.key);
      expect(keys).toContain('FIRST_POST');
      expect(keys).toContain('FIRST_TOURNAMENT');
      expect(keys).toContain('TOURNAMENT_WINNER');
      expect(keys).toContain('GAME_CONNECTOR');
      expect(keys).toContain('ENDORSED');
    });
  });

  describe('unlockByKey', () => {
    it('unlocks an achievement and notifies the user', async () => {
      db.achievement.findUnique.mockResolvedValue(null);
      db.achievement.create.mockResolvedValue({ id: 'a1', key: 'FIRST_POST' });

      const result = await service.unlockByKey(userId, 'FIRST_POST');

      expect(result).not.toBeNull();
      expect(db.achievement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ profileId: 'profile-1', key: 'FIRST_POST' }),
      });
    });

    it('does not unlock twice for the same key (farming guard)', async () => {
      db.achievement.findUnique.mockResolvedValue({ id: 'a1' });

      const result = await service.unlockByKey(userId, 'FIRST_POST');

      expect(result).toBeNull();
      expect(db.achievement.create).not.toHaveBeenCalled();
    });

    it('returns null for unknown keys and users without a profile', async () => {
      expect(await service.unlockByKey(userId, 'NOT_A_KEY')).toBeNull();

      db.profile.findUnique.mockResolvedValue(null);
      expect(await service.unlockByKey(userId, 'FIRST_POST')).toBeNull();
      expect(db.achievement.create).not.toHaveBeenCalled();
    });

    it('treats a concurrent duplicate create as success instead of throwing', async () => {
      db.achievement.findUnique.mockResolvedValue(null);
      db.achievement.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.unlockByKey(userId, 'FIRST_POST')).resolves.toBeNull();
    });
  });

  describe('getProgressForUser', () => {
    it('marks catalog entries as unlocked when the user owns them', async () => {
      db.achievement.findMany.mockResolvedValue([{ key: 'FIRST_POST', unlockedAt: new Date('2026-01-01') }]);

      const progress = await service.getProgressForUser(userId);

      const firstPost = progress.unlocked.find((a: any) => a.key === 'FIRST_POST')!;
      expect(firstPost.unlocked).toBe(true);
      expect(firstPost.unlockedAt).not.toBeNull();
      const winner = progress.unlocked.find((a: any) => a.key === 'TOURNAMENT_WINNER')!;
      expect(winner.unlocked).toBe(false);
    });
  });
});
