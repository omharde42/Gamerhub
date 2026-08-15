import prisma from '../config/database';
import { AppError, NotFoundError } from '../utils/errors';

export interface SteamGame {
  appId: number;
  name: string;
  playtime2WeeksMinutes?: number;
  playtimeForeverMinutes: number;
  playtimeForeverHours: number;
  iconUrl: string;
  headerUrl: string;
}

export interface SteamAchievement {
  apiName: string;
  name: string;
  description: string;
  achieved: boolean;
  unlockTime?: string;
  icon: string;
}

export interface SteamFullProfile {
  steamId: string;
  username: string;
  avatar: string;
  profileUrl: string;
  level: number | null;
  connectedAt?: Date;
  totalGames: number;
  totalPlaytimeHours: number;
  recentlyPlayed: SteamGame[];
  topGames: SteamGame[];
  achievements: SteamAchievement[];
}

const STEAM_API_BASE = 'https://api.steampowered.com';
const REQUEST_TIMEOUT_MS = 10_000;

async function fetchJson(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new AppError(`Steam API returned status ${res.status}`, res.status >= 500 ? 502 : 400);
    }
    return await res.json();
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    if (err?.name === 'AbortError') {
      throw new AppError('Steam API request timed out. Please try again later.', 504);
    }
    throw new AppError('Steam API is currently unavailable. Please try again later.', 502);
  } finally {
    clearTimeout(timer);
  }
}

export class SteamService {
  private getApiKey(): string {
    const key = (process.env.STEAM_API_KEY || '').trim();
    if (!key) {
      throw new AppError('Steam API key missing on server configuration. Verified Steam data is unavailable.', 500);
    }
    return key;
  }

  private validateSteamId(steamId: string): string {
    const id = (steamId || '').trim();
    if (!/^\d{17}$/.test(id)) {
      throw new AppError('Steam ID64 must be a 17-digit numeric SteamID (e.g. 76561198012345678).', 400);
    }
    return id;
  }

  /**
   * Fetch a Steam profile from the official Steam Web API.
   *
   * Returns ONLY data returned by the API. Nothing is fabricated: when the API
   * key is missing, the account is not found, or a request fails, this throws a
   * clear error instead of inventing games, playtime or achievements.
   */
  async getSteamProfileData(steamId: string): Promise<SteamFullProfile> {
    const id = this.validateSteamId(steamId);
    const apiKey = this.getApiKey();

    // 1. Fetch Player Summary (proves the account exists)
    const summaryRes = await fetchJson(
      `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${id}`
    );
    const player = summaryRes?.response?.players?.[0];
    if (!player) {
      throw new NotFoundError('Steam player');
    }

    const username = player.personaname || '';
    const avatar = player.avatarfull || player.avatar || '';
    const profileUrl = player.profileurl || `https://steamcommunity.com/profiles/${id}`;

    // 2. Fetch Steam Level (optional; null when unavailable)
    let level: number | null = null;
    try {
      const levelRes = await fetchJson(
        `${STEAM_API_BASE}/IPlayerService/GetSteamLevel/v1/?key=${apiKey}&steamid=${id}`
      );
      if (levelRes?.response?.player_level !== undefined) {
        level = levelRes.response.player_level;
      }
    } catch (err) {
      console.warn('[SteamService] Steam level fetch failed (kept as unavailable):', (err as Error).message);
    }

    // 3. Fetch Recently Played Games (empty when none / private profile)
    let recentlyPlayed: SteamGame[] = [];
    try {
      const recentRes = await fetchJson(
        `${STEAM_API_BASE}/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${apiKey}&steamid=${id}&count=10`
      );
      recentlyPlayed = (recentRes?.response?.games || []).map((g: any) => ({
        appId: g.appid,
        name: g.name,
        playtime2WeeksMinutes: g.playtime_2weeks || 0,
        playtimeForeverMinutes: g.playtime_forever || 0,
        playtimeForeverHours: Math.round(((g.playtime_forever || 0) / 60) * 10) / 10,
        iconUrl: g.img_icon_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg` : '',
        headerUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
      }));
    } catch (err) {
      console.warn('[SteamService] Recently-played fetch failed (kept empty):', (err as Error).message);
    }

    // 4. Fetch Owned Games (empty when private profile / API error)
    let ownedGames: SteamGame[] = [];
    try {
      const ownedRes = await fetchJson(
        `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${id}&include_appinfo=true&include_played_free_games=true`
      );
      ownedGames = (ownedRes?.response?.games || [])
        .map((g: any) => ({
          appId: g.appid,
          name: g.name,
          playtimeForeverMinutes: g.playtime_forever || 0,
          playtimeForeverHours: Math.round(((g.playtime_forever || 0) / 60) * 10) / 10,
          iconUrl: g.img_icon_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg` : '',
          headerUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
        }))
        .sort((a: SteamGame, b: SteamGame) => b.playtimeForeverHours - a.playtimeForeverHours);
    } catch (err) {
      console.warn('[SteamService] Owned-games fetch failed (kept empty):', (err as Error).message);
    }

    const totalPlaytimeHours = Math.round(ownedGames.reduce((acc, g) => acc + g.playtimeForeverHours, 0));

    return {
      steamId: id,
      username: username || `Steam_${id.slice(-4)}`,
      avatar,
      profileUrl,
      level,
      totalGames: ownedGames.length,
      totalPlaytimeHours,
      recentlyPlayed,
      topGames: ownedGames.slice(0, 8),
      // Achievements require per-app schema lookups (playerstats) and are not
      // fabricated — they are simply unavailable through this flow.
      achievements: [],
    };
  }

  async getUserSteamProfile(userId: string): Promise<SteamFullProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        steamId: true,
        steamUsername: true,
        steamAvatar: true,
        steamProfileUrl: true,
        steamLevel: true,
        steamConnectedAt: true,
      },
    });

    if (!user || !user.steamId) return null;

    const steamData = await this.getSteamProfileData(user.steamId);
    return {
      ...steamData,
      connectedAt: user.steamConnectedAt || undefined,
    };
  }
}

export const steamService = new SteamService();
