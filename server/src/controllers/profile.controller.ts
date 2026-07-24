import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import cloudinary from '../config/cloudinary';
import { config } from '../config';
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

    let friendshipStatus: 'friends' | 'pending' | null = null;
    if (req.user) {
      const relationship = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId: req.user.userId, receiverId: profile.userId },
            { senderId: profile.userId, receiverId: req.user.userId },
          ],
        },
      });

      if (relationship) {
        if (relationship.status === 'ACCEPTED') {
          friendshipStatus = 'friends';
        } else if (relationship.status === 'PENDING') {
          friendshipStatus = 'pending';
        }
      }
    }

    sendSuccess(res, {
      ...profile,
      connectionsCount,
      profileViews,
      friendshipStatus,
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
      return sendError(res, 400, 'No file uploaded. Please select an image.');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(req.file.mimetype.toLowerCase())) {
      return sendError(res, 400, 'Unsupported file format. Please upload a JPG, JPEG, PNG, or WebP image.');
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return sendError(res, 400, 'Image is too large. Maximum size is 5MB.');
    }

    let avatarUrl = '';

    // 1. Try Cloudinary upload if configured
    if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
      try {
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'gamerhub/avatars',
          width: 512,
          height: 512,
          crop: 'fill',
        });
        if (result && result.secure_url) {
          avatarUrl = result.secure_url;
        }
      } catch (cloudErr) {
        console.warn('Cloudinary avatar upload warning:', cloudErr);
      }
    }

    // 2. Local Disk Storage Fallback if Cloudinary is unconfigured or fails
    if (!avatarUrl) {
      const uploadsDir = path.join(__dirname, '../../public/uploads/avatars');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const ext = path.extname(req.file.originalname) || '.jpg';
      const filename = `avatar_${req.user!.userId}_${Date.now()}${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:4000';
      avatarUrl = `${protocol}://${host}/uploads/avatars/${filename}`;
    }

    const profile = await prisma.profile.update({
      where: { userId: req.user!.userId },
      data: { avatar: avatarUrl },
    });

    sendSuccess(res, { avatar: avatarUrl, profile }, 'Avatar updated successfully');
  });

  uploadBanner = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return sendError(res, 400, 'No file uploaded. Please select an image.');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(req.file.mimetype.toLowerCase())) {
      return sendError(res, 400, 'Unsupported file format. Please upload a JPG, JPEG, PNG, or WebP image.');
    }

    if (req.file.size > 10 * 1024 * 1024) {
      return sendError(res, 400, 'Image is too large. Maximum size is 10MB.');
    }

    let bannerUrl = '';

    if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
      try {
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'gamerhub/banners',
          width: 1200,
          height: 400,
          crop: 'fill',
        });
        if (result && result.secure_url) {
          bannerUrl = result.secure_url;
        }
      } catch (cloudErr) {
        console.warn('Cloudinary banner upload warning:', cloudErr);
      }
    }

    if (!bannerUrl) {
      const uploadsDir = path.join(__dirname, '../../public/uploads/banners');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const ext = path.extname(req.file.originalname) || '.jpg';
      const filename = `banner_${req.user!.userId}_${Date.now()}${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:4000';
      bannerUrl = `${protocol}://${host}/uploads/banners/${filename}`;
    }

    const profile = await prisma.profile.update({
      where: { userId: req.user!.userId },
      data: { banner: bannerUrl },
    });

    sendSuccess(res, { banner: bannerUrl, profile }, 'Banner updated successfully');
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
