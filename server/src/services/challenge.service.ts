import prisma from '../config/database';
import { notificationService } from './notification.service';
import { emitToUser } from '../socket-emitter';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';
import {
  ChallengeNotificationType,
  ChallengeStatus,
  ChallengeType,
  NotificationType,
  Prisma,
  ReportReason,
} from '@prisma/client';

export type ChallengeGame = 'clashofclans' | 'pubg';
export type ChallengeDirection = 'incoming' | 'outgoing' | 'all';
export type ChallengeWinner = 'challenger' | 'opponent' | 'draw';

export interface CreateChallengeInput {
  opponentId: string;
  game: string;
  challengeType: ChallengeType;
  gameMode: string;
  message?: string;
  scheduledAt?: string;
  expiresAt?: string;
  /** Additional challenger-team member usernames (captain is the creator). */
  challengerTeam?: string[];
  /** Additional opponent-team member usernames (captain is the challenged player). */
  opponentTeam?: string[];
}

export const SUPPORTED_CHALLENGE_GAMES: { id: ChallengeGame; name: string; icon: string; modes: string[] }[] = [
  {
    id: 'clashofclans',
    name: 'Clash of Clans',
    icon: '🏰',
    modes: ['Friendly Challenge', 'Clan War', 'Clan War League', 'Builder Base Battle'],
  },
  {
    id: 'pubg',
    name: 'PUBG (PC / Console)',
    icon: '🪖',
    modes: ['TPP Solo', 'FPP Solo', 'TPP Duo', 'FPP Duo', 'TPP Squad', 'FPP Squad', 'Custom Match'],
  },
];

const MAX_TEAM_SIZE = 5;
const MAX_EXPIRY_HOURS = 168; // 7 days
const VALID_STATUSES = new Set<ChallengeStatus>(['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED', 'COMPLETED']);

export const normalizeChallengeGame = (game: string): ChallengeGame => {
  const g = (game || '').trim().toLowerCase();
  if (g === 'clashofclans' || g === 'clash_of_clans' || g === 'coc') return 'clashofclans';
  if (g === 'pubg' || g === 'pubg_pc' || g === 'pubgpc') return 'pubg';
  throw new ValidationError({
    game: ['Unsupported game. Challenges are only available for Clash of Clans and PUBG (PC/Console).'],
  });
};

function publicUserSelect() {
  return { id: true, profile: { select: { username: true, displayName: true, avatar: true } } };
}

function challengeInclude() {
  return {
    challenger: { select: publicUserSelect() },
    opponent: { select: publicUserSelect() },
    teams: {
      include: {
        captain: { select: publicUserSelect() },
        members: { include: { user: { select: publicUserSelect() } } },
      },
    },
    participants: { include: { user: { select: publicUserSelect() } } },
  };
}

type ChallengeWithRelations = Prisma.ChallengeGetPayload<{ include: ReturnType<typeof challengeInclude> }>;

export class ChallengeService {
  getGameModes() {
    return SUPPORTED_CHALLENGE_GAMES.map(({ id, name, icon, modes }) => ({ game: id, name, icon, modes }));
  }

  private gameLabel(game: string): string {
    return SUPPORTED_CHALLENGE_GAMES.find((g) => g.id === game)?.name || game;
  }

  private displayName(user: { profile?: { displayName?: string | null; username?: string | null } | null }): string {
    return user?.profile?.displayName || user?.profile?.username || 'A gamer';
  }

