import { cocCache } from '../utils/cache';
import { AppError, NotFoundError } from '../utils/errors';

export interface ClashOfClansPlayerStats {
  tag: string;
  name: string;
  townHallLevel: number;
  townHallWeaponLevel?: number;
  expLevel: number;
  trophies: number;
  bestTrophies: number;
  warStars: number;
  attackWins: number;
  defenseWins: number;
  builderHallLevel?: number;
  versusTrophies?: number;
  bestVersusTrophies?: number;
  donations: number;
  donationsReceived: number;
  clanCapitalContributions: number;
  role?: string;
  clan?: {
    tag: string;
    name: string;
    clanLevel: number;
    badgeUrls: { small?: string; medium?: string; large?: string };
  };
  league?: {
    id: number;
    name: string;
    iconUrls: { small?: string; tiny?: string; medium?: string };
  };
  heroes?: { name: string; level: number; maxLevel: number; village: string }[];
  troops?: { name: string; level: number; maxLevel: number; village: string }[];
  spells?: { name: string; level: number; maxLevel: number; village: string }[];
  pets?: { name: string; level: number; maxLevel: number }[];
  achievements?: { name: string; stars: number; value: number; target: number; info: string; completionInfo?: string }[];
  labels?: { id: number; name: string; iconUrls: { small?: string; medium?: string } }[];
  legendStatistics?: any;
  warPreference?: string;
  cachedAt: string;
}

export class ClashOfClansService {
  private apiBaseUrl = 'https://api.clashofclans.com/v1';

  private getApiToken(): string {
    const token = process.env.CLASH_OF_CLANS_API_TOKEN || process.env.CLASH_API_KEY || process.env.SUPERCELL_COC_TOKEN || process.env.COC_API_KEY;
    if (!token) {
      console.warn('[ClashOfClansService] Warning: No Clash API Key env variable set.');
      return '';
    }
    return token.trim();
  }

  /**
   * Normalize player tag to uppercase with # prefix removed for URL encoding
   */
  public normalizeTag(tag: string): string {
    if (!tag) throw new AppError('Player tag is required', 400);
    let cleaned = tag.trim().toUpperCase();
    if (cleaned.startsWith('#')) {
      cleaned = cleaned.substring(1);
    }
    return cleaned;
  }

  /**
   * Fetch player profile with 5-minute server-side caching
   */
  async getPlayerProfile(rawTag: string): Promise<ClashOfClansPlayerStats> {
    const tag = this.normalizeTag(rawTag);
    const cacheKey = `coc_player_${tag}`;

    // 1. Check 5-minute memory cache
    const cachedData = cocCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // 2. Fetch fresh data from Supercell API
    const token = this.getApiToken();
    const encodedTag = `%23${tag}`;

    try {
      const response = await fetch(`${this.apiBaseUrl}/players/${encodedTag}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        const status = response.status;
        const reason = errorData?.reason;

        if (status === 404) {
          throw new NotFoundError(`Player with tag #${tag}`);
        }
        if (status === 403) {
          let serverIp = 'unknown';
          try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData: any = await ipRes.json();
            serverIp = ipData.ip || 'unknown';
          } catch (e) {}
          throw new AppError(`Supercell API Access Denied (${reason || 'invalidIp'}). Your Render server IP is ${serverIp}. Please add ${serverIp} to your API key at developer.clashofclans.com.`, 403);
        }
        if (status === 429) {
          throw new AppError('Clash of Clans API rate limit reached. Please try again in a few moments.', 429);
        }
        throw new AppError(`Clash of Clans API Error: ${errorData?.message || response.statusText}`, status);
      }

      const raw: any = await response.json();

      // 3. Transform to clean, structured player object
      const formattedStats: ClashOfClansPlayerStats = {
        tag: raw.tag,
        name: raw.name,
        townHallLevel: raw.townHallLevel || 1,
        townHallWeaponLevel: raw.townHallWeaponLevel,
        expLevel: raw.expLevel || 1,
        trophies: raw.trophies || 0,
        bestTrophies: raw.bestTrophies || raw.trophies || 0,
        warStars: raw.warStars || 0,
        attackWins: raw.attackWins || 0,
        defenseWins: raw.defenseWins || 0,
        builderHallLevel: raw.builderHallLevel,
        versusTrophies: raw.versusTrophies,
        bestVersusTrophies: raw.bestVersusTrophies,
        donations: raw.donations || 0,
        donationsReceived: raw.donationsReceived || 0,
        clanCapitalContributions: raw.clanCapitalContributions || 0,
        heroes: raw.heroes || [],
        troops: raw.troops || [],
        spells: raw.spells || [],
        pets: raw.pets || [],
        achievements: raw.achievements || [],
        labels: raw.labels || [],
        legendStatistics: raw.legendStatistics,
        warPreference: raw.warPreference,
        role: raw.role,
        clan: raw.clan
          ? {
              tag: raw.clan.tag,
              name: raw.clan.name,
              clanLevel: raw.clan.clanLevel,
              badgeUrls: raw.clan.badgeUrls || {},
            }
          : undefined,
        league: raw.league
          ? {
              id: raw.league.id,
              name: raw.league.name,
              iconUrls: raw.league.iconUrls || {},
            }
          : undefined,
        cachedAt: new Date().toISOString(),
      };

      // 4. Save into 5-minute memory cache
      cocCache.set(cacheKey, formattedStats, 5 * 60 * 1000);

      return formattedStats;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to fetch Clash of Clans player data: ${error.message}`, 500);
    }
  }
}

export const clashOfClansService = new ClashOfClansService();
