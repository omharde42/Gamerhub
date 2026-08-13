import { fileFilter } from './upload';
import { AppError } from '../utils/errors';

function callFileFilter(filename: string, mimetype: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const file = { originalname: filename, mimetype } as Express.Multer.File;
    fileFilter(null, file, (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
}

describe('upload fileFilter', () => {
  it('accepts an image with a matching extension and MIME type', async () => {
    await expect(callFileFilter('avatar.png', 'image/png')).resolves.toBe(true);
  });

  it('rejects SVG files (executable content / stored XSS risk)', async () => {
    await expect(callFileFilter('logo.svg', 'image/svg+xml')).rejects.toThrow(AppError);
  });

  it('rejects a renamed executable (mismatched extension and MIME)', async () => {
    // Old behavior: extension check only -> evil.png with application/octet-stream passed.
    await expect(callFileFilter('evil.png', 'application/x-msdownload')).rejects.toThrow(AppError);
  });

  it('rejects an image extension with a non-image MIME type', async () => {
    await expect(callFileFilter('photo.jpg', 'text/html')).rejects.toThrow(AppError);
  });

  it('rejects files with an unsupported extension', async () => {
    await expect(callFileFilter('notes.txt', 'text/plain')).rejects.toThrow(AppError);
  });

  it('accepts a video with matching extension and MIME type', async () => {
    await expect(callFileFilter('clip.mp4', 'video/mp4')).resolves.toBe(true);
  });

  it('accepts audio with matching extension and MIME type', async () => {
    await expect(callFileFilter('note.mp3', 'audio/mpeg')).resolves.toBe(true);
  });
});
