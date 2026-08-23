import { Router } from 'express';
import { compareController } from '../controllers/compare.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/games', authenticate, compareController.getCommonGames);
router.get('/:gameId/leaderboard', authenticate, compareController.getLeaderboard);
router.get('/:gameId/versus/:friendId', authenticate, compareController.getVersus);
router.patch('/privacy', authenticate, compareController.updatePrivacy);

export default router;
