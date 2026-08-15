import prisma from '../config/database';
import { notificationService } from './notification.service';
import { emitToUser } from '../socket-emitter';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import { NotificationType } from '@prisma/client';

export type PartnershipApplicationType = 'PARTNERSHIP' | 'SPONSORSHIP';
export type PartnershipApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CreatePartnershipInput {
  type: PartnershipApplicationType;
  organizationName: string;
  contactName: string;
  contactEmail: string;
  website?: string;
  description: string;
  audience?: string;
}

const MAX_FIELD_LENGTH = 2000;

function clean(value: string | undefined, field: string, required: boolean): string | undefined {
  const v = (value || '').trim();
  if (!v) {
    if (required) throw new ValidationError({ [field]: [`${field} is required`] });
    return undefined;
  }
  if (v.length > MAX_FIELD_LENGTH) {
    throw new ValidationError({ [field]: [`${field} must be at most ${MAX_FIELD_LENGTH} characters`] });
  }
  return v;
}

export class PartnershipService {
  /**
   * Create a partnership/sponsorship application. Backend validates everything —
   * the client can never forge a status or bypass review.
   */
  async apply(userId: string, input: CreatePartnershipInput) {
    if (input.type !== 'PARTNERSHIP' && input.type !== 'SPONSORSHIP') {
      throw new ValidationError({ type: ['Type must be PARTNERSHIP or SPONSORSHIP'] });
    }
    const organizationName = clean(input.organizationName, 'organizationName', true)!;
    const contactName = clean(input.contactName, 'contactName', true)!;
    const contactEmail = clean(input.contactEmail, 'contactEmail', true)!;
    const description = clean(input.description, 'description', true)!;
    const website = clean(input.website, 'website', false);
    const audience = clean(input.audience, 'audience', false);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      throw new ValidationError({ contactEmail: ['A valid contact email is required'] });
    }
    if (website && !/^https?:\/\/.+/i.test(website)) {
      throw new ValidationError({ website: ['Website must start with http:// or https://'] });
    }

    const application = await prisma.partnershipApplication.create({
      data: {
        userId,
        type: input.type,
        organizationName,
        contactName,
        contactEmail,
        website,
        description,
        audience,
        status: 'PENDING',
      },
    });
    return application;
  }

  /** A user can only see their own applications (no private info leaks). */
  async getMyApplications(userId: string) {
    return prisma.partnershipApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Admin: review queue with applicant info (admin-only route guard). */
  async getApplicationsForAdmin(query: { status?: string }) {
    const where: Record<string, any> = {};
    const status = (query.status || '').toUpperCase();
    if (status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED') {
      where.status = status;
    }
    return prisma.partnershipApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, profile: { select: { username: true, displayName: true, avatar: true } } } } },
    });
  }

  /** Admin: approve/reject an application (admin-only route guard). */
  async review(userId: string, id: string, decision: 'APPROVED' | 'REJECTED', adminNote?: string) {
    const application = await prisma.partnershipApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundError('Application');
    if (application.status !== 'PENDING') {
      throw new ValidationError({ status: ['Only pending applications can be reviewed'] });
    }

    const updated = await prisma.partnershipApplication.update({
      where: { id },
      data: {
        status: decision,
        adminNote: adminNote?.trim() || null,
        reviewedAt: new Date(),
      },
    });

    // Notify the applicant of the review outcome (valid platform event).
    await notificationService.create({
      userId: application.userId,
      type: NotificationType.PARTNERSHIP_UPDATED,
      title: decision === 'APPROVED' ? '🤝 Partnership Approved' : 'Partnership Application Update',
      message:
        decision === 'APPROVED'
          ? `Your ${application.type.toLowerCase()} application for ${application.organizationName} was approved. Welcome aboard!`
          : `Your ${application.type.toLowerCase()} application for ${application.organizationName} was not approved at this time.`,
      link: '/partnership',
      metadata: { applicationId: id, status: decision },
    });
    emitToUser(application.userId, 'partnership:updated', { applicationId: id, status: decision });

    return updated;
  }

  async getApplication(userId: string, id: string, isAdmin: boolean) {
    const application = await prisma.partnershipApplication.findUnique({
      where: { id },
      include: isAdmin
        ? { user: { select: { id: true, email: true, profile: { select: { username: true, displayName: true, avatar: true } } } } }
        : undefined,
    });
    if (!application) throw new NotFoundError('Application');
    if (!isAdmin && application.userId !== userId) throw new ForbiddenError('You do not have access to this application');
    return application;
  }
}

export const partnershipService = new PartnershipService();
