import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, username } = req.body;
    const result = await authService.register(email, password, username);
    sendSuccess(res, result, 'Account created successfully!', 201);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    sendSuccess(res, result);
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    sendSuccess(res, result);
  });

  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;
    if (refreshToken) await authService.logout(refreshToken);
    sendSuccess(res, null, 'Logged out successfully');
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await authService.forgotPassword(email);
    sendSuccess(res, null, 'If the email exists, a reset link has been sent.');
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    sendSuccess(res, null, 'Password reset successfully');
  });

  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.query;
    await authService.verifyEmail(token as string);
    sendSuccess(res, null, 'Email verified successfully');
  });

  setupTwoFactor = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.setupTwoFactor(req.user!.userId);
    sendSuccess(res, result);
  });

  verifyTwoFactor = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token } = req.body;
    const result = await authService.verifyTwoFactor(req.user!.userId, token);
    sendSuccess(res, result);
  });

  disableTwoFactor = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token } = req.body;
    await authService.disableTwoFactor(req.user!.userId, token);
    sendSuccess(res, null, '2FA disabled');
  });

  getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { profile: true, subscription: true },
    });
    if (!user) throw new NotFoundError('User');
    const { password, twoFactorSecret, ...safeUser } = user;
    sendSuccess(res, { ...safeUser, hasPassword: !!user.password });
  });

  setPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { password } = req.body;
    await authService.setPassword(req.user!.userId, password);
    sendSuccess(res, null, 'Password set successfully');
  });

  changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user!.userId, currentPassword, newPassword);
    sendSuccess(res, null, 'Password changed. Please log in again.');
  });
}

export const authController = new AuthController();
