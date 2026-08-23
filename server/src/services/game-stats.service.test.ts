import { GameStatsService } from './game-stats.service';
import { AppError, ValidationError } from '../utils/errors';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    gameAccount: { findMany: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
  },
}));

jest.mock('./game-connectors/clashofclans.connector', () => ({
  clashOfClansConnector: { connect: jest.fn() },
}));
jest.mock('./game-connectors/pubg.connector', () => ({
  pubgConnector: { connect: jest.fn() },
}));
jest.mock('./game-connectors/steam.connector', () => ({
  steamConnector: { connect: jest.fn() },
}));

const clashConnector = require('./game-connectors/clashofclans.connector').clashOfClansConnector as any;
const pubgConnector = require('./game-connectors/pubg.connector').pubgConnector as any;
const steamConnector = require('./game-connectors/steam.connector').steamConnector as any;
const db = require('../config/database').default as any;

describe('GameStatsService — no fabricated game data', () => {
  const service = new GameStatsService();
  const userId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(['Valorant', 'Free Fire', 'CS2', 'Call of Duty', 'BGMI', 'PUBG Mobile', 'Fortnite'])(
    'rejects %s with a clear verification-unavailable error and writes nothing',
    async (game) => {
      await expect(
        service.verifyAndLinkGameAccount({ userId, game, inGameUid: '1234567890' })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining('does not currently support verified account connection'),
      });
      expect(clashConnector.connect).not.toHaveBeenCalled();
      expect(pubgConnector.connect).not.toHaveBeenCalled();
      expect(steamConnector.connect).not.toHaveBeenCalled();
    }
  );

  it('rejects when no game title is provided', async () => {
    await expect(
      service.verifyAndLinkGameAccount({ userId, game: '', inGameUid: 'x' })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects when no in-game UID is provided', async () => {
    await expect(
      service.verifyAndLinkGameAccount({ userId, game: 'Clash of Clans', inGameUid: '  ' })
    ).rejects.toBeInstanceOf(ValidationError);
    expect(clashConnector.connect).not.toHaveBeenCalled();
  });

  it('delegates Clash of Clans verification to the official connector (which enforces the tag lock)', async () => {
    clashConnector.connect.mockResolvedValue({ gameAccount: { id: 'ga' }, stats: { name: 'Real Player' } });

    const result = await service.verifyAndLinkGameAccount({
      userId,
      game: 'Clash of Clans',
      inGameUid: '#GR8QQRV9J',
    });

    expect(clashConnector.connect).toHaveBeenCalledWith(userId, { playerTag: '#GR8QQRV9J' });
    expect(result.verified).toBe(true);
  });

  it('delegates PUBG verification to the official connector (which rejects mobile UIDs server-side)', async () => {
    pubgConnector.connect.mockResolvedValue({ gameAccount: { id: 'ga' }, stats: { matches: 25 } });

    const result = await service.verifyAndLinkGameAccount({
      userId,
      game: 'PUBG',
      inGameUid: 'TGLTN',
    });

    expect(pubgConnector.connect).toHaveBeenCalledWith(userId, { playerName: 'TGLTN' });
    expect(result.verified).toBe(true);
  });

  it('never falls back to a fabricated player name for supported games', async () => {
    // If the underlying connector is bypassed (mocked to succeed without an
    // API check), the service must not inject synthetic names into the result.
    pubgConnector.connect.mockResolvedValue({ gameAccount: { id: 'ga' }, stats: { name: null } });
    const result = await service.verifyAndLinkGameAccount({ userId, game: 'PUBG', inGameUid: 'PlayerOne' });
    expect(result.gameAccount).toBeDefined();
    // The returned payload contains only connector output — no invented values.
    expect(JSON.stringify(result)).not.toContain('FF_Player_');
    expect(JSON.stringify(result)).not.toContain('PUBG_Player_');
  });

  it('unlinking a game account requires ownership', async () => {
    db.gameAccount.findFirst.mockResolvedValue(null);
    await expect(service.unlinkGameAccount(userId, 'ga-1')).rejects.toMatchObject({ statusCode: 404 });
    expect(db.gameAccount.delete).not.toHaveBeenCalled();
  });
});
