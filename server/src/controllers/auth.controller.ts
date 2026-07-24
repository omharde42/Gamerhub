import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';
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
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new ValidationError({ refreshToken: ['Refresh token is required'] });
    }
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

  socialLogin = asyncHandler(async (req: Request, res: Response) => {
    const { token, provider } = req.body;
    const result = await authService.socialLogin(token, provider);
    sendSuccess(res, result, 'Logged in successfully!');
  });

  googleRedirect = asyncHandler(async (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || '1028691049535-cou454qqcspf45t2h0b2lllkqdsus1bi.apps.googleusercontent.com';

    const originHeader = req.get('origin') || req.get('referer');
    let clientUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (originHeader) {
      try {
        const parsed = new URL(originHeader);
        clientUrl = parsed.origin;
      } catch {}
    }

    const redirectUri = `${clientUrl}/auth/callback`;

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.append('client_id', clientId);
    googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.append('response_type', 'token id_token');
    googleAuthUrl.searchParams.append('scope', 'openid email profile');
    googleAuthUrl.searchParams.append('nonce', 'gamerhub_google_auth');

    res.redirect(googleAuthUrl.toString());
  });

  googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const { email, displayName, avatar, googleId } = req.body;
    const result = await authService.directGoogleLogin(email, displayName, avatar, googleId);
    sendSuccess(res, result, 'Logged in with Google successfully!');
  });

  steamRedirect = asyncHandler(async (req: Request, res: Response) => {
    const host = req.get('host') || 'localhost:4000';
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const returnTo = `${protocol}://${host}/api/auth/steam/callback`;

    const openIdUrl = new URL('https://steamcommunity.com/openid/login');
    openIdUrl.searchParams.append('openid.ns', 'http://specs.openid.net/auth/2.0');
    openIdUrl.searchParams.append('openid.mode', 'checkid_setup');
    openIdUrl.searchParams.append('openid.return_to', returnTo);
    openIdUrl.searchParams.append('openid.realm', `${protocol}://${host}`);
    openIdUrl.searchParams.append('openid.identity', 'http://specs.openid.net/auth/2.0/identifier_select');
    openIdUrl.searchParams.append('openid.claimed_id', 'http://specs.openid.net/auth/2.0/identifier_select');

    res.redirect(openIdUrl.toString());
  });

  steamCallback = asyncHandler(async (req: Request, res: Response) => {
    const claimedId = req.query['openid.claimed_id'] as string;
    const clientUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!claimedId) {
      return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent('Steam authentication was cancelled or failed')}`);
    }

    const matches = claimedId.match(/\/id\/(\d+)/);
    const steamId = matches ? matches[1] : null;

    if (!steamId) {
      return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent('Invalid Steam ID response')}`);
    }

    let personaName = `SteamPlayer_${steamId.slice(-4)}`;
    let avatarUrl = '';

    const steamApiKey = process.env.STEAM_API_KEY;
    if (steamApiKey) {
      try {
        const fetchRes = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamId}`);
        const data = await fetchRes.json();
        const player = data?.response?.players?.[0];
        if (player) {
          personaName = player.personaname || personaName;
          avatarUrl = player.avatarfull || player.avatar || '';
        }
      } catch (err) {
        console.warn('Could not fetch Steam player details:', err);
      }
    }

    const result = await authService.steamLogin(steamId, personaName, avatarUrl);
    res.redirect(`${clientUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`);
  });

  getLinkedAccounts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const accounts = await authService.getLinkedAccounts(req.user!.userId);
    sendSuccess(res, accounts);
  });

  linkAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { provider, providerId, providerUsername } = req.body;
    const account = await authService.linkSocialAccount(req.user!.userId, provider, providerId, providerUsername);
    sendSuccess(res, account, `${provider} account linked successfully!`);
  });

  unlinkAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { provider } = req.body;
    await authService.unlinkSocialAccount(req.user!.userId, provider);
    sendSuccess(res, null, `${provider} account unlinked successfully!`);
  });
}

export const authController = new AuthController();
