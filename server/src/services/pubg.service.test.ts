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

  it('maps a request timeout (ECONNABORTED) to a 504 timeout error', async () => {
    process.env.PUBG_API_KEY = 'test-key';
    mockedAxios.get.mockRejectedValueOnce({ code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' });

    try {
      await service.getPlayerProfile('TGLTN', 'steam');
      fail('Expected getPlayerProfile to throw');
    } catch (err: any) {
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(504);
      expect(err.message).toContain('timed out');
    }
  });

  it('sets an explicit timeout on every PUBG API request', async () => {
    process.env.PUBG_API_KEY = 'test-key';
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: [{ id: 'acc-1', attributes: { name: 'TGLTN', clanId: null, banType: 'Innocent' } }] },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: { attributes: { gameModeStats: { solo: { kills: 10, losses: 5, wins: 2, roundsPlayed: 7 } } } } },
    });

    await service.getPlayerProfile('TGLTN', 'steam');

    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    for (const call of mockedAxios.get.mock.calls) {
      expect(call[1]).toMatchObject({ timeout: expect.any(Number) });
    }
  });

  it('rejects the lookup when the lifetime statistics request fails (never returns zeroed stats)', async () => {
    process.env.PUBG_API_KEY = 'test-key';
    // Player found…
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: [{ id: 'acc-1', attributes: { name: 'TGLTN', clanId: null, banType: 'Innocent' } }] },
    });
    // …but the lifetime stats request fails (API down / auth error).
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 500 } });

    try {
      await service.getPlayerProfile('TGLTN', 'steam');
      fail('Expected getPlayerProfile to throw when lifetime stats are unavailable');
    } catch (err: any) {
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(500);
      expect(err.message).toContain('lifetime statistics are currently unavailable');
    }
  });

  it('handles a malformed API response by returning a clear error instead of fabricated data', async () => {
    process.env.PUBG_API_KEY = 'test-key';
    mockedAxios.get.mockResolvedValueOnce({ data: { data: [{ id: undefined, attributes: {} }] } });

    try {
      await service.getPlayerProfile('TGLTN', 'steam');
      fail('Expected getPlayerProfile to throw on malformed response');
    } catch (err: any) {
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(502);
      expect(err.message).toContain('malformed');
    }
  });

  it('returns N/A (not 0) when a real player has no ranked matches yet', async () => {
    process.env.PUBG_API_KEY = 'test-key';
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: [{ id: 'acc-1', attributes: { name: 'FreshPlayer', clanId: null, banType: 'Innocent' } }] },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: { attributes: { gameModeStats: { solo: { kills: 0, losses: 0, wins: 0, roundsPlayed: 0 } } } } },
    });

    const result = await service.getPlayerProfile('FreshPlayer', 'steam');

    // Distinguish "no stats yet" from a fabricated zero.
    expect(result.matches).toBe(0);
    expect(result.kdRatio).toBe('N/A');
    expect(result.winRate).toBe('N/A');
  });
});
