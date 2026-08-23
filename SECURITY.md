# Security Policy

## Verified Game-Data Integrity

GamerZ Hub never fabricates player identities, game statistics, ranks, K/D,
win rates, match counts, achievements, or "verified" status. Verified game
accounts are stored **only** when a real, supported server-side API
verification succeeds:

- **Clash of Clans** — official Supercell API (player tag lookup)
- **PUBG PC / Console (Steam)** — official PUBG API (player name lookup)
- **Steam** — official Steam Web API (steamID64 lookup)

Every other game returns "This game does not currently support verified
account connection" and never creates a verified account. Unsupported/unknown
statistics are stored as NULL (not 0) and rendered as unavailable.

### Clash of Clans account-ownership limitation

The public Supercell player API can prove that a player tag **exists**, but it
cannot prove that the requesting user **owns** the account (there is no
OAuth-style ownership proof). GamerZ Hub therefore uses the safest feasible
policy: a player may connect one tag, change it exactly once, and the tag is
then permanently locked to their account. The lock is stored on the User row
(`clashTagChangeCount` / `clashTagHistory`) and survives disconnecting,
logging out, deleting the game-account row and refreshing — it can never be
reset or bypassed through direct API calls.

### Cleaning legacy fabricated records

`npx tsx src/scripts/cleanup-fabricated-accounts.ts` (or `--dry-run` to
preview) marks accounts that were created by legacy fabricated flows as
unverified and clears their fabricated statistic columns. The production
build applies the schema changes via `prisma db push`.

## Supported Versions

Use this section to tell people about which versions of your project are
currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 5.1.x   | :white_check_mark: |
| 5.0.x   | :x:                |
| 4.0.x   | :white_check_mark: |
| < 4.0   | :x:                |

## Reporting a Vulnerability

Use this section to tell people how to report a vulnerability.

Tell them where to go, how often they can expect to get an update on a
reported vulnerability, what to expect if the vulnerability is accepted or
declined, etc.
