import { Router } from 'express';
import { steamController } from '../controllers/steam.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/user/:userId', steamController.getSteamProfile);
router.get('/steamid/:steamId', steamController.getSteamProfileBySteamId);
router.post('/disconnect', authenticate, steamController.disconnectSteam);

export default router;
