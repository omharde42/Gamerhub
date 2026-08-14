import axios from 'axios';
import { AppError } from '../utils/errors';

export interface PubgPlayerStats {
  id: string;
  name: string;
  shard: string;
  clanId: string | null;
  banType: string;
  kills: number;
  deaths: number;
  wins: number;
  matches: number;
  kdRatio: string;
  winRate: string;
  accuracy: string;
  accuracyNote: string;
}

export class PubgService {
  private getApiKey(): string {
    const key = (process.env.PUBG_API_KEY || '').trim();
    if (!key) {
      throw new AppError('PUBG API key missing on server configuration.', 500);
    }
    return key;
  }

  /**
   * Validate that the identifier is a real PUBG PC/Console player name.
   * PUBG Mobile accounts use numeric UIDs — those are explicitly rejected
   * because they belong to a different platform and their stats are not
   * available through the PC/Console (Steam) API shard.
   */
  public validatePlayerName(playerName: string): string {
    const trimmed = (playerName || '').trim();
    if (!trimmed) {
      throw new AppError('PUBG player name is required.', 400);
    }
    if (trimmed.length < 2 || trimmed.length > 50) {
      throw new AppError('PUBG player name must be between 2 and 50 characters.', 400);
    }
    if (/^\d+$/.test(trimmed)) {
      throw new AppError(
        'PUBG Mobile UIDs are numeric IDs and are not supported for the PC/Console integration. Enter your PUBG PC/Steam player name instead.',
        400
      );
    }
    if (!/^[A-Za-z0-9_.\- ]+$/.test(trimmed)) {
      throw new AppError('PUBG player name contains unsupported characters.', 400);
    }
    return trimmed;
  }

  async getPlayerProfile(playerName: string, shard: string = 'steam'): Promise<PubgPlayerStats> {
    if (!shard || shard.toLowerCase() !== 'steam') {
      throw new AppError('Currently GamerZ Hub supports PUBG PC/Steam players only.', 400);
    }

    const validatedName = this.validatePlayerName(playerName);

    const apiKey = this.getApiKey();
    const encodedName = encodeURIComponent(validatedName);

    // Step 1: Query Player by Name
    let playerRes;
    try {
      playerRes = await axios.get(
        `https://api.pubg.com/shards/steam/players?filter[playerNames]=${encodedName}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/vnd.api+json',
          },
        }
      );
    } catch (apiErr: any) {
      const status = apiErr.response?.status;
      if (status === 404) {
        throw new AppError('PUBG player not found.', 404);
      }
      if (status === 401 || status === 403) {
        throw new AppError('PUBG API authorization failed. Check server configuration.', 401);
      }
      if (status === 429) {
        throw new AppError('PUBG API rate limit reached. Please try again later.', 429);
      }
      throw new AppError('Failed to fetch PUBG player data.', status || 500);
    }

    const playerData = playerRes.data?.data?.[0];
    if (!playerData) {
      throw new AppError('PUBG player not found.', 404);
    }

    const accountId = playerData.id;
    const realName = playerData.attributes?.name || playerName;
    const clanId = playerData.attributes?.clanId || null;
    const banType = playerData.attributes?.banType || 'Innocent';

    // Step 2: Fetch Lifetime Statistics
    let kills = 0;
    let deaths = 0;
    let wins = 0;
    let matches = 0;

    try {
      const statsRes = await axios.get(
        `https://api.pubg.com/shards/steam/players/${accountId}/seasons/lifetime`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/vnd.api+json',
          },
        }
      );

      const modeStats = statsRes.data?.data?.attributes?.gameModeStats;
      if (modeStats) {
        for (const modeKey in modeStats) {
          const mode = modeStats[modeKey];
          kills += mode.kills || 0;
          deaths += mode.losses || 0;
          wins += mode.wins || 0;
          matches += mode.roundsPlayed || 0;
        }
      }
    } catch (statsErr: any) {
      console.warn('Could not fetch PUBG lifetime stats:', statsErr.message);
    }

    const kdRatio = deaths > 0 ? (kills / deaths).toFixed(2) : (kills > 0 ? kills.toString() : '0.00');
    const winRate = matches > 0 ? `${((wins / matches) * 100).toFixed(1)}%` : '0.0%';

    return {
      id: accountId,
      name: realName,
      shard: 'steam',
      clanId,
      banType,
      kills,
      deaths,
      wins,
      matches,
      kdRatio: matches > 0 ? kdRatio : 'N/A',
      winRate: matches > 0 ? winRate : 'N/A',
      accuracy: 'N/A',
      accuracyNote: 'Not available from PUBG API',
    };
  }
}

export const pubgService = new PubgService();
