import { ClashOfClansConnector } from './clashofclans.connector';
import { AppError } from '../../utils/errors';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    gameAccount: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    profile: {
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('../clashofclans.service', () => ({
  clashOfClansService: {
    getPlayerProfile: jest.fn(),
    normalizeTag: jest.fn((tag: string) => tag.replace(/^#/, '').toUpperCase()),
  },
}));

const db = require('../../config/database').default as any;
const clashOfClansServiceMock = require('../clashofclans.service').clashOfClansService as any;

describe('ClashOfClansConnector one-time tag change', () => {
  const connector = new ClashOfClansConnector();
  const userId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks a second tag change when changeCount >= 1', async () => {
    db.gameAccount.findUnique.mockResolvedValue({ inGameUid: '#AAAAAAA', changeCount: 1 });
    clashOfClansServiceMock.getPlayerProfile.mockResolvedValue({ name: 'Player', townHallLevel: 12, expLevel: 100 });

    await expect(connector.connect(userId, { playerTag: '#BBBBBBB' })).rejects.toMatchObject({
      statusCode: 403,
      message: expect.stringContaining('Locked'),
    });
    expect(db.gameAccount.upsert).not.toHaveBeenCalled();
  });

  it('allows re-connecting the same tag without consuming the change', async () => {
    db.gameAccount.findUnique.mockResolvedValue({ inGameUid: '#AAAAAA', changeCount: 1 });
    clashOfClansServiceMock.getPlayerProfile.mockResolvedValue({ name: 'Player', townHallLevel: 12, expLevel: 100 });
    db.gameAccount.upsert.mockImplementation(({ update }: any) => ({ ...update }));

    const result = await connector.connect(userId, { playerTag: '#aaaaaa' });
    expect(db.gameAccount.upsert).toHaveBeenCalled();
    expect(result.gameAccount.changeCount).toBe(1);
  });

  it('consumes the single allowed change on the first tag switch', async () => {
    db.gameAccount.findUnique.mockResolvedValue({ inGameUid: '#AAAAAAA', changeCount: 0 });
    clashOfClansServiceMock.getPlayerProfile.mockResolvedValue({ name: 'Player', townHallLevel: 12, expLevel: 100 });
    db.gameAccount.upsert.mockImplementation(({ update }: any) => ({ ...update }));

    const result = await connector.connect(userId, { playerTag: '#BBBBBBB' });
    expect(result.gameAccount.changeCount).toBe(1);
  });

  it('validates the tag against the live API before accepting it (invalid tag rejected)', async () => {
    db.gameAccount.findUnique.mockResolvedValue(null);
    clashOfClansServiceMock.getPlayerProfile.mockRejectedValueOnce(new AppError('Player with tag #ZZZ', 404));

    await expect(connector.connect(userId, { playerTag: '#ZZZ' })).rejects.toMatchObject({ statusCode: 404 });
    expect(db.gameAccount.upsert).not.toHaveBeenCalled();
  });
});
