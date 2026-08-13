import jwt from 'jsonwebtoken';
import { verifySupabaseJwt } from './supabaseAuth';
import { UnauthorizedError } from './errors';

const SUPABASE_JWT_SECRET = 'test-supabase-jwt-secret-please-change';
const ATTESTED_SECRET = 'attacker-known-secret';

describe('verifySupabaseJwt', () => {
  const realSecret = process.env.SUPABASE_JWT_SECRET;

  afterEach(() => {
    if (realSecret === undefined) {
      delete process.env.SUPABASE_JWT_SECRET;
    } else {
      process.env.SUPABASE_JWT_SECRET = realSecret;
    }
  });

  it('accepts a token signed with the configured Supabase secret', () => {
    process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET;
    const token = jwt.sign({ email: 'user@example.com', sub: '123' }, SUPABASE_JWT_SECRET);

    const claims = verifySupabaseJwt(token);
    expect(claims.email).toBe('user@example.com');
    expect(claims.sub).toBe('123');
  });

  it('rejects a token signed with a different (attacker-known) secret', () => {
    process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET;
    // Old vulnerable code path: verification fails, then jwt.decode() accepts
    // this token because it ignores the signature entirely.
    const forgedToken = jwt.sign(
      { email: 'victim@example.com', sub: 'attacker-controlled-sub' },
      ATTESTED_SECRET
    );

    expect(() => verifySupabaseJwt(forgedToken)).toThrow(UnauthorizedError);
  });

  it('rejects a token signed with the old hard-coded dev fallback secret', () => {
    process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET;
    // Regression test for the removed 'dev-jwt-secret-change-in-production' fallback:
    // even a token "signed" with that publicly-known string must be rejected.
    const legacyToken = jwt.sign(
      { email: 'victim@example.com', sub: 'attacker-controlled-sub' },
      'dev-jwt-secret-change-in-production'
    );

    expect(() => verifySupabaseJwt(legacyToken)).toThrow(UnauthorizedError);
  });

  it('rejects an unsigned token', () => {
    process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET;
    const unsignedToken = jwt.sign({ email: 'victim@example.com', sub: 'x' }, '', { algorithm: 'none' });

    expect(() => verifySupabaseJwt(unsignedToken)).toThrow(UnauthorizedError);
  });

  it('fails closed when the Supabase secret is not configured', () => {
    delete process.env.SUPABASE_JWT_SECRET;
    const token = jwt.sign({ email: 'user@example.com', sub: '123' }, SUPABASE_JWT_SECRET);

    expect(() => verifySupabaseJwt(token)).toThrow(UnauthorizedError);
  });
});
