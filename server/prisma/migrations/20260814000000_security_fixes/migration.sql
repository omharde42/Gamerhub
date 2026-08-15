-- Security fix: durable Clash of Clans one-time tag-change lock.
-- The lock lives on the User row so disconnecting/logging out/refreshing can
-- never reset the one-time change restriction (the GameAccount row is
-- deletable; this is not).
ALTER TABLE "User" ADD COLUMN "clashTagChangeCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "clashTagHistory" JSONB;

-- Security fix: fabricated-statistics ban.
-- GameAccount.verified now defaults to FALSE (nothing is verified implicitly),
-- and nullable statistic columns no longer default to 0 so "no stats yet" is
-- stored as NULL (distinct from a real numeric zero).
ALTER TABLE "GameAccount" ALTER COLUMN "verified" SET DEFAULT false;
ALTER TABLE "GameAccount" ALTER COLUMN "kdRatio" DROP DEFAULT;
ALTER TABLE "GameAccount" ALTER COLUMN "winRate" DROP DEFAULT;
ALTER TABLE "GameAccount" ALTER COLUMN "totalMatches" DROP DEFAULT;
ALTER TABLE "GameAccount" ALTER COLUMN "rankRating" DROP DEFAULT;
ALTER TABLE "GameAccount" ALTER COLUMN "headshotPct" DROP DEFAULT;
ALTER TABLE "GameAccount" ALTER COLUMN "elo" DROP DEFAULT;
ALTER TABLE "GameAccount" ALTER COLUMN "steamLevel" DROP DEFAULT;
ALTER TABLE "GameAccount" ALTER COLUMN "hoursPlayed" DROP DEFAULT;
ALTER TABLE "GameAccount" ALTER COLUMN "level" DROP DEFAULT;

-- NOTE: existing fabricated rows are cleaned by
--   npx tsx src/scripts/cleanup-fabricated-accounts.ts
-- (or with --dry-run to preview). The build pipeline uses `prisma db push`,
-- which applies the schema above automatically.
