import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';
const router = Router();
router.get('/', authenticate, notificationController.getNotifications.bind(notificationController));
router.get('/unread-count', authenticate, notificationController.getUnreadCount.bind(notificationController));
router.post('/:id/read', authenticate, notificationController.markAsRead.bind(notificationController));
router.post('/read-all', authenticate, notificationController.markAllAsRead.bind(notificationController));
export default router;
