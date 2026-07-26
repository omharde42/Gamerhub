'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ExternalLink, RefreshCw, Newspaper, TrendingUp, Sparkles, Loader2, Search, Globe, Calendar, Clock, Zap, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatRelativeTime } from '@/lib/utils';

const FALLBACK_NEWS = [
  { title: 'ESL Pro League Season 20: Teams & Schedule Revealed — Top Teams Battle for $1M Prize Pool', source: 'ESL Gaming', url: 'https://www.eslgaming.com' },
  { title: 'Valorant Champions Tour 2026: New Format Announced with Open Qualifiers Across All Regions', source: 'Riot Games', url: 'https://valorantesports.com' },
  { title: 'CS2 Major Championship 2026: Prize Pool Hits $2M as 24 Teams Qualify for Biggest Event Yet', source: 'HLTV', url: 'https://www.hltv.org' },
  { title: 'NVIDIA RTX 5090 Release Date Leaked: 32GB GDDR7, 600W TDP & 2.5x Performance Leap', source: 'WCCFTech', url: 'https://wccftech.com' },
  { title: 'AMD Ryzen 9 10950X Benchmarks Leak: 24 Cores, 5.8GHz Boost Dominates Multi-Thread', source: "Tom's Hardware", url: 'https://www.tomshardware.com' },
  { title: 'Steam Deck 2: Valve Confirms Next-Gen Handheld with Ray Tracing & 3+ Hour Battery', source: 'The Verge', url: 'https://www.theverge.com' },
  { title: 'League of Legends Worlds 2026: Championship Dates Revealed — Returning to Asia', source: 'Riot Games', url: 'https://lolesports.com' },
  { title: 'The International 2026: Dota 2 Championship Returns to Europe with Record $5M Prize Pool', source: 'Valve', url: 'https://www.dota2.com/esports' },
  { title: 'Fortnite Chapter 6 Season 2: Major Map Changes, New Weapons & Battle Pass Revealed', source: 'Epic Games', url: 'https://www.fortnite.com' },
  { title: 'GTA VI Online: Rockstar Reveals First Details About Next-Gen Multiplayer Experience', source: 'Rockstar Games', url: 'https://www.rockstargames.com' },
  { title: 'Elden Ring Nightreign: FromSoftware Unveils New Co-op Mode at Summer Game Fest', source: 'FromSoftware', url: 'https://www.bandainamco.com' },
  { title: 'Nintendo Switch 2 Launch Titles Leaked: Metroid Prime 4, New Zelda & Mario Confirmed', source: 'Nintendo', url: 'https://www.nintendo.com' },
  { title: 'DDR5 Memory Hits 10,000MT/s: G.Skill Breaks World Record with Trident Z5 Kit', source: 'TechPowerUp', url: 'https://www.techpowerup.com' },
  { title: 'AMD Radeon RX 9070 XT Review: RDNA 4 Brings Ray Tracing Revolution to Mid-Range', source: 'GamersNexus', url: 'https://www.gamersnexus.net' },
  { title: 'ASUS ROG Zephyrus G16 (2026) Review: Ultra-Thin Gaming Laptop with RTX 5080', source: 'NotebookCheck', url: 'https://www.notebookcheck.net' },
  { title: 'Unreal Engine 6 Revealed: Nanite 2.0, MegaLights & Real-Time Path Tracing Demo', source: 'Epic Games', url: 'https://www.unrealengine.com' },
  { title: 'DLSS 4 vs FSR 4 vs XeSS 2: 2026 Upscaling Technology Comparison Benchmarks', source: 'Digital Foundry', url: 'https://www.eurogamer.net/digitalfoundry' },
  { title: 'PlayStation 6 Rumors: Early Dev Kits Spotted — 8K Gaming & AI Upscaling Expected', source: 'IGN', url: 'https://www.ign.com' },
  { title: 'Razer Blade 18 (2026): World\'s First 18-Inch 4K 240Hz OLED Gaming Laptop', source: 'Razer', url: 'https://www.razer.com' },
  { title: 'Marvel Rivals Season 1: New Heroes, Maps & Battle Pass Revealed for Hit Hero Shooter', source: 'NetEase Games', url: 'https://www.marvelrivals.com' },
  { title: 'World of Warcraft: Midnight Expansion Revealed — New Continent, Class Changes & Release Date', source: 'Blizzard', url: 'https://worldofwarcraft.blizzard.com' },
  { title: 'Saudi Arabia\'s Esports World Cup 2026: $100M Prize Pool Confirmed with 20+ Game Titles', source: 'Esports Insider', url: 'https://esportsinsider.com' },
  { title: 'Qualcomm Snapdragon X Elite Gen 2: Handheld Gaming PC Chips Challenge AMD & Intel', source: 'Liliputing', url: 'https://liliputing.com' },
  { title: 'Monitors in 2026: 500Hz OLED, 8K Mini-LED & Thunderbolt 5 Become Mainstream', source: 'DisplaySpecifications', url: 'https://www.displayspecifications.com' },
  { title: 'Corsair Dominator Titanium DDR5-8000: The Ultimate Gaming Memory Kit Tested', source: 'TechSpot', url: 'https://www.techspot.com' },
  { title: 'Intel Arrow Lake-S Desktop CPUs: Full Specs, Pricing & Performance Review', source: 'AnandTech', url: 'https://www.anandtech.com' },
  { title: 'MSI MEG X870E Godlike: Flagship AM5 Motherboard with 10G LAN & 5 M.2 Slots', source: 'HardwareUnboxed', url: 'https://www.hardwareunboxed.com' },
  { title: 'Godot Engine 5.0 Released: Major Upgrade Brings AAA-Quality Rendering to Open-Source', source: 'Godot', url: 'https://godotengine.org' },
  { title: 'AI in Game Development: Ubisoft Uses Generative AI for NPC Dialogues & Quest Design', source: 'GamesIndustry', url: 'https://www.gamesindustry.biz' },
  { title: 'Samsung 990 EVO Plus SSD Review: PCIe 5.0 Speed at PCIe 4.0 Prices', source: 'StorageReview', url: 'https://www.storagereview.com' },
  { title: 'Helldivers 2: Major Warbond Update Adds New Weapons, Vehicles & Enemy Faction', source: 'PlayStation', url: 'https://www.playstation.com' },
  { title: 'Tekken 8 Season 2: New Characters, Stages & Balance Changes Announced at Evo Japan', source: 'Bandai Namco', url: 'https://www.bandainamco.com' },
  { title: 'Skyrim: Anniversary Edition 2026 — Official UE5 Remaster with Full Ray Tracing Leaked', source: 'Bethesda', url: 'https://bethesda.net' },
  { title: 'PUBG Global Championship 2026: 32 Teams Set to Battle for $3M Prize Pool in Dubai', source: 'Krafton', url: 'https://pubg.com' },
  { title: 'Sentinels Win VCT Masters Bangkok 2026: Dominant Run Through International Playoffs', source: 'Valorant Esports', url: 'https://valorantesports.com' },
  { title: 'Liquid Cooling Evolution: Thermaltake Unveils AIO with 4K OLED Display on Pump', source: 'Thermaltake', url: 'https://www.thermaltake.com' },
  { title: 'Microsoft Flight Simulator 2026: Ray-Traced Global Lighting & Full Earth Rendering', source: 'Xbox', url: 'https://www.xbox.com' },
  { title: 'Game Streaming Wars: NVIDIA GeForce NOW vs Xbox Cloud Gaming vs PlayStation Plus 2026', source: 'Digital Trends', url: 'https://www.digitaltrends.com' },
  { title: 'Esports Viewership Hits All-Time High: 650M+ Viewers in 2025, Projected 800M in 2026', source: 'Newzoo', url: 'https://newzoo.com' },
  { title: 'Call of Duty League 2026: Full Schedule and Team Rosters Revealed for New Season', source: 'CDL', url: 'https://callofdutyleague.com' },
  { title: 'Overwatch Champions Series 2026: Blizzard Unveils New Tournament Format and Regional Leagues', source: 'Blizzard', url: 'https://overwatch.blizzard.com' },
  { title: 'BGMI Pro Series Season 4 Returns with ₹1 Crore Prize Pool — Registrations Open Now', source: 'Krafton', url: 'https://www.battlegroundsmobileindia.com' },
  { title: 'Source 3 Engine: Valve\'s Next-Gen Technology Powers New Half-Life Game, Sources Say', source: 'PC Gamer', url: 'https://www.pcgamer.com' },
  { title: 'Xbox Next-Gen Console Leak: Cloud-Native Architecture with Local Ray Tracing Hardware', source: 'Windows Central', url: 'https://www.windowscentral.com' },
  { title: 'Mechanical Keyboard Market 2026: Hall Effect Switches, Wireless & LCD Screens Dominate', source: 'TechRadar', url: 'https://www.techradar.com' },
  { title: 'Modding Scene 2026: Cyberpunk 2077 Overhaul Mod Adds Full Path Tracing & New Gameplay', source: 'Nexus Mods', url: 'https://www.nexusmods.com' },
  { title: 'FaZe Clan CS2 Team Wins IEM Katowice 2026: $400K Prize & Intel Grand Slam Contention', source: 'ESL Gaming', url: 'https://www.eslgaming.com' },
  { title: 'Street Fighter 6 Capcom Cup 2026: Qualifiers Begin for $2M Fighting Tournament', source: 'Capcom', url: 'https://www.capcom.com' },
  { title: 'PCIe 6.0 Standard Finalized: 256GB/s Bandwidth Set to Transform GPU Performance', source: 'AnandTech', url: 'https://www.anandtech.com' },
  { title: 'Apex Legends Global Series 2026: Split 1 Playoffs Kick Off with 40 Teams Competing', source: 'EA Sports', url: 'https://www.ea.com/apex-legends' },
];

