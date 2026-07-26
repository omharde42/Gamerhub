import prisma from '../config/database';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../utils/errors';
export class TournamentService {
  async create(data: any, organizerId: string) { return prisma.tournament.create({ data: { ...data, organizerId } }); }
  async getById(id: string) {
    const tournament = await prisma.tournament.findUnique({ where: { id }, include: { organizer: true, teams: { include: { team: { include: { members: { include: { user: { select: { id: true, profile: true } } } } } }, members: { include: { user: { select: { id: true, profile: true } } } } } }, matches: true, participants: { include: { user: { select: { id: true, profile: true } } } } } });
    if (!tournament) throw new NotFoundError('Tournament'); return tournament;
  }
  async list(params: { page?: number; limit?: number; status?: string; game?: string }) {
    const { page = 1, limit = 20, status, game } = params; const where: any = {};
    if (status) where.status = status; if (game) where.game = game;
    const [tournaments, total] = await Promise.all([prisma.tournament.findMany({ where, skip: (page - 1) * limit, take: limit, include: { organizer: { select: { id: true, name: true, avatar: true } }, _count: { select: { teams: true } } }, orderBy: { startDate: 'asc' } }), prisma.tournament.count({ where })]);
    return { data: tournaments, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } };
  }
  async registerTeam(tournamentId: string, teamId: string) {
    if (!teamId) throw new ValidationError({ teamId: ['Team ID is required'] });
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundError('Tournament');
    if (tournament.status !== 'REGISTRATION_OPEN') throw new ForbiddenError('Registration is not open');
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundError('Team');
    const existing = await prisma.tournamentTeam.findUnique({ where: { tournamentId_teamId: { tournamentId, teamId } } });
    if (existing) throw new ConflictError('Team is already registered for this tournament');
    const teamCount = await prisma.tournamentTeam.count({ where: { tournamentId } });
    if (teamCount >= tournament.maxTeams) throw new ForbiddenError('Tournament is full');
    return prisma.tournamentTeam.create({ data: { tournamentId, teamId } });
  }
  async generateBrackets(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, include: { teams: true } });
    if (!tournament) throw new NotFoundError('Tournament');
    const teams = tournament.teams; const numTeams = teams.length; const rounds = Math.ceil(Math.log2(numTeams));
    const matches = [];
    for (let round = 0; round < rounds; round++) {
      const numMatches = Math.floor(numTeams / Math.pow(2, round + 1));
      for (let i = 0; i < numMatches; i++) { matches.push({ tournamentId, round: round + 1, matchIndex: i, team1Id: round === 0 ? teams[i * 2]?.id : null, team2Id: round === 0 ? teams[i * 2 + 1]?.id : null }); }
    }
    await prisma.match.createMany({ data: matches as any });
    await prisma.tournament.update({ where: { id: tournamentId }, data: { status: 'IN_PROGRESS' } });
    return matches;
  }
}
export const tournamentService = new TournamentService();
