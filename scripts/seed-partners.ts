/**
 * Additive seed for Feature C — firm-wide partners + varied referral history,
 * so success scores and response velocities compute to realistic numbers.
 *
 * Standalone; does NOT modify the existing seed. Run AFTER `pnpm run seed`
 * (it needs the demo advisor's clients). Run with:
 *   pnpm tsx scripts/seed-partners.ts
 *
 * @module scripts/seed-partners
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const DAY = 86_400_000;

const partnerDefs = [
  { name: "Lim & Tan Estate Advisory", specialization: "Estate & trust planning", specializationTags: ["estate-planning", "trust", "philanthropy"], contactEmail: "estate@limtan.example" },
  { name: "Meridian Tax Partners", specialization: "Tax & cross-border", specializationTags: ["tax-planning", "cross-border"], contactEmail: "hello@meridiantax.example" },
  { name: "AsiaGuard Insurance", specialization: "Risk & insurance", specializationTags: ["insurance", "risk"], contactEmail: "team@asiaguard.example" },
  { name: "Keystone Property Finance", specialization: "Property & mortgage", specializationTags: ["property", "mortgage"], contactEmail: "advisors@keystone.example" },
  { name: "Pinnacle Succession Law", specialization: "Business succession & legal", specializationTags: ["business-succession", "legal"], contactEmail: "partners@pinnacle.example" },
  { name: "Horizon Cross-Border Wealth", specialization: "Offshore & international", specializationTags: ["cross-border", "offshore", "tax-planning"], contactEmail: "contact@horizonxb.example" },
];

// Varied referral plan (partner index, status, days to respond if responded+).
const plan: { p: number; status: "introduced" | "responded" | "progressing" | "closed"; resp?: number }[] = [
  { p: 0, status: "closed", resp: 5 }, { p: 0, status: "progressing", resp: 3 }, { p: 0, status: "introduced" },
  { p: 1, status: "responded", resp: 2 }, { p: 1, status: "progressing", resp: 8 }, { p: 1, status: "closed", resp: 4 }, { p: 1, status: "closed", resp: 6 },
  { p: 2, status: "introduced" }, { p: 2, status: "introduced" },
  { p: 3, status: "closed", resp: 7 }, { p: 3, status: "responded", resp: 1 }, { p: 3, status: "introduced" },
  { p: 4, status: "progressing", resp: 3 }, { p: 4, status: "closed", resp: 5 }, { p: 4, status: "closed", resp: 2 },
  { p: 5, status: "responded", resp: 4 }, { p: 5, status: "introduced" }, { p: 5, status: "progressing", resp: 9 }, { p: 5, status: "closed", resp: 3 },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — add it to .env.local first.");
  }
  const { eq } = await import("drizzle-orm");
  const { db, pool } = await import("../db/client");
  const { partners, referrals, clients } = await import("../db/schema");
  const { DEMO_ADVISOR_ID } = await import("../lib/constants");

  const advisorClients = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.advisorId, DEMO_ADVISOR_ID));
  if (advisorClients.length === 0) {
    throw new Error("No clients for the demo advisor — run `pnpm run seed` first.");
  }

  // Re-runnable: clearing partners cascades all referrals.
  await db.delete(partners);
  const inserted = await db.insert(partners).values(partnerDefs).returning({ id: partners.id });

  const now = Date.now();
  const rows = plan.map((item, i) => {
    const introducedAt = new Date(now - (10 + i * 4) * DAY);
    const respondedAt = item.resp != null ? new Date(introducedAt.getTime() + item.resp * DAY) : null;
    return {
      advisorId: DEMO_ADVISOR_ID,
      clientId: advisorClients[i % advisorClients.length].id,
      partnerId: inserted[item.p].id,
      status: item.status,
      introducedAt,
      respondedAt,
    };
  });
  await db.insert(referrals).values(rows);

  console.log(`Seeded ${inserted.length} partners and ${rows.length} referrals for ${DEMO_ADVISOR_ID}.`);
  await pool.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
