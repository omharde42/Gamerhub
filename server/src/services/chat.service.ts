import prisma from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export class ChatService {
  async createDirectMessage(userId1: string, userId2: string) {
    // 1. Find any existing 1-to-1 chat between userId1 and userId2
    const existingChats = await prisma.chat.findMany({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: userId1 } } },
          { participants: { some: { userId: userId2 } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, presence: true, updatedAt: true, profile: true },
            },
          },
        },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (existingChats && existingChats.length > 0) {
      return existingChats[0];
    }

    // 2. Otherwise create a single canonical 1-to-1 chat
    return prisma.chat.create({
      data: {
        isGroup: false,
        participants: {
          create: [{ userId: userId1 }, { userId: userId2 }],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, presence: true, updatedAt: true, profile: true },
            },
          },
        },
      },
    });
  }

  async createGroupChat(name: string, userIds: string[]) {
    return prisma.chat.create({
      data: {
        name,
        isGroup: true,
        participants: { create: userIds.map((userId) => ({ userId })) },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, presence: true, updatedAt: true, profile: true } },
          },
        },
      },
    });
  }

  async getUserChats(userId: string) {
    const rawChats = await prisma.chat.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, presence: true, updatedAt: true, profile: true },
            },
          },
        },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Safely deduplicate 1-to-1 conversations in memory for presentation
    // Group 1-to-1 chats by the other participant's userId.
    const seenOtherUserIds = new Set<string>();
    const deduplicatedChats: typeof rawChats = [];

    for (const chat of rawChats) {
      if (chat.isGroup) {
        deduplicatedChats.push(chat);
      } else {
        const otherParticipant = chat.participants.find((p) => p.userId !== userId);
        const otherUserId = otherParticipant?.userId || 'unknown';

        if (!seenOtherUserIds.has(otherUserId)) {
          seenOtherUserIds.add(otherUserId);
          deduplicatedChats.push(chat);
        }
      }
    }

    return deduplicatedChats;
  }

  async getChatMessages(userId: string, chatId: string, page: number = 1, limit: number = 50) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { participants: { where: { userId }, select: { userId: true } } },
    });
    if (!chat) throw new NotFoundError('Chat not found');
    if (chat.participants.length === 0) throw new ForbiddenError('Not a participant in this chat');

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { chatId, isDeleted: false },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sender: { select: { id: true, profile: true } },
          readBy: { include: { user: { select: { id: true, presence: true, updatedAt: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.message.count({ where: { chatId, isDeleted: false } }),
    ]);
    return { data: messages.reverse(), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async sendMessage(
    chatId: string,
    senderId: string,
    data: {
      content?: string;
      media?: string[];
      gif?: string;
      voiceNote?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
    }
  ) {
    const chat = await prisma.chat.findUnique({ where: { id: chatId }, include: { participants: true } });
    if (!chat) throw new NotFoundError('Chat not found');
    const isParticipant = chat.participants.some((p) => p.userId === senderId);
    if (!isParticipant) throw new ForbiddenError('Not a participant in this chat');

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId,
        content: data.content,
        media: data.media || [],
        voiceNote: data.voiceNote,
        gif: data.gif,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
      },
      include: { sender: { select: { id: true, profile: true } } },
    });

    await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
    return message;
  }

  async markAsRead(chatId: string, userId: string) {
    const membership = await prisma.chatParticipant.findFirst({
      where: { chatId, userId },
      select: { id: true },
    });
    if (!membership) throw new ForbiddenError('Not a participant in this chat');

    const unreadMessages = await prisma.message.findMany({
      where: { chatId, senderId: { not: userId }, readBy: { none: { userId } } },
      select: { id: true },
    });
    const ids = unreadMessages.map((m) => m.id);
    for (const msg of unreadMessages) {
      await prisma.messageRead.create({ data: { messageId: msg.id, userId } });
    }
    await prisma.chatParticipant.updateMany({ where: { chatId, userId }, data: { lastReadAt: new Date() } });
    return { markedAsRead: ids.length, messageIds: ids };
  }

  async getUnreadCounts(userId: string) {
    const participants = await prisma.chatParticipant.findMany({
      where: { userId },
      select: {
        chatId: true,
      },
    });

    if (!participants || participants.length === 0) return {};

    // Execute unread counts in parallel using Promise.all to eliminate sequential N+1 latency
    const countResults = await Promise.all(
      participants.map(async (p) => {
        const count = await prisma.message.count({
          where: {
            chatId: p.chatId,
            senderId: { not: userId },
            readBy: { none: { userId } },
          },
        });
        return { chatId: p.chatId, count };
      })
    );

    const counts: Record<string, number> = {};
    for (const res of countResults) {
      if (res.count > 0) counts[res.chatId] = res.count;
    }

    return counts;
  }

  async setTyping(_chatId: string, _userId: string, _isTyping: boolean) {
    return true;
  }
}

export const chatService = new ChatService();
