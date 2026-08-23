import { sanitizeProfileUpdate, PROFILE_ALLOWED_FIELDS, PROFILE_RESTRICTED_FIELDS } from './profile-allowlist';

describe('sanitizeProfileUpdate — mass assignment protection', () => {
  it('allows only editable fields', () => {
    const { data, restrictedFields } = sanitizeProfileUpdate({
      username: 'new-name',
      displayName: 'Display',
      bio: 'Hello',
      mainGames: ['Valorant'],
    });

    expect(restrictedFields).toEqual([]);
    expect(data).toEqual({
      username: 'new-name',
      displayName: 'Display',
      bio: 'Hello',
      mainGames: ['Valorant'],
    });
  });

  it('flags every server-owned statistic field as restricted', () => {
    const body: Record<string, unknown> = {
      gamerScore: 9999,
      skillScore: 9999,
      competitiveScore: 9999,
      communicationScore: 9999,
      leadershipScore: 9999,
      teamworkScore: 9999,
      improvementRate: 99,
      winRate: 99,
      kd: 9.9,
      accuracy: 99,
      totalMatches: 999,
      wins: 99,
      losses: 1,
      rankScore: 9999,
      rank: 'Grandmaster',
      verified: true,
      toxicityScore: 0,
      aiSummary: 'hacked',
    };

    const { data, restrictedFields } = sanitizeProfileUpdate(body);

    expect(data).toEqual({});
    expect(restrictedFields.sort()).toEqual([...PROFILE_RESTRICTED_FIELDS].sort());
  });

  it('returns validation failures when restricted fields are supplied alongside allowed fields', () => {
    const { data, restrictedFields } = sanitizeProfileUpdate({
      bio: 'update me',
      kd: 5.0,
      rank: 'Grandmaster',
    });

    expect(data).toEqual({ bio: 'update me' });
    expect(restrictedFields).toContain('kd');
    expect(restrictedFields).toContain('rank');
  });

  it('does not allow unknown server-owned keys to slip through (allowlist only)', () => {
    const { data } = sanitizeProfileUpdate({
      gamerScore: 1,
      someFutureStatField: 'x',
      userId: 'someone-elses-id',
    });
    expect(data).toEqual({});
    expect(Object.keys(data).every((k) => (PROFILE_ALLOWED_FIELDS as readonly string[]).includes(k))).toBe(true);
  });

  it('ignores restricted fields that were not supplied', () => {
    const { restrictedFields } = sanitizeProfileUpdate({ bio: 'clean update' });
    expect(restrictedFields).toEqual([]);
  });
});
