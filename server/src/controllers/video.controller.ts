import { Response } from 'express';
import { AuthRequest } from '../types';
import { videoService } from '../services/video.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';

export class VideoController {
  uploadClip = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) return sendError(res, 400, 'No video file uploaded.');
    const clip = await videoService.uploadClip(req.user!.userId, req.file);
    sendSuccess(res, { clip }, 'Clip uploaded successfully');
  });

  listClips = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const result = await videoService.listClips(req.user!.userId, page, limit);
    sendSuccess(res, result.data, 'Clips fetched', 200, { ...result.meta });
  });

  getClip = asyncHandler(async (req: AuthRequest, res: Response) => {
    const clip = await videoService.getClip(req.user!.userId, req.params.id);
    sendSuccess(res, { clip });
  });

  trimClip = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { start, end } = req.body ?? {};
    const clip = await videoService.trimClip(req.user!.userId, req.params.id, Number(start), Number(end));
    sendSuccess(res, { clip }, 'Clip trimmed successfully');
  });

  deleteClip = asyncHandler(async (req: AuthRequest, res: Response) => {
    await videoService.deleteClip(req.user!.userId, req.params.id);
    sendSuccess(res, null, 'Clip deleted');
  });

  createMontage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, edl } = req.body ?? {};
    const project = await videoService.createMontage(req.user!.userId, title, edl);
    sendSuccess(res, { project }, 'Montage project created');
  });

  listMontages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const result = await videoService.listMontages(req.user!.userId, page, limit);
    sendSuccess(res, result.data, 'Montages fetched', 200, { ...result.meta });
  });

  getMontage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const project = await videoService.getMontage(req.user!.userId, req.params.id);
    sendSuccess(res, { project });
  });

  updateMontageEdl = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { edl } = req.body ?? {};
    const project = await videoService.updateMontageEdl(req.user!.userId, req.params.id, edl);
    sendSuccess(res, { project }, 'Montage updated');
  });

  renderMontage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { resolution, fps } = req.body ?? {};
    const result = await videoService.renderMontage(req.user!.userId, req.params.id, resolution, fps);
    sendSuccess(res, result, 'Render queued');
  });

  generateHighlights = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await videoService.generateHighlights(req.user!.userId, req.params.id);
    sendSuccess(res, result, 'AI highlights generated — saved as an editable draft');
  });

  uploadMusic = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) return sendError(res, 400, 'No audio file uploaded.');
    const music = await videoService.uploadMusic(req.user!.userId, req.file);
    sendSuccess(res, { music }, 'Music uploaded');
  });
}

export const videoController = new VideoController();