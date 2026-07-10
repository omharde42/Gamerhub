import { Router } from 'express';
import { newsController } from '../controllers/news.controller';
const router = Router();

router.get('/', newsController.list.bind(newsController));

export default router;
