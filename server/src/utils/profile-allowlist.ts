/**
 * Profile update allowlist.
 *
 * Users may only update their own editable profile fields. Server-owned fields
 * (game statistics, scores, verification flags and anything derived from
 * verified game connections) are rejected with validation errors — a direct
 * API call can never write them.
 */

export const PROFILE_ALLOWED_FIELDS = [
  'username',
  'displayName',
  'avatar',
  'banner',
  'bio',
  'country',
  'city',
  'languages',
  'experienceLevel',
  'playStyle',
  'communicationStyle',
  'activeTime',
  'age',
  'timezone',
  'availability',
  'preferredGamingTime',
  'role',
  'mainGames',
  'allowComparison',
  'twitch',
  'youtube',
  'discord',
  'steam',
  'twitter',
  'instagram',
  'kick',
  'facebookGaming',
  'website',
] as const;

/** Server-owned / game-verification fields — never writable by clients. */
export const PROFILE_RESTRICTED_FIELDS = [
  'gamerScore',
  'skillScore',
  'competitiveScore',
  'communicationScore',
  'leadershipScore',
  'teamworkScore',
  'improvementRate',
  'winRate',
  'kd',
  'accuracy',
  'totalMatches',
  'wins',
  'losses',
  'rankScore',
  'rank',
  'verified',
  'toxicityScore',
  'aiSummary',
] as const;

export interface ProfileUpdateResult {
  /** Sanitized, allowlisted update payload (only editable fields). */
  data: Record<string, unknown>;
  /** Restricted fields that were supplied by the client (rejected). */
  restrictedFields: string[];
}

/**
 * Split an incoming profile update body into allowed data and rejected
 * restricted fields. Empty `data` with a non-empty `restrictedFields` means the
 * request should be rejected entirely with validation errors.
 */
export function sanitizeProfileUpdate(body: Record<string, unknown>): ProfileUpdateResult {
  const data: Record<string, unknown> = {};
  const restrictedFields: string[] = [];

  for (const field of PROFILE_RESTRICTED_FIELDS) {
    if (field in body) restrictedFields.push(field);
  }

  for (const field of PROFILE_ALLOWED_FIELDS) {
    if (field in body) data[field] = body[field];
  }

  return { data, restrictedFields };
}
