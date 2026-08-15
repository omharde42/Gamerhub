import { Router } from 'express';
import { partnershipController } from '../controllers/partnership.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public program info (no auth needed — no private data).
router.get('/program', partnershipController.getProgramInfo.bind(partnershipController));

// User-facing
router.post('/apply', authenticate, partnershipController.apply.bind(partnershipController));
router.get('/my', authenticate, partnershipController.getMyApplications.bind(partnershipController));
router.get('/my/:id', authenticate, partnershipController.getApplication.bind(partnershipController));

// Admin review
router.get('/admin', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), partnershipController.getApplicationsForAdmin.bind(partnershipController));
router.post('/admin/:id/review', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), partnershipController.reviewApplication.bind(partnershipController));

export default router;
