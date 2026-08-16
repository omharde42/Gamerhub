import { TournamentService } from './tournament.service';
import { ForbiddenError, NotFoundError, ConflictError } from '../utils/errors';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    tournament: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn(), findMany: jest.fn() },
    tournamentTeam: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    tournamentParticipant: { findUnique: jest.fn(), create: jest.fn(), count: jest.fn() },
    tournamentHistory: { create: jest.fn() },
    match: { createMany: jest.fn(), findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    matchDispute: { findFirst: jest.fn(), count: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    team: { findUnique: jest.fn() },
    organization: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    organizationMember: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
    profile: { findUnique: jest.fn() },
    achievement: { findUnique: jest.fn(), create: jest.fn() },
  },
}));

jest.mock('../socket-emitter', () => ({
  emitToUser: jest.fn(),
}));

jest.mock('./notification.service', () => ({
  notificationService: { create: jest.fn().mockResolvedValue({ id: 'n1' }), createWithDedupe: jest.fn().mockResolvedValue({ id: 'n1' }) },
}));

jest.mock('./achievement.service', () => ({
  achievementService: { unlockByKey: jest.fn().mockResolvedValue(null) },
}));

const db = require('../config/database').default as any;

describe('TournamentService', () => {
  const service = new TournamentService();
  const organizerId = 'org-1';

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: caller is the org owner (organizer).
    db.organization.findUnique.mockResolvedValue({ ownerId: 'user-org-owner' });
  });

  describe('generateBrackets', () => {
    it('creates a valid power-of-two bracket with byes as walkovers', async () => {
      db.tournament.findUnique.mockResolvedValue({
        id: 't1',
        status: 'REGISTRATION_OPEN',
        teams: [
          { id: 'tt1', seed: 1 },
          { id: 'tt2', seed: 2 },
          { id: 'tt3', seed: 3 },
        ],
      });
      db.match.count.mockResolvedValue(0);

      await service.generateBrackets('t1');

      const data = db.match.createMany.mock.calls[0][0].data;
      // 3 teams → bracket size 4 → round 1 has 2 matches + round 2 has 1 match.
      expect(data).toHaveLength(3);
      const round1 = data.filter((m: any) => m.round === 1);
      expect(round1).toHaveLength(2);
      // One round-1 match has both teams; the other is a bye walkover.
      const walkover = round1.find((m: any) => !m.team1Id || !m.team2Id);
      expect(walkover).toBeDefined();
      expect(walkover.status).toBe('COMPLETED');
      expect(walkover.winnerId).toBe(walkover.team1Id || walkover.team2Id);
      // Tournament marked IN_PROGRESS.
      expect(db.tournament.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'IN_PROGRESS' }) })
      );
    });

    it('is idempotent — returns existing matches when present', async () => {
      db.tournament.findUnique.mockResolvedValue({ id: 't1', status: 'REGISTRATION_OPEN', teams: [{ id: 'tt1', seed: 1 }, { id: 'tt2', seed: 2 }] });
      db.match.count.mockResolvedValue(2);
      db.match.findMany.mockResolvedValue([{ id: 'm1' }]);

      const result = await service.generateBrackets('t1');

      expect(db.match.createMany).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('submitResult', () => {
    const baseMatch = {
      id: 'm1',
      round: 1,
      matchIndex: 0,
      status: 'SCHEDULED',
      team1Id: 'tt1',
      team2Id: 'tt2',
      tournamentId: 't1',
      tournament: { organizerId: 'org-1' },
      team1: { team: { name: 'Alpha' }, members: [{ userId: 'u1' }] },
      team2: { team: { name: 'Beta' }, members: [{ userId: 'u2' }] },
    };

    it('rejects result submission by a non-organizer', async () => {
      db.organization.findUnique.mockResolvedValue({ ownerId: 'someone-else' });
      db.organizationMember.findFirst.mockResolvedValue(null);

      await expect(service.submitResult('t1', 'm1', 'user-x', { scoreTeam1: 2, scoreTeam2: 1 })).rejects.toThrow(ForbiddenError);
      expect(db.match.update).not.toHaveBeenCalled();
    });

    it('advances the winner into the next round slot', async () => {
      db.organization.findUnique.mockResolvedValue({ ownerId: 'org-owner' });
      db.organizationMember.findFirst.mockResolvedValue(null);
      db.match.findUnique.mockResolvedValue(baseMatch);
      db.match.findFirst.mockResolvedValue({ id: 'm2', round: 2, matchIndex: 0 });
      db.match.update.mockResolvedValue({ id: 'm1' });
      db.tournament.findUnique.mockResolvedValue({
        id: 't1',
        title: 'T',
        status: 'IN_PROGRESS',
        organizerId: 'org-1',
        teams: [],
        participants: [],
        matches: [],
      });
      db.match.findMany.mockResolvedValue([]);

      await service.submitResult('t1', 'm1', 'org-owner', { scoreTeam1: 2, scoreTeam2: 1 });

      const updateCalls = db.match.update.mock.calls.map((c: any) => c[0]);
      const resultCall = updateCalls.find((c: any) => c.where.id === 'm1');
      expect(resultCall.data).toMatchObject({ status: 'COMPLETED', winnerId: 'tt1', scoreTeam1: 2, scoreTeam2: 1 });
      const advanceCall = updateCalls.find((c: any) => c.where.id === 'm2');
      expect(advanceCall.data).toEqual({ team1Id: 'tt1' });
    });

    it('rejects a result for an already-completed match', async () => {
      db.organization.findUnique.mockResolvedValue({ ownerId: 'org-owner' });
      db.match.findUnique.mockResolvedValue({ ...baseMatch, status: 'COMPLETED' });

      await expect(service.submitResult('t1', 'm1', 'org-owner', { scoreTeam1: 2, scoreTeam2: 1 })).rejects.toThrow(ConflictError);
    });
  });

  describe('fileDispute', () => {
    const completedMatch = {
      id: 'm1',
      status: 'COMPLETED',
      tournamentId: 't1',
      team1Id: 'tt1',
      team2Id: 'tt2',
      team1: { members: [{ userId: 'u1' }] },
      team2: { members: [{ userId: 'u2' }] },
    };

    it('allows a member of either team to dispute a completed match', async () => {
      db.match.findUnique.mockResolvedValue(completedMatch);
      db.organization.findUnique.mockResolvedValue({ ownerId: 'someone-else' });
      db.organizationMember.findFirst.mockResolvedValue(null);
      db.matchDispute.findFirst.mockResolvedValue(null);
      db.matchDispute.count.mockResolvedValue(0);
      db.matchDispute.create.mockResolvedValue({ id: 'd1' });
      db.tournament.findUnique.mockResolvedValue({ organizerId: 'org-1' });

      const result = await service.fileDispute('t1', 'm1', 'u2', { reason: 'Score was entered wrong' });

      expect(db.matchDispute.create).toHaveBeenCalled();
      expect(result.id).toBe('d1');
    });

    it('blocks disputes from users not on either team', async () => {
      db.match.findUnique.mockResolvedValue(completedMatch);
      db.organization.findUnique.mockResolvedValue({ ownerId: 'someone-else' });
      db.organizationMember.findFirst.mockResolvedValue(null);

      await expect(service.fileDispute('t1', 'm1', 'stranger', { reason: 'Score was entered wrong' })).rejects.toThrow(ForbiddenError);
      expect(db.matchDispute.create).not.toHaveBeenCalled();
    });

    it('blocks disputes on matches that are not completed', async () => {
      db.match.findUnique.mockResolvedValue({ ...completedMatch, status: 'SCHEDULED' });

      await expect(service.fileDispute('t1', 'm1', 'u1', { reason: 'Score was entered wrong' })).rejects.toThrow(ForbiddenError);
    });

    it('blocks a duplicate open dispute by the same reporter', async () => {
      db.match.findUnique.mockResolvedValue(completedMatch);
      db.organization.findUnique.mockResolvedValue({ ownerId: 'someone-else' });
      db.organizationMember.findFirst.mockResolvedValue(null);
      db.matchDispute.findFirst.mockResolvedValue({ id: 'open-1' });

      await expect(service.fileDispute('t1', 'm1', 'u1', { reason: 'Score was entered wrong' })).rejects.toThrow(ConflictError);
    });
  });
});
