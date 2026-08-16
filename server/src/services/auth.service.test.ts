import { authService } from './auth.service';
import { UnauthorizedError, ValidationError, NotFoundError } from '../utils/errors';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn(), delete: jest.fn() },
    friendRequest: { deleteMany: jest.fn() },
    endorsement: { deleteMany: jest.fn() },
    auditLog: { deleteMany: jest.fn() },
    serverMember: { deleteMany: jest.fn() },
    serverMessage: { deleteMany: jest.fn() },
    messageReaction: { deleteMany: jest.fn() },
    challengeTeam: { deleteMany: jest.fn() },
    organization: { deleteMany: jest.fn() },
    server: { deleteMany: jest.fn() },
  },
}));

jest.mock('../utils/helpers', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  generateToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  sanitizeUser: jest.fn(),
}));

jest.mock('../utils/supabaseAuth', () => ({ verifySupabaseJwt: jest.fn() }));

jest.mock('../config/redis', () => ({ redis: { get: jest.fn(), set: jest.fn(), del: jest.fn() } }));

// No Supabase service role key configured → the best-effort GoTrue cleanup is skipped.
jest.mock('../config', () => ({
  config: { supabase: { url: '', serviceRoleKey: '' } },
}));

jest.mock('./email.service', () => ({ sendEmail: jest.fn() }));

const db = require('../config/database').default as any;
const helpers = require('../utils/helpers') as any;

describe('AuthService.deleteAccount', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requires the password for password-based accounts', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', password: 'hashed' });

    await expect(authService.deleteAccount('u1')).rejects.toBeInstanceOf(ValidationError);
    expect(db.user.delete).not.toHaveBeenCalled();
  });

  it('rejects a wrong password', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', password: 'hashed' });
    helpers.comparePassword.mockResolvedValue(false);

    await expect(authService.deleteAccount('u1', 'wrong')).rejects.toBeInstanceOf(UnauthorizedError);
    expect(db.user.delete).not.toHaveBeenCalled();
  });

  it('cleans up non-cascading relations before deleting the user', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', password: 'hashed' });
    helpers.comparePassword.mockResolvedValue(true);
    db.user.delete.mockResolvedValue({ id: 'u1' });

    const result = await authService.deleteAccount('u1', 'correct-password');

    expect(db.friendRequest.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { OR: [{ senderId: 'u1' }, { receiverId: 'u1' }] } })
    );
    expect(db.endorsement.deleteMany).toHaveBeenCalledWith(expect.objectContaining({ where: { endorserId: 'u1' } }));
    expect(db.auditLog.deleteMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1' } }));
    expect(db.serverMember.deleteMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1' } }));
    expect(db.serverMessage.deleteMany).toHaveBeenCalledWith(expect.objectContaining({ where: { senderId: 'u1' } }));
    expect(db.messageReaction.deleteMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1' } }));
    expect(db.challengeTeam.deleteMany).toHaveBeenCalledWith(expect.objectContaining({ where: { captainId: 'u1' } }));
    expect(db.organization.deleteMany).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerId: 'u1' } }));
    expect(db.server.deleteMany).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerId: 'u1' } }));
    expect(db.user.delete).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'u1' } }));
    expect(result.success).toBe(true);
  });

  it('skips the password check for OAuth-only accounts', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', password: null });
    db.user.delete.mockResolvedValue({ id: 'u1' });

    await authService.deleteAccount('u1');

    expect(helpers.comparePassword).not.toHaveBeenCalled();
    expect(db.user.delete).toHaveBeenCalled();
  });

  it('throws NotFound for a missing user', async () => {
    db.user.findUnique.mockResolvedValue(null);

    await expect(authService.deleteAccount('missing')).rejects.toBeInstanceOf(NotFoundError);
    expect(db.user.delete).not.toHaveBeenCalled();
  });
});
