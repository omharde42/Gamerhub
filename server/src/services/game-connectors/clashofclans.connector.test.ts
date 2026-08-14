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
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
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
  const profile = { name: 'Player', townHallLevel: 12, expLevel: 100 };

  const mockUser = (clashTagChangeCount: number, clashTagHistory: { tag: string; changedAt: string }[] | null = null) => ({
    clashTagChangeCount,
    clashTagHistory,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    db.user.findUnique.mockResolvedValue(mockUser(0));
    clashOfClansServiceMock.getPlayerProfile.mockResolvedValue(profile);
  });

  it('blocks a second tag change when the durable changeCount >= 1', async () => {
    db.gameAccount.findUnique.mockResolvedValue({ inGameUid: '#AAAAAAA', changeCount: 1 });
    db.user.findUnique.mockResolvedValue(mockUser(1, [{ tag: '#AAAAAAA', changedAt: new Date().toISOString() }]));

    await expect(connector.connect(userId, { playerTag: '#BBBBBBB' })).rejects.toMatchObject({
      statusCode: 403,
      message: expect.stringContaining('Locked'),
    });
    expect(db.gameAccount.upsert).not.toHaveBeenCalled();
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('allows re-connecting the same tag without consuming the change', async () => {
    db.gameAccount.findUnique.mockResolvedValue({ inGameUid: '#AAAAAA', changeCount: 1 });
    db.user.findUnique.mockResolvedValue(mockUser(1, [{ tag: '#AAAAAA', changedAt: new Date().toISOString() }]));
    db.gameAccount.upsert.mockImplementation(({ update }: any) => ({ ...update }));

    const result = await connector.connect(userId, { playerTag: '#aaaaaa' });
    expect(db.gameAccount.upsert).toHaveBeenCalled();
    expect(result.gameAccount.changeCount).toBe(1);
    // User-level lock untouched (no new change).
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ clashTagChangeCount: 1 }) })
    );
  });

  it('consumes the single allowed change on the first tag switch', async () => {
    db.gameAccount.findUnique.mockResolvedValue({ inGameUid: '#AAAAAAA', changeCount: 0 });
    db.user.findUnique.mockResolvedValue(mockUser(0, [{ tag: '#AAAAAAA', changedAt: new Date().toISOString() }]));
    db.gameAccount.upsert.mockImplementation(({ update }: any) => ({ ...update }));

    const result = await connector.connect(userId, { playerTag: '#BBBBBBB' });
    expect(result.gameAccount.changeCount).toBe(1);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ clashTagChangeCount: 1 }) })
    );
  });

  it('allows the initial connection and records the tag in the durable history', async () => {
    db.gameAccount.findUnique.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue(mockUser(0, null));
    db.gameAccount.upsert.mockImplementation(({ create }: any) => ({ ...create }));

    const result = await connector.connect(userId, { playerTag: '#GR8QQRV9J' });
    expect(result.gameAccount.changeCount).toBe(0);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clashTagChangeCount: 0,
          clashTagHistory: [{ tag: '#GR8QQRV9J', changedAt: expect.any(String) }],
        }),
      })
    );
  });

  it('disconnect/reconnect cannot bypass the lock: a new tag after disconnect is blocked', async () => {
    // Account was disconnected (row gone) but the durable lock remains.
    db.gameAccount.findUnique.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue(mockUser(1, [{ tag: '#AAAAAAA', changedAt: new Date().toISOString() }]));

    await expect(connector.connect(userId, { playerTag: '#BBBBBBB' })).rejects.toMatchObject({
      statusCode: 403,
      message: expect.stringContaining('Locked'),
    });
    expect(db.gameAccount.upsert).not.toHaveBeenCalled();
  });

  it('reconnecting the SAME tag after disconnect stays allowed', async () => {
    db.gameAccount.findUnique.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue(mockUser(1, [{ tag: '#AAAAAAA', changedAt: new Date().toISOString() }]));
    db.gameAccount.upsert.mockImplementation(({ create }: any) => ({ ...create }));

    const result = await connector.connect(userId, { playerTag: '#AAAAAAA' });
    expect(result.gameAccount.changeCount).toBe(1); // unchanged
  });

  it('disconnecting only deletes the account row and never touches the durable lock', async () => {
    db.gameAccount.deleteMany.mockResolvedValue({ count: 1 });

    const ok = await connector.disconnect(userId);

    expect(ok).toBe(true);
    expect(db.gameAccount.deleteMany).toHaveBeenCalledWith({
      where: { userId, game: 'CLASH_OF_CLANS' },
    });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('validates the tag against the live API before accepting it (invalid tag rejected)', async () => {
    db.gameAccount.findUnique.mockResolvedValue(null);
    clashOfClansServiceMock.getPlayerProfile.mockRejectedValueOnce(new AppError('Player with tag #ZZZ', 404));

    await expect(connector.connect(userId, { playerTag: '#ZZZ' })).rejects.toMatchObject({ statusCode: 404 });
    expect(db.gameAccount.upsert).not.toHaveBeenCalled();
  });

  it('rejects a tag with an invalid format before persisting anything', async () => {
    // Server-side tag validation happens inside clashOfClansService.normalizeTag,
    // which runs before any DB write in the real flow.
    db.gameAccount.findUnique.mockResolvedValue(null);
    clashOfClansServiceMock.getPlayerProfile.mockRejectedValueOnce(new AppError('Invalid Clash of Clans player tag', 400));

    await expect(connector.connect(userId, { playerTag: '#!!bad!!' })).rejects.toMatchObject({ statusCode: 400 });
    expect(db.gameAccount.upsert).not.toHaveBeenCalled();
  });
});
