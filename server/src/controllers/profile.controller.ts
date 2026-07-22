import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import cloudinary from '../config/cloudinary';
import { aiService } from '../services/ai.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';
import { NotFoundError, ValidationError } from '../utils/errors';

export class ProfileController {
  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { username } = req.params;
    const profile = await prisma.profile.findUnique({
      where: { username },
      include: {
        achievements: true,
        certifications: true,
        tournamentHistory: true,
        user: {
          select: {
            id: true,
            createdAt: true,
            _count: {
              select: {
                followers: true,
                following: true,
                posts: true,
              },
            },
          },
        },
      },
    });
    if (!profile) throw new NotFoundError('Profile');

    const [sentCount, receivedCount] = await Promise.all([
      prisma.friendRequest.count({ where: { senderId: profile.userId, status: 'ACCEPTED' } }),
      prisma.friendRequest.count({ where: { receiverId: profile.userId, status: 'ACCEPTED' } }),
    ]);
    const connectionsCount = sentCount + receivedCount;
    const profileViews = Math.floor((profile.kd || 0.0) * 142 + (profile.totalMatches || 0) * 3.5 + 57);

    sendSuccess(res, {
      ...profile,
      connectionsCount,
      profileViews,
    });
  });

  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = req.body;
    const profile = await prisma.profile.update({
      where: { userId: req.user!.userId },
      data,
    });
    sendSuccess(res, profile);
  });

  uploadAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return sendError(res, 400, 'No file uploaded');
    }
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'gamerhub/avatars',
      width: 256,
      height: 256,
      crop: 'fill',
    });
    await prisma.profile.update({
      where: { userId: req.user!.userId },
      data: { avatar: result.secure_url },
    });
    sendSuccess(res, { avatar: result.secure_url });
  });

  uploadBanner = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return sendError(res, 400, 'No file uploaded');
    }
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'gamerhub/banners',
      width: 1200,
      height: 400,
      crop: 'fill',
    });
    await prisma.profile.update({
      where: { userId: req.user!.userId },
      data: { banner: result.secure_url },
    });
    sendSuccess(res, { banner: result.secure_url });
  });

  getProfileAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!profile) throw new NotFoundError('Profile');
    const analysis = await aiService.analyzeProfileForOptimization(profile);
    sendSuccess(res, { profile, analysis });
  });

  searchProfiles = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { q, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const where: any = {};
    
    if (q && (q as string).trim().length > 0) {
      where.OR = [
        { username: { contains: q as string, mode: 'insensitive' as const } },
        { displayName: { contains: q as string, mode: 'insensitive' as const } },
        { bio: { contains: q as string, mode: 'insensitive' as const } },
      ];
    }
    
    // Always exclude current user
    if (req.user?.userId) {
      where.userId = { not: req.user.userId };
    }
    
    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { winRate: 'desc' },
      }),
      prisma.profile.count({ where }),
    ]);
    
    sendSuccess(res, profiles, undefined, 200, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  });
}

export const profileController = new ProfileController();
