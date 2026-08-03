import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
import path from 'path';
import fs from 'fs';

// Initialize Cloudinary with configured credentials
const cloudName = config.cloudinary.cloudName || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = config.cloudinary.apiKey || process.env.CLOUDINARY_API_KEY;
const apiSecret = config.cloudinary.apiSecret || process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export interface UploadResult {
  url: string;
  publicId?: string;
  storageProvider: 'cloudinary' | 'disk' | 'base64';
  size?: number;
  mimeType?: string;
}

export class MediaStorageService {
  /**
   * Upload a file buffer to permanent Cloud CDN storage (Cloudinary)
   * Fallback to base64 Data URIs to prevent image loss on ephemeral hosts (like Render)
   */
  async uploadMedia(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: 'avatars' | 'posts' | 'chat' | 'banners' = 'posts'
  ): Promise<UploadResult> {
    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');

    // 1. Primary Storage: Cloudinary Permanent CDN
    if (cloudName && apiKey && apiSecret) {
      try {
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `gamerhub/${folder}`,
              resource_type: isVideo ? 'video' : 'auto',
              transformation: isImage
                ? folder === 'avatars'
                  ? [{ width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto:good', fetch_format: 'auto' }]
                  : folder === 'banners'
                  ? [{ width: 1200, height: 400, crop: 'fill', quality: 'auto:good', fetch_format: 'auto' }]
                  : folder === 'chat'
                  ? [{ width: 800, limit: true, quality: 'auto:good', fetch_format: 'auto' }]
                  : [{ width: 1280, limit: true, quality: 'auto:good', fetch_format: 'auto' }]
                : undefined,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          uploadStream.end(fileBuffer);
        });

        if (result && result.secure_url) {
          return {
            url: result.secure_url,
            publicId: result.public_id,
            storageProvider: 'cloudinary',
            size: result.bytes || fileBuffer.length,
            mimeType,
          };
        }
      } catch (cloudErr) {
        console.warn(`Cloudinary upload warning (${folder}):`, cloudErr);
      }
    }

    // 2. Secondary Storage Fallback: base64 Data URI to prevent image loss on ephemeral hosts (like Render/containers)
    // base64 strings are stored directly in PostgreSQL database columns (TEXT) which persists permanently across deployments!
    const isRenderHost = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.RENDER_EXTERNAL_URL);
    if (isRenderHost || fileBuffer.length < 5 * 1024 * 1024) {
      const b64 = fileBuffer.toString('base64');
      return {
        url: `data:${mimeType};base64,${b64}`,
        storageProvider: 'base64',
        size: fileBuffer.length,
        mimeType,
      };
    }

    // 3. Local Persistent Disk Storage (backup option)
    try {
      const uploadsDir = path.resolve(process.cwd(), `public/uploads/${folder}`);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const ext = path.extname(originalName) || (isVideo ? '.mp4' : '.jpg');
      const filename = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, fileBuffer);

      const frontendUrl = config.frontendUrl || 'https://gamerhub-web.onrender.com';
      const host = process.env.RENDER_EXTERNAL_URL || `${frontendUrl.replace(/\/+$/, '')}`;
      const mediaUrl = `${host}/uploads/${folder}/${filename}`;

      return {
        url: mediaUrl,
        storageProvider: 'disk',
        size: fileBuffer.length,
        mimeType,
      };
    } catch (diskErr) {
      console.warn(`Disk write warning (${folder}), using base64 fallback:`, diskErr);
    }

    // 4. Ultimate Fallback: Base64 Data URI
    const b64 = fileBuffer.toString('base64');
    return {
      url: `data:${mimeType};base64,${b64}`,
      storageProvider: 'base64',
      size: fileBuffer.length,
      mimeType,
    };
  }

  /**
   * Helper to delete an asset from Cloudinary
   */
  async deleteMedia(publicId: string): Promise<boolean> {
    try {
      if (publicId && cloudName && apiKey && apiSecret) {
        await cloudinary.uploader.destroy(publicId);
        return true;
      }
    } catch (err) {
      console.warn('Failed to delete media from Cloudinary:', err);
    }
    return false;
  }
}

export const mediaStorageService = new MediaStorageService();
