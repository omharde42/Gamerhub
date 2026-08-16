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
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    chatMessageReaction: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
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

  describe('editMessage', () => {
    it('rejects editing a message the user did not send', async () => {
      db.chatParticipant.findFirst.mockResolvedValue({ id: 'p1' });
      db.message.findFirst.mockResolvedValue(null);

      await expect(service.editMessage('chat-1', 'm1', userId, 'new text')).rejects.toThrow(NotFoundError);
      expect(db.message.update).not.toHaveBeenCalled();
    });

    it('edits an owned message and flags isEdited', async () => {
      db.chatParticipant.findFirst.mockResolvedValue({ id: 'p1' });
      db.message.findFirst.mockResolvedValue({ id: 'm1', senderId: userId });
      db.message.update.mockResolvedValue({ id: 'm1', content: 'new text', isEdited: true });

      const result = await service.editMessage('chat-1', 'm1', userId, '  new text  ');
      expect(db.message.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: { content: 'new text', isEdited: true },
        include: expect.anything(),
      });
      expect(result.isEdited).toBe(true);
    });
  });

  describe('deleteMessage', () => {
    it('rejects deleting a message the user did not send', async () => {
      db.chatParticipant.findFirst.mockResolvedValue({ id: 'p1' });
      db.message.findFirst.mockResolvedValue(null);

      await expect(service.deleteMessage('chat-1', 'm1', userId)).rejects.toThrow(NotFoundError);
      expect(db.message.update).not.toHaveBeenCalled();
    });

    it('soft-deletes an owned message and clears content', async () => {
      db.chatParticipant.findFirst.mockResolvedValue({ id: 'p1' });
      db.message.findFirst.mockResolvedValue({ id: 'm1', senderId: userId });
      db.message.update.mockResolvedValue({ id: 'm1', isDeleted: true });

      const result = await service.deleteMessage('chat-1', 'm1', userId);
      expect(db.message.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: expect.objectContaining({ isDeleted: true, content: null }),
      });
      expect(result.isDeleted).toBe(true);
    });
  });

  describe('toggleReaction', () => {
    it('adds a reaction when none exists and removes it on toggle-back', async () => {
      db.chatParticipant.findFirst.mockResolvedValue({ id: 'p1' });
      db.message.findFirst.mockResolvedValue({ id: 'm1' });
      db.chatMessageReaction.findUnique.mockResolvedValueOnce(null);
      db.chatMessageReaction.create.mockResolvedValue({ id: 'r1', emoji: '🔥' });

      const added = await service.toggleReaction('chat-1', 'm1', userId, '🔥');
      expect(added.reacted).toBe(true);
      expect(db.chatMessageReaction.create).toHaveBeenCalled();

      db.chatMessageReaction.findUnique.mockResolvedValueOnce({ id: 'r1' });
      db.chatMessageReaction.delete.mockResolvedValue({ id: 'r1' });
      const removed = await service.toggleReaction('chat-1', 'm1', userId, '🔥');
      expect(removed.reacted).toBe(false);
      expect(db.chatMessageReaction.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
    });
  });

  describe('setPinned', () => {
    it('rejects pinning a message in a chat the user is not part of', async () => {
      db.chatParticipant.findFirst.mockResolvedValue(null);

      await expect(service.setPinned('chat-9', 'm1', userId, true)).rejects.toThrow(ForbiddenError);
      expect(db.message.update).not.toHaveBeenCalled();
    });

    it('pins an existing message', async () => {
      db.chatParticipant.findFirst.mockResolvedValue({ id: 'p1' });
      db.message.findFirst.mockResolvedValue({ id: 'm1' });
      db.message.update.mockResolvedValue({ id: 'm1', isPinned: true });

      const result = await service.setPinned('chat-1', 'm1', userId, true);
      expect(db.message.update).toHaveBeenCalledWith({ where: { id: 'm1' }, data: { isPinned: true } });
      expect(result.isPinned).toBe(true);
    });
  });

  describe('searchMessages', () => {
    it('rejects searching a chat the user is not part of', async () => {
      db.chatParticipant.findFirst.mockResolvedValue(null);

      await expect(service.searchMessages('chat-9', userId, 'valorant')).rejects.toThrow(ForbiddenError);
    });

    it('searches only non-deleted messages with a query filter', async () => {
      db.chatParticipant.findFirst.mockResolvedValue({ id: 'p1' });
      db.message.findMany.mockResolvedValue([{ id: 'm1', content: 'valorant scrim' }]);
      db.message.count.mockResolvedValue(1);

      const result = await service.searchMessages('chat-1', userId, 'valorant');
      expect(db.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isDeleted: false, content: { contains: 'valorant', mode: 'insensitive' } }) })
      );
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
