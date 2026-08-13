import multer from 'multer';
import path from 'path';
import { AppError } from '../utils/errors';

const storage = multer.memoryStorage();

// SVG is deliberately excluded: SVG files can contain scripts and are served
// as image/svg+xml, which browsers will execute when opened directly or
// embedded via <iframe> — a stored-XSS vector.
const IMAGE_TYPES = /jpeg|jpg|png|gif|webp/;
const VIDEO_TYPES = /mp4|webm|mov|ogg|avi|mkv|flv/;
const AUDIO_TYPES = /mp3|wav|ogg|aac|flac/;

export const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Validate BOTH the extension and the declared MIME type so a renamed
  // executable (e.g. evil.exe -> evil.png) cannot pass the filter.
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  const mime = file.mimetype || '';

  const isImage = IMAGE_TYPES.test(ext) && mime.startsWith('image/');
  const isVideo = VIDEO_TYPES.test(ext) && mime.startsWith('video/');
  const isAudio = AUDIO_TYPES.test(ext) && mime.startsWith('audio/');

  if (isImage || isVideo || isAudio) cb(null, true);
  else cb(new AppError(`Invalid file type: .${ext}. Allowed: images (jpeg, png, gif, webp), videos (mp4, webm, mov, ogg, avi), audio (mp3, wav, ogg)`, 400));
};

export const uploadAvatar = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter }).single('avatar');
export const uploadBanner = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter }).single('banner');
// Memory-backed uploads: keep the per-request ceiling bounded (6 x 25MB).
export const uploadMedia = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 }, fileFilter }).array('media', 6);
export const uploadVoice = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter }).single('voiceNote');
export const uploadScreenshot = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter }).single('screenshot');
