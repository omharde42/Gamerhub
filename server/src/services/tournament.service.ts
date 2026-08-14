import prisma from '../config/database';
import { TournamentType, TournamentStatus } from '@prisma/client';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../utils/errors';
import { emitToUser } from '../socket-emitter';
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

  async getById(id: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true, avatar: true } },
        teams: { include: { team: { include: { members: { include: { user: { select: { id: true, profile: true } } } } } }, members: { include: { user: { select: { id: true, profile: true } } } } } },
        matches: true,
        participants: { include: { user: { select: { id: true, profile: true } } } },
      },
    });
    if (!tournament) throw new NotFoundError('Tournament'); return tournament;
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
    return result;
  }

  private broadcastUpdate(tournament: { id: string; organizerId: string }) {
    emitToUser(tournament.organizerId, 'tournament:updated', { tournamentId: tournament.id });
  }

  async generateBrackets(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, include: { teams: true } });
    if (!tournament) throw new NotFoundError('Tournament');
    const teams = tournament.teams; const numTeams = teams.length; const rounds = Math.ceil(Math.log2(numTeams));
    const matches: Array<{ tournamentId: string; round: number; matchIndex: number; team1Id: string | null; team2Id: string | null }> = [];
    for (let round = 0; round < rounds; round++) {
      const numMatches = Math.floor(numTeams / Math.pow(2, round + 1));
      for (let i = 0; i < numMatches; i++) { matches.push({ tournamentId, round: round + 1, matchIndex: i, team1Id: round === 0 ? teams[i * 2]?.id : null, team2Id: round === 0 ? teams[i * 2 + 1]?.id : null }); }
    }
    await prisma.match.createMany({ data: matches });
    await prisma.tournament.update({ where: { id: tournamentId }, data: { status: 'IN_PROGRESS' } });
    return matches;
  }
}
export const tournamentService = new TournamentService();