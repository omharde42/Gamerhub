import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errors';

export interface SupabaseClaims {
  email?: string;
  sub?: string;
  user_metadata?: Record<string, unknown>;
}

/**
 * Verifies a Supabase-issued JWT against the project's JWT secret.
 *
 * Security: this fails CLOSED. If the secret is missing, or the signature is
 * invalid/expired, an UnauthorizedError is thrown. There is intentionally no
 * fallback to jwt.decode() — decoding without verifying the signature would let
 * an attacker mint arbitrary claims (e.g. any email address) and take over any
 * account.
 */
export function verifySupabaseJwt(token: string): SupabaseClaims {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) {
    throw new UnauthorizedError('Invalid or expired Supabase authentication token');
  }
  try {
    const decoded = jwt.verify(token, jwtSecret) as unknown;
    if (!decoded || typeof decoded !== 'object') {
      throw new UnauthorizedError('Invalid or expired Supabase authentication token');
    }
    return decoded as SupabaseClaims;
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Invalid or expired Supabase authentication token');
  }
}
