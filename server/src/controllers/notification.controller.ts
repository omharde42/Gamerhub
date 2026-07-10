import { Response } from 'express';
import { AuthRequest } from '../types';
import { notificationService } from '../services/notification.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class NotificationController {
  getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page } = req.query;
    const result = await notificationService.getUserNotifications(
      req.user!.userId,
      page ? parseInt(page as string) : undefined,
    );
    sendSuccess(res, result.data, undefined, 200, result.meta);
  });

  markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    await notificationService.markAsRead(req.params.id, req.user!.userId);
    sendSuccess(res, null);
  });

  markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    await notificationService.markAllAsRead(req.user!.userId);
    sendSuccess(res, null);
  });

  getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!.userId);
    sendSuccess(res, { count });
  });
}

export const notificationController = new NotificationController();
