import prisma from '../config/database';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';
import { clashOfClansConnector } from './game-connectors/clashofclans.connector';
import { pubgConnector } from './game-connectors/pubg.connector';
import { steamConnector } from './game-connectors/steam.connector';

export interface VerifyGameInput {
  userId: string;
  game: string;
  inGameUid: string;
  inGameName?: string;
  region?: string;
  screenshotBase64?: string;
}

export type VerificationResultStatus =
  | 'VERIFIED'
  | 'NO_DATA'
  | 'ACCOUNT_NOT_FOUND'
  | 'API_UNAVAILABLE'
  | 'UNSUPPORTED';

/**
 * Game account verification.
 *
 * GamerZ Hub never fabricates statistics, player names, ranks, K/D, win rates,
 * matches, levels, avatars, achievements or "verified" flags. Verified accounts
 * are only stored when a real, supported server-side API verification succeeds:
 *
 *   - Clash of Clans  → official Supercell API (player tag lookup)
 *   - PUBG (PC/Steam) → official PUBG API (player name lookup)
 *   - Steam           → official Steam Web API (steamID64 lookup)
 *
 * Every other game returns "This game does not currently support verified
 * account connection" and never creates an account. Numeric PUBG Mobile UIDs
 * and arbitrary identifiers are rejected — a public tag/name lookup proves the
 * account EXISTS, never that the requesting user OWNS it; ownership is enforced
 * by the one-time-connect policy per game (see ClashOfClansConnector).
 */
export class GameStatsService {
  /**
   * Map a user-facing game label to a connector game key. Returns null when the
   * game has no supported verified-connection integration.
   */
  private resolveGameKey(game: string): string | null {
    const g = (game || '').trim().toLowerCase();
    if (g.includes('clash')) return 'clashofclans';
    if (g === 'pubg' || g === 'pubg pc' || g === 'pubgpc' || g.includes('pubg') || g.includes('steam')) {
      if (g.includes('mobile') || g.includes('bgmi')) return null;
      if (g.includes('steam')) return 'steam';
      if (g.includes('pubg')) return 'pubg';
    }
    return null;
  }

  async verifyAndLinkGameAccount(input: VerifyGameInput) {
    const { userId, game } = input;
    const normalizedGame = (game || '').trim();
    if (!normalizedGame) {
      throw new ValidationError({ game: ['Game title is required'] });
    }

    const uid = (input.inGameUid || '').trim();
    if (!uid) {
      throw new ValidationError({ inGameUid: ['In-Game UID is required'] });
    }

    const gameKey = this.resolveGameKey(normalizedGame);
    if (!gameKey) {
      throw new AppError('This game does not currently support verified account connection.', 400);
    }

    // Delegate to the same connectors used by /api/game/:game/connect so every
    // entry point enforces identical rules (validation, API verification,
    // one-time tag change lock, no fabricated stats).
    if (gameKey === 'clashofclans') {
      const result = await clashOfClansConnector.connect(userId, { playerTag: uid });
      return {
        gameAccount: result.gameAccount,
        verified: true,
        statsAvailable: true,
        status: 'VERIFIED' as VerificationResultStatus,
        message: 'Clash of Clans account verified with real data from the official Supercell API.',
      };
    }

    if (gameKey === 'pubg') {
      const result = await pubgConnector.connect(userId, { playerName: uid });
      return {
        gameAccount: result.gameAccount,
        verified: true,
        statsAvailable: (result.stats?.matches ?? 0) > 0,
        status: 'VERIFIED' as VerificationResultStatus,
        message: 'PUBG PC/Steam account verified with real data from the official PUBG API.',
      };
    }

    if (gameKey === 'steam') {
      const result = await steamConnector.connect(userId, { steamId: uid });
      return {
        gameAccount: result.gameAccount,
        verified: true,
        statsAvailable: true,
        status: 'VERIFIED' as VerificationResultStatus,
        message: 'Steam account verified with real data from the official Steam Web API.',
      };
    }

    // Unreachable — kept for type-safety.
    throw new AppError('This game does not currently support verified account connection.', 400);
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

    // Clash of Clans: unlinking must never reset the one-time tag-change lock.
    // The durable lock lives on the User row (clashTagChangeCount) and survives
    // account deletion, disconnect, logout and refresh — deleting the account
    // row alone cannot touch it.
    await prisma.gameAccount.delete({
      where: { id: gameAccountId },
    });
    return { success: true };
  }
}

export const gameStatsService = new GameStatsService();
