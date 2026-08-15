import { normalizeChallengeGame, SUPPORTED_CHALLENGE_GAMES } from './challenge.service';
import { ValidationError } from '../utils/errors';

describe('normalizeChallengeGame', () => {
  it('accepts Clash of Clans variants', () => {
    expect(normalizeChallengeGame('clashofclans')).toBe('clashofclans');
    expect(normalizeChallengeGame('clash_of_clans')).toBe('clashofclans');
    expect(normalizeChallengeGame('coc')).toBe('clashofclans');
  });

  it('accepts PUBG PC/Console variants but not mobile', () => {
    expect(normalizeChallengeGame('pubg')).toBe('pubg');
    expect(normalizeChallengeGame('pubg_pc')).toBe('pubg');
    expect(normalizeChallengeGame('pubgpc')).toBe('pubg');
  });

  it('accepts Smash Karts as a community challenge game', () => {
    expect(normalizeChallengeGame('smashkarts')).toBe('smashkarts');
    expect(normalizeChallengeGame('smash_karts')).toBe('smashkarts');
    expect(normalizeChallengeGame('Smash Karts')).toBe('smashkarts');
  });

  it('rejects unsupported games with a clear message', () => {
    expect(() => normalizeChallengeGame('valorant')).toThrow(ValidationError);
    expect(() => normalizeChallengeGame('chess')).toThrow(ValidationError);
  });

  it('marks Smash Karts as a community game in the supported list', () => {
    const smash = SUPPORTED_CHALLENGE_GAMES.find((g) => g.id === 'smashkarts');
    expect(smash).toBeDefined();
    expect(smash!.community).toBe(true);
    expect(smash!.modes.length).toBeGreaterThan(0);
  });
});
