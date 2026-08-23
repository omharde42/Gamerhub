import { PubgConnector } from './pubg.connector';
import { AppError } from '../../utils/errors';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    gameAccount: { upsert: jest.fn(), deleteMany: jest.fn() },
  },
}));

jest.mock('../pubg.service', () => ({
  pubgService: { getPlayerProfile: jest.fn() },
}));

const db = require('../../config/database').default as any;
const pubgServiceMock = require('../pubg.service').pubgService as any;

describe('PubgConnector — never stores fabricated/zero stats', () => {
  const connector = new PubgConnector();
  const userId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects the connection when lifetime stats are unavailable (N/A k/d)', async () => {
    pubgServiceMock.getPlayerProfile.mockResolvedValue({
      id: 'acc-1',
      name: 'FreshPlayer',
      matches: 0,
      kdRatio: 'N/A',
      winRate: 'N/A',
    });

    await expect(connector.connect(userId, { playerName: 'FreshPlayer' })).rejects.toBeInstanceOf(AppError);
    expect(db.gameAccount.upsert).not.toHaveBeenCalled();
  });

  it('rejects when the underlying service throws (e.g. timeout, stats API failure)', async () => {
    pubgServiceMock.getPlayerProfile.mockRejectedValue(new AppError('PUBG lifetime statistics are currently unavailable', 502));

    await expect(connector.connect(userId, { playerName: 'TGLTN' })).rejects.toMatchObject({ statusCode: 502 });
    expect(db.gameAccount.upsert).not.toHaveBeenCalled();
  });

  it('persists only real values when stats exist', async () => {
    pubgServiceMock.getPlayerProfile.mockResolvedValue({
      id: 'acc-1',
      name: 'TGLTN',
      matches: 40,
      kdRatio: '2.10',
      winRate: '45.0%',
    });
    db.gameAccount.upsert.mockImplementation(({ create }: any) => ({ ...create }));

    const result = await connector.connect(userId, { playerName: 'TGLTN' });

    expect(db.gameAccount.upsert).toHaveBeenCalled();
    expect(result.gameAccount).toMatchObject({
      kdRatio: 2.1,
      winRate: 45,
      totalMatches: 40,
      verified: true,
    });
  });

  it('requires a player name', async () => {
    await expect(connector.connect(userId, {})).rejects.toMatchObject({ statusCode: 400 });
    expect(pubgServiceMock.getPlayerProfile).not.toHaveBeenCalled();
  });
});
