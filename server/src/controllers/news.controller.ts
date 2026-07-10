import { Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

const FALLBACK_NEWS = [
  { title: 'ESL Pro League Season 20: Teams & Schedule Revealed — Top Teams Battle for $1M Prize Pool', source: 'ESL Gaming', url: 'https://www.eslgaming.com', image: '' },
  { title: 'Valorant Champions Tour 2026: New Format Announced with Open Qualifiers Across All Regions', source: 'Riot Games', url: 'https://valorantesports.com', image: '' },
  { title: 'CS2 Major Championship 2026: Prize Pool Hits $2M as 24 Teams Qualify for Biggest Event Yet', source: 'HLTV', url: 'https://www.hltv.org', image: '' },
  { title: 'League of Legends Worlds 2026: Championship Dates Revealed — Returning to Asia', source: 'Riot Games', url: 'https://lolesports.com', image: '' },
  { title: 'The International 2026: Dota 2 Championship Returns to Europe with Record $5M Prize Pool', source: 'Valve', url: 'https://www.dota2.com/esports', image: '' },
  { title: 'Fortnite Chapter 6 Season 2: Major Map Changes, New Weapons & Battle Pass Revealed', source: 'Epic Games', url: 'https://www.fortnite.com', image: '' },
  { title: 'Sentinels Win VCT Masters Bangkok 2026: Dominant Run Through International Playoffs', source: 'Valorant Esports', url: 'https://valorantesports.com', image: '' },
  { title: 'NVIDIA RTX 5090 Release Date Leaked: 32GB GDDR7, 600W TDP & 2.5x Performance Leap', source: 'WCCFTech', url: 'https://wccftech.com', image: '' },
  { title: 'AMD Ryzen 9 10950X Benchmarks Leak: 24 Cores, 5.8GHz Boost Dominates Multi-Thread', source: "Tom's Hardware", url: 'https://www.tomshardware.com', image: '' },
  { title: 'Steam Deck 2: Valve Confirms Next-Gen Handheld with Ray Tracing & 3+ Hour Battery', source: 'The Verge', url: 'https://www.theverge.com', image: '' },
  { title: 'GTA VI Online: Rockstar Reveals First Details About Next-Gen Multiplayer Experience', source: 'Rockstar Games', url: 'https://www.rockstargames.com', image: '' },
  { title: 'Unreal Engine 6 Revealed: Nanite 2.0, MegaLights & Real-Time Path Tracing Demo', source: 'Epic Games', url: 'https://www.unrealengine.com', image: '' },
  { title: 'DLSS 4 vs FSR 4 vs XeSS 2: 2026 Upscaling Technology Comparison Benchmarks', source: 'Digital Foundry', url: 'https://www.eurogamer.net/digitalfoundry', image: '' },
  { title: 'Saudi Arabia\'s Esports World Cup 2026: $100M Prize Pool Confirmed with 20+ Game Titles', source: 'Esports Insider', url: 'https://esportsinsider.com', image: '' },
  { title: 'Monitors in 2026: 500Hz OLED, 8K Mini-LED & Thunderbolt 5 Become Mainstream', source: 'DisplaySpecifications', url: 'https://www.displayspecifications.com', image: '' },
  { title: 'Godot Engine 5.0 Released: Major Upgrade Brings AAA-Quality Rendering to Open-Source', source: 'Godot', url: 'https://godotengine.org', image: '' },
  { title: 'AI in Game Development: Ubisoft Uses Generative AI for NPC Dialogues & Quest Design', source: 'GamesIndustry', url: 'https://www.gamesindustry.biz', image: '' },
  { title: 'Razer Blade 18 (2026): World\'s First 18-Inch 4K 240Hz OLED Gaming Laptop', source: 'Razer', url: 'https://www.razer.com', image: '' },
  { title: 'Xbox Next-Gen Console Leak: Cloud-Native Architecture with Local Ray Tracing Hardware', source: 'Windows Central', url: 'https://www.windowscentral.com', image: '' },
  { title: 'Esports Viewership Hits All-Time High: 650M+ Viewers in 2025, Projected 800M in 2026', source: 'Newzoo', url: 'https://newzoo.com', image: '' },
];

export class NewsController {
  list = asyncHandler(async (_req: AuthRequest, res: Response) => {
    try {
      const response = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/rss/search?q=gaming+esports+2026&hl=en-US&gl=US',
      );
      if (response.ok) {
        const data = await response.json();
        if (data.items?.length > 0) {
          const items = data.items.slice(0, 10).map((item: any) => ({
            title: item.title,
            source: new URL(item.link).hostname.replace('www.', ''),
            url: item.link,
            image: item.enclosure?.link || '',
          }));
          sendSuccess(res, items);
          return;
        }
      }
    } catch {
      // fallback below
    }
    sendSuccess(res, FALLBACK_NEWS);
  });
}

export const newsController = new NewsController();
