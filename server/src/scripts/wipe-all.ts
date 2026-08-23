/**
 * Wipe ALL data from the connected database.
 *
 * DANGER: This truncates every table and resets all sequences.
 * It cannot be undone. Requires an explicit confirmation flag.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx src/scripts/wipe-all.ts --confirm=WIPE_PRODUCTION
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const confirm = process.argv.find((a) => a.startsWith('--confirm='))?.split('=')[1];
  if (confirm !== 'WIPE_PRODUCTION') {
    console.error('ABORTED: pass --confirm=WIPE_PRODUCTION to run this script.');
    process.exit(1);
  }

  const url = (process.env.DATABASE_URL || '').replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  console.log(`Connected to: ${url}`);
  console.log('Fetching table list...');

  const tables: string[] = await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  ).then((rows: any) => rows.map((r: any) => r.tablename));

  if (!tables.length) {
    console.log('No tables found in public schema. Nothing to wipe.');
    return;
  }

  console.log(`Truncating ${tables.length} tables: ${tables.join(', ')}`);

  const quoted = tables.map((t) => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);

  const remaining: any[] = await prisma.$queryRawUnsafe(
    `SELECT (SELECT count(*) FROM pg_tables WHERE schemaname='public') AS tables,
            (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.reltuples > 0) AS nonempty`
  );
  console.log('DONE. All rows deleted, all sequences reset.');
  console.log(JSON.stringify(remaining[0]));
}

main()
  .catch((e) => {
    console.error('WIPE FAILED:', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
