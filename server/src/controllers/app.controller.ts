import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class AppController {
  getVersion = asyncHandler(async (req: Request, res: Response) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:4000';
    const baseUrl = `${protocol}://${host}`;

    sendSuccess(res, {
      latestVersion: '1.2.0',
      minSupportedVersion: '1.0.0',
      apkUrl: `${baseUrl}/downloads/GamerHub-latest.apk`,
      isForceUpdate: false,
      releaseNotes: [
        'Fixed profile picture and post image uploads',
        'Added interactive Poll creation and voting in feed',
        'Fixed authentication session persistence across app restarts',
        'Enhanced mobile APK stability and overall performance'
      ]
    });
  });
}

export const appController = new AppController();
