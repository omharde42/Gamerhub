import { ChatService } from './chat.service';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import prisma from '../config/database';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    chat: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    chatParticipant: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    messageRead: {
      create: jest.fn(),
    },
    friendRequest: {
      findFirst: jest.fn(),
    },
  },
}));

const db = prisma as any;

describe('ChatService access control', () => {
  const service = new ChatService();
  const userId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getChatMessages', () => {
    it('rejects reading a chat the user is not a participant of', async () => {
      db.chat.findUnique.mockResolvedValue({ participants: [] });

      await expect(service.getChatMessages(userId, 'chat-9')).rejects.toThrow(ForbiddenError);
      // No messages may be fetched when the caller is not a member
      expect(db.message.findMany).not.toHaveBeenCalled();
    });

    it('throws NotFound for a chat that does not exist', async () => {
      db.chat.findUnique.mockResolvedValue(null);

      await expect(service.getChatMessages(userId, 'missing-chat')).rejects.toThrow(NotFoundError);
    });

    it('returns messages when the user is a participant', async () => {
      db.chat.findUnique.mockResolvedValue({ participants: [{ userId }] });
      db.message.findMany.mockResolvedValue([{ id: 'm1' }]);
      db.message.count.mockResolvedValue(1);

      const result = await service.getChatMessages(userId, 'chat-1', 1, 50);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('markAsRead', () => {
    it('rejects marking messages read in a chat the user is not part of', async () => {
      db.chatParticipant.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('chat-9', userId)).rejects.toThrow(ForbiddenError);
      expect(db.message.findMany).not.toHaveBeenCalled();
    });

    it('marks messages read when the user is a participant', async () => {
      db.chatParticipant.findFirst.mockResolvedValue({ id: 'p1' });
      db.message.findMany.mockResolvedValue([]);
      db.chatParticipant.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.markAsRead('chat-1', userId);
      expect(result.markedAsRead).toBe(0);
    });
  });
});
