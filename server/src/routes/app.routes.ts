import { Router } from 'express';
import { appController } from '../controllers/app.controller';

const router = Router();

router.get('/version', appController.getVersion);
router.get('/download', appController.downloadApk);

export default router;
