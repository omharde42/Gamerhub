import { partnershipService } from './partnership.service';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    partnershipApplication: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  },
}));

jest.mock('./notification.service', () => ({
  notificationService: { create: jest.fn() },
}));

jest.mock('../socket-emitter', () => ({
  emitToUser: jest.fn(),
}));

const db = require('../config/database').default as any;

const validInput = {
  type: 'PARTNERSHIP' as const,
  organizationName: 'Neon Esports',
  contactName: 'Jane Doe',
  contactEmail: 'jane@neon.gg',
  website: 'https://neon.gg',
  description: 'We run competitive events and want to partner with GamerZ Hub.',
  audience: '50K followers',
};

describe('PartnershipService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a pending application with validated fields', async () => {
    db.partnershipApplication.create.mockResolvedValue({ id: 'app-1', ...validInput, status: 'PENDING' });
    const result = await partnershipService.apply('user-1', validInput);
    expect(db.partnershipApplication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1', status: 'PENDING', organizationName: 'Neon Esports' }),
      })
    );
    expect(result.status).toBe('PENDING');
  });

  it('rejects an invalid type', async () => {
    await expect(partnershipService.apply('user-1', { ...validInput, type: 'SCAM' as any })).rejects.toBeInstanceOf(ValidationError);
    expect(db.partnershipApplication.create).not.toHaveBeenCalled();
  });

  it('rejects missing required fields', async () => {
    await expect(partnershipService.apply('user-1', { ...validInput, organizationName: '  ' })).rejects.toBeInstanceOf(ValidationError);
    await expect(partnershipService.apply('user-1', { ...validInput, contactEmail: 'not-an-email' })).rejects.toBeInstanceOf(ValidationError);
    expect(db.partnershipApplication.create).not.toHaveBeenCalled();
  });

  it('rejects a website that is not a URL', async () => {
    await expect(partnershipService.apply('user-1', { ...validInput, website: 'neon.gg' })).rejects.toBeInstanceOf(ValidationError);
  });

  it('only returns the caller\'s own applications', async () => {
    db.partnershipApplication.findMany.mockResolvedValue([{ id: 'app-1', userId: 'user-1' }]);
    const result = await partnershipService.getMyApplications('user-1');
    expect(db.partnershipApplication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    );
    expect(result).toHaveLength(1);
  });

  it('blocks users from viewing someone else\'s application', async () => {
    db.partnershipApplication.findUnique.mockResolvedValue({ id: 'app-1', userId: 'user-2' });
    await expect(partnershipService.getApplication('user-1', 'app-1', false)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('reviews a pending application and notifies the applicant', async () => {
    db.partnershipApplication.findUnique.mockResolvedValue({ id: 'app-1', userId: 'user-1', status: 'PENDING', type: 'PARTNERSHIP', organizationName: 'Neon Esports' });
    db.partnershipApplication.update.mockResolvedValue({ id: 'app-1', status: 'APPROVED', adminNote: 'Welcome!', reviewedAt: new Date() });

    const result = await partnershipService.review('admin-1', 'app-1', 'APPROVED', 'Welcome!');

    expect(result.status).toBe('APPROVED');
    const { notificationService } = require('./notification.service');
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', type: 'PARTNERSHIP_UPDATED', title: expect.stringContaining('Approved') })
    );
  });

  it('rejects reviewing a non-pending application twice', async () => {
    db.partnershipApplication.findUnique.mockResolvedValue({ id: 'app-1', status: 'APPROVED' });
    await expect(partnershipService.review('admin-1', 'app-1', 'REJECTED')).rejects.toBeInstanceOf(ValidationError);
    expect(db.partnershipApplication.update).not.toHaveBeenCalled();
  });

  it('throws NotFound for a missing application', async () => {
    db.partnershipApplication.findUnique.mockResolvedValue(null);
    await expect(partnershipService.review('admin-1', 'missing', 'APPROVED')).rejects.toBeInstanceOf(NotFoundError);
  });
});
