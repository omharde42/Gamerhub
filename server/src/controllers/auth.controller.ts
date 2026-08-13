import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { config } from '../config';
import { NotFoundError, ValidationError } from '../utils/errors';
import { verifySteamOpenIdResponse, SteamOpenIdParams, signOAuthState, verifyOAuthState, OAuthStatePayload } from '../utils/oauth';
import crypto from 'crypto';
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

    clientUrl = clientUrl.replace(/\/+$/, '');
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

  steamRedirect = asyncHandler(async (_req: Request, res: Response) => {
    // Callback URL is built from configuration, never from the Host header,
    // so attackers cannot steer the OpenID flow to their own domain.
    const returnTo = `${config.apiUrl}/api/auth/steam/callback`;

    const openIdUrl = new URL('https://steamcommunity.com/openid/login');
    openIdUrl.searchParams.append('openid.ns', 'http://specs.openid.net/auth/2.0');
    openIdUrl.searchParams.append('openid.mode', 'checkid_setup');
    openIdUrl.searchParams.append('openid.return_to', returnTo);
    openIdUrl.searchParams.append('openid.realm', config.frontendUrl);
    openIdUrl.searchParams.append('openid.identity', 'http://specs.openid.net/auth/2.0/identifier_select');
    openIdUrl.searchParams.append('openid.claimed_id', 'http://specs.openid.net/auth/2.0/identifier_select');

    res.redirect(openIdUrl.toString());
  });

  steamCallback = asyncHandler(async (req: Request, res: Response) => {
    const clientUrl = config.frontendUrl;
    const expectedReturnTo = `${config.apiUrl}/api/auth/steam/callback`;

    // The OpenID response must be validated against Steam (check_authentication).
    // Without this, an attacker can forge openid.claimed_id and log in as any
    // Steam user (authentication bypass).
    const responseValid = await verifySteamOpenIdResponse(req.query as SteamOpenIdParams, expectedReturnTo);
    if (!responseValid) {
      return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent('Steam authentication failed: invalid OpenID response')}`);
    }

    const claimedId = (req.query['openid.claimed_id'] as string) || '';
    const matches = claimedId.match(/\/id\/(\d{17,19})/);
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

  discordRedirect = asyncHandler(async (_req: Request, res: Response) => {
    // Login flow only. Account linking goes through the authenticated
    // POST /auth/discord/link endpoint (see discordLinkInitiate) — the old
    // query-driven `?action=link&userId=` flow let an attacker link their own
    // Discord account to a victim's account and then log in as the victim.
    const clientUrl = config.frontendUrl;
    const clientId = config.discord.clientId || process.env.DISCORD_CLIENT_ID;
    const redirectUri = config.discord.redirectUri || `${config.apiUrl}/api/auth/discord/callback`;

    // Signed state so the callback can trust action/nonce values.
    const statePayload: OAuthStatePayload = { action: 'login', nonce: crypto.randomBytes(16).toString('hex'), iat: Date.now() };
    const state = signOAuthState(statePayload, config.jwt.secret);

    if (!clientId) {
      // In dev or when Client ID is unconfigured, fallback gracefully so local testing never breaks
      const mockDiscordId = `discord_dev_${Date.now()}`;
      const mockProfile = {
        id: mockDiscordId,
        username: `DiscordDev_${mockDiscordId.slice(-4)}`,
        globalName: `Discord Dev User`,
        avatar: `https://cdn.discordapp.com/embed/avatars/0.png`,
        email: `discord_dev@gamerhub.local`,
      };

      const result = await authService.discordLogin(mockProfile);
      return res.redirect(`${clientUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`);
    }

    const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize');
    discordAuthUrl.searchParams.append('client_id', clientId);
    discordAuthUrl.searchParams.append('redirect_uri', redirectUri);
    discordAuthUrl.searchParams.append('response_type', 'code');
    discordAuthUrl.searchParams.append('scope', 'identify email');
    discordAuthUrl.searchParams.append('state', state);

    res.redirect(discordAuthUrl.toString());
  });

  discordLinkInitiate = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Authenticated initiation of the Discord linking flow. The signed state
    // binds the link to the CURRENT authenticated user, so a victim's userId
    // can never be injected into the flow by an attacker.
    const clientId = config.discord.clientId || process.env.DISCORD_CLIENT_ID;
    const redirectUri = config.discord.redirectUri || `${config.apiUrl}/api/auth/discord/callback`;

    if (!clientId) {
      // Dev fallback: link a mock Discord identity directly.
      const mockDiscordId = `discord_dev_${Date.now()}`;
      const mockProfile = {
        id: mockDiscordId,
        username: `DiscordDev_${mockDiscordId.slice(-4)}`,
        globalName: 'Discord Dev User',
        avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
        email: 'discord_dev@gamerhub.local',
      };
      await authService.linkDiscordAccount(req.user!.userId, mockProfile);
      return sendSuccess(res, { linked: true }, 'Discord account linked successfully (dev mock)');
    }

    const statePayload: OAuthStatePayload = {
      action: 'link',
      userId: req.user!.userId,
      nonce: crypto.randomBytes(16).toString('hex'),
      iat: Date.now(),
    };
    const state = signOAuthState(statePayload, config.jwt.secret);

    const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize');
    discordAuthUrl.searchParams.append('client_id', clientId);
    discordAuthUrl.searchParams.append('redirect_uri', redirectUri);
    discordAuthUrl.searchParams.append('response_type', 'code');
    discordAuthUrl.searchParams.append('scope', 'identify email');
    discordAuthUrl.searchParams.append('state', state);

    sendSuccess(res, { url: discordAuthUrl.toString() });
  });

  discordCallback = asyncHandler(async (req: Request, res: Response) => {
    const { code, state, error, error_description } = req.query;
    const clientUrl = config.frontendUrl;

    if (error || !code) {
      const errorMsg = (error_description as string) || (error as string) || 'Discord authentication was cancelled or failed';
      return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent(errorMsg)}`);
    }

    // Only trust a state that carries a valid HMAC signature from this server;
    // an unsigned/tampered/expired state is treated as a login (no userId) and
    // can never trigger an account link.
    let action = 'login';
    let userId = '';

    if (state && typeof state === 'string') {
      const verifiedState = verifyOAuthState(state, config.jwt.secret);
      if (verifiedState) {
        action = verifiedState.action || 'login';
        userId = verifiedState.userId || '';
      } else {
        console.warn('Discord OAuth state failed verification; ignoring it');
      }
    }

    try {
      const clientId = config.discord.clientId || process.env.DISCORD_CLIENT_ID || '';
      const clientSecret = config.discord.clientSecret || process.env.DISCORD_CLIENT_SECRET || '';
      // Must match the redirect_uri used when building the authorize URL.
      const redirectUri = config.discord.redirectUri || `${config.apiUrl}/api/auth/discord/callback`;

      // 1. Exchange code for access token
      const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description || 'Failed to exchange Discord authorization code');
      }

      // 2. Fetch Discord user profile
      const userRes = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const discordUser = await userRes.json();
      if (!userRes.ok || !discordUser.id) {
        throw new Error('Failed to fetch Discord user profile');
      }

      const profile = {
        id: discordUser.id,
        username: discordUser.username,
        globalName: discordUser.global_name || discordUser.username,
        avatar: discordUser.avatar,
        email: discordUser.email,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      };

      if (action === 'link' && userId) {
        await authService.linkDiscordAccount(userId, profile);
        return res.redirect(`${clientUrl}/profile/settings?linked=discord`);
      } else {
        const result = await authService.discordLogin(profile);
        return res.redirect(`${clientUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`);
      }
    } catch (err: any) {
      console.error('Discord callback error:', err);
      return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent(err.message || 'Discord authentication failed')}`);
    }
  });

  discordDisconnect = asyncHandler(async (req: AuthRequest, res: Response) => {
    await authService.unlinkDiscordAccount(req.user!.userId);
    sendSuccess(res, null, 'Discord account unlinked successfully');
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