  /** Mark a single challenge as expired and notify everyone involved. */
  private async markExpired(challengeId: string): Promise<void> {
    const challenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: { status: 'EXPIRED' },
      include: challengeInclude(),
    });
    await this.notifyParticipants(
      challenge,
      null,
      ChallengeNotificationType.CHALLENGE_EXPIRED,
      NotificationType.CHALLENGE_EXPIRED,
      '⚔️ Challenge Expired',
      'A challenge expired because it was not answered in time.',
      'challenge:expired',
      { status: 'EXPIRED' }
    );
  }

  /** Background sweep (called on an interval + lazily on reads). */
  async expireOverdue(): Promise<number> {
    let total = 0;
    // Loop in batches until the backlog drains (safely capped per sweep).
    for (let i = 0; i < 20; i++) {
      const overdue = await prisma.challenge.findMany({
        where: { status: 'PENDING', expiresAt: { lt: new Date() } },
        take: 200,
        select: { id: true },
      });
      if (overdue.length === 0) break;
      total += overdue.length;
      for (const c of overdue) {
        try {
          await this.markExpired(c.id);
        } catch (err: any) {
          console.error('[challenge-sweep] failed to expire', c.id, err?.message);
        }
      }
    }
    return total;
  }

  /** Notify every participant of a challenge except the actor (null = everyone). */
  private async notifyParticipants(
    challenge: ChallengeWithRelations,
    actorId: string | null,
    chType: ChallengeNotificationType,
    nType: NotificationType,
    title: string,
    message: string,
    event: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const ids = new Set<string>();
    (challenge.participants || []).forEach((p) => {
      if (p.userId) ids.add(p.userId);
    });
    (challenge.teams || []).forEach((t) => {
      if (t.captainId) ids.add(t.captainId);
    });
    if (actorId) ids.delete(actorId);
    for (const uid of ids) {
      await notificationService.create({
        userId: uid,
        type: nType,
        title,
        message,
        link: '/challenges',
        metadata: { challengeId: challenge.id, ...payload },
      });
      await prisma.challengeNotification.create({
        data: { challengeId: challenge.id, userId: uid, type: chType },
      });
      emitToUser(uid, event, { challengeId: challenge.id, ...payload });
    }
  }

  /** Resolve usernames → user ids for a challenge team (captain excluded). */
  private async resolveTeamMembers(
    usernames: string[] | undefined,
    excludeIds: Set<string>,
    field: string
  ): Promise<string[]> {
    const clean = [...new Set((usernames || []).map((u) => u.trim().toLowerCase()).filter(Boolean))];
    if (clean.length > MAX_TEAM_SIZE) {
      throw new ValidationError({ [field]: [`Maximum ${MAX_TEAM_SIZE} members per team`] });
    }
    if (clean.length === 0) return [];
    const profiles = await prisma.profile.findMany({
      where: { username: { in: clean, mode: 'insensitive' } },
      select: { userId: true, username: true },
    });
    const found = new Set(profiles.map((p) => p.username.toLowerCase()));
    const missing = clean.filter((u) => !found.has(u));
    if (missing.length > 0) {
      throw new ValidationError({ [field]: [`Unknown players: ${missing.join(', ')}`] });
    }
    const ids = profiles.map((p) => p.userId);
    if (ids.some((id) => excludeIds.has(id))) {
      throw new ValidationError({ [field]: ['Team contains the captain or a duplicate member'] });
    }
    ids.forEach((id) => excludeIds.add(id));
    return ids;
  }

  async createChallenge(userId: string, input: CreateChallengeInput): Promise<ChallengeWithRelations> {
    const game = normalizeChallengeGame(input.game);

    if (!input.opponentId || input.opponentId === userId) {
      throw new ValidationError({ opponentId: ['You cannot challenge yourself'] });
    }
    if (!input.gameMode || !input.gameMode.trim()) {
      throw new ValidationError({ gameMode: ['Game mode is required'] });
    }

    const [opponent, me] = await Promise.all([
      prisma.user.findUnique({
        where: { id: input.opponentId },
        include: { profile: { select: { username: true, displayName: true } } },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: { select: { username: true, displayName: true } } },
      }),
    ]);
    if (!opponent) throw new NotFoundError('User');

    // Blocked players can never challenge each other (either direction).
    const blocked = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: input.opponentId },
          { blockerId: input.opponentId, blockedId: userId },
        ],
      },
    });
    if (blocked) throw new ForbiddenError('You cannot challenge this player');

    // Prevent duplicate pending challenges between the same users for the same game.
    const existing = await prisma.challenge.findFirst({
      where: {
        game,
        status: 'PENDING',
        OR: [
          { challengerId: userId, opponentId: input.opponentId },
          { challengerId: input.opponentId, opponentId: userId },
        ],
      },
    });
    if (existing) {
      throw new ConflictError('A pending challenge already exists between you and this player for this game');
    }

    const now = new Date();
    let scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : now;
    if (Number.isNaN(scheduledAt.getTime())) throw new ValidationError({ scheduledAt: ['Invalid scheduled date'] });
    if (scheduledAt.getTime() < now.getTime() - 5 * 60 * 1000) {
      throw new ValidationError({ scheduledAt: ['Scheduled date must be in the future'] });
    }
    if (scheduledAt < now) scheduledAt = now;

    const expiresAt = input.expiresAt
      ? new Date(input.expiresAt)
      : new Date(scheduledAt.getTime() + 48 * 60 * 60 * 1000);
    if (Number.isNaN(expiresAt.getTime())) throw new ValidationError({ expiresAt: ['Invalid expiry date'] });
    if (expiresAt <= scheduledAt) throw new ValidationError({ expiresAt: ['Expiry must be after the scheduled time'] });
    if (expiresAt.getTime() > now.getTime() + MAX_EXPIRY_HOURS * 60 * 60 * 1000) {
      throw new ValidationError({ expiresAt: [`Expiry cannot be more than ${MAX_EXPIRY_HOURS} hours from now`] });
    }

    const message = input.message?.trim() || undefined;
    const meName = this.displayName(me || { profile: null });
    const opponentName = this.displayName(opponent);

    // Resolve team rosters for TEAM_VS_TEAM challenges.
    let challengerIds: string[] = [];
    let opponentIds: string[] = [];
    if (input.challengeType === 'TEAM_VS_TEAM') {
      const exclude = new Set<string>([userId, input.opponentId]);
      challengerIds = await this.resolveTeamMembers(input.challengerTeam, exclude, 'challengerTeam');
      opponentIds = await this.resolveTeamMembers(input.opponentTeam, exclude, 'opponentTeam');

      // Nobody who blocked you (or whom you blocked) can be drafted into the rosters.
      const memberIds = [...challengerIds, ...opponentIds];
      if (memberIds.length > 0) {
        const blockedPair = await prisma.userBlock.findFirst({
          where: {
            OR: memberIds.flatMap((mid) => [
              { blockerId: userId, blockedId: mid },
              { blockerId: mid, blockedId: userId },
            ]),
          },
        });
        if (blockedPair) {
          throw new ValidationError({ challengerTeam: ['One of the selected players has blocked you (or you blocked them)'] });
        }
      }
    }

    const challenge = await prisma.challenge.create({
      data: {
        game,
        challengeType: input.challengeType,
        gameMode: input.gameMode.trim(),
        message,
        scheduledAt,
        expiresAt,
        challenger: { connect: { id: userId } },
        opponent: { connect: { id: input.opponentId } },
        ...(input.challengeType === 'TEAM_VS_TEAM'
          ? {
              teams: {
                create: [
                  {
                    teamRole: 'CHALLENGER',
                    name: `${meName}'s Team`,
                    captain: { connect: { id: userId } },
                  },
                  {
                    teamRole: 'OPPONENT',
                    name: `${opponentName}'s Team`,
                    captain: { connect: { id: input.opponentId } },
                  },
                ],
              },
            }
          : {}),
      },
      include: challengeInclude(),
    });

    // Attach participants (and their team membership) after the challenge + teams exist.
    if (input.challengeType === 'TEAM_VS_TEAM') {
      const challengerTeam = challenge.teams.find((t) => t.teamRole === 'CHALLENGER');
      const opponentTeam = challenge.teams.find((t) => t.teamRole === 'OPPONENT');
      await prisma.challengeParticipant.createMany({
        data: [
          { challengeId: challenge.id, teamId: challengerTeam?.id, userId },
          { challengeId: challenge.id, teamId: opponentTeam?.id, userId: input.opponentId },
          ...challengerIds.map((uid) => ({ challengeId: challenge.id, teamId: challengerTeam?.id, userId: uid })),
          ...opponentIds.map((uid) => ({ challengeId: challenge.id, teamId: opponentTeam?.id, userId: uid })),
        ],
      });
    } else {
      await prisma.challengeParticipant.createMany({
        data: [
          { challengeId: challenge.id, userId },
          { challengeId: challenge.id, userId: input.opponentId },
        ],
      });
    }

    const gameName = this.gameLabel(game);
    const typeLabel = input.challengeType === 'ONE_VS_ONE' ? '1v1' : 'Team vs Team';

    await notificationService.create({
      userId: input.opponentId,
      type: NotificationType.CHALLENGE_RECEIVED,
      title: '⚔️ New Challenge',
      message: `${meName} challenged you to ${gameName} (${typeLabel} • ${input.gameMode.trim()}).`,
      link: '/challenges',
      metadata: { challengeId: challenge.id, game, challengeType: input.challengeType, status: 'PENDING' },
    });
    await prisma.challengeNotification.create({
      data: { challengeId: challenge.id, userId: input.opponentId, type: ChallengeNotificationType.NEW_CHALLENGE },
    });
    emitToUser(input.opponentId, 'challenge:new', {
      challengeId: challenge.id,
      game,
      gameMode: input.gameMode.trim(),
      challengeType: input.challengeType,
      from: { id: userId, username: meName },
    });

    return (await prisma.challenge.findUnique({
      where: { id: challenge.id },
      include: challengeInclude(),
    }))!;
  }

  async listChallenges(
    userId: string,
    query: { status?: string; direction?: ChallengeDirection; page?: number; limit?: number }
  ): Promise<{ data: ChallengeWithRelations[]; meta: Record<string, any> }> {
    await this.expireOverdue(); // lazy sweep so statuses are always accurate

    const { status, direction = 'all', page = 1, limit = 50 } = query;
    const where: Prisma.ChallengeWhereInput = {};
    if (direction === 'incoming') where.opponentId = userId;
    else if (direction === 'outgoing') where.challengerId = userId;
    else {
      where.OR = [{ opponentId: userId }, { challengerId: userId }, { participants: { some: { userId } } }];
    }

    if (status) {
      const statuses = status.split(',').map((s) => s.trim().toUpperCase()) as ChallengeStatus[];
      if (statuses.some((s) => !VALID_STATUSES.has(s))) {
        throw new ValidationError({ status: ['Invalid challenge status filter'] });
      }
      where.status = { in: statuses };
    }

    const [data, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: challengeInclude(),
      }),
      prisma.challenge.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getCounts(userId: string): Promise<{ incoming: number; outgoing: number; history: number }> {
    await this.expireOverdue();
    const [incoming, outgoing, history] = await Promise.all([
      prisma.challenge.count({ where: { opponentId: userId, status: { in: ['PENDING', 'ACCEPTED'] } } }),
      prisma.challenge.count({ where: { challengerId: userId, status: { in: ['PENDING', 'ACCEPTED'] } } }),
      prisma.challenge.count({
        where: {
          OR: [{ opponentId: userId }, { challengerId: userId }],
          status: { in: ['DECLINED', 'CANCELLED', 'EXPIRED', 'COMPLETED'] },
        },
      }),
    ]);
    return { incoming, outgoing, history };
  }

  async getChallenge(userId: string, id: string): Promise<ChallengeWithRelations> {
    const challenge = await prisma.challenge.findUnique({ where: { id }, include: challengeInclude() });
    if (!challenge) throw new NotFoundError('Challenge');
    const isPart =
      challenge.challengerId === userId ||
      challenge.opponentId === userId ||
      (challenge.participants || []).some((p) => p.userId === userId);
    if (!isPart) throw new ForbiddenError('You are not part of this challenge');

    if (challenge.status === 'PENDING' && challenge.expiresAt < new Date()) {
      await this.markExpired(challenge.id);
      return this.getChallenge(userId, id);
    }
    return challenge;
  }

  /**
   * Atomically transition a challenge from one status to another (guarded by
   * a conditional `updateMany`) so concurrent accept/decline/cancel calls
   * cannot both succeed.
   */
  private async transitionChallenge(
    id: string,
    fromStatuses: ChallengeStatus[],
    toStatus: ChallengeStatus,
    extraWhere: Prisma.ChallengeWhereInput = {},
    data: Prisma.ChallengeUpdateManyMutationInput = {}
  ): Promise<boolean> {
    const result = await prisma.challenge.updateMany({
      where: { id, status: { in: fromStatuses }, ...extraWhere },
      data: { status: toStatus, ...data },
    });
    return result.count > 0;
  }

  private async assertChallengePart(userId: string, id: string): Promise<{ opponentId: string; status: ChallengeStatus; expiresAt: Date; game: string }> {
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: { id: true, opponentId: true, status: true, expiresAt: true, game: true },
    });
    if (!challenge) throw new NotFoundError('Challenge');
    return challenge;
  }

  private challengeStatusError(status: ChallengeStatus | undefined): ConflictError {
    return new ConflictError(`Challenge is already ${(status || 'updated').toLowerCase()}`);
  }

  async acceptChallenge(userId: string, id: string): Promise<ChallengeWithRelations> {
    const existing = await this.assertChallengePart(userId, id);
    if (existing.opponentId !== userId) {
      throw new ForbiddenError('Only the challenged player can accept this challenge');
    }
    // Atomic PENDING → ACCEPTED; expired challenges never match.
    const ok = await this.transitionChallenge(id, ['PENDING'], 'ACCEPTED', { expiresAt: { gt: new Date() } });
    if (!ok) {
      const fresh = await prisma.challenge.findUnique({ where: { id }, select: { status: true, expiresAt: true } });
      if (fresh && fresh.status === 'PENDING') {
        // Expired — flip the status so the UI shows EXPIRED instead of PENDING.
        await prisma.challenge.update({ where: { id }, data: { status: 'EXPIRED' } });
        throw new ConflictError('This challenge has expired');
      }
      throw this.challengeStatusError(fresh?.status);
    }

    const updated = await prisma.challenge.findUnique({ where: { id }, include: challengeInclude() });
    await this.notifyParticipants(
      updated!,
      userId,
      ChallengeNotificationType.CHALLENGE_ACCEPTED,
      NotificationType.CHALLENGE_ACCEPTED,
      '⚔️ Challenge Accepted',
      `${this.displayName(updated!.opponent)} accepted the ${this.gameLabel(updated!.game)} challenge!`,
      'challenge:updated',
      { status: 'ACCEPTED' }
    );
    return updated!;
  }

  async declineChallenge(userId: string, id: string): Promise<ChallengeWithRelations> {
    const existing = await this.assertChallengePart(userId, id);
    if (existing.opponentId !== userId) {
      throw new ForbiddenError('Only the challenged player can decline this challenge');
    }
    const ok = await this.transitionChallenge(id, ['PENDING'], 'DECLINED');
    if (!ok) {
      const fresh = await prisma.challenge.findUnique({ where: { id }, select: { status: true } });
      throw this.challengeStatusError(fresh?.status);
    }

    const updated = await prisma.challenge.findUnique({ where: { id }, include: challengeInclude() });
    await this.notifyParticipants(
      updated!,
      userId,
      ChallengeNotificationType.CHALLENGE_DECLINED,
      NotificationType.CHALLENGE_DECLINED,
      '⚔️ Challenge Declined',
      `${this.displayName(updated!.opponent)} declined your ${this.gameLabel(updated!.game)} challenge.`,
      'challenge:updated',
      { status: 'DECLINED' }
    );
    return updated!;
  }

  async cancelChallenge(userId: string, id: string): Promise<ChallengeWithRelations> {
    await this.assertChallengePart(userId, id);
    const ok = await this.transitionChallenge(id, ['PENDING'], 'CANCELLED');
    if (!ok) {
      const fresh = await prisma.challenge.findUnique({ where: { id }, select: { status: true } });
      throw this.challengeStatusError(fresh?.status);
    }

    const updated = await prisma.challenge.findUnique({ where: { id }, include: challengeInclude() });
    await this.notifyParticipants(
      updated!,
      userId,
      ChallengeNotificationType.CHALLENGE_CANCELLED,
      NotificationType.CHALLENGE_CANCELLED,
      '⚔️ Challenge Cancelled',
      `A ${this.gameLabel(updated!.game)} challenge was cancelled.`,
      'challenge:updated',
      { status: 'CANCELLED' }
    );
    return updated!;
  }

  async completeChallenge(
    userId: string,
    id: string,
    winner?: ChallengeWinner
  ): Promise<ChallengeWithRelations> {
    const existing = await prisma.challenge.findUnique({
      where: { id },
      select: { challengerId: true, opponentId: true, status: true },
    });
    if (!existing) throw new NotFoundError('Challenge');
    if (existing.challengerId !== userId && existing.opponentId !== userId) {
      throw new ForbiddenError('Only the captains can complete a challenge');
    }
    const result = winner
      ? winner === 'draw'
        ? 'DRAW'
        : winner === 'challenger'
          ? 'CHALLENGER_WIN'
          : 'OPPONENT_WIN'
      : null;

    const ok = await this.transitionChallenge(id, ['ACCEPTED'], 'COMPLETED', {}, { result });
    if (!ok) {
      const fresh = await prisma.challenge.findUnique({ where: { id }, select: { status: true } });
      throw this.challengeStatusError(fresh?.status);
    }

    const updated = await prisma.challenge.findUnique({ where: { id }, include: challengeInclude() });
    await this.notifyParticipants(
      updated!,
      userId,
      ChallengeNotificationType.CHALLENGE_COMPLETED,
      NotificationType.CHALLENGE_COMPLETED,
      '⚔️ Challenge Completed',
      `The ${this.gameLabel(updated!.game)} challenge has been completed${result ? ` • ${result.replace('_', ' ')}` : ''}.`,
      'challenge:completed',
      { status: 'COMPLETED', result }
    );
    return updated!;
  }

  async blockUser(userId: string, targetId: string) {
    if (!targetId || targetId === userId) throw new ValidationError({ targetId: ['You cannot block yourself'] });
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundError('User');
    const existing = await prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } },
    });
    if (existing) throw new ConflictError('User is already blocked');

    // Blocking also cancels any pending challenges between the two users.
    await prisma.challenge.updateMany({
      where: {
        status: 'PENDING',
        OR: [
          { challengerId: userId, opponentId: targetId },
          { challengerId: targetId, opponentId: userId },
        ],
      },
      data: { status: 'CANCELLED' },
    });

    return prisma.userBlock.create({ data: { blockerId: userId, blockedId: targetId } });
  }

  async unblockUser(userId: string, targetId: string) {
    const result = await prisma.userBlock.deleteMany({ where: { blockerId: userId, blockedId: targetId } });
    if (result.count === 0) throw new NotFoundError('Block');
    return { success: true };
  }

  async listBlocks(userId: string) {
    const blocks = await prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: { blocked: { select: publicUserSelect() } },
      orderBy: { createdAt: 'desc' },
    });
    return blocks.map((b) => ({ id: b.id, createdAt: b.createdAt, user: b.blocked }));
  }

  async reportUser(userId: string, targetId: string, reason: ReportReason, description?: string, challengeId?: string) {
    if (!targetId || targetId === userId) throw new ValidationError({ targetId: ['You cannot report yourself'] });
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundError('User');

    // If reported from a challenge context, only participants may report.
    if (challengeId) {
      const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId },
        select: { challengerId: true, opponentId: true, participants: { select: { userId: true } } },
      });
      if (!challenge) throw new NotFoundError('Challenge');
      const isPart =
        challenge.challengerId === userId ||
        challenge.opponentId === userId ||
        challenge.participants.some((p) => p.userId === userId);
      if (!isPart) throw new ForbiddenError('You are not part of this challenge');
    }

    const existing = await prisma.report.findFirst({
      where: { reporterId: userId, reportedId: targetId, status: 'PENDING' },
    });
    if (existing) throw new ConflictError('You have already reported this user');
    return prisma.report.create({
      data: { reporterId: userId, reportedId: targetId, reason, description: description?.trim() || undefined },
    });
  }
}

export const challengeService = new ChallengeService();
