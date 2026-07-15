import prisma from '../config/database';
import { AppError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
export class TeamService {
  async create(data: { name: string; tag?: string; description?: string; region?: string }, userId: string) {
    const existing = await prisma.team.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictError('Team name already taken');
    return prisma.team.create({ data: { ...data, members: { create: { userId, role: 'CAPTAIN' } } }, include: { members: { include: { user: { select: { id: true, email: true, profile: true } } } } } });
  }
  async getById(id: string) {
    const team = await prisma.team.findUnique({ where: { id }, include: { members: { include: { user: { select: { id: true, email: true, profile: true } } } }, practiceSchedules: true, scrims: true } });
    if (!team) throw new NotFoundError('Team'); return team;
  }
  async list(params: { page?: number; limit?: number; region?: string; rank?: string }) {
    const { page = 1, limit = 20, region, rank } = params; const where: any = { status: 'ACTIVE' };
    if (region) where.region = region; if (rank) where.rank = rank;
    const [teams, total] = await Promise.all([prisma.team.findMany({ where, skip: (page - 1) * limit, take: limit, include: { _count: { select: { members: true } } }, orderBy: { rankScore: 'desc' } }), prisma.team.count({ where })]);
    return { data: teams, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } };
  }
  async update(id: string, data: any, userId: string) {
    const team = await prisma.team.findUnique({ where: { id }, include: { members: true } });
    if (!team) throw new NotFoundError('Team');
    const member = team.members.find((m: any) => m.userId === userId);
    if (!member || !['CAPTAIN', 'MANAGER'].includes(member.role)) throw new ForbiddenError('Only captains and managers can update the team');
    return prisma.team.update({ where: { id }, data, include: { members: { include: { user: { select: { id: true, email: true, profile: true } } } } } });
  }
  async invite(teamId: string, userId: string, inviterId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
    if (!team) throw new NotFoundError('Team');
    const inviter = team.members.find((m: any) => m.userId === inviterId);
    if (!inviter || !['CAPTAIN', 'MANAGER'].includes(inviter.role)) throw new ForbiddenError('Only captains and managers can invite');
    const existingInvite = await prisma.teamInvite.findUnique({ where: { teamId_userId: { teamId, userId } } });
    if (existingInvite) throw new ConflictError('User already invited');
    const alreadyMember = team.members.find((m: any) => m.userId === userId);
    if (alreadyMember) throw new ConflictError('User is already a member');
    return prisma.teamInvite.create({ data: { teamId, userId }, include: { team: true, user: { select: { id: true, email: true, profile: true } } } });
  }
  async acceptInvite(teamId: string, userId: string) {
    const invite = await prisma.teamInvite.findUnique({ where: { teamId_userId: { teamId, userId } } });
    if (!invite || invite.status !== 'PENDING') throw new NotFoundError('Invite');
    await prisma.$transaction([prisma.teamMember.create({ data: { teamId, userId } }), prisma.teamInvite.update({ where: { id: invite.id }, data: { status: 'ACCEPTED' } })]);
  }
  async apply(teamId: string, userId: string, message?: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
    if (!team) throw new NotFoundError('Team');
    const existing = await prisma.teamApplication.findUnique({ where: { teamId_userId: { teamId, userId } } });
    if (existing) throw new ConflictError('Already applied');
    const alreadyMember = team.members.find((m: any) => m.userId === userId);
    if (alreadyMember) throw new ConflictError('Already a member');
    return prisma.teamApplication.create({ data: { teamId, userId, message } });
  }
  async kick(teamId: string, userId: string, kickerId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
    if (!team) throw new NotFoundError('Team');
    const kicker = team.members.find((m: any) => m.userId === kickerId);
    if (!kicker || !['CAPTAIN', 'MANAGER'].includes(kicker.role)) throw new ForbiddenError('Only captains and managers can kick members');
    const target = team.members.find((m: any) => m.userId === userId);
    if (!target) throw new NotFoundError('Member');
    if (target.role === 'CAPTAIN') throw new ForbiddenError('Cannot kick the captain');
    await prisma.teamMember.delete({ where: { id: target.id } });
  }
  async addPracticeSchedule(teamId: string, data: { dayOfWeek: number; startTime: string; endTime: string }) { return prisma.practiceSchedule.create({ data: { ...data, teamId } }); }
  async addScrim(teamId: string, data: { title: string; description?: string; scheduledAt: string; duration: number }) { return prisma.scrim.create({ data: { ...data, teamId } }); }
}
export const teamService = new TeamService();
