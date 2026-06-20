/**
 * Seed script: inserts the demo advisor and ~6 realistic clients.
 *
 * Idempotent — safe to re-run. It upserts the advisor (fixed id) and replaces
 * the advisor's client set each run. Run with: `pnpm run seed`.
 *
 * @module scripts/seed
 */
import { config } from "dotenv";
// Load env BEFORE importing db/client — that module reads DATABASE_URL at import
// time, and ESM hoists static imports above this call. Dynamic-import below.
config({ path: ".env.local" });

const dollars = (d: number) => Math.round(d * 100);

const seedClients = [
  { name: "Eleanor Harrington", sentiment: "green" as const, balance: dollars(14_820_000), email: "eleanor.harrington@harringtontrust.com", phone: "+1 (212) 555-0147" },
  { name: "Marcus Okafor", sentiment: "amber" as const, balance: dollars(8_430_000), email: "marcus@okaforholdings.com", phone: "+1 (312) 555-0188" },
  { name: "Sophie Delacroix", sentiment: "green" as const, balance: dollars(22_150_000), email: "s.delacroix@delacroixprivate.fr", phone: "+33 1 45 55 0192" },
  { name: "Priya Venkataraman", sentiment: "green" as const, balance: dollars(41_300_000), email: "priya@venkataramanfo.com", phone: "+44 20 7555 0123" },
  { name: "James Whitlock", sentiment: "red" as const, balance: dollars(3_120_000), email: "james.whitlock@whitlockret.com", phone: "+1 (415) 555-0166" },
  { name: "Yuki Nakamura", sentiment: "amber" as const, balance: dollars(9_870_000), email: "yuki.nakamura@nakamuratrust.jp", phone: "+81 3 5555 0179" },
];

/** A few continuing-education activities (past + upcoming) for the Compliance log. */
const seedActivities = [
  { title: "Fixed income & duration risk workshop", category: "CPD", daysFromNow: -2 },
  { title: "Suitability & concentration risk module", category: "Ethics", daysFromNow: -5 },
  { title: "SEC Marketing Rule Q3 refresher", category: "Regulatory", daysFromNow: 9 },
  { title: "Alternatives & private credit due diligence", category: "CPD", daysFromNow: 21 },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — add it to .env.local before seeding.");
  }

  const { eq } = await import("drizzle-orm");
  const { db, pool } = await import("../db/client");
  const { advisors, clients, activities } = await import("../db/schema");
  const { DEMO_ADVISOR_ID } = await import("../lib/constants");

  // Advisor — fixed id so the server-side constant matches the seeded row.
  await db
    .insert(advisors)
    .values({
      id: DEMO_ADVISOR_ID,
      email: "alex@rapport.demo",
      name: "Alex Donovan",
      firm: "Rapport Wealth Partners",
    })
    .onConflictDoNothing();

  // Re-runnable: clear this advisor's clients (cascades to echoes + moves) first.
  await db.delete(clients).where(eq(clients.advisorId, DEMO_ADVISOR_ID));

  await db.insert(clients).values(
    seedClients.map((c) => ({
      advisorId: DEMO_ADVISOR_ID,
      name: c.name,
      sentiment: c.sentiment,
      totalBalanceCents: c.balance,
      email: c.email,
      phone: c.phone,
      status: "active" as const,
    }))
  );

  // Reset + seed compliance activities.
  await db.delete(activities).where(eq(activities.advisorId, DEMO_ADVISOR_ID));
  await db.insert(activities).values(
    seedActivities.map((a) => ({
      advisorId: DEMO_ADVISOR_ID,
      title: a.title,
      category: a.category,
      scheduledAt: new Date(Date.now() + a.daysFromNow * 86_400_000),
    }))
  );

  const inserted = await db
    .select()
    .from(clients)
    .where(eq(clients.advisorId, DEMO_ADVISOR_ID));

  console.log(`Seeded advisor ${DEMO_ADVISOR_ID} and ${inserted.length} clients:`);
  for (const c of inserted) {
    console.log(`  ${c.name} · ${c.sentiment} · $${((c.totalBalanceCents ?? 0) / 100).toLocaleString()}`);
  }

  await pool.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
