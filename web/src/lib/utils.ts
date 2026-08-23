import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatDate(date: string | Date) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date)); }
export function formatAbsoluteDateTime(date: string | Date) { return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)); }
export function formatRelativeTime(date: string | Date) {
  const now = new Date();
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return formatDate(date);
  const diffMs = now.getTime() - d.getTime();
  // Future timestamps (clock skew between client/server) are treated as "just now".
  if (diffMs < 0) return 'just now';
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (seconds < 60) return 'just now';
  if (minutes < 2) return '1m ago';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 2) return '1h ago';
  if (hours < 24) return `${hours}h ago`;
  if (days < 2) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return formatDate(date);
}
export function formatNumber(num: number) { if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`; if (num >= 1000) return `${(num / 1000).toFixed(1)}K`; return num.toString(); }
/** Compact count formatting for views/likes, e.g. 1234 → "1.2K". */
export function formatViewCount(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  const n = Number(num);
  if (!Number.isFinite(n) || n < 0) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(Math.floor(n));
}
export function getInitials(name: string) { return name?.charAt(0)?.toUpperCase() || '?'; }
export function getRankColor(rank: string | null) { const colors: Record<string, string> = { Bronze: 'text-orange-600', Silver: 'text-gray-400', Gold: 'text-yellow-500', Platinum: 'text-cyan-400', Diamond: 'text-blue-400', Master: 'text-purple-400', Grandmaster: 'text-red-400', Challenger: 'text-yellow-300' }; return rank ? colors[rank] || 'text-muted-foreground' : 'text-muted-foreground'; }

export function formatLastSeen(date: string | Date | null | undefined): string {
  if (!date) return 'Offline';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 2) return '1 min ago';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 2) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  if (days < 2) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
import { API_URL } from './constants';

export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  
  // Clean double/malformed protocols
  const cleaned = url.replace(/^(https?,\s*)+/i, '');

  // Extract relative /uploads/... path if present in absolute or relative URL
  if (cleaned.includes('/uploads/')) {
    const relativePath = cleaned.substring(cleaned.indexOf('/uploads/'));
    const baseUrl = API_URL.replace(/\/api\/?$/, '');
    return `${baseUrl}${relativePath}`;
  }

  if (cleaned.startsWith('uploads/')) {
    const baseUrl = API_URL.replace(/\/api\/?$/, '');
    return `${baseUrl}/${cleaned}`;
  }

  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && cleaned.startsWith('http://')) {
    return cleaned.replace('http://', 'https://');
  }

  return cleaned;
}

export function getOptimizedMediaUrl(url: string | null | undefined, width?: number): string {
  const mediaUrl = getMediaUrl(url);
  if (!mediaUrl) return '';
  
  // Dynamic Cloudinary Image CDN Auto-Resizing & Format Optimization
  if (mediaUrl.includes('res.cloudinary.com') && mediaUrl.includes('/upload/')) {
    const params = ['f_auto', 'q_auto:good'];
    if (width) params.push(`w_${width}`, 'c_limit');
    const paramString = params.join(',');
    return mediaUrl.replace('/upload/', `/upload/${paramString}/`);
  }
  return mediaUrl;
}
