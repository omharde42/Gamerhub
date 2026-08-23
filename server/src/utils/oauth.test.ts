import { verifySteamOpenIdResponse, SteamOpenIdParams, signOAuthState, verifyOAuthState } from './oauth';

const EXPECTED_RETURN_TO = 'https://api.gamerhub.example/api/auth/steam/callback';

function validParams(): SteamOpenIdParams {
  return {
    'openid.mode': 'id_res',
    'openid.claimed_id': 'https://steamcommunity.com/openid/id/76561198000000000',
    'openid.identity': 'https://steamcommunity.com/openid/id/76561198000000000',
    'openid.return_to': EXPECTED_RETURN_TO,
    'openid.response_nonce': '2026-08-13T00:00:00Zabc',
    'openid.assoc_handle': '1234567890',
    'openid.op_endpoint': 'https://steamcommunity.com/openid/login',
    'openid.signed': 'signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle',
    'openid.sig': 'dGVzdHNpZ25hdHVyZQ==',
  };
}

function mockFetch(respondWith: string | null): typeof fetch {
  return (async () => {
    if (respondWith === null) {
      throw new Error('network down');
    }
    return {
      text: async () => respondWith,
      ok: true,
    } as unknown as Response;
  }) as unknown as typeof fetch;
}

describe('verifySteamOpenIdResponse', () => {
  it('accepts a valid Steam OpenID response (is_valid:true)', async () => {
    const ok = await verifySteamOpenIdResponse(
      validParams(),
      EXPECTED_RETURN_TO,
      mockFetch('ns:http://specs.openid.net/auth/2.0\nis_valid:true\n')
    );
    expect(ok).toBe(true);
  });

  it('rejects a response Steam says is invalid (is_valid:false)', async () => {
    const ok = await verifySteamOpenIdResponse(
      validParams(),
      EXPECTED_RETURN_TO,
      mockFetch('ns:http://specs.openid.net/auth/2.0\nis_valid:false\n')
    );
    expect(ok).toBe(false);
  });

  it('rejects a response that is not in id_res mode (forged login attempt)', async () => {
    const params = { ...validParams(), 'openid.mode': 'checkid_setup' };
    const ok = await verifySteamOpenIdResponse(params, EXPECTED_RETURN_TO, mockFetch('is_valid:true'));
    expect(ok).toBe(false);
  });

  it('rejects a claimed_id that is not a Steam community profile', async () => {
    const params = { ...validParams(), 'openid.claimed_id': 'https://evil.example/profile/123' };
    const ok = await verifySteamOpenIdResponse(params, EXPECTED_RETURN_TO, mockFetch('is_valid:true'));
    expect(ok).toBe(false);
  });

  it('rejects a return_to that does not match our callback URL', async () => {
    const params = { ...validParams(), 'openid.return_to': 'https://evil.example/callback' };
    const ok = await verifySteamOpenIdResponse(params, EXPECTED_RETURN_TO, mockFetch('is_valid:true'));
    expect(ok).toBe(false);
  });

  it('fails closed when the verification round trip errors', async () => {
    const ok = await verifySteamOpenIdResponse(validParams(), EXPECTED_RETURN_TO, mockFetch(null));
    expect(ok).toBe(false);
  });
});

describe('signOAuthState / verifyOAuthState', () => {
  const SECRET = 'test-oauth-state-secret';
  const payload = { action: 'link', userId: 'victim-user-id', nonce: 'abc123', iat: Date.now() };

  it('round-trips a signed state', () => {
    const state = signOAuthState(payload, SECRET);
    const verified = verifyOAuthState(state, SECRET);
    expect(verified).not.toBeNull();
    expect(verified!.action).toBe('link');
    expect(verified!.userId).toBe('victim-user-id');
  });

  it('rejects a state signed with a different secret', () => {
    const state = signOAuthState(payload, 'attacker-secret');
    expect(verifyOAuthState(state, SECRET)).toBeNull();
  });

  it('rejects a tampered payload (attacker swaps userId)', () => {
    // Simulate the old attack: base64-encode { action: 'link', userId: victim } and use a valid-looking but wrong sig
    const forged = Buffer.from(JSON.stringify({ action: 'link', userId: 'victim-user-id', nonce: 'x', iat: Date.now() })).toString('base64url');
    expect(verifyOAuthState(`${forged}.c2lnbmF0dXJl`, SECRET)).toBeNull();
  });

  it('rejects an expired state', () => {
    const expired = { ...payload, iat: Date.now() - 11 * 60 * 1000 };
    const state = signOAuthState(expired, SECRET);
    expect(verifyOAuthState(state, SECRET)).toBeNull();
  });

  it('rejects malformed state strings', () => {
    expect(verifyOAuthState('not-a-signed-state', SECRET)).toBeNull();
    expect(verifyOAuthState('a.b.c', SECRET)).toBeNull();
  });
});
