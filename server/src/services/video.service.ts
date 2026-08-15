import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { openai } from '../config/openai';
import { notificationService } from './notification.service';
import { NotFoundError, ValidationError, AppError } from '../utils/errors';
import fs from 'fs';
import os from 'os';
import path from 'path';

const CLIP_FOLDER = 'gamerhub/clips';
const MONTAGE_FOLDER = 'gamerhub/montages';
const MUSIC_FOLDER = 'gamerhub/music';
export const MAX_RAW_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
export const MAX_RAW_DURATION = 20 * 60; // 20 minutes
export const MIN_CLIP_DURATION = 3; // seconds

interface SegmentInput {
  clipId?: string;
  sourceUrl: string;
  publicId?: string;
  start: number;
  end: number;
  transition?: 'cut' | 'fade' | 'crossfade';
}

interface OverlayInput {
  text: string;
  x?: number;
  y?: number;
  fontSize?: number;
  color?: string;
  start?: number;
  end?: number;
}

interface MusicInput {
  url?: string;
  publicId?: string;
  volume?: number;
}

function truncateTitle(raw: string): string {
  return raw.replace(/\.[^.]+$/, '').slice(0, 120) || 'Untitled clip';
}

async function uploadFileToCloudinary(filePath: string, mimeType: string, folder: string, options: Record<string, any> = {}) {
  const result: any = await cloudinary.uploader.upload(filePath, {
    resource_type: 'video',
    folder,
    eager: [{ width: 640, crop: 'limit', format: 'jpg', fetch_format: 'auto' }],
    ...options,
  });
  return {
    publicId: result.public_id,
    url: result.secure_url,
    durationSec: typeof result.duration === 'number' ? result.duration : null,
    sizeBytes: result.bytes ?? null,
    thumbnailUrl: Array.isArray(result.eager) && result.eager[0]?.secure_url ? result.eager[0].secure_url : null,
  };
}

export class VideoService {
  // ─── Tier 1: Clips ────────────────────────────────────────────────────────
  async uploadClip(userId: string, file: { path: string; originalname: string; mimetype: string; size: number }) {
    if (file.size > MAX_RAW_SIZE) {
      throw new AppError('Video is too large. Maximum size is 2GB.');
    }
    try {
      const uploaded = await uploadFileToCloudinary(file.path, file.mimetype, CLIP_FOLDER);
      if (uploaded.durationSec && uploaded.durationSec > MAX_RAW_DURATION) {
        await cloudinary.uploader.destroy(uploaded.publicId, { resource_type: 'video' }).catch(() => {});
        throw new AppError('Video is too long. Maximum duration is 20 minutes.');
      }
      return (prisma as any).videoClip.create({
        data: {
          userId,
          title: truncateTitle(file.originalname),
          sourceUrl: uploaded.url,
          sourcePublicId: uploaded.publicId,
          thumbnailUrl: uploaded.thumbnailUrl,
          durationSec: uploaded.durationSec,
          sizeBytes: uploaded.sizeBytes,
          mimeType: file.mimetype,
          status: 'UPLOADED',
        },
      });
    } finally {
      fs.promises.unlink(file.path).catch(() => {});
    }
  }

