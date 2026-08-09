import { Router } from 'express';
import { pubgController } from '../controllers/pubg.controller';

const router = Router();

router.get('/player/:platform/:playerName', pubgController.getPlayer);
router.get('/profile', pubgController.getProfile);
router.post('/connect', pubgController.connect);

export default router;
