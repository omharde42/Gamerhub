import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { Strategy as SteamStrategy } from 'passport-steam';
import { config } from './index';
import prisma from './database';
import { generateToken, generateRefreshToken, sanitizeUser } from '../utils/helpers';

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id }, include: { profile: true } });
    done(null, user);
  } catch (err) { done(err); }
});

const handleOAuth = async (provider: string, profile: any, done: any) => {
  try {
    const { id: providerId, emails, displayName, photos, username } = profile;
    const email = emails?.[0]?.value || `${providerId}@${provider}.user`;
    let account = await prisma.account.findUnique({ where: { provider_providerId: { provider, providerId } }, include: { user: { include: { profile: true } } } });
    if (account) {
      if (account.user.banned) return done(null, false, { message: 'Account banned' });
      const payload = { userId: account.user.id, email: account.user.email, role: account.user.role };
      const accessToken = generateToken(payload);
      const refreshToken = generateRefreshToken(payload);
      await prisma.session.create({ data: { refreshToken, userId: account.user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
      return done(null, { user: sanitizeUser(account.user), accessToken, refreshToken });
    }
    let user = email ? await prisma.user.findUnique({ where: { email } }) : null;
    if (!user) {
      const baseUsername = username || displayName || email.split('@')[0];
      let finalUsername = baseUsername;
      let counter = 0;
      while (await prisma.profile.findUnique({ where: { username: finalUsername } })) { counter++; finalUsername = `${baseUsername}${counter}`; }
      user = await prisma.user.create({
        data: { email, emailVerified: new Date(), profile: { create: { username: finalUsername, displayName: displayName || baseUsername, avatar: photos?.[0]?.value || undefined } }, notificationSettings: { create: {} } },
        include: { profile: true },
      });
    }
    await prisma.account.create({ data: { provider, providerId, providerUsername: displayName || username || email, userId: user.id } });
    if (user.banned) return done(null, false, { message: 'Account banned' });
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await prisma.session.create({ data: { refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    return done(null, { user: sanitizeUser(user), accessToken, refreshToken });
  } catch (err) { done(err, null); }
};

if (config.oauth.google.clientId) {
  passport.use(new GoogleStrategy({ clientID: config.oauth.google.clientId, clientSecret: config.oauth.google.clientSecret, callbackURL: config.oauth.google.callbackUrl, scope: ['profile', 'email'] }, (accessToken, refreshToken, profile, done) => handleOAuth('GOOGLE', profile, done)));
}

if (config.oauth.discord.clientId) {
  passport.use(new DiscordStrategy({ clientID: config.oauth.discord.clientId, clientSecret: config.oauth.discord.clientSecret, callbackURL: config.oauth.discord.callbackUrl, scope: ['identify', 'email'] }, (accessToken, refreshToken, profile, done) => handleOAuth('DISCORD', profile, done)));
}

if (config.oauth.steam.apiKey) {
  passport.use(new SteamStrategy({ apiKey: config.oauth.steam.apiKey, realm: `${config.frontendUrl}/`, returnURL: config.oauth.steam.callbackUrl }, (identifier, profile, done) => handleOAuth('STEAM', profile, done)));
}

export default passport;
