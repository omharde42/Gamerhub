import { NotificationService } from './notification.service';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    notification: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

const db = require('../config/database').default as any;

describe('NotificationService', () => {
  const service = new NotificationService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWithDedupe', () => {
    const base = {
      userId: 'user-1',
      type: 'CHALLENGE_COMPLETED' as const,
      title: '⚔️ Challenge Completed',
      message: 'done',
    };

    it('creates a notification when none exists for the dedupe key', async () => {
      db.notification.findFirst.mockResolvedValue(null);
      db.notification.create.mockResolvedValue({ id: 'n1' });

      const result = await service.createWithDedupe(base, 'challenge:c1:CHALLENGE_COMPLETED');

      expect(db.notification.create).toHaveBeenCalledTimes(1);
      expect(db.notification.create.mock.calls[0][0].data.metadata).toMatchObject({
        dedupeKey: 'challenge:c1:CHALLENGE_COMPLETED',
      });
      expect(result.id).toBe('n1');
    });

    it('does not create a duplicate when the same event was processed recently', async () => {
      db.notification.findFirst.mockResolvedValue({ id: 'existing-1' });

      const result = await service.createWithDedupe(base, 'challenge:c1:CHALLENGE_COMPLETED');

      expect(db.notification.create).not.toHaveBeenCalled();
      expect(result.id).toBe('existing-1');
    });

    it('scopes the dedupe lookup to the target user and type', async () => {
      db.notification.findFirst.mockResolvedValue(null);
      db.notification.create.mockResolvedValue({ id: 'n2' });

      await service.createWithDedupe(base, 'challenge:c1:CHALLENGE_COMPLETED');

      const where = db.notification.findFirst.mock.calls[0][0].where;
      expect(where.userId).toBe('user-1');
      expect(where.type).toBe('CHALLENGE_COMPLETED');
      expect(where.metadata).toMatchObject({ path: ['dedupeKey'], equals: 'challenge:c1:CHALLENGE_COMPLETED' });
    });
  });

  describe('user scoping', () => {
    it('only ever reads and updates the authenticated user\u2019s own notifications', async () => {
      db.notification.findMany.mockResolvedValue([]);
      db.notification.count.mockResolvedValue(0);

      await service.getUserNotifications('user-1', 1, 20);
      expect(db.notification.findMany.mock.calls[0][0].where.userId).toBe('user-1');

      await service.markAsRead('n1', 'user-1');
      expect(db.notification.updateMany.mock.calls[0][0].where).toEqual({ id: 'n1', userId: 'user-1' });

      await service.markAllAsRead('user-1');
      expect(db.notification.updateMany.mock.calls[1][0].where).toEqual({ userId: 'user-1', isRead: false });
    });
  });
});
