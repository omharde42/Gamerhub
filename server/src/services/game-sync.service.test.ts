import { GameSyncService } from './game-sync.service';
import { AppError } from '../utils/errors';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    gameAccount: { upsert: jest.fn(), deleteMany: jest.fn() },
    user: { update: jest.fn() },
  },
}));

jest.mock('../index', () => ({ io: null }));

const db = require('../config/database').default as any;

describe('GameSyncService — no fabricated statistics', () => {
  const service = new GameSyncService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(['riot', 'valorant', 'faceit', 'discord', 'clash royale', 'brawl stars', 'clash of clans'])(
    'refuses %s sync with a verification-unavailable error',
    async (method) => {
      let promise: Promise<any>;
      switch (method) {
        case 'riot':
        case 'valorant': promise = service.syncRiot(); break;
        case 'faceit': promise = service.syncFaceit(); break;
        case 'discord': promise = service.syncDiscord(); break;
        case 'clash royale':
        case 'brawl stars':
        case 'clash of clans': promise = service.syncSupercell(); break;
        default: promise = Promise.reject(new Error('unreachable'));
      }

      await expect(promise).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining('does not currently support verified account connection'),
      });
      expect(db.gameAccount.upsert).not.toHaveBeenCalled();
    }
  );

  it('never fabricates a Steam profile when the real API data is unavailable', async () => {
    jest.spyOn(require('./steam.service').steamService, 'getSteamProfileData').mockRejectedValue(
      new AppError('Steam API key missing on server configuration. Verified Steam data is unavailable.', 500)
    );

    await expect(service.syncSteam('u1', '76561198012345678')).rejects.toMatchObject({ statusCode: 500 });
    expect(db.gameAccount.upsert).not.toHaveBeenCalled();
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('disconnect for Clash of Clans only deletes the account row (durable lock untouched)', async () => {
    db.gameAccount.deleteMany.mockResolvedValue({ count: 1 });

    const ok = await service.disconnectAccount('u1', 'CLASH_OF_CLANS');

    expect(ok).toBe(true);
    expect(db.gameAccount.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1', game: 'CLASH_OF_CLANS' } });
    // No user-level state is cleared for Clash.
    expect(db.user.update).not.toHaveBeenCalled();
  });
});
