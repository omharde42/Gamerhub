import { cocCache } from '../utils/cache';
import { AppError, NotFoundError } from '../utils/errors';

export interface ClashRoyalePlayerStats {
  tag: string;
  name: string;
  expLevel: number;
  trophies: number;
  bestTrophies: number;
  wins: number;
  losses: number;
  battleCount: number;
  threeCrownWins: number;
  challengeCardsWon: number;
  tournamentCardsWon: number;
  totalDonations: number;
  warDayWins: number;
  clanWarsWins: number;
  starPoints: number;
  arena?: { id: number; name: string };
  clan?: { tag: string; name: string; badgeId: number };
  leagueStatistics?: any;
  cards?: { name: string; level: number; maxLevel: number; count: number }[];
  currentDeck?: { name: string; level: number; maxLevel: number }[];
  cachedAt: string;
}

export class ClashRoyaleService {
  private apiBaseUrl = 'https://api.clashroyale.com/v1';

  private getApiToken(): string {
    const token = process.env.CLASH_ROYALE_API_TOKEN || process.env.CR_API_KEY || process.env.SUPERCELL_CR_TOKEN;
    if (!token) {
      console.warn('[ClashRoyaleService] Warning: No Clash Royale API Key env variable set.');
      return '';
    }
    return token.trim();
  }

  public normalizeTag(tag: string): string {
    if (!tag) throw new AppError('Player tag is required', 400);
    let cleaned = tag.trim().toUpperCase();
    if (cleaned.startsWith('#')) cleaned = cleaned.substring(1);
    return cleaned;
  }

  async getPlayerProfile(rawTag: string): Promise<ClashRoyalePlayerStats> {
    const tag = this.normalizeTag(rawTag);
    const cacheKey = `cr_player_${tag}`;
    const cachedData = cocCache.get(cacheKey);
    if (cachedData) return cachedData;

    const token = this.getApiToken();
    const encodedTag = `%23${tag}`;

    try {
      const response = await fetch(`${this.apiBaseUrl}/players/${encodedTag}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        const status = response.status;
        const reason = errorData?.reason;

        if (status === 404) throw new NotFoundError(`Player with tag #${tag}`);
        if (status === 403) {
          let serverIp = 'unknown';
          try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData: any = await ipRes.json();
            serverIp = ipData.ip || 'unknown';
          } catch (e) {}
          throw new AppError(`Supercell API Access Denied (${reason || 'invalidIp'}). Your server IP is ${serverIp}. Please add ${serverIp} to your API key at developer.clashroyale.com.`, 403);
        }
        if (status === 429) throw new AppError('Clash Royale API rate limit reached. Please try again in a few moments.', 429);
        throw new AppError(`Clash Royale API Error: ${errorData?.message || response.statusText}`, status);
      }

      const raw: any = await response.json();

      const formattedStats: ClashRoyalePlayerStats = {
        tag: raw.tag,
        name: raw.name,
        expLevel: raw.expLevel || 1,
        trophies: raw.trophies || 0,
        bestTrophies: raw.bestTrophies || raw.trophies || 0,
        wins: raw.wins || 0,
        losses: raw.losses || 0,
        battleCount: raw.battleCount || 0,
        threeCrownWins: raw.threeCrownWins || 0,
        challengeCardsWon: raw.challengeCardsWon || 0,
        tournamentCardsWon: raw.tournamentCardsWon || 0,
        totalDonations: raw.totalDonations || 0,
        warDayWins: raw.warDayWins || 0,
        clanWarsWins: raw.clanWarsWins || 0,
        starPoints: raw.starPoints || 0,
        arena: raw.arena ? { id: raw.arena.id, name: raw.arena.name } : undefined,
        clan: raw.clan ? { tag: raw.clan.tag, name: raw.clan.name, badgeId: raw.clan.badgeId || 0 } : undefined,
        leagueStatistics: raw.leagueStatistics,
        cards: raw.cards || [],
        currentDeck: raw.currentDeck || [],
        cachedAt: new Date().toISOString(),
      };

      cocCache.set(cacheKey, formattedStats, 5 * 60 * 1000);
      return formattedStats;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to fetch Clash Royale player data: ${error.message}`, 500);
    }
  }
}

export const clashRoyaleService = new ClashRoyaleService();