import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { videoController } from '../controllers/video.controller';
import { uploadClip, uploadMusic } from '../middleware/upload';

const router = Router();

router.use(authenticate);

// Tier 1 — clips
router.post('/clips/upload', uploadClip, videoController.uploadClip);
router.get('/clips', videoController.listClips);
router.get('/clips/:id', videoController.getClip);
router.post('/clips/:id/trim', videoController.trimClip);
router.post('/clips/:id/highlights', videoController.generateHighlights);
router.delete('/clips/:id', videoController.deleteClip);

// Music for montage audio track
router.post('/music/upload', uploadMusic, videoController.uploadMusic);

// Tier 2 — montage projects
router.post('/projects', videoController.createMontage);
router.get('/projects', videoController.listMontages);
router.get('/projects/:id', videoController.getMontage);
router.put('/projects/:id/edl', videoController.updateMontageEdl);
router.post('/projects/:id/render', videoController.renderMontage);

export default router;