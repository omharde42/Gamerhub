import { Response } from 'express';
import { AuthRequest } from '../types';
import { postService } from '../services/post.service';
import { io } from '../index';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import cloudinary from '../config/cloudinary';

export class PostController {
  uploadMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return sendError(res, 400, 'No files uploaded');
    }

    const uploadPromises = files.map(async (file) => {
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'gamerhub/posts',
        resource_type: 'auto',
      });
      return result.secure_url;
    });

    const urls = await Promise.all(uploadPromises);
    sendSuccess(res, { urls });
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
