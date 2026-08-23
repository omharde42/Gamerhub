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
import { VIEW_WINDOW_MS, hashIp } from '../utils/views';
import { mediaStorageService } from '../utils/storage';
import { sanitizeProfileUpdate } from '../utils/profile-allowlist';

export class ProfileController {
  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { username } = req.params;
    const profile = await prisma.profile.findUnique({
      where: { username },
      include: {
        achievements: true,
        certifications: true,
        tournamentHistory: true,
        _count: { select: { views: true } },
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

    // Real view tracking: record one deduped view per viewer (or IP for
    // anonymous visitors) per 24h window. Own profile views are not counted.
    const viewerId = req.user?.userId ?? undefined;
    if (viewerId !== profile.userId) {
      const viewerIp = viewerId ? undefined : hashIp(req.ip || req.socket?.remoteAddress || '');
      const since = new Date(Date.now() - VIEW_WINDOW_MS);
      const existing = await prisma.profileView.findFirst({
        where: viewerId
          ? { profileId: profile.id, viewerId, createdAt: { gte: since } }
          : viewerIp
            ? { profileId: profile.id, viewerIp, createdAt: { gte: since } }
            : { profileId: profile.id },
        select: { id: true },
      });
      if (!existing) {
        await prisma.profileView.create({
          data: viewerId
            ? { profileId: profile.id, viewerId }
            : viewerIp
              ? { profileId: profile.id, viewerIp }
              : { profileId: profile.id },
        });
      }
    }

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
      profileViews: profile._count.views,
      friendshipStatus,
    });
  });

  /**
   * PUT /api/profiles
   *
   * Strict allowlist — a user may only update their own editable profile
   * fields. Server-owned fields (gamerScore, skillScore, competitiveScore,
   * communicationScore, leadershipScore, teamworkScore, improvementRate,
   * winRate, kd, accuracy, totalMatches, wins, losses, rankScore, rank,
   * verified, toxicityScore, and any game-verification/statistics fields) are
   * rejected with a validation error — clients can never write them, even by
   * accident or direct API call.
   */
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = req.body || {};
    const { data } = sanitizeProfileUpdate(body);

    const profile = await prisma.profile.update({
      where: { userId: req.user!.userId },
      data,
    });
    sendSuccess(res, profile, 'Profile updated successfully');
  });

  uploadAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
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

    const result = await mediaStorageService.uploadMedia(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'avatars'
    );
    const avatarUrl = result.url;

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

    const result = await mediaStorageService.uploadMedia(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'banners'
    );
    const bannerUrl = result.url;

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
