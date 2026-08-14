/**
 * Cleanup script for fabricated game-account records.
 *
 * Background: before the fabrication ban, several flows stored synthetic player
 * names, ranks, K/D, win rates, match counts, levels, achievements and
 * "verified" flags (game-sync service, Free Fire/Valorant/BGMI connectors,
 * legacy Steam fallbacks). Those records must never be returned as verified
 * data.
 *
 * This script is idempotent and safe to re-run. It marks affected records as
 * unverified (verified=false, syncStatus='NO_DATA') and clears fabricated
 * statistic columns — it never deletes rows or user data.
 *
 * Usage:
 *   npx tsx src/scripts/cleanup-fabricated-accounts.ts          # apply
 *   npx tsx src/scripts/cleanup-fabricated-accounts.ts --dry-run # preview only
 */
import prisma from '../config/database';
import { Prisma } from '@prisma/client';

const FABRICATED_GAMES = ['FREE_FIRE', 'VALORANT', 'FACEIT', 'CLASH_ROYALE', 'BRAWL_STARS', 'DISCORD'];

// Stat columns that were fabricated by legacy flows and must be cleared.
const FABRICATED_COLUMNS = {
  kdRatio: null,
  winRate: null,
  totalMatches: null,
  rank: null,
  level: null,
  rankRating: null,
  headshotPct: null,
  elo: null,
  steamLevel: null,
  hoursPlayed: null,
  recentMatches: Prisma.JsonNull,
  achievements: Prisma.JsonNull,
};

async function unverify(account: { id: string; game: string; inGameUid: string; inGameName: string; rank: string | null; winRate: number | null; totalMatches: number | null }, dryRun: boolean, reasons: string[]) {
  const label = `[${account.game}] ${account.inGameUid}`;
  if (dryRun) {
    console.log(`DRY-RUN: would unverify ${label} — ${reasons.join('; ')}`);
    return;
  }
  await prisma.gameAccount.update({
    where: { id: account.id },
    data: { verified: false, syncStatus: 'NO_DATA', ...FABRICATED_COLUMNS },
  });
  console.log(`Unverified ${label} — ${reasons.join('; ')}`);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const accounts = await prisma.gameAccount.findMany({
    select: { id: true, game: true, inGameUid: true, inGameName: true, rank: true, winRate: true, totalMatches: true },
  });

  let checked = 0;
  let flagged = 0;

  // Profile statistic fields are exclusively written by game connectors. The
  // legacy Free Fire / Valorant / BGMI connectors fabricated these values, and
  // no verified path writes them today — so any non-zero value cannot be
  // trusted and is reset to 0 ("no data"). The dedicated Clash connector only
  // writes profile.rank (real API value), which is left intact.
  if (!dryRun) {
    const profileReset = await prisma.profile.updateMany({
      where: {
        OR: [
          { kd: { not: 0 } },
          { winRate: { not: 0 } },
          { accuracy: { not: 0 } },
          { totalMatches: { not: 0 } },
          { wins: { not: 0 } },
          { losses: { not: 0 } },
        ],
      },
      data: { kd: 0, winRate: 0, accuracy: 0, totalMatches: 0, wins: 0, losses: 0 },
    });
    console.log(`Reset fabricated profile statistic fields on ${profileReset.count} profiles.`);
  } else {
    console.log('DRY-RUN: would reset fabricated profile statistic fields (kd, winRate, accuracy, totalMatches, wins, losses) to 0.');
  }

  for (const acc of accounts) {
    checked++;
    const reasons: string[] = [];
    const game = (acc.game || '').toUpperCase();

    // 1. Games that never had an official verification path.
    if (FABRICATED_GAMES.includes(game)) {
      reasons.push('no official verification path exists for this game');
    }

    // 2. PUBG rows with purely numeric inGameUid are BGMI mobile UIDs that were
    //    fabricated by the legacy BGMI connector. Real PUBG PC names can never
    //    be purely numeric (the connector rejects them).
    if (game === 'PUBG' && /^\d+$/.test(acc.inGameUid || '')) {
      reasons.push('numeric mobile UID written by the legacy BGMI connector');
    }

    // 3. Clash of Clans rows created by the legacy game-sync fabricated path
    //    ("X Master (#TAG)" names, 'Legend League' hard-coded ranks, winRate).
    //    The real connector never writes winRate and always stores
    //    "Town Hall N" ranks from the API.
    if (game === 'CLASH_OF_CLANS') {
      if ((acc.inGameName || '').includes(' Master (#')) reasons.push('legacy fabricated game-sync record');
      if ((acc.rank || '').includes('Legend League')) reasons.push('hard-coded fabricated rank');
      if (acc.winRate != null) reasons.push('fabricated win rate');
    }

    // 4. Steam rows created by the legacy game-sync fallback wrote fabricated
    //    winRate/totalMatches/achievements. The real Steam integration never
    //    sets these.
    if (game === 'STEAM') {
      if (acc.winRate != null) reasons.push('fabricated win rate from legacy game-sync');
      if (acc.totalMatches != null) reasons.push('fabricated match count from legacy game-sync');
    }

    if (reasons.length > 0) {
      flagged++;
      await unverify(acc, dryRun, reasons);
    }
  }

  console.log(`\nScanned ${checked} game accounts; flagged ${flagged} fabricated/unverified records.`);
  if (dryRun) {
    console.log('Dry-run complete — no changes were made. Re-run without --dry-run to apply.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Cleanup failed:', err);
    process.exit(1);
  });
