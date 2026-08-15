import prisma from '../config/database';
import { AppError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';

export class TeamService {
  async create(data: { name: string; tag?: string; description?: string; region?: string }, userId: string) {
    const existingMembership = await prisma.teamMember.findFirst({ where: { userId } });
    if (existingMembership) {
      throw new ConflictError('You are already a member of an active team. Please leave your current team before creating a new team.');
    }

    const existingName = await prisma.team.findUnique({ where: { name: data.name } });
    if (existingName) throw new ConflictError('Team name already taken');

    return prisma.team.create({
      data: {
        ...data,
        members: { create: { userId, role: 'CAPTAIN' } },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, email: true, profile: true } },
          },
        },
      },
    });
  }

  async getById(id: string) {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, email: true, profile: true } },
          },
        },
        invites: {
          where: { status: 'PENDING' },
          include: {
            user: { select: { id: true, email: true, profile: true } },
          },
        },
        applications: {
          where: { status: 'PENDING' },
          include: {
            user: { select: { id: true, email: true, profile: true } },
          },
        },
        practiceSchedules: true,
        scrims: true,
      },
    });
    if (!team) throw new NotFoundError('Team');
    return team;
  }

  async list(params: { page?: number; limit?: number; region?: string; rank?: string }) {
    const { page = 1, limit = 20, region, rank } = params;
    const where: Record<string, unknown> = { status: 'ACTIVE' };
    if (region) where.region = region;
    if (rank) where.rank = rank;

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { members: true } },
          members: {
            where: { role: 'CAPTAIN' },
            include: { user: { select: { id: true, profile: true } } },
          },
        },
        orderBy: { rankScore: 'desc' },
      }),
      prisma.team.count({ where }),
    ]);

    return {
      data: teams,
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

  async update(id: string, data: { name?: string; tag?: string; description?: string; avatar?: string; banner?: string; region?: string }, userId: string) {
    const team = await prisma.team.findUnique({ where: { id }, include: { members: true } });
    if (!team) throw new NotFoundError('Team');

    const member = team.members.find((m) => m.userId === userId);
    if (!member || !['CAPTAIN', 'MANAGER'].includes(member.role)) {
      throw new ForbiddenError('Only captains and managers can update the team');
    }

    return prisma.team.update({
      where: { id },
      data,
      include: {
        members: {
          include: { user: { select: { id: true, email: true, profile: true } } },
        },
      },
    });
  }

  async invite(teamId: string, userId: string, inviterId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
    if (!team) throw new NotFoundError('Team');

    const inviter = team.members.find((m) => m.userId === inviterId);
    if (!inviter || !['CAPTAIN', 'MANAGER'].includes(inviter.role)) {
      throw new ForbiddenError('Only captains and managers can invite players');
    }

    const targetInTeam = await prisma.teamMember.findFirst({ where: { userId } });
    if (targetInTeam) {
      throw new ConflictError('This player is already a member of an active team');
    }

    const existingInvite = await prisma.teamInvite.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    let invite;
    if (existingInvite) {
      invite = await prisma.teamInvite.update({
        where: { id: existingInvite.id },
        data: { status: 'PENDING' },
        include: { team: true, user: { select: { id: true, email: true, profile: true } } },
      });
    } else {
      invite = await prisma.teamInvite.create({
        data: { teamId, userId, status: 'PENDING' },
        include: { team: true, user: { select: { id: true, email: true, profile: true } } },
      });
    }

    // Create notification for target user
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: 'TEAM_INVITE',
          title: 'Team Invitation',
          message: `You were invited to join team ${team.name}!`,
          link: `/teams/${teamId}`,
        },
      });
    } catch (e) {
      // Ignore notification table errors if optional
    }

    return invite;
  }

  async myInvites(userId: string) {
    return prisma.teamInvite.findMany({
      where: { userId, status: 'PENDING' },
      include: {
        team: {
          include: {
            members: {
              where: { role: 'CAPTAIN' },
              include: { user: { select: { id: true, profile: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptInvite(teamId: string, userId: string) {
    const existingMembership = await prisma.teamMember.findFirst({ where: { userId } });
    if (existingMembership) {
      throw new ConflictError('You are already in an active team. Please leave your current team first.');
    }

    const invite = await prisma.teamInvite.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    if (!invite || invite.status !== 'PENDING') {
      throw new NotFoundError('Team invitation not found or already responded');
    }

    await prisma.$transaction([
      prisma.teamMember.create({ data: { teamId, userId, role: 'MEMBER' } }),
      prisma.teamInvite.update({ where: { id: invite.id }, data: { status: 'ACCEPTED' } }),
    ]);

    return { message: 'Successfully joined team' };
  }

  async declineInvite(teamId: string, userId: string) {
    const invite = await prisma.teamInvite.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!invite) throw new NotFoundError('Invite not found');

    return prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: 'REJECTED' },
    });
  }

  async apply(teamId: string, userId: string, message?: string) {
    const existingMembership = await prisma.teamMember.findFirst({ where: { userId } });
    if (existingMembership) {
      throw new ConflictError('You are already a member of an active team. Leave your team first.');
    }

    const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
    if (!team) throw new NotFoundError('Team');

    const alreadyMember = team.members.find((m) => m.userId === userId);
    if (alreadyMember) throw new ConflictError('Already a member of this team');

    const existing = await prisma.teamApplication.findUnique({ where: { teamId_userId: { teamId, userId } } });
    if (existing) throw new ConflictError('Already applied to this team');

    return prisma.teamApplication.create({ data: { teamId, userId, message, status: 'PENDING' } });
  }

  async handleApplication(teamId: string, applicationId: string, action: 'ACCEPT' | 'REJECT', captainId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
    if (!team) throw new NotFoundError('Team');

    const captain = team.members.find((m) => m.userId === captainId);
    if (!captain || !['CAPTAIN', 'MANAGER'].includes(captain.role)) {
      throw new ForbiddenError('Only captains and managers can handle team applications');
    }

    const application = await prisma.teamApplication.findUnique({ where: { id: applicationId } });
    if (!application || application.teamId !== teamId) throw new NotFoundError('Application not found');

    if (action === 'REJECT') {
      return prisma.teamApplication.update({ where: { id: applicationId }, data: { status: 'REJECTED' } });
    }

    const targetInTeam = await prisma.teamMember.findFirst({ where: { userId: application.userId } });
    if (targetInTeam) {
      await prisma.teamApplication.update({ where: { id: applicationId }, data: { status: 'REJECTED' } });
      throw new ConflictError('Applicant is already in another team.');
    }

    await prisma.$transaction([
      prisma.teamMember.create({ data: { teamId, userId: application.userId, role: 'MEMBER' } }),
      prisma.teamApplication.update({ where: { id: applicationId }, data: { status: 'ACCEPTED' } }),
    ]);

    return { message: 'Application accepted and player added to team roster' };
  }

  async kick(teamId: string, userId: string, kickerId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
    if (!team) throw new NotFoundError('Team');

    const kicker = team.members.find((m) => m.userId === kickerId);
    if (!kicker || !['CAPTAIN', 'MANAGER'].includes(kicker.role)) {
      throw new ForbiddenError('Only captains and managers can kick members');
    }

    const target = team.members.find((m) => m.userId === userId);
    if (!target) throw new NotFoundError('Member not found');
    if (target.role === 'CAPTAIN') throw new ForbiddenError('Cannot kick the team captain');

    await prisma.teamMember.delete({ where: { id: target.id } });
  }

  async leave(teamId: string, userId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
    if (!team) throw new NotFoundError('Team');

    const member = team.members.find((m) => m.userId === userId);
    if (!member) throw new NotFoundError('You are not a member of this team');

    if (member.role === 'CAPTAIN') {
      const otherMembers = team.members.filter((m) => m.userId !== userId);
      if (otherMembers.length > 0) {
        // Transfer captaincy to next member
        await prisma.$transaction([
          prisma.teamMember.update({ where: { id: otherMembers[0].id }, data: { role: 'CAPTAIN' } }),
          prisma.teamMember.delete({ where: { id: member.id } }),
        ]);
        return { message: 'You left the team and captaincy was transferred.' };
      } else {
        // Last member deletes team
        await prisma.team.delete({ where: { id: teamId } });
        return { message: 'You left the team and the squad was disbanded.' };
      }
    }

    await prisma.teamMember.delete({ where: { id: member.id } });
    return { message: 'Successfully left the team.' };
  }

  async addPracticeSchedule(teamId: string, data: { dayOfWeek: number; startTime: string; endTime: string }) {
    return prisma.practiceSchedule.create({ data: { ...data, teamId } });
  }

  async addScrim(teamId: string, data: { title: string; description?: string; scheduledAt: string; duration: number }) {
    return prisma.scrim.create({ data: { ...data, teamId } });
  }
}

export const teamService = new TeamService();
