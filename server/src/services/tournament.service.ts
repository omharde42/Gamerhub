import prisma from '../config/database';
import { TournamentType, TournamentStatus, MatchStatus, OrgMemberRole, NotificationType } from '@prisma/client';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../utils/errors';
import { emitToUser } from '../socket-emitter';
import { notificationService } from './notification.service';
import { achievementService } from './achievement.service';

const ORGANIZER_ROLES = [OrgMemberRole.OWNER, OrgMemberRole.ADMIN, OrgMemberRole.MODERATOR];

export class TournamentService {
  async create(data: { title: string; description?: string; game: string; type?: TournamentType; format?: TournamentType; maxTeams: number; prizePool?: number; entryFee?: number; startDate: string; rules?: string }, userId: string) {
    const { startDate, ...rest } = data;
    const type = rest.type || rest.format || TournamentType.SINGLE_ELIMINATION;
    const organizerId = await this.resolveOrganizerId(userId);
    return prisma.tournament.create({
      data: {
        title: rest.title,
        description: rest.description,
        game: rest.game,
        type,
        maxTeams: rest.maxTeams,
        prizePool: rest.prizePool,
        entryFee: rest.entryFee,
        startDate: new Date(startDate),
        rules: rest.rules,
        organizerId,
        status: TournamentStatus.REGISTRATION_OPEN,
      },
    });
  }