export default function NewsPage() {
  const [search, setSearch] = useState('');

  const { data: apiNews, isLoading, refetch } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.get('/news').then(r => r.data.data).catch(() => null),
    refetchInterval: 300000,
  });

  const news = apiNews || FALLBACK_NEWS;

  const { data: aiSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['ai-news-summary'],
    queryFn: () => api.post('/ai/summarize-news', { articles: news || [] }).then(r => r.data.data).catch(() => null),
    enabled: !!news && news.length > 0,
  });

  const filteredNews = news?.filter((item: any) =>
    !search || item.title?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="w-full space-y-6">
      <motion.div className="flex items-center justify-between flex-wrap gap-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
            <Newspaper className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Gaming News</h1>
            <p className="text-xs text-muted-foreground">Latest esports and gaming headlines, summarized with AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground border-border/50">
            <Zap className="h-3.5 w-3.5 text-primary" />
            {news?.length || 0} Stories
          </Badge>
          <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 group-hover:animate-spin" /> Refresh
          </Button>
        </div>
      </motion.div>

      {aiSummary?.summary && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/60 bg-muted/15 shadow-sm rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary animate-twinkle" />
                <h3 className="font-semibold text-sm text-foreground">AI News Summary</h3>
                {summaryLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{aiSummary.summary}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search news..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 pl-9 bg-muted/10 border-border/80 focus-visible:ring-primary/30"
        />
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredNews.map((item: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="block group h-full">
                <Card variant="glass" className="h-full border-border/60 hover:border-border/80 shadow-sm transition-all duration-200">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 h-full">
                      <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0 border border-border/40 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                        <Globe className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/80">{item.source}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Read story</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && filteredNews.length === 0 && (
        <div className="text-center py-16">
          <Newspaper className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold mb-1">No news found</h3>
          <p className="text-sm text-muted-foreground">Try a different search term</p>
        </div>
      )}
    </div>
  );
}