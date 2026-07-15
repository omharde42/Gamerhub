import prisma from '../config/database';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';

export class JobService {
  async create(data: any, organizationId: string) {
    if (!data.title || !data.type) {
      throw new ValidationError({ title: ['Title is required'], type: ['Job type is required'] });
    }
    const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization) throw new NotFoundError('Organization');
    return prisma.job.create({ data: { ...data, organizationId }, include: { organization: { select: { id: true, name: true, avatar: true } } } });
  }
  async list(params: { page?: number; limit?: number; type?: string; game?: string; status?: string }) {
    const { page = 1, limit = 20, type, game, status } = params; const where: any = {};
    if (type) where.type = type; if (game) where.game = game; if (status) where.status = status; else where.status = 'OPEN';
    const [jobs, total] = await Promise.all([prisma.job.findMany({ where, skip: (page - 1) * limit, take: limit, include: { organization: { select: { id: true, name: true, avatar: true, verified: true } }, _count: { select: { applications: true } } }, orderBy: { createdAt: 'desc' } }), prisma.job.count({ where })]);
    return { data: jobs, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } };
  }
  async apply(jobId: string, userId: string, message?: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundError('Job');
    const existing = await prisma.jobApplication.findUnique({ where: { jobId_userId: { jobId, userId } } });
    if (existing) throw new ConflictError('You have already applied to this job');
    return prisma.jobApplication.create({ data: { jobId, userId, message }, include: { job: true } });
  }
  async save(userId: string, jobId: string) {
    const existing = await prisma.savedJob.findUnique({ where: { userId_jobId: { userId, jobId } } });
    if (existing) throw new ConflictError('Job already saved');
    return prisma.savedJob.create({ data: { userId, jobId } });
  }
  async unsave(userId: string, jobId: string) { await prisma.savedJob.deleteMany({ where: { userId, jobId } }); }
}
export const jobService = new JobService();
