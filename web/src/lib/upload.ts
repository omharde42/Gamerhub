import api from './api';

export interface UploadOptions {
  endpoint?: string;
  folder?: 'avatars' | 'posts' | 'chat' | 'banners';
  fieldName?: string;
  onProgress?: (percent: number) => void;
}

export async function uploadMediaFile(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  const {
    endpoint = '/posts/upload',
    folder = 'posts',
    fieldName = 'media',
    onProgress,
  } = options;

  // 1. File Size Validation (10MB Max)
  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File "${file.name}" is too large. Maximum allowed size is 10MB.`);
  }

  // 2. MIME Type Validation
  const allowedPrefixes = ['image/', 'video/'];
  const isAllowed = allowedPrefixes.some((prefix) => file.type.startsWith(prefix));
  if (!isAllowed) {
    throw new Error(`Unsupported file format (${file.type || 'unknown'}). Please upload a JPG, PNG, WEBP, or MP4 file.`);
  }

  // 3. Perform Multipart Form Upload with Progress Callback
  const formData = new FormData();
  formData.append(fieldName, file);
  if (folder) {
    formData.append('folder', folder);
  }

  try {
    const response = await api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    const data = response.data?.data;
    if (data?.urls && Array.isArray(data.urls) && data.urls.length > 0) {
      return data.urls[0];
    }
    if (data?.url) {
      return data.url;
    }
    if (data?.avatar) {
      return data.avatar;
    }
    if (data?.banner) {
      return data.banner;
    }

    throw new Error('Upload succeeded but server did not return a valid media URL.');
  } catch (err: any) {
    const errorMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'Failed to upload image. Please check your connection and try again.';
    throw new Error(errorMsg);
  }
}
