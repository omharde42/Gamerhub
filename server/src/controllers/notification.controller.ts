import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { notificationService } from '../services/notification.service';
export class NotificationController {
  async getNotifications(req: AuthRequest, res: Response, next: NextFunction) { try { const { page } = req.query; const result = await notificationService.getUserNotifications(req.user!.userId, page ? parseInt(page as string) : undefined); res.json({ success: true, ...result }); } catch (error) { next(error); } }
  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) { try { await notificationService.markAsRead(req.params.id, req.user!.userId); res.json({ success: true }); } catch (error) { next(error); } }
  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) { try { await notificationService.markAllAsRead(req.user!.userId); res.json({ success: true }); } catch (error) { next(error); } }
  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) { try { const count = await notificationService.getUnreadCount(req.user!.userId); res.json({ success: true, data: { count } }); } catch (error) { next(error); } }
}
export const notificationController = new NotificationController();
