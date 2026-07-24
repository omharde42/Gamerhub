import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../types';
import { postService } from '../services/post.service';
import { io } from '../index';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import cloudinary from '../config/cloudinary';
import { config } from '../config';

export class PostController {
  uploadMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return sendError(res, 400, 'No files uploaded. Please select an image or video.');
    }

    const uploadPromises = files.map(async (file, idx) => {
      let mediaUrl = '';

      // 1. Try Cloudinary if configured
      if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
        try {
          const b64 = Buffer.from(file.buffer).toString('base64');
          const dataURI = `data:${file.mimetype};base64,${b64}`;
          const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'gamerhub/posts',
            resource_type: 'auto',
          });
          if (result && result.secure_url) {
            mediaUrl = result.secure_url;
          }
        } catch (cloudErr) {
          console.warn('Cloudinary post media upload warning:', cloudErr);
        }
      }

      // 2. Disk Storage Fallback if Cloudinary is unconfigured or fails
      if (!mediaUrl) {
        const uploadsDir = path.join(__dirname, '../../public/uploads/posts');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const ext = path.extname(file.originalname) || '.jpg';
        const filename = `post_${req.user?.userId || 'user'}_${Date.now()}_${idx}${ext}`;
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, file.buffer);

        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        const host = req.get('host') || 'localhost:4000';
        mediaUrl = `${protocol}://${host}/uploads/posts/${filename}`;
      }

      return mediaUrl;
    });

    const urls = await Promise.all(uploadPromises);
    sendSuccess(res, { urls }, 'Media uploaded successfully');
  });

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const post = await postService.create(req.body, req.user!.userId);
    io.emit('post:new', post);
    sendSuccess(res, post, undefined, 201);
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, hashtag, userId, following } = req.query;
    const result = await postService.list({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      hashtag: hashtag as string,
      userId: userId as string,
      following: following as string,
    });
    sendSuccess(res, result.data, undefined, 200, result.meta);
  });

  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const post = await postService.getById(req.params.id);
    if (!post) throw new NotFoundError('Post');
    sendSuccess(res, post);
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    await postService.delete(req.params.id, req.user!.userId);
    sendSuccess(res, null, 'Post deleted');
  });

  like = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await postService.like(req.params.id, req.user!.userId);
    sendSuccess(res, result);
  });

  getComments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const comments = await postService.getComments(req.params.id);
    sendSuccess(res, comments);
  });

  comment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { content } = req.body;
    const comment = await postService.comment(req.params.id, req.user!.userId, content);
    sendSuccess(res, comment, undefined, 201);
  });

  getTrending = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const trending = await postService.getTrending();
    sendSuccess(res, trending);
  });
}

export const postController = new PostController();
