import prisma from '../config/database';
import { JobType, JobStatus } from '@prisma/client';
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from '../utils/errors';

type JobInput = {
  title?: string;
  description?: string;
  type?: JobType;
  game?: string;
  location?: string;
  salary?: string;
  requirements?: string[];
  rankRequired?: string;
  expiresAt?: string | Date | null;
  status?: JobStatus;
  organizationId?: string;
};

export class JobService {
  /**
   * Resolve the organization a job belongs to and verify the caller may manage
   * jobs on it. Falls back to the caller's first owned organization when no
   * organizationId is provided.
   */
  private async resolveManageableOrganization(userId: string, organizationId?: string) {
    let organization: { id: string; ownerId: string } | null = null;
    if (organizationId) {
      organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, ownerId: true },
      });
      if (!organization) throw new NotFoundError('Organization');
    } else {
      organization = await prisma.organization.findFirst({
        where: { ownerId: userId },
        select: { id: true, ownerId: true },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
    if (!organization) {
      throw new ValidationError({
        organizationId: ['You must create an organization before posting jobs'],
      });
    }
    if (organization.ownerId !== userId && !isAdmin) {
      throw new ForbiddenError('You do not have permission to manage jobs for this organization');
    }
    return organization;
  }

  async create(data: JobInput, userId: string) {
    if (!data.title || !data.type || !data.description) {
      throw new ValidationError({
        title: ['Title is required'],
        type: ['Job type is required'],
        description: ['Description is required'],
      });
    }
    const organization = await this.resolveManageableOrganization(userId, data.organizationId);
    return prisma.job.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        game: data.game,
        location: data.location,
        salary: data.salary,
        requirements: data.requirements || [],
        rankRequired: data.rankRequired,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        status: data.status || 'OPEN',
        organizationId: organization.id,
      },
      include: { organization: { select: { id: true, name: true, avatar: true, verified: true, ownerId: true } } },
    });
  }

  async update(id: string, userId: string, data: JobInput) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: { organization: { select: { ownerId: true } } },
    });
    if (!job) throw new NotFoundError('Job');
    await this.resolveManageableOrganization(userId, job.organization.ownerId);

    return prisma.job.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.game !== undefined ? { game: data.game } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.salary !== undefined ? { salary: data.salary } : {}),
        ...(data.requirements !== undefined ? { requirements: data.requirements } : {}),
        ...(data.rankRequired !== undefined ? { rankRequired: data.rankRequired } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null } : {}),
      },
      include: { organization: { select: { id: true, name: true, avatar: true, verified: true, ownerId: true } } },
    });
  }

  async remove(id: string, userId: string) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: { organization: { select: { ownerId: true } } },
    });
    if (!job) throw new NotFoundError('Job');
    await this.resolveManageableOrganization(userId, job.organization.ownerId);
    await prisma.job.delete({ where: { id } });
  }

  async list(params: {
    page?: number;
    limit?: number;
    type?: JobType;
    game?: string;
    status?: JobStatus;
    search?: string;
    location?: string;
  }) {
    const { page = 1, limit = 20, type, game, status, search, location } = params;
    const where: {
      type?: JobType;
      game?: string;
      status?: JobStatus;
      location?: { contains: string; mode: 'insensitive' };
      OR?: Array<{ title?: { contains: string; mode: 'insensitive' }; description?: { contains: string; mode: 'insensitive' } }>;
    } = {};
    if (type) where.type = type;
    if (game) where.game = game;
    if (status) where.status = status;
    else where.status = 'OPEN';
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (location) where.location = { contains: location, mode: 'insensitive' };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          organization: { select: { id: true, name: true, avatar: true, verified: true, ownerId: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job.count({ where }),
    ]);
    return { data: jobs, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } };
  }

  async getById(id: string) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true, avatar: true, verified: true, ownerId: true } },
        _count: { select: { applications: true } },
      },
    });
    if (!job) throw new NotFoundError('Job');
    return job;
  }

  /** All jobs (any status) posted by organizations the user owns — for the My Postings management view. */
  async listMine(userId: string) {
    return prisma.job.findMany({
      where: { organization: { ownerId: userId } },
      include: {
        organization: { select: { id: true, name: true, avatar: true, verified: true, ownerId: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async apply(jobId: string, userId: string, message?: string, resume?: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundError('Job');
    if (job.status !== 'OPEN') throw new ValidationError({ jobId: ['This job is no longer accepting applications'] });
    if (job.expiresAt && job.expiresAt < new Date()) {
      throw new ValidationError({ jobId: ['This job posting has expired'] });
    }
    const existing = await prisma.jobApplication.findUnique({ where: { jobId_userId: { jobId, userId } } });
    if (existing) throw new ConflictError('You have already applied to this job');
    return prisma.jobApplication.create({ data: { jobId, userId, message, resume }, include: { job: true } });
  }

  async save(userId: string, jobId: string) {
    const existing = await prisma.savedJob.findUnique({ where: { userId_jobId: { userId, jobId } } });
    if (existing) throw new ConflictError('Job already saved');
    return prisma.savedJob.create({ data: { userId, jobId } });
  }

  async unsave(userId: string, jobId: string) {
    await prisma.savedJob.deleteMany({ where: { userId, jobId } });
  }
}
export const jobService = new JobService();
