/**
 * Idempotent, ADDITIVE DDL for Features A/B/C — raw SQL (NOT drizzle-kit).
 * Creates cpd_entries, field_briefs, partners, then referrals (FK order).
 * Nothing is dropped. Safe to re-run. Run with:
 *   pnpm tsx scripts/apply-abc-schema.ts
 *
 * @module scripts/apply-abc-schema
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const STATEMENTS = [
  // Account role for the admin oversight interface.
  `ALTER TABLE advisors ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'advisor'`,
  `CREATE TABLE IF NOT EXISTS cpd_entries (
     id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     advisor_id  uuid NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
     source_type text NOT NULL,
     source_ref  text,
     category    text,
     minutes     integer NOT NULL,
     verified_at timestamptz,
     created_at  timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS field_briefs (
     id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     advisor_id     uuid NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
     transcript     text,
     summary        text,
     problem_domain text,
     tags           jsonb,
     scrubbed       boolean DEFAULT false,
     created_at     timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS partners (
     id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     name                text NOT NULL,
     specialization      text,
     specialization_tags jsonb,
     contact_email       text,
     created_at          timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS referrals (
     id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     advisor_id    uuid NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
     client_id     uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
     partner_id    uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
     status        text NOT NULL,
     introduced_at timestamptz DEFAULT now(),
     responded_at  timestamptz,
     created_at    timestamptz NOT NULL DEFAULT now()
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
  console.log("A/B/C schema applied.");
  await pool.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
