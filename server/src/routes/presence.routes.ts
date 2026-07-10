import { Router } from 'express';
import { AuthRequest } from '../types';
import { authenticate } from '../middleware/auth';
import prisma from '../config/database';
const router = Router();

router.put('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { presence } = req.body;
    await prisma.user.update({ where: { id: req.user!.userId }, data: { presence } });
    const { io } = await import('../index');
    io.emit('user:presence', { userId: req.user!.userId, presence });
    res.json({ success: true, data: { presence } });
  } catch (error) { next(error); }
});

export default router;
