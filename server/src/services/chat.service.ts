import prisma from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';
export class ChatService {
  async createDirectMessage(userId1: string, userId2: string) {
    const friendship = await prisma.friendRequest.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
    });

    if (!friendship) {
      throw new ForbiddenError('You can only message users who have accepted your friend request');
    }

    const existingChat = await prisma.chat.findFirst({ where: { isGroup: false, AND: [{ participants: { some: { userId: userId1 } } }, { participants: { some: { userId: userId2 } } }] }, include: { participants: { include: { user: { select: { id: true, profile: true } } } } } });
    if (existingChat) return existingChat;
    return prisma.chat.create({ data: { participants: { create: [{ userId: userId1 }, { userId: userId2 }] } }, include: { participants: { include: { user: { select: { id: true, profile: true } } } } } });
  }
  async createGroupChat(name: string, userIds: string[]) { return prisma.chat.create({ data: { name, isGroup: true, participants: { create: userIds.map(userId => ({ userId })) } }, include: { participants: { include: { user: { select: { id: true, profile: true } } } } } }); }
  async getUserChats(userId: string) { return prisma.chat.findMany({ where: { participants: { some: { userId } } }, include: { participants: { include: { user: { select: { id: true, profile: true } } } }, messages: { take: 1, orderBy: { createdAt: 'desc' } } }, orderBy: { updatedAt: 'desc' } }); }
  async getChatMessages(chatId: string, page: number = 1, limit: number = 50) {
    const [messages, total] = await Promise.all([prisma.message.findMany({ where: { chatId, isDeleted: false }, skip: (page - 1) * limit, take: limit, include: { sender: { select: { id: true, profile: true } }, readBy: true }, orderBy: { createdAt: 'desc' } }), prisma.message.count({ where: { chatId, isDeleted: false } })]);
    return { data: messages.reverse(), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
  async sendMessage(chatId: string, senderId: string, data: any) {
    const chat = await prisma.chat.findUnique({ where: { id: chatId }, include: { participants: true } });
    if (!chat) throw new NotFoundError('Chat not found');
    const isParticipant = chat.participants.some((p: any) => p.userId === senderId);
    if (!isParticipant) throw new ForbiddenError('Not a participant in this chat');

    if (!chat.isGroup) {
      const otherParticipant = chat.participants.find((p: any) => p.userId !== senderId);
      if (otherParticipant) {
        const friendship = await prisma.friendRequest.findFirst({
          where: {
            status: 'ACCEPTED',
            OR: [
              { senderId: senderId, receiverId: otherParticipant.userId },
              { senderId: otherParticipant.userId, receiverId: senderId },
            ],
          },
        });
        if (!friendship) {
          throw new ForbiddenError('You can only message users who have accepted your friend request');
        }
      }
    }

    const message = await prisma.message.create({ data: { chatId, senderId, content: data.content, media: data.media || [], voiceNote: data.voiceNote, gif: data.gif, fileUrl: data.fileUrl, fileName: data.fileName, fileSize: data.fileSize }, include: { sender: { select: { id: true, profile: true } } } });
    await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } }); return message;
  }
  async markAsRead(chatId: string, userId: string) {
    const unreadMessages = await prisma.message.findMany({ where: { chatId, senderId: { not: userId }, readBy: { none: { userId } } } });
    for (const msg of unreadMessages) { await prisma.messageRead.create({ data: { messageId: msg.id, userId } }); }
    await prisma.chatParticipant.updateMany({ where: { chatId, userId }, data: { lastReadAt: new Date() } });
    return { markedAsRead: unreadMessages.length };
  }
  async setTyping(chatId: string, userId: string, isTyping: boolean) {
    if (isTyping) { await prisma.typingIndicator.upsert({ where: { chatId_userId: { chatId, userId } }, update: {}, create: { chatId, userId } }); } else { await prisma.typingIndicator.deleteMany({ where: { chatId, userId } }); }
  }
}
export const chatService = new ChatService();
