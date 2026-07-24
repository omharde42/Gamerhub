import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';

export class AppController {
  getVersion = asyncHandler(async (req: Request, res: Response) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:4000';
    const baseUrl = `${protocol}://${host}`;

    sendSuccess(res, {
      latestVersion: '1.2.1',
      minSupportedVersion: '1.0.0',
      apkUrl: `${baseUrl}/downloads/GamerHub-latest.apk`,
      isForceUpdate: false,
      releaseNotes: [
        '🎉 New GamerzHub launcher icon — fresh branding!',
        '🖼️ Fixed profile picture and post image uploads',
        '📊 Added interactive Poll creation and voting in feed',
        '🔒 Fixed authentication session persistence across app restarts',
        '⚡ Enhanced mobile APK stability and overall performance',
        '🐛 Fixed image display after posting'
      ]
    });
  });

  downloadApk = asyncHandler(async (req: Request, res: Response) => {
    const apkPath = path.join(__dirname, '../../public/downloads/GamerHub-latest.apk');
    if (!fs.existsSync(apkPath)) {
      return sendError(res, 404, 'APK not yet available. Please check back soon or visit GitHub Releases for the latest build.');
    }
    res.download(apkPath, 'GamerHub-latest.apk');
  });
}

export const appController = new AppController();
