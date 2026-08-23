import prisma from '../config/database';
import { emitToUser } from '../socket-emitter';
import { notificationService } from './notification.service';
import { NotificationType } from '@prisma/client';

/**
 * Achievement catalog. Every entry is backed by a real, verifiable platform
 * event (first post, tournament registration, etc.) — never by invented stats.
 * `unlockByKey` is idempotent: the (profileId, key) unique index guarantees a
 * user can unlock each achievement at most once, which prevents farming.
 */
export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
  { key: 'FIRST_POST', title: 'First Post', description: 'Shared your first post on GamerzHub', icon: '📝', rarity: 'COMMON' },
  { key: 'FIRST_TOURNAMENT', title: 'First Blood', description: 'Registered for your first tournament', icon: '⚔️', rarity: 'COMMON' },
  { key: 'TOURNAMENT_TOP3', title: 'Podium Finish', description: 'Finished top 3 in a tournament', icon: '🥉', rarity: 'EPIC' },
  { key: 'TOURNAMENT_WINNER', title: 'Champion', description: 'Won a tournament', icon: '🏆', rarity: 'LEGENDARY' },
  { key: 'COMMUNITY_JOINER', title: 'Community Joiner', description: 'Joined your first community', icon: '👥', rarity: 'COMMON' },
  { key: 'GAME_CONNECTOR', title: 'Game Connector', description: 'Connected your first game account', icon: '🎮', rarity: 'COMMON' },
  { key: 'ENDORSED', title: 'Endorsed', description: 'Received your first endorsement', icon: '🤝', rarity: 'RARE' },
];

export class AchievementService {
  getCatalog() {
    return ACHIEVEMENT_CATALOG;
  }

  /**
   * Unlock an achievement for a user if they have not unlocked it already.
   * Best-effort: never throws into caller flows (fire-and-forget hooks call
   * `.catch(() => {})`).
   */
  async unlockByKey(userId: string, key: string) {
    const def = ACHIEVEMENT_CATALOG.find((a) => a.key === key);
    if (!def) return null;
    const profile = await prisma.profile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) return null;
    // Upsert-style guard: the unique index makes concurrent duplicate unlocks
    // fail gracefully, so check-then-create plus a P2002 catch is enough.
    const existing = await prisma.achievement.findUnique({
      where: { profileId_key: { profileId: profile.id, key } },
      select: { id: true },
    });
    if (existing) return null;
    try {
      const achievement = await prisma.achievement.create({
        data: { profileId: profile.id, key, title: def.title, description: def.description, icon: def.icon, rarity: def.rarity },
      });
      emitToUser(userId, 'achievement:unlocked', { achievement });
      await notificationService.create({
        userId,
        type: NotificationType.ACHIEVEMENT,
        title: `Achievement unlocked: ${def.title}`,
        message: def.description,
        link: `/passport/${(await prisma.profile.findUnique({ where: { id: profile.id }, select: { username: true } }))?.username || ''}`,
      });
      return achievement;
    } catch {
      // Duplicate (already unlocked concurrently) — treat as success.
      return null;
    }
  }

  /** Count of achievements the user has unlocked (for passport display). */
  async countForUser(userId: string): Promise<number> {
    const profile = await prisma.profile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) return 0;
    return prisma.achievement.count({ where: { profileId: profile.id } });
  }

  /** Catalog + which entries this user has unlocked (ordered, for progress). */
  async getProgressForUser(userId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) return { unlocked: [], catalog: ACHIEVEMENT_CATALOG };
    const rows = await prisma.achievement.findMany({
      where: { profileId: profile.id, key: { not: null } },
      select: { key: true, unlockedAt: true },
    });
    const unlockedMap = new Map(rows.map((r) => [r.key, r.unlockedAt]));
    return {
      catalog: ACHIEVEMENT_CATALOG,
      unlocked: ACHIEVEMENT_CATALOG.map((def) => ({ ...def, unlocked: unlockedMap.has(def.key), unlockedAt: unlockedMap.get(def.key) || null })),
    };
  }
}

export const achievementService = new AchievementService();
