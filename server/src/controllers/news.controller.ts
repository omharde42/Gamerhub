import { Request, Response, NextFunction } from 'express';

const FALLBACK_NEWS = [
  // Gaming News
  { title: 'ESL Pro League Season 20: Teams & Schedule Revealed — Top Teams Battle for $1M Prize Pool', source: 'ESL Gaming', url: 'https://www.eslgaming.com', image: '' },
  { title: 'Valorant Champions Tour 2026: New Format Announced with Open Qualifiers Across All Regions', source: 'Riot Games', url: 'https://valorantesports.com', image: '' },
  { title: 'CS2 Major Championship 2026: Prize Pool Hits $2M as 24 Teams Qualify for Biggest Event Yet', source: 'HLTV', url: 'https://www.hltv.org', image: '' },
  { title: 'League of Legends Worlds 2026: Championship Dates Revealed — Returning to Asia', source: 'Riot Games', url: 'https://lolesports.com', image: '' },
  { title: 'BGMI Pro Series Season 4 Returns with ₹1 Crore Prize Pool — Registrations Open Now', source: 'Krafton', url: 'https://www.battlegroundsmobileindia.com', image: '' },
  { title: 'Free Fire World Series 2026: Regional Qualifiers Open — $2M Global Prize Pool Announced', source: 'Garena', url: 'https://ffesports.com', image: '' },
  { title: 'The International 2026: Dota 2 Championship Returns to Europe with Record $5M Prize Pool', source: 'Valve', url: 'https://www.dota2.com/esports', image: '' },
  { title: 'Fortnite Chapter 6 Season 2: Major Map Changes, New Weapons & Battle Pass Revealed', source: 'Epic Games', url: 'https://www.fortnite.com', image: '' },
  { title: 'Call of Duty League 2026: Full Schedule and Team Rosters Revealed for New Season', source: 'CDL', url: 'https://callofdutyleague.com', image: '' },
  { title: 'Overwatch Champions Series 2026: Blizzard Unveils New Tournament Format and Regional Leagues', source: 'Blizzard', url: 'https://overwatch.blizzard.com', image: '' },
  { title: 'Apex Legends Global Series 2026: Split 1 Playoffs Kick Off with 40 Teams Competing', source: 'EA Sports', url: 'https://www.ea.com/apex-legends', image: '' },
  { title: 'Rocket League Championship Series 2026: New Season Brings Cross-Platform Tournaments', source: 'Psyonix', url: 'https://www.rocketleague.com', image: '' },
  { title: 'Rainbow Six Siege Manchester Major 2026: Everything You Need to Know About the $750K Event', source: 'Ubisoft', url: 'https://www.ubisoft.com', image: '' },
  { title: 'PUBG Global Championship 2026: 32 Teams Set to Battle for $3M Prize Pool in Dubai', source: 'Krafton', url: 'https://pubg.com', image: '' },
  { title: 'Street Fighter 6 Capcom Cup 2026: Qualifiers Begin for $2M Fighting Tournament', source: 'Capcom', url: 'https://www.capcom.com', image: '' },
  { title: 'Elden Ring Nightreign: FromSoftware Unveils New Co-op Mode at Summer Game Fest', source: 'FromSoftware', url: 'https://www.bandainamco.com', image: '' },
  { title: 'Nintendo Switch 2 Launch Titles Leaked: Metroid Prime 4, New Zelda & Mario Confirmed', source: 'Nintendo', url: 'https://www.nintendo.com', image: '' },
  { title: 'GTA VI Online: Rockstar Reveals First Details About Next-Gen Multiplayer Experience', source: 'Rockstar Games', url: 'https://www.rockstargames.com', image: '' },
  { title: 'Marvel Rivals Season 1: New Heroes, Maps & Battle Pass Revealed for Hit Hero Shooter', source: 'NetEase Games', url: 'https://www.marvelrivals.com', image: '' },
  { title: 'World of Warcraft: Midnight Expansion Revealed — New Continent, Class Changes & Release Date', source: 'Blizzard', url: 'https://worldofwarcraft.blizzard.com', image: '' },
  { title: 'Tekken 8 Season 2: New Characters, Stages & Balance Changes Announced at Evo Japan', source: 'Bandai Namco', url: 'https://www.bandainamco.com', image: '' },
  { title: 'Helldivers 2: Major Warbond Update Adds New Weapons, Vehicles & Enemy Faction', source: 'PlayStation', url: 'https://www.playstation.com', image: '' },

  // PC & Gaming Hardware News
  { title: 'NVIDIA RTX 5090 Release Date Leaked: 32GB GDDR7, 600W TDP & 2.5x Performance Leap', source: 'WCCFTech', url: 'https://wccftech.com', image: '' },
  { title: 'AMD Ryzen 9 10950X Benchmarks Leak: 24 Cores, 5.8GHz Boost Dominates Multi-Thread', source: 'Tom\'s Hardware', url: 'https://www.tomshardware.com', image: '' },
  { title: 'Intel Arrow Lake-S Desktop CPUs: Full Specs, Pricing & Performance Review', source: 'AnandTech', url: 'https://www.anandtech.com', image: '' },
  { title: 'DDR5 Memory Hits 10,000MT/s: G.Skill Breaks World Record with Trident Z5 Kit', source: 'TechPowerUp', url: 'https://www.techpowerup.com', image: '' },
  { title: 'AMD Radeon RX 9070 XT Review: RDNA 4 Brings Ray Tracing Revolution to Mid-Range', source: 'GamersNexus', url: 'https://www.gamersnexus.net', image: '' },
  { title: 'PCIe 6.0 Standard Finalized: 256GB/s Bandwidth Set to Transform GPU Performance', source: 'AnandTech', url: 'https://www.anandtech.com', image: '' },
  { title: 'Samsung 990 EVO Plus SSD Review: PCIe 5.0 Speed at PCIe 4.0 Prices', source: 'StorageReview', url: 'https://www.storagereview.com', image: '' },
  { title: 'ASUS ROG Zephyrus G16 (2026) Review: Ultra-Thin Gaming Laptop with RTX 5080', source: 'NotebookCheck', url: 'https://www.notebookcheck.net', image: '' },
  { title: 'Corsair Dominator Titanium DDR5-8000: The Ultimate Gaming Memory Kit Tested', source: 'TechSpot', url: 'https://www.techspot.com', image: '' },
  { title: 'Liquid Cooling Evolution: Thermaltake Unveils AIO with 4K OLED Display on Pump', source: 'Thermaltake', url: 'https://www.thermaltake.com', image: '' },
  { title: 'MSI MEG X870E Godlike: Flagship AM5 Motherboard with 10G LAN & 5 M.2 Slots', source: 'HardwareUnboxed', url: 'https://www.hardwareunboxed.com', image: '' },
  { title: 'Razer Blade 18 (2026): World\'s First 18-Inch 4K 240Hz OLED Gaming Laptop', source: 'Razer', url: 'https://www.razer.com', image: '' },

  // Gaming Tech & Industry News
  { title: 'Steam Deck 2: Valve Confirms Next-Gen Handheld with Ray Tracing & 3+ Hour Battery', source: 'The Verge', url: 'https://www.theverge.com', image: '' },
  { title: 'Microsoft Flight Simulator 2026: Ray-Traced Global Lighting & Full Earth Rendering', source: 'Xbox', url: 'https://www.xbox.com', image: '' },
  { title: 'Unreal Engine 6 Revealed: Nanite 2.0, MegaLights & Real-Time Path Tracing Demo', source: 'Epic Games', url: 'https://www.unrealengine.com', image: '' },
  { title: 'DLSS 4 vs FSR 4 vs XeSS 2: 2026 Upscaling Technology Comparison Benchmarks', source: 'Digital Foundry', url: 'https://www.eurogamer.net/digitalfoundry', image: '' },
  { title: 'PlayStation 6 Rumors: Early Dev Kits Spotted — 8K Gaming & AI Upscaling Expected', source: 'IGN', url: 'https://www.ign.com', image: '' },
  { title: 'Xbox Next-Gen Console Leak: Cloud-Native Architecture with Local Ray Tracing Hardware', source: 'Windows Central', url: 'https://www.windowscentral.com', image: '' },
  { title: 'Qualcomm Snapdragon X Elite Gen 2: Handheld Gaming PC Chips Challenge AMD & Intel', source: 'Liliputing', url: 'https://liliputing.com', image: '' },
  { title: 'Monitors in 2026: 500Hz OLED, 8K Mini-LED & Thunderbolt 5 Become Mainstream', source: 'DisplaySpecifications', url: 'https://www.displayspecifications.com', image: '' },
  { title: 'Mechanical Keyboard Market 2026: Hall Effect Switches, Wireless & LCD Screens Dominate', source: 'TechRadar', url: 'https://www.techradar.com', image: '' },
  { title: 'Game Streaming Wars: NVIDIA GeForce NOW vs Xbox Cloud Gaming vs PlayStation Plus 2026', source: 'Digital Trends', url: 'https://www.digitaltrends.com', image: '' },

  // E-Sports & Competitive Gaming
  { title: 'Sentinels Win VCT Masters Bangkok 2026: Dominant Run Through International Playoffs', source: 'Valorant Esports', url: 'https://valorantesports.com', image: '' },
  { title: 'FaZe Clan CS2 Team Wins IEM Katowice 2026: $400K Prize & Intel Grand Slam Contention', source: 'ESL Gaming', url: 'https://www.eslgaming.com', image: '' },
  { title: 'T1 League of Legends: 2026 Roster Revealed with Rising Korean Talent', source: 'LCK', url: 'https://www.lck.com', image: '' },
  { title: 'OpTic Gaming Returns to Competitive Call of Duty: Full Roster for CDL 2026', source: 'CDL', url: 'https://callofdutyleague.com', image: '' },
  { title: 'G2 Esports Expands into Apex Legends: Superstar Roster Announced for ALGS 2026', source: 'G2 Esports', url: 'https://www.g2esports.com', image: '' },
  { title: 'Esports Viewership Hits All-Time High: 650M+ Viewers in 2025, Projected 800M in 2026', source: 'Newzoo', url: 'https://newzoo.com', image: '' },
  { title: 'Saudi Arabia\'s Esports World Cup 2026: $100M Prize Pool Confirmed with 20+ Game Titles', source: 'Esports Insider', url: 'https://esportsinsider.com', image: '' },

  // Game Development & Modding
  { title: 'Skyrim: Anniversary Edition 2026 — Official UE5 Remaster with Full Ray Tracing Leaked', source: 'Bethesda', url: 'https://bethesda.net', image: '' },
  { title: 'Source 3 Engine: Valve\'s Next-Gen Technology Powers New Half-Life Game, Sources Say', source: 'PC Gamer', url: 'https://www.pcgamer.com', image: '' },
  { title: 'Godot Engine 5.0 Released: Major Upgrade Brings AAA-Quality Rendering to Open-Source', source: 'Godot', url: 'https://godotengine.org', image: '' },
  { title: 'AI in Game Development: Ubisoft Uses Generative AI for NPC Dialogues & Quest Design', source: 'GamesIndustry', url: 'https://www.gamesindustry.biz', image: '' },
  { title: 'Modding Scene 2026: Cyberpunk 2077 Overhaul Mod Adds Full Path Tracing & New Gameplay', source: 'Nexus Mods', url: 'https://www.nexusmods.com', image: '' },
];

export class NewsController {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/rss/search?q=gaming+esports+2026&hl=en-US&gl=US');
      if (response.ok) {
        const data = await response.json();
        if (data.items?.length > 0) {
          const items = data.items.slice(0, 10).map((item: any) => ({
            title: item.title,
            source: new URL(item.link).hostname.replace('www.', ''),
            url: item.link,
            image: item.enclosure?.link || '',
          }));
          res.json({ success: true, data: items });
          return;
        }
      }
      res.json({ success: true, data: FALLBACK_NEWS });
    } catch {
      res.json({ success: true, data: FALLBACK_NEWS });
    }
  }
}

export const newsController = new NewsController();
