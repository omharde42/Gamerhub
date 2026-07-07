import { Router } from 'express';
import { matchmakingController } from '../controllers/matchmaking.controller';
import { authenticate } from '../middleware/auth';
const router = Router();
router.get('/recommendations', authenticate, matchmakingController.getRecommendations.bind(matchmakingController));
export default router;
