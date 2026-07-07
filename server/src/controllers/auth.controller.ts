import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';
import { ValidationError } from '../utils/errors';
import prisma from '../config/database';
export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) { try { const { email, password, username } = req.body; const result = await authService.register(email, password, username); res.status(201).json({ success: true, message: 'Registration successful. Please verify your email.', data: result }); } catch (error) { next(error); } }
  async login(req: Request, res: Response, next: NextFunction) { try { const { email, password } = req.body; const result = await authService.login(email, password); res.json({ success: true, data: result }); } catch (error) { next(error); } }
  async firebaseLogin(req: Request, res: Response, next: NextFunction) { try { const { idToken } = req.body; if (!idToken) throw new ValidationError({ idToken: ['ID token is required'] }); const result = await authService.firebaseLogin(idToken); res.json({ success: true, data: result }); } catch (error) { next(error); } }
  async refreshToken(req: Request, res: Response, next: NextFunction) { try { const { refreshToken } = req.body; const result = await authService.refreshToken(refreshToken); res.json({ success: true, data: result }); } catch (error) { next(error); } }
  async logout(req: AuthRequest, res: Response, next: NextFunction) { try { const { refreshToken } = req.body; if (refreshToken) await authService.logout(refreshToken); res.json({ success: true, message: 'Logged out successfully' }); } catch (error) { next(error); } }
  async forgotPassword(req: Request, res: Response, next: NextFunction) { try { const { email } = req.body; await authService.forgotPassword(email); res.json({ success: true, message: 'If the email exists, a reset link has been sent.' }); } catch (error) { next(error); } }
  async resetPassword(req: Request, res: Response, next: NextFunction) { try { const { token, password } = req.body; await authService.resetPassword(token, password); res.json({ success: true, message: 'Password reset successfully' }); } catch (error) { next(error); } }
  async verifyEmail(req: Request, res: Response, next: NextFunction) { try { const { token } = req.query; await authService.verifyEmail(token as string); res.json({ success: true, message: 'Email verified successfully' }); } catch (error) { next(error); } }
  async setupTwoFactor(req: AuthRequest, res: Response, next: NextFunction) { try { const result = await authService.setupTwoFactor(req.user!.userId); res.json({ success: true, data: result }); } catch (error) { next(error); } }
  async verifyTwoFactor(req: AuthRequest, res: Response, next: NextFunction) { try { const { token } = req.body; const result = await authService.verifyTwoFactor(req.user!.userId, token); res.json({ success: true, data: result }); } catch (error) { next(error); } }
  async disableTwoFactor(req: AuthRequest, res: Response, next: NextFunction) { try { const { token } = req.body; await authService.disableTwoFactor(req.user!.userId, token); res.json({ success: true, message: '2FA disabled' }); } catch (error) { next(error); } }
  async getMe(req: AuthRequest, res: Response, next: NextFunction) { try { const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { profile: true, subscription: true } }); res.json({ success: true, data: user }); } catch (error) { next(error); } }
}
export const authController = new AuthController();
