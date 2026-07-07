import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { postService } from '../services/post.service';
export class PostController {
  async create(req: AuthRequest, res: Response, next: NextFunction) { try { const post = await postService.create(req.body, req.user!.userId); res.status(201).json({ success: true, data: post }); } catch (error) { next(error); } }
  async list(req: AuthRequest, res: Response, next: NextFunction) { try { const { page, limit, hashtag, userId, following } = req.query; const result = await postService.list({ page: page ? parseInt(page as string) : undefined, limit: limit ? parseInt(limit as string) : undefined, hashtag: hashtag as string, userId: userId as string, following: following as string }); res.json({ success: true, ...result }); } catch (error) { next(error); } }
  async getById(req: AuthRequest, res: Response, next: NextFunction) { try { const post = await postService.getById(req.params.id); if (!post) { res.status(404).json({ success: false, message: 'Post not found' }); return; } res.json({ success: true, data: post }); } catch (error) { next(error); } }
  async delete(req: AuthRequest, res: Response, next: NextFunction) { try { await postService.delete(req.params.id, req.user!.userId); res.json({ success: true, message: 'Post deleted' }); } catch (error) { next(error); } }
  async like(req: AuthRequest, res: Response, next: NextFunction) { try { const result = await postService.like(req.params.id, req.user!.userId); res.json({ success: true, data: result }); } catch (error) { next(error); } }
  async getComments(req: AuthRequest, res: Response, next: NextFunction) { try { const comments = await postService.getComments(req.params.id); res.json({ success: true, data: comments }); } catch (error) { next(error); } }
  async comment(req: AuthRequest, res: Response, next: NextFunction) { try { const { content } = req.body; const comment = await postService.comment(req.params.id, req.user!.userId, content); res.status(201).json({ success: true, data: comment }); } catch (error) { next(error); } }
  async getTrending(_req: AuthRequest, res: Response, next: NextFunction) { try { const trending = await postService.getTrending(); res.json({ success: true, data: trending }); } catch (error) { next(error); } }
}
export const postController = new PostController();
