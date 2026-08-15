import { IGameConnector } from './base.connector';
import { clashOfClansService } from '../clashofclans.service';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';

/**
 * Clash of Clans connector.
 *
 * Verification & ownership policy:
 *  - The player tag is validated + normalized server-side, then verified
 *    against the official Supercell API BEFORE anything is persisted.
 *  - A public tag lookup proves the tag EXISTS — it does not prove the
 *    requesting user owns the account. Ownership cannot be proven with the
 *    public Clash API, so GamerZ Hub uses the safest feasible policy: a player
 *    may connect one tag, change it exactly once, and the tag is then locked
 *    to their account.
 *  - The one-time change lock is stored on the User row (clashTagChangeCount +
 *    clashTagHistory), which is independent of the deletable GameAccount row:
 *    disconnecting, deleting, logging out or refreshing never resets it.
 */
export class ClashOfClansConnector implements IGameConnector {
  gameKey = 'clashofclans';

  async validate(payload: Record<string, any>): Promise<boolean> {
    if (!payload.playerTag) throw new AppError('Player Tag is required', 400);
    return true;
  }

  async fetchProfile(gameUid: string): Promise<any> {
    return clashOfClansService.getPlayerProfile(gameUid);
  }

  async fetchStats(gameUid: string): Promise<any> {
    return clashOfClansService.getPlayerProfile(gameUid);
  }

  async connect(userId: string, payload: Record<string, any>): Promise<any> {
    await this.validate(payload);
    const tag = payload.playerTag;

    // 1. Verify against the official Clash API BEFORE persisting anything.
    //    Invalid or not-found tags throw here (404/400) and nothing is saved.
    const stats = await this.fetchProfile(tag);

    // 2. Normalize the tag (validated server-side by normalizeTag).
    const normalizedTag = `#${clashOfClansService.normalizeTag(tag)}`;

    // 3. Enforce the one-time tag-change rule using the DURABLE user-level lock
    //    (survives disconnect/logout/refresh) plus the current account row.
    const [existingAccount, user] = await Promise.all([
      prisma.gameAccount.findUnique({
        where: { userId_game: { userId, game: 'CLASH_OF_CLANS' } },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { clashTagChangeCount: true, clashTagHistory: true } }),
    ]);

    const durableChangeCount = user?.clashTagChangeCount ?? 0;
    const history: { tag: string; changedAt: string }[] = Array.isArray(user?.clashTagHistory) ? (user!.clashTagHistory as any) : [];
    const lastHistoryTag = history.length > 0 ? history[history.length - 1].tag : null;

    // Decide whether this connect is a tag CHANGE (consumes the one allowed
    // change) or a reconnect of the previously recorded tag (free). The check
    // runs against BOTH the current account row and the durable history, so a
    // disconnect/reconnect can never bypass the one-time restriction.
    let isTagChange: boolean;
    if (existingAccount) {
      isTagChange = existingAccount.inGameUid.toUpperCase() !== normalizedTag.toUpperCase();
    } else if (lastHistoryTag) {
      isTagChange = lastHistoryTag !== normalizedTag.toUpperCase();
    } else {
      isTagChange = false; // first-ever connection
    }

    if (isTagChange && durableChangeCount >= 1) {
      throw new AppError(
        'Player Tag Locked: You have used your one allowed Player Tag change. Reconnect your previous tag or contact support.',
        403
      );
    }

    const nextChangeCount = isTagChange ? durableChangeCount + 1 : durableChangeCount;

    const gameAccount = await prisma.gameAccount.upsert({
      where: {
        userId_game: {
          userId,
          game: 'CLASH_OF_CLANS',
        },
      },
      update: {
        inGameUid: normalizedTag,
        inGameName: stats.name,
        rank: `Town Hall ${stats.townHallLevel}`,
        level: stats.expLevel,
        changeCount: nextChangeCount,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        game: 'CLASH_OF_CLANS',
        inGameUid: normalizedTag,
        inGameName: stats.name,
        rank: `Town Hall ${stats.townHallLevel}`,
        level: stats.expLevel,
        // Mirror the durable user-level lock so reconnecting after a disconnect
        // cannot reset the visible changeCount.
        changeCount: nextChangeCount,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
    });

    // 4. Persist the durable lock + history independently of the GameAccount
    //    row so a disconnect can never reset the one-time change restriction.
    const nextHistory = isTagChange
      ? [...history, { tag: normalizedTag.toUpperCase(), changedAt: new Date().toISOString() }]
      : history.length === 0
        ? [{ tag: normalizedTag.toUpperCase(), changedAt: new Date().toISOString() }]
        : history;
    await prisma.user.update({
      where: { id: userId },
      data: {
        clashTagChangeCount: nextChangeCount,
        clashTagHistory: nextHistory,
      },
    });

    // 5. Update Profile rank (real API value only).
    await prisma.profile.updateMany({
      where: { userId },
      data: {
        rank: `Town Hall ${stats.townHallLevel}`,
      },
    });

    return { gameAccount, stats };
  }

  async disconnect(userId: string): Promise<boolean> {
    // Only the GameAccount row is deleted. The user-level tag lock
    // (clashTagChangeCount / clashTagHistory) is intentionally preserved.
    await prisma.gameAccount.deleteMany({
      where: { userId, game: 'CLASH_OF_CLANS' },
    });
    return true;
  }
}

export const clashOfClansConnector = new ClashOfClansConnector();
