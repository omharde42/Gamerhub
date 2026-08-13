/**
 * Verification helpers for OAuth provider callbacks.
 */

import crypto from 'crypto';

const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login';

export interface SteamOpenIdParams {
  'openid.mode'?: unknown;
  'openid.claimed_id'?: unknown;
  'openid.return_to'?: unknown;
  [key: string]: unknown;
}

/**
 * Validates a Steam OpenID 2.0 response (openid.mode=id_res).
 *
 * The RP must prove the response actually came from Steam, otherwise an
 * attacker can forge openid.claimed_id and log in as any Steam user:
 *
 *  1. mode must be id_res
 *  2. claimed_id must be a steamcommunity.com/openid/id/<steam64> URL
 *  3. return_to must match our own callback URL exactly (prevents replay
 *     against a different/attacker callback)
 *  4. a check_authentication round trip to Steam must return is_valid:true
 *
 * Fails closed: any missing/abnormal input returns false.
 */
export async function verifySteamOpenIdResponse(
  params: SteamOpenIdParams,
  expectedReturnTo: string,
  fetchImpl: typeof fetch = fetch
): Promise<boolean> {
  if (params['openid.mode'] !== 'id_res') return false;

  const claimedId = params['openid.claimed_id'];
  if (typeof claimedId !== 'string' || !claimedId.startsWith('https://steamcommunity.com/openid/id/')) {
    return false;
  }

  const returnTo = params['openid.return_to'];
  if (typeof returnTo !== 'string' || returnTo !== expectedReturnTo) return false;

  // Echo every openid.* parameter back to Steam with mode=check_authentication.
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && key.startsWith('openid.')) {
      body.append(key, value);
    }
  }
  body.set('openid.mode', 'check_authentication');

  let res: Response;
  try {
    res = await fetchImpl(STEAM_OPENID_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch {
    return false;
  }

  const text = await res.text();
  return /\bis_valid:true\b/.test(text);
}

export interface OAuthStatePayload {
  action: string;
  userId?: string;
  nonce: string;
  iat: number;
}

const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

/**
 * Signs an OAuth state payload so the callback can trust it.
 *
 * The state is the only thing carrying `userId` into the Discord callback.
 * If it were unsigned base64 (as before), an attacker could craft
 * { action: 'link', userId: '<victim>' } and link their own Discord account
 * to a victim's GamerHub account, then log in as the victim.
 */
export function signOAuthState(payload: OAuthStatePayload, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

/**
 * Verifies a signed OAuth state and returns the payload, or null if the state
 * was tampered with, expired, or malformed. Fails closed.
 */
export function verifyOAuthState(state: string, secret: string, maxAgeMs: number = OAUTH_STATE_MAX_AGE_MS): OAuthStatePayload | null {
  const parts = state.split('.');
  if (parts.length !== 2) return null;

  const [encoded, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as OAuthStatePayload;
    if (typeof payload.action !== 'string' || typeof payload.iat !== 'number') return null;
    const now = Date.now();
    if (now - payload.iat > maxAgeMs || payload.iat > now + 60_000) return null;
    return payload;
  } catch {
    return null;
  }
}