  /**
   * Tournament.organizerId is an FK to Organization, but tournaments are
   * created by plain users. Resolve the user's organization (first membership,
   * else the org they own, else a personal org created on the fly) so the FK
   * always holds.
   */
  private async resolveOrganizerId(userId: string): Promise<string> {
    const membership = await prisma.organizationMember.findFirst({
      where: { userId },
      select: { organizationId: true },
    });
    if (membership) return membership.organizationId;
    const owned = await prisma.organization.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });
    if (owned) return owned.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profile: { select: { username: true } }, email: true },
    });
    const username = user?.profile?.username || user?.email?.split('@')[0] || 'user';
    const slugBase = username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const org = await prisma.organization.create({
      data: {
        name: `${username}'s Organization`,
        slug: `${slugBase}-org-${userId.slice(0, 8)}`,
        ownerId: userId,
      },
    });
    return org.id;
  }

  /** True when the user owns/admins/moderates the org running the tournament. */
  private async isOrganizer(tournamentId: string, userId: string): Promise<boolean> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { organizerId: true },
    });
    if (!tournament) return false;
    const org = await prisma.organization.findUnique({
      where: { id: tournament.organizerId },
      select: { ownerId: true },
    });
    if (org && org.ownerId === userId) return true;
    const membership = await prisma.organizationMember.findFirst({
      where: { organizationId: tournament.organizerId, userId, role: { in: ORGANIZER_ROLES } },
      select: { id: true },
    });
    return Boolean(membership);
  }

  private async assertOrganizer(tournamentId: string, userId: string) {
    if (!(await this.isOrganizer(tournamentId, userId))) {
      throw new ForbiddenError('Only tournament organizers can perform this action');
    }
  }

  async getById(id: string, viewerUserId?: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true, avatar: true } },
        teams: { include: { team: { include: { members: { include: { user: { select: { id: true, profile: true } } } } } }, members: { include: { user: { select: { id: true, profile: true } } } } } },
        matches: {
          include: {
            team1: { include: { team: { select: { id: true, name: true, avatar: true } } } },
            team2: { include: { team: { select: { id: true, name: true, avatar: true } } } },
          },
          orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
        },
        participants: { include: { user: { select: { id: true, profile: true } } } },
        disputes: { include: { reporter: { select: { id: true, profile: { select: { username: true, avatar: true } } } } }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!tournament) throw new NotFoundError('Tournament');
    if (viewerUserId) {
      (tournament as any).isOrganizer = await this.isOrganizer(id, viewerUserId);
    }
    return tournament;
  }
  async list(params: { page?: number; limit?: number; status?: TournamentStatus; game?: string; search?: string }) {
    const { page = 1, limit = 20, status, game, search } = params;
    const where: { status?: TournamentStatus; game?: string; OR?: Array<{ title?: { contains: string; mode: 'insensitive' }; game?: { contains: string; mode: 'insensitive' } }> } = {};
    if (status) where.status = status;
    if (game) where.game = game;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { game: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { organizer: { select: { id: true, name: true, avatar: true } }, _count: { select: { teams: true } } },
        orderBy: { startDate: 'asc' },
      }),
      prisma.tournament.count({ where }),
    ]);
    return { data: tournaments, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } };
  }
  /**
   * Register for a tournament:
   * - with a teamId: the team must exist and the caller must be a member;
   *   double-registration is blocked by the TournamentTeam unique constraint.
   * - without a teamId: the caller registers as an individual
   *   TournamentParticipant (blocked by the TournamentParticipant unique pair).
   * Spot count = registered teams + individual participants vs maxTeams.
   */
  async registerTeam(tournamentId: string, teamId: string | undefined, userId: string) {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { id: true, status: true, maxTeams: true, organizerId: true } });
    if (!tournament) throw new NotFoundError('Tournament');
    if (tournament.status !== 'REGISTRATION_OPEN' && tournament.status !== 'DRAFT') {
      throw new ForbiddenError('Registration is not open for this tournament');
    }
    if (teamId) {
      const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: { select: { userId: true } } } });
      if (!team) throw new NotFoundError('Team');
      if (!team.members.some((m) => m.userId === userId)) {
        throw new ForbiddenError('You must be a member of the team to register it');
      }
      const existing = await prisma.tournamentTeam.findUnique({ where: { tournamentId_teamId: { tournamentId, teamId } } });
      if (existing) throw new ConflictError('Team is already registered for this tournament');
      const teamCount = await prisma.tournamentTeam.count({ where: { tournamentId } });
      if (teamCount >= tournament.maxTeams) throw new ForbiddenError('Tournament is full');
      const result = await prisma.tournamentTeam.create({ data: { tournamentId, teamId } });
      this.broadcastUpdate(tournament);
      this.notifyRegistration(tournament, userId);
      achievementService.unlockByKey(userId, 'FIRST_TOURNAMENT').catch(() => {});
      return result;
    }
    const existingParticipant = await prisma.tournamentParticipant.findUnique({ where: { tournamentId_userId: { tournamentId, userId } } });
    if (existingParticipant) throw new ConflictError('You are already registered for this tournament');
    const [teamCount, participantCount] = await Promise.all([
      prisma.tournamentTeam.count({ where: { tournamentId } }),
      prisma.tournamentParticipant.count({ where: { tournamentId } }),
    ]);
    if (teamCount + participantCount >= tournament.maxTeams) throw new ForbiddenError('Tournament is full');
    const result = await prisma.tournamentParticipant.create({ data: { tournamentId, userId, role: 'PLAYER' } });
    this.broadcastUpdate(tournament);
    this.notifyRegistration(tournament, userId);
    achievementService.unlockByKey(userId, 'FIRST_TOURNAMENT').catch(() => {});
    return result;
  }

  private broadcastUpdate(tournament: { id: string; organizerId: string }) {
    emitToUser(tournament.organizerId, 'tournament:updated', { tournamentId: tournament.id });
  }

  private async notifyRegistration(tournament: { id: string; title?: string }, userId: string) {
    await notificationService.create({
      userId,
      type: NotificationType.TOURNAMENT,
      title: 'Tournament registration confirmed',
      message: `You are registered for "${tournament.title}"`,
      link: `/tournaments/${tournament.id}`,
    });
  }

  /** Next power of two >= n (bracket size). */
  private bracketSize(n: number): number {
    let size = 1;
    while (size < n) size *= 2;
    return size;
  }

  /**
   * Generate a single-elimination bracket:
   *  - teams are seeded 1..N (random when no seeds exist yet) and paired
   *    consecutively in round 1;
   *  - teams facing a bye (no opponent in round 1) are recorded as a
   *    completed walkover so they advance automatically;
   *  - later rounds are created empty and filled as results are submitted.
   * Idempotent: when matches already exist they are returned unchanged.
   */
  async generateBrackets(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { teams: { include: { team: { select: { id: true, name: true, avatar: true } } }, orderBy: { seed: 'asc' } } },
    });
    if (!tournament) throw new NotFoundError('Tournament');
    const existing = await prisma.match.count({ where: { tournamentId } });
    if (existing > 0) {
      return prisma.match.findMany({ where: { tournamentId }, orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }] });
    }
    const teams = tournament.teams;
    if (teams.length < 2) throw new ValidationError({ teams: ['At least 2 teams are required to generate a bracket'] });

    // Assign seeds when not already seeded (random for fairness; stored so
    // subsequent calls are stable).
    const seeded = teams.map((t) => t.seed ?? 0);
    let nextSeed = Math.max(0, ...seeded) + 1;
    for (const t of teams) {
      if (t.seed == null) {
        await prisma.tournamentTeam.update({ where: { id: t.id }, data: { seed: nextSeed++ } });
        t.seed = nextSeed - 1;
      }
    }
    const ordered = [...teams].sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0));
    const size = this.bracketSize(ordered.length);
    const rounds = Math.log2(size);

    const toCreate: Array<{ tournamentId: string; round: number; matchIndex: number; team1Id: string | null; team2Id: string | null; status: MatchStatus; winnerId?: string; scoreTeam1?: number; scoreTeam2?: number; completedAt?: Date }> = [];

    // Round 1 — pair consecutive seeds; a missing opponent is a bye (walkover).
    const round1Count = size / 2;
    for (let i = 0; i < round1Count; i++) {
      const teamA = ordered[i * 2];
      const teamB = ordered[i * 2 + 1];
      if (teamA && teamB) {
        toCreate.push({ tournamentId, round: 1, matchIndex: i, team1Id: teamA.id, team2Id: teamB.id, status: MatchStatus.SCHEDULED });
      } else if (teamA) {
        toCreate.push({ tournamentId, round: 1, matchIndex: i, team1Id: teamA.id, team2Id: null, status: MatchStatus.COMPLETED, winnerId: teamA.id, scoreTeam1: 1, scoreTeam2: 0, completedAt: new Date() });
      } else if (teamB) {
        toCreate.push({ tournamentId, round: 1, matchIndex: i, team1Id: null, team2Id: teamB.id, status: MatchStatus.COMPLETED, winnerId: teamB.id, scoreTeam1: 0, scoreTeam2: 1, completedAt: new Date() });
      }
    }
    // Rounds 2..R — empty, filled as winners advance.
    for (let round = 2; round <= rounds; round++) {
      const count = size / Math.pow(2, round);
      for (let i = 0; i < count; i++) {
        toCreate.push({ tournamentId, round, matchIndex: i, team1Id: null, team2Id: null, status: MatchStatus.SCHEDULED });
      }
    }
    await prisma.match.createMany({ data: toCreate as any });
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: tournament.status === TournamentStatus.COMPLETED || tournament.status === TournamentStatus.CANCELLED ? tournament.status : TournamentStatus.IN_PROGRESS },
    });
    const created = await prisma.match.findMany({ where: { tournamentId }, orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }] });
    this.broadcastUpdate(tournament);
    return created;
  }

  /**
   * Organizer submits a match result. The winner is advanced into the next
   * round's slot automatically; submitting the final match completes the
   * tournament, computes placements, writes TournamentHistory and notifies.
   */
  async submitResult(tournamentId: string, matchId: string, userId: string, data: { scoreTeam1: number; scoreTeam2: number; winnerId?: string }) {
    await this.assertOrganizer(tournamentId, userId);
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: { select: { id: true, title: true, status: true, organizerId: true } },
        team1: { include: { team: { select: { name: true } }, members: { select: { userId: true } } } },
        team2: { include: { team: { select: { name: true } }, members: { select: { userId: true } } } },
      },
    });
    if (!match || match.tournamentId !== tournamentId) throw new NotFoundError('Match');
    if (match.status === MatchStatus.COMPLETED) throw new ConflictError('This match already has a result');
    if (!match.team1Id || !match.team2Id) throw new ForbiddenError('Both teams must be present to submit a result');
    const s1 = Number(data.scoreTeam1) || 0;
    const s2 = Number(data.scoreTeam2) || 0;
    if (s1 < 0 || s2 < 0) throw new ValidationError({ scoreTeam1: ['Scores must be non-negative'] });

    let winnerId = data.winnerId;
    if (winnerId && winnerId !== match.team1Id && winnerId !== match.team2Id) {
      throw new ValidationError({ winnerId: ['Winner must be one of the two teams'] });
    }
    if (!winnerId) {
      if (s1 === s2) throw new ValidationError({ winnerId: ['Scores are tied — specify the winner'] });
      winnerId = s1 > s2 ? match.team1Id : match.team2Id;
    }

    await prisma.match.update({
      where: { id: matchId },
      data: { status: MatchStatus.COMPLETED, winnerId, scoreTeam1: s1, scoreTeam2: s2, completedAt: new Date() },
    });

    // Advance winner into the next round's slot.
    const nextMatch = await prisma.match.findFirst({
      where: { tournamentId, round: match.round + 1, matchIndex: Math.floor(match.matchIndex / 2) },
    });
    if (nextMatch) {
      const slot = match.matchIndex % 2 === 0 ? { team1Id: winnerId } : { team2Id: winnerId };
      await prisma.match.update({ where: { id: nextMatch.id }, data: slot });
      await this.notifyMatchResult(match, matchId, winnerId, s1, s2);
    } else {
      // Final match — complete the tournament.
      await this.completeTournament(tournamentId, matchId, winnerId);
    }
    this.broadcastUpdate({ id: tournamentId, organizerId: match.tournament.organizerId });
    return this.getById(tournamentId);
  }

  private async notifyMatchResult(match: any, matchId: string, winnerId: string, s1: number, s2: number) {
    const winnerName = winnerId === match.team1Id ? match.team1?.team?.name : match.team2?.team?.name;
    const loserName = winnerId === match.team1Id ? match.team2?.team?.name : match.team1?.team?.name;
    const memberIds = new Set<string>();
    match.team1?.members?.forEach((m: any) => memberIds.add(m.userId));
    match.team2?.members?.forEach((m: any) => memberIds.add(m.userId));
    const text = `${winnerName} defeated ${loserName} ${s1}-${s2}`;
    for (const memberId of memberIds) {
      await notificationService.createWithDedupe(
        {
          userId: memberId,
          type: NotificationType.TOURNAMENT_RESULT,
          title: 'Match result recorded',
          message: text,
          link: `/tournaments/${match.tournamentId}`,
        },
        `match-result-${matchId}-${memberId}`
      );
    }
  }

  /**
   * Finalize the tournament: mark COMPLETED, compute 1st/2nd/3rd placements,
   * write TournamentHistory entries for the top teams' members, award the
   * winner achievement and notify every participant.
   */
  private async completeTournament(tournamentId: string, finalMatchId: string, championId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        teams: { include: { members: { select: { userId: true } }, team: { select: { name: true } } } },
        participants: { select: { userId: true } },
        matches: { select: { id: true, round: true, winnerId: true, team1Id: true, team2Id: true } },
      },
    });
    if (!tournament) throw new NotFoundError('Tournament');

    const rounds = tournament.matches.reduce((max, m) => Math.max(max, m.round), 0);
    // placement per TournamentTeam id, derived from the round they lost in.
    const placements = new Map<string, number>();
    for (const match of tournament.matches) {
      if (!match.winnerId) continue;
      const loserId = match.team1Id === match.winnerId ? match.team2Id : match.team1Id;
      if (!loserId) continue;
      let placement: number;
      if (match.round === rounds) {
        placement = 2; // runner-up
      } else {
        placement = Math.pow(2, rounds - match.round) + 1; // group start (3rd/4th, 5th-8th, ...)
      }
      const existing = placements.get(loserId);
      if (existing === undefined || placement < existing) placements.set(loserId, placement);
    }
    placements.set(championId, 1);

    await Promise.all(
      tournament.teams.map((t) =>
        prisma.tournamentTeam.update({ where: { id: t.id }, data: { placement: placements.get(t.id) ?? null } })
      )
    );
    await prisma.tournament.update({ where: { id: tournamentId }, data: { status: TournamentStatus.COMPLETED, endDate: new Date() } });

    // TournamentHistory for the top 3 teams + winner achievement + notifications.
    const topTeams = [...tournament.teams]
      .map((t) => ({ ...t, placement: placements.get(t.id) ?? Infinity }))
      .sort((a, b) => a.placement - b.placement)
      .slice(0, 3);
    const placementLabel: Record<number, string> = { 1: '1st Place', 2: '2nd Place', 3: '3rd Place' };
    for (const team of topTeams) {
      const label = placementLabel[team.placement] || `#${team.placement}`;
      for (const member of team.members) {
        await prisma.tournamentHistory.create({
          data: {
            tournamentName: tournament.title,
            placement: label,
            prize: team.placement === 1 && tournament.prizePool ? `${tournament.prizePool}` : undefined,
            profileId: member.userId,
          },
        }).catch(() => {});
        if (team.placement === 1) {
          achievementService.unlockByKey(member.userId, 'TOURNAMENT_WINNER').catch(() => {});
        }
        if (team.placement <= 3) {
          achievementService.unlockByKey(member.userId, 'TOURNAMENT_TOP3').catch(() => {});
        }
        await notificationService.createWithDedupe(
          {
            userId: member.userId,
            type: NotificationType.TOURNAMENT_RESULT,
            title: `Tournament complete — ${label}`,
            message: `${team.team.name} finished ${label} in "${tournament.title}"`,
            link: `/tournaments/${tournamentId}`,
          },
          `tournament-final-${tournamentId}-${member.userId}`
        );
      }
    }
    const allMemberIds = new Set<string>(tournament.participants.map((p) => p.userId));
    for (const team of tournament.teams) for (const member of team.members) allMemberIds.add(member.userId);
    for (const memberId of allMemberIds) {
      emitToUser(memberId, 'tournament:completed', { tournamentId });
    }
  }

  /** Standings derived from real match results (wins/losses + placement). */
  async getStandings(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        teams: { include: { team: { select: { id: true, name: true, avatar: true, tag: true } }, members: { include: { user: { select: { id: true, profile: { select: { username: true, avatar: true } } } } } } } },
        matches: { select: { winnerId: true, team1Id: true, team2Id: true, status: true, round: true } },
      },
    });
    if (!tournament) throw new NotFoundError('Tournament');
    const stats = new Map<string, { wins: number; losses: number }>();
    for (const t of tournament.teams) stats.set(t.id, { wins: 0, losses: 0 });
    for (const m of tournament.matches) {
      if (m.status !== MatchStatus.COMPLETED || !m.winnerId) continue;
      const winner = stats.get(m.winnerId);
      if (winner) winner.wins += 1;
      const loserId = m.team1Id === m.winnerId ? m.team2Id : m.team1Id;
      if (loserId) {
        const loser = stats.get(loserId);
        if (loser) loser.losses += 1;
      }
    }
    const standings = tournament.teams
      .map((t) => ({ ...t, ...(stats.get(t.id) || { wins: 0, losses: 0 }) }))
      .sort((a, b) => {
        const pa = a.placement ?? Number.MAX_SAFE_INTEGER;
        const pb = b.placement ?? Number.MAX_SAFE_INTEGER;
        if (pa !== pb) return pa - pb;
        return (b.wins ?? 0) - (a.wins ?? 0);
      });
    return standings;
  }

  // ─── Disputes (match result verification) ────────────────────────────────

  /**
   * A member of either team (or the organizer) can dispute a completed match
   * result. One OPEN dispute per match per reporter; a hard cap per match
   * prevents flooding.
   */
  async fileDispute(tournamentId: string, matchId: string, userId: string, data: { reason: string; description?: string }) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { team1: { include: { members: { select: { userId: true } } } }, team2: { include: { members: { select: { userId: true } } } } },
    });
    if (!match || match.tournamentId !== tournamentId) throw new NotFoundError('Match');
    if (match.status !== MatchStatus.COMPLETED) throw new ForbiddenError('Only completed matches can be disputed');
    const isOrganizer = await this.isOrganizer(tournamentId, userId);
    const memberIds = new Set<string>();
    match.team1?.members?.forEach((m: any) => memberIds.add(m.userId));
    match.team2?.members?.forEach((m: any) => memberIds.add(m.userId));
    if (!isOrganizer && !memberIds.has(userId)) {
      throw new ForbiddenError('Only members of the participating teams can dispute a result');
    }
    const existing = await prisma.matchDispute.findFirst({ where: { matchId, reporterId: userId, status: 'OPEN' }, select: { id: true } });
    if (existing) throw new ConflictError('You already have an open dispute for this match');
    const openCount = await prisma.matchDispute.count({ where: { matchId, status: 'OPEN' } });
    if (openCount >= 3) throw new ConflictError('This match already has too many open disputes');
    const dispute = await prisma.matchDispute.create({
      data: { matchId, tournamentId, reporterId: userId, reason: data.reason, description: data.description },
      include: { reporter: { select: { id: true, profile: { select: { username: true, avatar: true } } } } },
    });
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { organizerId: true } });
    if (tournament) {
      await notificationService.create({
        userId: tournament.organizerId,
        type: NotificationType.TOURNAMENT,
        title: 'Match result disputed',
        message: `${data.reason}`,
        link: `/tournaments/${tournamentId}`,
      });
    }
    return dispute;
  }

  /**
   * Organizer resolves an OPEN dispute. RESOLVED can optionally overturn the
   * result: the new winner replaces the previous one in the next-round slot.
   */
  async resolveDispute(tournamentId: string, disputeId: string, userId: string, data: { status: 'RESOLVED' | 'DISMISSED'; resolution?: string; newWinnerId?: string }) {
    await this.assertOrganizer(tournamentId, userId);
    const dispute = await prisma.matchDispute.findUnique({
      where: { id: disputeId },
      include: { match: { include: { tournament: { select: { organizerId: true } } } } },
    });
    if (!dispute || dispute.tournamentId !== tournamentId) throw new NotFoundError('Dispute');
    if (dispute.status !== 'OPEN') throw new ConflictError('This dispute is already resolved');
    if (data.status !== 'RESOLVED' && data.status !== 'DISMISSED') {
      throw new ValidationError({ status: ['Status must be RESOLVED or DISMISSED'] });
    }
    if (data.newWinnerId && data.newWinnerId !== dispute.match.team1Id && data.newWinnerId !== dispute.match.team2Id) {
      throw new ValidationError({ newWinnerId: ['New winner must be one of the two teams'] });
    }
    const match = dispute.match;
    if (data.status === 'RESOLVED' && data.newWinnerId && data.newWinnerId !== match.winnerId) {
      await prisma.match.update({ where: { id: match.id }, data: { winnerId: data.newWinnerId } });
      const nextMatch = await prisma.match.findFirst({
        where: { tournamentId, round: match.round + 1, matchIndex: Math.floor(match.matchIndex / 2) },
      });
      if (nextMatch) {
        const slot = match.matchIndex % 2 === 0 ? { team1Id: data.newWinnerId } : { team2Id: data.newWinnerId };
        await prisma.match.update({ where: { id: nextMatch.id }, data: slot });
      } else {
        // Final overturned → re-complete the tournament with the new champion.
        await this.completeTournament(tournamentId, match.id, data.newWinnerId);
      }
    }
    const updated = await prisma.matchDispute.update({
      where: { id: disputeId },
      data: { status: data.status, resolution: data.resolution, resolvedAt: new Date() },
    });
    await notificationService.create({
      userId: dispute.reporterId,
      type: NotificationType.TOURNAMENT,
      title: data.status === 'RESOLVED' ? 'Dispute resolved' : 'Dispute dismissed',
      message: data.resolution || (data.status === 'RESOLVED' ? 'Your dispute was accepted' : 'Your dispute was not upheld'),
      link: `/tournaments/${tournamentId}`,
    }).catch(() => {});
    this.broadcastUpdate({ id: tournamentId, organizerId: match.tournament.organizerId });
    return updated;
  }
}
export const tournamentService = new TournamentService();
