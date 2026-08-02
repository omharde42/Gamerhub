import { generateVerificationCode } from './helpers';

describe('generateVerificationCode', () => {
  it('returns a code with the requested length and only uppercase alphanumeric characters', () => {
    const code = generateVerificationCode(8);
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it('defaults to a six-character code when no length is provided', () => {
    const code = generateVerificationCode();
    expect(code).toHaveLength(6);
  });
});
