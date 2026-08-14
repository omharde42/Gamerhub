import { PubgService } from './pubg.service';
import { AppError } from '../utils/errors';

jest.mock('axios', () => ({
  get: jest.fn(),
}));

import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PubgService player validation', () => {
  const service = new PubgService();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rejects PUBG Mobile UIDs (numeric IDs) for the PC/Console integration', async () => {
    process.env.PUBG_API_KEY = 'test-key';
    await expect(service.getPlayerProfile('512938412', 'steam')).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('PUBG Mobile UIDs'),
    });
    // The API must never be called for an obviously invalid identifier.
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('rejects an empty player name', async () => {
    process.env.PUBG_API_KEY = 'test-key';
    await expect(service.getPlayerProfile('   ', 'steam')).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('required'),
    });
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('rejects names with unsupported characters', async () => {
    process.env.PUBG_API_KEY = 'test-key';
    await expect(service.getPlayerProfile('Player<script>', 'steam')).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('unsupported characters'),
    });
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('rejects non-Steam shards since only PC/Console is supported', async () => {
    process.env.PUBG_API_KEY = 'test-key';
    await expect(service.getPlayerProfile('TGLTN', 'kakao')).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('PUBG PC/Steam'),
    });
  });

  it('maps a 404 from the PUBG API to a friendly "player not found" error', async () => {
    process.env.PUBG_API_KEY = 'test-key';
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 404 } });

    try {
      await service.getPlayerProfile('NoSuchPlayer_XYZ', 'steam');
      fail('Expected getPlayerProfile to throw');
    } catch (err: any) {
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(404);
      expect(err.message).toContain('PUBG player not found');
    }
  });

  it('maps a 429 from the PUBG API to a rate-limit error', async () => {
    process.env.PUBG_API_KEY = 'test-key';
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 429 } });

    try {
      await service.getPlayerProfile('TGLTN', 'steam');
      fail('Expected getPlayerProfile to throw');
    } catch (err: any) {
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(429);
      expect(err.message).toContain('rate limit');
    }
  });
});
