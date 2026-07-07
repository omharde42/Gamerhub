import prisma from '../config/database';
import { hashPassword, comparePassword, generateToken, generateRefreshToken, sanitizeUser } from '../utils/helpers';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../utils/errors';
import { sendEmail } from './email.service';
import { redis } from '../config/redis';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
export class AuthService {
  async anonLogin(username: string) {
    const existingProfile = await prisma.profile.findUnique({ where: { username } });
    let userId: string;
    if (existingProfile) {
      userId = existingProfile.userId;
    } else {
      const user = await prisma.user.create({
        data: { email: `${username}@anon.gamerhub.com`, profile: { create: { username } }, notificationSettings: { create: {} } },
        include: { profile: true },
      });
      userId = user.id;
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } })!;
    const payload = { userId: user!.id, email: user!.email, role: user!.role };
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await prisma.session.create({ data: { refreshToken, userId: user!.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    return { user: sanitizeUser(user!), profile: user!.profile, accessToken, refreshToken };
  }
  async register(email: string, password: string, username: string) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) throw new ConflictError('Email already registered');
    const existingUsername = await prisma.profile.findUnique({ where: { username } });
    if (existingUsername) throw new ConflictError('Username already taken');
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, profile: { create: { username } }, notificationSettings: { create: {} } },
      include: { profile: true },
    });
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await prisma.emailVerificationToken.create({ data: { token: verificationToken, userId: user.id, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
    sendEmail({ to: email, subject: 'Verify your GamerHub email', html: `<p>Click <a href="${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}">here</a> to verify your email.</p>` }).catch(() => {});
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await prisma.session.create({ data: { refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    return { user: sanitizeUser(user), accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
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
  async wipeAll() {
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
  }
}
export const authService = new AuthService();
