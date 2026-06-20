/**
 * One-off, idempotent, ADDITIVE schema changes for the feature update:
 * client contact info + approval status + note, and a new `activities` table.
 *
 * Nothing is dropped. Safe to re-run. Run with: `pnpm tsx scripts/apply-feature-schema.ts`.
 *
 * @module scripts/apply-feature-schema
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const STATEMENTS = [
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS email text`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone text`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS note text`,
  `CREATE TABLE IF NOT EXISTS activities (
     id uuid primary key default gen_random_uuid(),
     advisor_id uuid not null references advisors(id) on delete cascade,
     title text not null,
     category text,
     scheduled_at timestamptz,
     created_at timestamptz not null default now()
   )`,
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — add it to .env.local first.");
  }
  const { pool } = await import("../db/client");
  for (const sql of STATEMENTS) {
    await pool.query(sql);
    console.log("ok:", sql.split("\n")[0].trim());
  }
  console.log("Feature schema applied.");
  await pool.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
