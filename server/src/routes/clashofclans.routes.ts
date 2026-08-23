import { Router } from 'express';
import { clashOfClansController } from '../controllers/clashofclans.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/clashofclans/player/:tag - Get live/cached stats for player tag
router.get('/player/:tag', clashOfClansController.getPlayer);

// GET /api/clashofclans/status - Durable one-time tag-change lock state (auth)
router.get('/status', authenticate, clashOfClansController.getStatus);

// POST /api/clashofclans/connect - Connect Clash of Clans account for authenticated user
router.post('/connect', authenticate, clashOfClansController.connectAccount);

export default router;
