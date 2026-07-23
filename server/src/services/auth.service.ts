import prisma from '../config/database';
import { hashPassword, comparePassword, generateToken, generateRefreshToken, sanitizeUser } from '../utils/helpers';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../utils/errors';
import { sendEmail } from './email.service';
import { redis } from '../config/redis';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
export class AuthService {
  async register(email: string, password: string, username: string) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) throw new ConflictError('Email already registered');
    const existingUsername = await prisma.profile.findUnique({ where: { username } });
    if (existingUsername) throw new ConflictError('Username already taken');
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, emailVerified: new Date(), profile: { create: { username } }, notificationSettings: { create: {} } },
      include: { profile: true },
    });
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await prisma.session.create({ data: { refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    return { user: sanitizeUser(user), accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true, subscription: true },
    });
    if (!user) throw new UnauthorizedError('Invalid credentials');
    if (!user.password) throw new UnauthorizedError('Account uses OAuth. Please sign in with Google, Discord, or Steam.');
    const isValid = await comparePassword(password, user.password);
    if (!isValid) throw new UnauthorizedError('Invalid credentials');
    if (user.banned) throw new UnauthorizedError(`Account banned: ${user.banReason || 'No reason provided'}`);
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await prisma.session.create({ data: { refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    return { user: sanitizeUser(user), accessToken, refreshToken, requiresTwoFactor: user.isTwoFactorEnabled };
  }

  async refreshToken(token: string) {
    const session = await prisma.session.findUnique({ where: { refreshToken: token }, include: { user: true } });
    if (!session || session.expiresAt < new Date()) { if (session) await prisma.session.delete({ where: { id: session.id } }); throw new UnauthorizedError('Invalid or expired refresh token'); }
    const payload = { userId: session.user.id, email: session.user.email, role: session.user.role };
    const accessToken = generateToken(payload);
    const newRefreshToken = generateRefreshToken(payload);
    await prisma.session.update({ where: { id: session.id }, data: { refreshToken: newRefreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string) { await prisma.session.deleteMany({ where: { refreshToken } }); }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;
    const resetToken = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({ data: { token: resetToken, userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
    await sendEmail({ to: email, subject: 'Reset your GamerHub password', html: `<p>Click <a href="${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}">here</a> to reset your password. This link expires in 1 hour.</p>` });
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.expiresAt < new Date()) throw new ValidationError({ token: ['Invalid or expired reset token'] });
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashedPassword } });
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    await prisma.session.deleteMany({ where: { userId: resetToken.userId } });
  }

  async verifyEmail(token: string) {
    const verificationToken = await prisma.emailVerificationToken.findUnique({ where: { token } });
    if (!verificationToken || verificationToken.expiresAt < new Date()) throw new ValidationError({ token: ['Invalid or expired verification token'] });
    await prisma.user.update({ where: { id: verificationToken.userId }, data: { emailVerified: new Date() } });
    await prisma.emailVerificationToken.delete({ where: { id: verificationToken.id } });
  }

  async setupTwoFactor(userId: string) {
    const secret = speakeasy.generateSecret({ name: 'GamerHub' });
    await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret.base32 } });
    return { secret: secret.base32, otpauthUrl: secret.otpauth_url };
  }

  async verifyTwoFactor(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) throw new ValidationError({ token: ['2FA not set up'] });
    const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token });
    if (!verified) throw new ValidationError({ token: ['Invalid 2FA token'] });
    await prisma.user.update({ where: { id: userId }, data: { isTwoFactorEnabled: true } });
    return { verified: true };
  }

  async setPassword(userId: string, password: string) {
    if (!password || password.length < 6) throw new ValidationError({ password: ['Password must be at least 6 characters'] });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');
    if (user.password) throw new ValidationError({ password: ['User already has a password. Use change password instead.'] });
    const hashedPassword = await hashPassword(password);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) throw new ValidationError({ password: ['New password must be at least 6 characters'] });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');
    if (!user.password) throw new ValidationError({ password: ['No password set. Use set password instead.'] });
    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) throw new UnauthorizedError('Current password is incorrect');
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
    await prisma.session.deleteMany({ where: { userId } });
  }

  async disableTwoFactor(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) throw new ValidationError({ token: ['2FA not set up'] });
    const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token });
    if (!verified) throw new ValidationError({ token: ['Invalid 2FA token'] });
    await prisma.user.update({ where: { id: userId }, data: { isTwoFactorEnabled: false, twoFactorSecret: null } });
  }

  async socialLogin(supabaseToken: string, providerName: string) {
    if (!supabaseToken) {
      throw new ValidationError({ token: ['Supabase token is required'] });
    }

    let decoded: any;
    try {
      const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'dev-jwt-secret-change-in-production';
      const jwt = await import('jsonwebtoken');
      decoded = jwt.verify(supabaseToken, jwtSecret);
    } catch (err: any) {
      throw new UnauthorizedError('Invalid or expired Supabase authentication token');
    }

    const { email, sub: providerId, user_metadata } = decoded;

    if (!email) {
      throw new ValidationError({ email: ['Supabase token payload does not contain an email'] });
    }

    // Map provider name to our AccountProvider enum
    let provider: any;
    const normProvider = providerName.toUpperCase();
    if (normProvider.includes('GOOGLE')) provider = 'GOOGLE';
    else if (normProvider.includes('DISCORD')) provider = 'DISCORD';
    else if (normProvider.includes('STEAM')) provider = 'STEAM';
    else if (normProvider.includes('APPLE')) provider = 'APPLE';
    else provider = 'GOOGLE'; // default fallback

    // 1. Check if Account mapping already exists
    let account = await prisma.account.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
      include: {
        user: {
          include: {
            profile: true,
            subscription: true,
          },
        },
      },
    });

    let user: any;

    if (account) {
      user = account.user;
    } else {
      // 2. Check if a User with the same email already exists
      user = await prisma.user.findUnique({
        where: { email },
        include: {
          profile: true,
          subscription: true,
        },
      });

      if (user) {
        // Link the existing user to the new social account
        await prisma.account.create({
          data: {
            provider,
            providerId,
            providerUsername: user_metadata?.full_name || user_metadata?.name || null,
            userId: user.id,
          },
        });
      } else {
        // 3. Create a brand new user
        // Generate a clean, unique username from email
        const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        let username = `${emailPrefix}${randomNum}`;

        // Ensure username uniqueness
        let existingUser = await prisma.profile.findUnique({ where: { username } });
        while (existingUser) {
          username = `${emailPrefix}${Math.floor(1000 + Math.random() * 9000)}`;
          existingUser = await prisma.profile.findUnique({ where: { username } });
        }

        const avatarUrl = user_metadata?.avatar_url || user_metadata?.picture || null;

        user = await prisma.user.create({
          data: {
            email,
            emailVerified: new Date(),
            profile: {
              create: {
                username,
                displayName: user_metadata?.full_name || user_metadata?.name || username,
                avatar: avatarUrl,
              },
            },
            notificationSettings: {
              create: {},
            },
            accounts: {
              create: {
                provider,
                providerId,
                providerUsername: user_metadata?.full_name || user_metadata?.name || null,
              },
            },
          },
          include: {
            profile: true,
            subscription: true,
          },
        });
      }
    }

    if (user.banned) {
      throw new UnauthorizedError(`Account banned: ${user.banReason || 'No reason provided'}`);
    }

    // 4. Generate our standard app access/refresh tokens
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.session.create({
      data: {
        refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
      requiresTwoFactor: false,
    };
  }
}
export const authService = new AuthService();
