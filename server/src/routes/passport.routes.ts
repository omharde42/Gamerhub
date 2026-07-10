import { Router } from 'express';
import { passportController } from '../controllers/passport.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { uploadScreenshot } from '../middleware/upload';

const router = Router();

// Public
router.get('/leaderboard', passportController.getLeaderboard.bind(passportController));
router.get('/:username', optionalAuth, passportController.getPassport.bind(passportController));
router.get('/:profileId/endorsements', passportController.getEndorsements.bind(passportController));

// Authenticated - Profile
router.put('/', authenticate, passportController.updatePassport.bind(passportController));

// Authenticated - Games
router.get('/games/search', authenticate, passportController.searchGames.bind(passportController));
router.post('/games', authenticate, passportController.addGame.bind(passportController));
router.put('/games/:id', authenticate, passportController.updateGame.bind(passportController));
router.delete('/games/:id', authenticate, passportController.deleteGame.bind(passportController));

// Authenticated - Skills
router.post('/skills', authenticate, passportController.addSkill.bind(passportController));
router.put('/skills/:id', authenticate, passportController.updateSkill.bind(passportController));
router.delete('/skills/:id', authenticate, passportController.deleteSkill.bind(passportController));

// Authenticated - Endorsements
router.post('/endorse', authenticate, passportController.endorse.bind(passportController));
router.delete('/endorsements/:id', authenticate, passportController.removeEndorsement.bind(passportController));

// Authenticated - Achievements
router.post('/achievements', authenticate, passportController.addAchievement.bind(passportController));
router.delete('/achievements/:id', authenticate, passportController.deleteAchievement.bind(passportController));

// Authenticated - Tournament History
router.post('/tournaments', authenticate, passportController.addTournamentHistory.bind(passportController));
router.delete('/tournaments/:id', authenticate, passportController.deleteTournamentHistory.bind(passportController));

// Authenticated - Certifications
router.post('/certifications', authenticate, passportController.addCertification.bind(passportController));
router.delete('/certifications/:id', authenticate, passportController.deleteCertification.bind(passportController));

// Authenticated - AI
router.post('/generate-summary', authenticate, passportController.generateSummary.bind(passportController));

// Authenticated - Screenshot Upload
router.post('/upload-screenshot', authenticate, uploadScreenshot, passportController.uploadScreenshot.bind(passportController));

export default router;
