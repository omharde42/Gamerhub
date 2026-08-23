import { Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import axios from 'axios';

// NOTE: We deliberately have NO fabricated/hard-coded fallback articles.
// If every real source fails we return an empty feed so the UI can show a
// clear "news unavailable" state instead of inventing headlines.

/** Strip tracking params so the same article URL always dedupes consistently. */
function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return '';
  }
}

interface NewsItem {
  title: string;
  description: string;
  url: string;
  image: string;
  publishedAt?: string;
  source: string;
}

/** Keep only real, de-duplicated articles (must have a title + reachable URL). */
function sanitizeArticles(articles: any[]): NewsItem[] {
  const seen = new Set<string>();
  const result: NewsItem[] = [];
  for (const art of articles || []) {
    const title = (art.title || '').trim();
    const url = normalizeUrl(art.url || '');
    if (!title || !url) continue;
    const key = url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      title,
      description: (art.description || '').slice(0, 500),
      url,
      image: art.image || art.urlToImage || (art.enclosure?.link) || '',
      publishedAt: art.publishedAt || undefined,
      source: art.source?.name || art.source || 'Gaming News',
    });
  }
  return result;
}

export class NewsController {
  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const apiKey = process.env.GNEWS_API_KEY || process.env.GNEWS_KEY;
    const region = (req.query.region as string) || 'global';

    // 1. Primary source: GNews API (real headlines only).
    if (apiKey) {
      try {
        const response = await axios.get('https://gnews.io/api/v4/search', {
          params: {
            q: 'gaming OR esports OR videogames',
            lang: 'en',
            max: 10,
            country: region === 'india' ? 'in' : undefined,
            apikey: apiKey,
          },
          timeout: 10000,
        });

        const articles = sanitizeArticles(response.data?.articles);
        if (articles.length > 0) {
          sendSuccess(res, articles);
          return;
        }
      } catch (err: any) {
        console.error('[GNews API Error]:', err.response?.data || err.message);
      }
    }

    // 2. Fallback source: Google News RSS (real, aggregated headlines).
    try {
      const response = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/rss/search?q=gaming+esports&hl=en-US&gl=US',
        { signal: AbortSignal.timeout(10000) },
      );
      if (response.ok) {
        const data = await response.json();
        const items = sanitizeArticles((data.items || []).map((item: any) => ({
          title: item.title,
          description: item.description || '',
          source: (() => {
            try { return new URL(item.link).hostname.replace('www.', ''); } catch { return 'Google News'; }
          })(),
          url: item.link,
          image: item.enclosure?.link || '',
          publishedAt: item.pubDate || undefined,
        })));
        if (items.length > 0) {
          sendSuccess(res, items);
          return;
        }
      }
    } catch {
      // ignore — every real source failed; return an empty feed below
    }

    // 3. No fabricated headlines: signal an empty feed so the client renders
    //    a proper "unavailable" empty state with a retry action.
    sendSuccess(res, [], 'Gaming news is temporarily unavailable. Please try again later.');
  });
}

export const newsController = new NewsController();
