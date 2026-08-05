import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Dashboard & Metrics
router.get('/dashboard', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'MODERATOR'), adminController.getDashboardStats.bind(adminController));

// User Management Actions
router.get('/users', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'MODERATOR'), adminController.getUsers.bind(adminController));
router.put('/users/:id/role', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), adminController.updateUserRole.bind(adminController));
router.post('/users/:id/verify', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'MODERATOR'), adminController.verifyUser.bind(adminController));
router.delete('/users/:id/delete', authenticate, authorize('SUPER_ADMIN'), adminController.deleteUser.bind(adminController));
router.post('/users/:id/ban', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'MODERATOR'), adminController.banUser.bind(adminController));
router.post('/users/:id/unban', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'MODERATOR'), adminController.unbanUser.bind(adminController));

// Moderation & Reports
router.get('/reports', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'MODERATOR'), adminController.getReports.bind(adminController));
router.post('/reports/:id/resolve', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'MODERATOR'), adminController.resolveReport.bind(adminController));

// Game API Integration Controls
router.get('/game-apis', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), adminController.getGameApiStats.bind(adminController));
router.post('/game-apis/sync', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), adminController.triggerApiSync.bind(adminController));

// System Audit Logs
router.get('/audit-logs', authenticate, authorize('SUPER_ADMIN'), adminController.getAuditLogs.bind(adminController));

export default router;
