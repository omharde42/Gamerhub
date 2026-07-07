import prisma from '../config/database';
export class JobService {
  async create(data: any, organizationId: string) { return prisma.job.create({ data: { ...data, organizationId }, include: { organization: { select: { id: true, name: true, avatar: true } } } }); }
  async list(params: { page?: number; limit?: number; type?: string; game?: string; status?: string }) {
    const { page = 1, limit = 20, type, game, status } = params; const where: any = {};
    if (type) where.type = type; if (game) where.game = game; if (status) where.status = status; else where.status = 'OPEN';
    const [jobs, total] = await Promise.all([prisma.job.findMany({ where, skip: (page - 1) * limit, take: limit, include: { organization: { select: { id: true, name: true, avatar: true, verified: true } }, _count: { select: { applications: true } } }, orderBy: { createdAt: 'desc' } }), prisma.job.count({ where })]);
    return { data: jobs, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } };
  }
  async apply(jobId: string, userId: string, message?: string) { return prisma.jobApplication.create({ data: { jobId, userId, message }, include: { job: true } }); }
  async save(userId: string, jobId: string) { return prisma.savedJob.create({ data: { userId, jobId } }); }
  async unsave(userId: string, jobId: string) { await prisma.savedJob.deleteMany({ where: { userId, jobId } }); }
}
export const jobService = new JobService();
