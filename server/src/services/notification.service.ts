import prisma from '../config/database';
import { NotificationType } from '@prisma/client';
export class NotificationService {
  async create(data: { userId: string; type: NotificationType; title: string; message?: string; link?: string; image?: string; metadata?: any }) { return prisma.notification.create({ data: { userId: data.userId, type: data.type, title: data.title, message: data.message, link: data.link, image: data.image, metadata: data.metadata || {} } }); }
  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const [notifications, total, unreadCount] = await Promise.all([prisma.notification.findMany({ where: { userId }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }), prisma.notification.count({ where: { userId } }), prisma.notification.count({ where: { userId, isRead: false } })]);
    return { data: notifications, meta: { page, limit, total, unreadCount, totalPages: Math.ceil(total / limit) } };
  }
  async markAsRead(notificationId: string, userId: string) { return prisma.notification.updateMany({ where: { id: notificationId, userId }, data: { isRead: true } }); }
  async markAllAsRead(userId: string) { return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } }); }
  async getUnreadCount(userId: string) { return prisma.notification.count({ where: { userId, isRead: false } }); }
}
export const notificationService = new NotificationService();
