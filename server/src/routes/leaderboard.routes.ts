import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/games', authenticate, leaderboardController.getGames.bind(leaderboardController));
router.get('/:game', authenticate, leaderboardController.getLeaderboard.bind(leaderboardController));

export default router;
