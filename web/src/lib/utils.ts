import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatDate(date: string | Date) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date)); }
export function formatRelativeTime(date: string | Date) { const now = new Date(); const d = new Date(date); const diff = now.getTime() - d.getTime(); const seconds = Math.floor(diff / 1000); const minutes = Math.floor(seconds / 60); const hours = Math.floor(minutes / 60); const days = Math.floor(hours / 24); if (seconds < 60) return 'just now'; if (minutes < 60) return `${minutes}m ago`; if (hours < 24) return `${hours}h ago`; if (days < 7) return `${days}d ago`; return formatDate(date); }
export function formatNumber(num: number) { if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`; if (num >= 1000) return `${(num / 1000).toFixed(1)}K`; return num.toString(); }
export function getInitials(name: string) { return name?.charAt(0)?.toUpperCase() || '?'; }
export function getRankColor(rank: string | null) { const colors: Record<string, string> = { Bronze: 'text-orange-600', Silver: 'text-gray-400', Gold: 'text-yellow-500', Platinum: 'text-cyan-400', Diamond: 'text-blue-400', Master: 'text-purple-400', Grandmaster: 'text-red-400', Challenger: 'text-yellow-300' }; return rank ? colors[rank] || 'text-muted-foreground' : 'text-muted-foreground'; }
import { API_URL } from './constants';

export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  
  if (url.startsWith('/uploads')) {
    const baseUrl = API_URL.replace(/\/api$/, '');
    return `${baseUrl}${url}`;
  }

  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }

  return url;
}
