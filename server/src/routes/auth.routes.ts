import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation, twoFactorValidation } from '../validators/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
const router = Router();

router.post('/register', authLimiter, registerValidation, validate, authController.register);
router.post('/login', authLimiter, loginValidation, validate, authController.login);
router.post('/refresh-token', authLimiter, authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, validate, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidation, validate, authController.resetPassword);
router.get('/verify-email', authController.verifyEmail);
router.post('/2fa/setup', authenticate, authController.setupTwoFactor);
router.post('/2fa/verify', authenticate, twoFactorValidation, validate, authController.verifyTwoFactor);
router.post('/2fa/disable', authenticate, authController.disableTwoFactor);
router.get('/me', authenticate, authController.getMe);
router.post('/set-password', authenticate, authController.setPassword);
router.post('/change-password', authenticate, authLimiter, authController.changePassword);

export default router;
