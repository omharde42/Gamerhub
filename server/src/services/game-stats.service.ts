import prisma from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';

export interface VerifyGameInput {
  userId: string;
  game: string; // 'Free Fire' | 'PUBG Mobile' | 'BGMI' | 'Valorant' | 'CS2' | 'Apex Legends' | 'COD Mobile'
  inGameUid: string;
  inGameName?: string;
  region?: string;
  screenshotBase64?: string;
}

/**
 * Game account verification.
 *
 * IMPORTANT: GamerZ Hub never fabricates statistics. If the external API for a
 * game is unavailable or returns no real data, the account is stored with null
 * statistics (and `verified` reflects actual verification status). No default
 * K/D, win rate or rank is ever invented.
 */
export class GameStatsService {
  async verifyAndLinkGameAccount(input: VerifyGameInput) {
    const { userId, game, inGameUid, region } = input;
    const normalizedGame = game.trim();

    const uid = inGameUid.trim();
    if (!uid) {
      throw new ValidationError({ inGameUid: ['In-Game UID is required'] });
    }

    // ── 1. Per-game validation & real API lookups ─────────────────────
    const realStats: {
      inGameName?: string;
      rank?: string | null;
      level?: number | null;
      kdRatio?: number | null;
      winRate?: number | null;
      totalMatches?: number | null;
      avatarUrl?: string | null;
      verified: boolean;
    } = {
      inGameName: input.inGameName?.trim() || undefined,
      rank: null,
      level: null,
      kdRatio: null,
      winRate: null,
      totalMatches: null,
      avatarUrl: null,
      verified: false,
    };

    if (normalizedGame.toLowerCase().includes('free fire')) {
      const cleanUid = uid.replace(/\D/g, '');
      if (!cleanUid || cleanUid.length < 6) {
        throw new ValidationError({ inGameUid: ['Free Fire UIDs are numeric and at least 6 digits long'] });
      }
      realStats.inGameName = input.inGameName?.trim() || `FF_Player_${cleanUid.slice(-4)}`;
      // Attempt a real public lookup. If it fails, we store the account with no
      // fabricated stats and mark it as unverified rather than inventing numbers.
      try {
        const ffRes = await fetch(`https://free-fire-api.vercel.app/api/v1/player?uid=${cleanUid}&region=${region || 'IND'}`);
        if (ffRes.ok) {
          const ffData = await ffRes.json();
          if (ffData?.name) {
            realStats.inGameName = ffData.name;
            realStats.level = typeof ffData.level === 'number' ? ffData.level : null;
            realStats.rank = typeof ffData.rank === 'string' ? ffData.rank : null;
            realStats.verified = true;
          }
        }
      } catch (err) {
        console.warn('Free Fire lookup failed (no stats will be fabricated):', err);
      }
    } else if (normalizedGame.toLowerCase().includes('valorant')) {
      const tagParts = uid.split('#');
      const name = tagParts[0]?.trim() || '';
      const tag = tagParts[1]?.trim() || '';
      if (!name || !/^\d{3,5}$/.test(tag)) {
        throw new ValidationError({ inGameUid: ['Valorant Riot IDs must use the format Name#TAG (e.g. TenZ#1234)'] });
      }
      realStats.inGameName = `${name}#${tag}`;
      try {
        const valRes = await fetch(`https://api.henrikdev.xyz/valorant/v1/mmr/ap/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
        if (valRes.ok) {
          const valData = await valRes.json();
          const tier = valData?.data?.currenttierpatched;
          if (tier) {
            realStats.rank = tier;
            realStats.level = typeof valData.data.ranking_in_tier === 'number' ? valData.data.ranking_in_tier : null;
            realStats.verified = true;
          }
        }
      } catch (err) {
        console.warn('Valorant lookup failed (no stats will be fabricated):', err);
      }
    } else if (normalizedGame.toLowerCase().includes('pubg') || normalizedGame.toLowerCase().includes('bgmi')) {
      // PUBG Mobile / BGMI have no official player-data API on this integration.
      // We never fabricate stats for them. Players who want verified stats should
      // connect PUBG PC/Console through the official integration.
      const cleanUid = uid.replace(/\D/g, '');
      if (!cleanUid || cleanUid.length < 6) {
        throw new ValidationError({ inGameUid: ['PUBG Mobile / BGMI character IDs are numeric and at least 6 digits long'] });
      }
      realStats.inGameName = input.inGameName?.trim() || `PUBG_Player_${cleanUid.slice(-4)}`;
    } else if (normalizedGame.toLowerCase().includes('cs2') || normalizedGame.toLowerCase().includes('cs go')) {
      throw new ValidationError({
        game: ['CS2 verification is not available yet. Connect your Steam account instead for verified profile data.'],
      });
    } else if (normalizedGame.toLowerCase().includes('call of duty') || normalizedGame.toLowerCase().includes('cod')) {
      throw new ValidationError({
        game: ['Call of Duty verification is not available yet on this integration.'],
      });
    } else {
      throw new ValidationError({
        game: ['Unsupported game for verification. Supported: Free Fire, Valorant, PUBG Mobile/BGMI (no verified stats available).'],
      });
    }

    // ── 2. Save or Upsert to PostgreSQL Database ──────────────────────
    const gameAccount = await prisma.gameAccount.upsert({
      where: {
        userId_game: {
          userId,
          game: normalizedGame,
        },
      },
      update: {
        inGameUid: uid,
        inGameName: realStats.inGameName || `Player_${uid.slice(-4)}`,
        region: region || 'Global',
        rank: realStats.rank,
        level: realStats.level,
        kdRatio: realStats.kdRatio,
        winRate: realStats.winRate,
        totalMatches: realStats.totalMatches,
        avatarUrl: realStats.avatarUrl,
        verified: realStats.verified,
        syncStatus: realStats.verified ? 'SUCCESS' : 'NO_DATA',
        verifiedAt: realStats.verified ? new Date() : undefined,
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        game: normalizedGame,
        inGameUid: uid,
        inGameName: realStats.inGameName || `Player_${uid.slice(-4)}`,
        region: region || 'Global',
        rank: realStats.rank,
        level: realStats.level,
        kdRatio: realStats.kdRatio,
        winRate: realStats.winRate,
        totalMatches: realStats.totalMatches,
        avatarUrl: realStats.avatarUrl,
        verified: realStats.verified,
        syncStatus: realStats.verified ? 'SUCCESS' : 'NO_DATA',
        verifiedAt: realStats.verified ? new Date() : undefined,
        lastSyncedAt: new Date(),
      },
    });

    return {
      gameAccount,
      verified: realStats.verified,
      statsAvailable: realStats.verified,
      message: realStats.verified
        ? `${normalizedGame} account verified with real data`
        : `${normalizedGame} account saved — no verified statistics are available yet. Stats are never fabricated; sync again later or connect an official integration.`,
    };
  }

  async getUserGameAccounts(userId: string) {
    return prisma.gameAccount.findMany({
      where: { userId },
      orderBy: { verifiedAt: 'desc' },
    });
  }

  async unlinkGameAccount(userId: string, gameAccountId: string) {
    const account = await prisma.gameAccount.findFirst({
      where: { id: gameAccountId, userId },
    });
    if (!account) throw new NotFoundError('Game account');

    await prisma.gameAccount.delete({
      where: { id: gameAccountId },
    });
    return { success: true };
  }
}

export const gameStatsService = new GameStatsService();
