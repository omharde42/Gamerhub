import multer from 'multer';
import path from 'path';
import { AppError } from '../utils/errors';
const storage = multer.memoryStorage();
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp|svg/; const allowedVideoTypes = /mp4|webm|mov/; const allowedAudioTypes = /mp3|wav|ogg/;
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  const isImage = allowedImageTypes.test(ext); const isVideo = allowedVideoTypes.test(ext); const isAudio = allowedAudioTypes.test(ext);
  if (isImage || isVideo || isAudio) cb(null, true); else cb(new AppError('Invalid file type', 400));
};
export const uploadAvatar = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter }).single('avatar');
export const uploadBanner = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter }).single('banner');
export const uploadMedia = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 }, fileFilter }).array('media', 10);
export const uploadVoice = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter }).single('voiceNote');
export const uploadScreenshot = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter }).single('screenshot');
