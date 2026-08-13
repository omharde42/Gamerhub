/**
 * Verification helpers for OAuth provider callbacks.
 */

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
