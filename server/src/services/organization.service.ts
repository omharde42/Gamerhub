import prisma from '../config/database';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errors';
import { generateSlug } from '../utils/helpers';
export class OrganizationService {
  async create(data: { name: string; description?: string; website?: string; location?: string }, ownerId: string) {
    const slug = generateSlug(data.name); const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) throw new ConflictError('Organization with this name already exists');
    return prisma.organization.create({ data: { ...data, slug, ownerId, members: { create: { userId: ownerId, role: 'OWNER' } } } });
  }
  async getBySlug(slug: string) {
    const org = await prisma.organization.findUnique({ where: { slug }, include: { members: { include: { user: { select: { id: true, profile: true } } } }, _count: { select: { jobs: true, tournaments: true } } } });
    if (!org) throw new NotFoundError('Organization'); return org;
  }
  async list(params: { page?: number; limit?: number; verified?: boolean }) {
    const { page = 1, limit = 20, verified } = params; const where: any = {};
    if (verified !== undefined) where.verified = verified;
    const [orgs, total] = await Promise.all([prisma.organization.findMany({ where, skip: (page - 1) * limit, take: limit, include: { _count: { select: { members: true, jobs: true } } }, orderBy: { createdAt: 'desc' } }), prisma.organization.count({ where })]);
    return { data: orgs, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } };
  }
}
export const organizationService = new OrganizationService();