  async listClips(userId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      (prisma as any).videoClip.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      (prisma as any).videoClip.count({ where: { userId } }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getClip(userId: string, clipId: string) {
    const clip = await (prisma as any).videoClip.findFirst({ where: { id: clipId, userId } });
    if (!clip) throw new NotFoundError('Clip');
    return clip;
  }

  async trimClip(userId: string, clipId: string, start: number, end: number) {
    const clip = await this.getClip(userId, clipId);
    if (typeof start !== 'number' || typeof end !== 'number' || !isFinite(start) || !isFinite(end)) {
      throw new AppError('Trim points must be numbers (seconds).');
    }
    if (start < 0) throw new AppError('Start offset cannot be negative.');
    if (end - start < MIN_CLIP_DURATION) {
      throw new AppError(`Trimmed clip must be at least ${MIN_CLIP_DURATION} seconds long.`);
    }
    if (clip.durationSec && end > clip.durationSec) {
      throw new AppError(`End offset (${end}s) exceeds clip duration (${clip.durationSec}s).`);
    }

    await (prisma as any).videoClip.update({ where: { id: clip.id }, data: { status: 'TRIMMING', trimStartSec: start, trimEndSec: end } });

    try {
      const sourceUrl = cloudinary.url(this.publicIdOf({ publicId: clip.sourcePublicId, sourceUrl: clip.sourceUrl }), { resource_type: 'video', secure: true, format: 'mp4' });
      const trimmed = await uploadFileToCloudinary(sourceUrl, 'video/mp4', `${CLIP_FOLDER}/trimmed`, {
        start_offset: String(start),
        end_offset: String(end),
      });
      return (prisma as any).videoClip.update({
        where: { id: clip.id },
        data: {
          trimmedUrl: trimmed.url,
          trimmedPublicId: trimmed.publicId,
          thumbnailUrl: trimmed.thumbnailUrl || clip.thumbnailUrl,
          status: 'TRIMMED',
        },
      });
    } catch (err: any) {
      await (prisma as any).videoClip.update({ where: { id: clip.id }, data: { status: 'FAILED', error: err.message || 'Trim failed' } });
      throw new AppError(err.message || 'Trim processing failed', err.status || 500);
    }
  }

  async deleteClip(userId: string, clipId: string) {
    const clip = await this.getClip(userId, clipId);
    await Promise.all(
      [clip.sourcePublicId, clip.trimmedPublicId].filter(Boolean).map((pid) =>
        cloudinary.uploader.destroy(pid!, { resource_type: 'video' }).catch(() => {})
      )
    );
    return (prisma as any).videoClip.delete({ where: { id: clip.id } });
  }

  // ─── Tier 2: Montage projects (EDL) ───────────────────────────────────────
  async createMontage(userId: string, title: string, edl: any, isAiGenerated = false) {
    const sanitized = this.sanitizeEdl(edl);
    return (prisma as any).montageProject.create({
      data: { userId, title: title?.slice(0, 120) || 'Untitled montage', edl: sanitized, isAiGenerated },
    });
  }

  async listMontages(userId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      (prisma as any).montageProject.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      (prisma as any).montageProject.count({ where: { userId } }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getMontage(userId: string, projectId: string) {
    const project = await (prisma as any).montageProject.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundError('Montage project');
    return project;
  }

  async updateMontageEdl(userId: string, projectId: string, edl: any) {
    await this.getMontage(userId, projectId);
    return (prisma as any).montageProject.update({
      where: { id: projectId },
      data: { edl: this.sanitizeEdl(edl), status: 'DRAFT' },
    });
  }

  sanitizeEdl(edl: any): Prisma.InputJsonValue {
    if (!edl || !Array.isArray(edl.segments) || edl.segments.length === 0) {
      throw new AppError('Montage must contain at least one segment.');
    }
    const segments = edl.segments.map((s: SegmentInput) => ({
      clipId: s.clipId || null,
      sourceUrl: String(s.sourceUrl || ''),
      publicId: s.publicId || null,
      start: Math.max(0, Number(s.start) || 0),
      end: Math.max(0, Number(s.end) || 0),
      transition: ['cut', 'fade', 'crossfade'].includes(s.transition || '') ? s.transition : 'cut',
    }));
    const overlays: OverlayInput[] = Array.isArray(edl.overlays)
      ? edl.overlays.map((o: OverlayInput) => ({
          text: String(o.text || '').slice(0, 200),
          x: Number(o.x) || 0,
          y: Number(o.y) || 0,
          fontSize: Math.min(200, Math.max(12, Number(o.fontSize) || 48)),
          color: /^#[0-9a-fA-F]{6}$/.test(String(o.color || '')) ? o.color : '#ffffff',
          start: Number(o.start) || 0,
          end: Number(o.end) || 0,
        })).filter((o: any) => o.text)
      : [];
    const music: MusicInput | null = edl.music?.publicId || edl.music?.url
      ? { url: edl.music.url || '', publicId: edl.music.publicId || '', volume: Math.min(100, Math.max(0, Number(edl.music.volume) || 70)) }
      : null;
    return { segments, overlays, music, resolution: edl.resolution || '720p', fps: Number(edl.fps) || 30 } as unknown as Prisma.InputJsonValue;
  }

  async renderMontage(userId: string, projectId: string, resolution = '720p', fps = 30) {
    const project = await this.getMontage(userId, projectId);
    if (project.status === 'RENDERING') {
      throw new AppError('This montage is already rendering.');
    }
    const edl = { ...(project.edl as any), resolution, fps };

    await (prisma as any).montageProject.update({ where: { id: project.id }, data: { status: 'RENDERING', renderError: null } });

    // Render asynchronously — user is notified when it completes.
    this.runRender(project.id, edl).catch(async (err) => {
      console.error('[VideoRender] failed:', err.message || err);
      await (prisma as any).montageProject.update({ where: { id: project.id }, data: { status: 'FAILED', renderError: err.message || 'Render failed' } });
      await notificationService.create({
        userId,
        type: 'VIDEO_RENDER' as any,
        title: 'Montage render failed',
        message: `"${project.title}" could not be rendered. Please try again.`,
        link: `/studio/projects/${project.id}`,
        metadata: { ok: false },
      });
    });

    return { id: project.id, status: 'RENDERING', message: 'Render queued — you will be notified when it is ready.' };
  }

  private async runRender(projectId: string, edl: any) {
    const composed = this.buildComposedUrl(edl);
    const rendered = await uploadFileToCloudinary(composed, 'video/mp4', MONTAGE_FOLDER);
    const project = await (prisma as any).montageProject.update({
      where: { id: projectId },
      data: { status: 'READY', renderUrl: rendered.url, thumbnailUrl: rendered.thumbnailUrl || null },
    });
    await notificationService.create({
      userId: project.userId,
      type: 'VIDEO_RENDER' as any,
      title: 'Your montage is ready!',
      message: `"${project.title}" has finished rendering.`,
      link: `/studio/projects/${project.id}`,
      image: rendered.thumbnailUrl || undefined,
      metadata: { ok: true },
    });
  }

  /** Compose a Cloudinary delivery URL that splices trimmed segments, applies transitions, text overlays and music. */
  private buildComposedUrl(edl: any): string {
    const { segments, overlays, music } = edl;
    if (!segments.length) throw new Error('No segments to render');

    const width = edl.resolution === '1080p' ? 1920 : 1280;
    const height = edl.resolution === '1080p' ? 1080 : 720;
    const base = segments[0];

    const transformation: any[] = [
      { start_offset: base.start, end_offset: base.end },
      { width, height, crop: 'limit' },
    ];

    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      const layer: any = { overlay: `video:${this.publicIdOf(seg)}`, start_offset: seg.start, end_offset: seg.end };
      if (seg.transition && seg.transition !== 'cut') {
        layer.transition = `${seg.transition}:600`;
      }
      transformation.push(layer);
    }

    overlays.forEach((o: OverlayInput) => {
      transformation.push({
        overlay: {
          font_family: 'Arial',
          font_size: o.fontSize,
          font_color: o.color?.replace('#', ''),
          text: String(o.text).replace(/_/g, ' '),
        },
        width: width * 0.9,
        x: o.x,
        y: o.y,
        start_offset: o.start,
        end_offset: o.end,
      });
    });

    if (music?.publicId) {
      transformation.push({ overlay: `audio:${music.publicId}`, flags: ['splice', 'layer_apply'], effect: `volume:${music.volume}` });
    }

    return cloudinary.url(this.publicIdOf(base), { resource_type: 'video', secure: true, transformation, format: 'mp4' });
  }

  /** Resolve a public_id from an EDL segment, preferring explicit ids over full URLs. */
  private publicIdOf(segment: any): string {
    if (segment.publicId) return segment.publicId;
    const url = segment.sourceUrl || '';
    const marker = '/video/upload/';
    const idx = url.indexOf(marker);
    if (idx === -1) throw new Error('Segment has no Cloudinary public id: ' + url.slice(0, 60));
    return url.slice(idx + marker.length).replace(/^v\d+\//, '').replace(/\.[^.]+$/, '');
  }

  // ─── Tier 3: AI highlight reel (OpenAI ranks moments; never auto-publishes) ──
  async generateHighlights(userId: string, clipId: string) {
    const clip = await this.getClip(userId, clipId);
    const duration = clip.durationSec || 0;
    if (duration <= 0) throw new AppError('Clip duration is unknown — cannot generate highlights.');

    let moments: { start: number; end: number; label: string; reason: string }[];
    if (openai) {
      moments = await this.askOpenAIForMoments(clip.title, duration);
    } else {
      moments = this.heuristicMoments(duration);
    }

    const segments = moments
      .filter((m) => m.end - m.start >= MIN_CLIP_DURATION && m.end <= duration)
      .map((m) => ({
        clipId: clip.id,
        sourceUrl: clip.trimmedUrl || clip.sourceUrl,
        publicId: clip.trimmedPublicId || clip.sourcePublicId || undefined,
        start: m.start,
        end: m.end,
        transition: 'crossfade',
      }));

    if (!segments.length) throw new AppError('Could not find any highlight-worthy moments in this clip.');

    const edl = { segments, overlays: [], music: null, resolution: '720p', fps: 30 };
    const project = await this.createMontage(userId, `${clip.title} — AI Highlights`, edl, true);
    return { project, moments };
  }

  private async askOpenAIForMoments(title: string, duration: number) {
    const response = await openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a gaming highlight editor. Given a clip title and duration in seconds, propose 3-6 highlight moments. ' +
            'Return ONLY JSON: {"moments":[{"start":<sec>,"end":<sec>,"label":"short title","reason":"why"}]}. ' +
            'Moments must be inside [0,duration], at least 3 seconds long, sorted by start, and should favour late-game/action moments. ' +
            'Do not include text outside the JSON object.',
        },
        { role: 'user', content: `Clip: "${title}"\nDuration: ${Math.round(duration)} seconds.` },
      ],
      temperature: 0.7,
    });
    const raw = response.choices[0]?.message?.content || '{"moments":[]}';
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.moments) ? parsed.moments : [];
  }

  private heuristicMoments(duration: number): { start: number; end: number; label: string; reason: string }[] {
    const moments = [];
    const count = Math.min(4, Math.max(2, Math.floor(duration / 90)));
    for (let i = 0; i < count; i++) {
      const start = Math.max(0, Math.round(duration * ((i + 1) / (count + 1)) * 10) / 10 - 5);
      moments.push({
        start,
        end: Math.min(duration, start + 10),
        label: `Moment ${i + 1}`,
        reason: 'Heuristic split of the clip into evenly spaced segments.',
      });
    }
    return moments;
  }

  // ─── Music (royalty-free upload for montage audio track) ───────────────────
  async uploadMusic(userId: string, file: { path: string; originalname: string; mimetype: string; size: number }) {
    if (file.size > 50 * 1024 * 1024) throw new AppError('Audio file is too large. Maximum size is 50MB.');
    try {
      const result: any = await cloudinary.uploader.upload(file.path, {
        resource_type: 'video',
        folder: MUSIC_FOLDER,
        format: 'mp3',
      });
      return { publicId: result.public_id, url: result.secure_url };
    } finally {
      fs.promises.unlink(file.path).catch(() => {});
    }
  }
}

export const videoService = new VideoService();