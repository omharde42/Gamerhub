import { Router } from 'express';
import { organizationController } from '../controllers/organization.controller';
import { authenticate } from '../middleware/auth';
const router = Router();
router.get('/', authenticate, organizationController.list.bind(organizationController));
router.get('/:slug', authenticate, organizationController.getBySlug.bind(organizationController));
router.post('/', authenticate, organizationController.create.bind(organizationController));
export default router;
