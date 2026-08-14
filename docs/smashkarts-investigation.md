# Smash Karts Integration — Investigation Findings

**Status:** Investigation complete — no integration code built. Recommendation: **manual entry only** (see below).

## Question

Does SmashKarts (smashkarts.io, by Tall Team Limited) expose a public API or stats endpoint that GamerzHub could sync player data from?

## Findings

1. **No public API exists.** SmashKarts has no developer portal, no OAuth flow, no player-stats REST endpoint, and no API documentation. Searches of tall.team (developer), smashkarts.io, and community documentation (Fandom wiki, Discord) surface no official stats API.
2. **No third-party stats API either.** Unlike PUBG (api.pubg.com) or Supercell games, no community-maintained SmashKarts stat service exists. The only community "leaderboards" (smash-karts.fandom.com/wiki/Smash_Karts_Wiki_Leaderboards) are manually maintained with user-submitted screenshots — not machine-readable data.
3. **Game data is transient and unidentifiable.** Rounds are 3-minute free-for-all deathmatches. The game has a username-based account system (used for cosmetics via the Prize Machine), but there is no lookup endpoint for a player's lifetime wins/kills, and match history is not exposed to players anywhere (web or mobile).
4. **Scraping is not viable.** There is no stats page to scrape per player, and any undocumented internal endpoints would be fragile, violate the game's ToS, and are not a sound product feature.

## Recommendation

**Do not build an API integration.** Use **manual entry**, which GamerzHub already supports:

- The Passport page (`web/src/app/passport/[username]/page.tsx`) already has a manual per-game add form (`winRate`, `kdRatio`, `matchesPlayed` inputs) — add a "SmashKarts" option there.
- Store it as a normal `ConnectedGame` row (`dataSource: 'MANUAL'`, `verificationStatus: 'UNVERIFIED'`), consistent with how manual passport entries are handled.
- Mark SmashKarts as **manual-entry only** in the games catalog so the UI shows "Enter stats manually" instead of "Connect account".

## Optional follow-ups (not code, coordination only)

- Contact Tall Team (support@tall.team / Discord) to ask whether a stats API is planned.
- If a player wants in-app verification of a manually entered stat, they can submit a screenshot — reuse the existing verification flow (`POST /game-stats/verify` pattern), which is designed exactly for this.
