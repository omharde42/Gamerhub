import { Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import axios from 'axios';

const FALLBACK_NEWS = [
  { title: 'ESL Pro League Season 20: Teams & Schedule Revealed — Top Teams Battle for $1M Prize Pool', source: 'ESL Gaming', url: 'https://www.eslgaming.com', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800' },
  { title: 'Valorant Champions Tour 2026: New Format Announced with Open Qualifiers Across All Regions', source: 'Riot Games', url: 'https://valorantesports.com', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800' },
  { title: 'CS2 Major Championship 2026: Prize Pool Hits $2M as 24 Teams Qualify for Biggest Event Yet', source: 'HLTV', url: 'https://www.hltv.org', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800' },
  { title: 'League of Legends Worlds 2026: Championship Dates Revealed — Returning to Asia', source: 'Riot Games', url: 'https://lolesports.com', image: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800' },
  { title: 'The International 2026: Dota 2 Championship Returns to Europe with Record $5M Prize Pool', source: 'Valve', url: 'https://www.dota2.com/esports', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800' },
  { title: 'Fortnite Chapter 6 Season 2: Major Map Changes, New Weapons & Battle Pass Revealed', source: 'Epic Games', url: 'https://www.fortnite.com', image: 'https://images.unsplash.com/photo-1580234811497-9df7fd2f357e?w=800' },
];

export class NewsController {
  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const apiKey = process.env.GNEWS_API_KEY || process.env.GNEWS_KEY;
    const region = (req.query.region as string) || 'global';

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
        });

        if (response.data?.articles && response.data.articles.length > 0) {
          const articles = response.data.articles.map((art: any) => ({
            title: art.title,
            description: art.description,
            url: art.url,
            image: art.image || '',
            publishedAt: art.publishedAt,
            source: art.source?.name || 'GNews',
          }));

          sendSuccess(res, articles);
          return;
        }
      } catch (err: any) {
        console.error('[GNews API Error]:', err.response?.data || err.message);
      }
    }

    // Fallback: Try RSS feeds or curated news if GNews key is absent or limit reached
    try {
      const response = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/rss/search?q=gaming+esports+2026&hl=en-US&gl=US',
      );
      if (response.ok) {
        const data = await response.json();
        if (data.items?.length > 0) {
          const items = data.items.slice(0, 10).map((item: any) => ({
            title: item.title,
            description: item.description || '',
            source: new URL(item.link).hostname.replace('www.', ''),
            url: item.link,
            image: item.enclosure?.link || '',
          }));
          sendSuccess(res, items);
          return;
        }
      }
    } catch {
      // ignore
    }

    sendSuccess(res, FALLBACK_NEWS);
  });
}

export const newsController = new NewsController();
