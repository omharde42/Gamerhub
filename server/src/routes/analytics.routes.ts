import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';
const router = Router();
router.get('/stats', authenticate, analyticsController.getStats.bind(analyticsController));
router.get('/heatmap', authenticate, analyticsController.getHeatmap.bind(analyticsController));
router.get('/weekly-progress', authenticate, analyticsController.getWeeklyProgress.bind(analyticsController));
export default router;
