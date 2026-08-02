import { Router } from 'express';
import { gameRequestController } from '../controllers/game-request.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public: list all approved games (user-submitted, admin-approved)
router.get('/approved', gameRequestController.listApproved.bind(gameRequestController));

// Authenticated user endpoints
router.post('/', authenticate, gameRequestController.create.bind(gameRequestController));
router.get('/my', authenticate, gameRequestController.myRequests.bind(gameRequestController));

// Admin endpoints
router.get('/pending', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), gameRequestController.listPending.bind(gameRequestController));
router.get('/all', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), gameRequestController.listAll.bind(gameRequestController));
router.post('/:id/approve', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), gameRequestController.approve.bind(gameRequestController));
router.post('/:id/reject', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), gameRequestController.reject.bind(gameRequestController));

export default router;
