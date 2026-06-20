/**
 * Seed script: two advisors (each with login credentials) and their client books.
 *
 * Idempotent — safe to re-run. Upserts the advisors by fixed id and replaces each
 * advisor's clients/activities. Run with: `pnpm run seed`.
 *
 * Demo credentials (work id / password):
 *   ADV-001 / rapport2026  → Alex Donovan (advisor, 6 clients)
 *   ADV-002 / rapport2026  → Jordan Avery (advisor, 2 clients)
 *   ADM-001 / rapport2026  → Morgan Reyes (admin, firm oversight)
 *
 * @module scripts/seed
 */
import { config } from "dotenv";
// Load env BEFORE importing db/client — that module reads DATABASE_URL at import
// time, and ESM hoists static imports above this call. Dynamic-import below.
config({ path: ".env.local" });

const dollars = (d: number) => Math.round(d * 100);
const ADVISOR_2_ID = "00000000-0000-0000-0000-000000000002";
const ADMIN_ID = "00000000-0000-0000-0000-000000000003";
const DEMO_PASSWORD = "rapport2026";

const clientsByAdvisorWorkId: Record<
  string,
  { name: string; sentiment: "green" | "amber" | "red"; balance: number; email: string; phone: string }[]
> = {
  "ADV-001": [
    { name: "Eleanor Harrington", sentiment: "green", balance: dollars(14_820_000), email: "eleanor.harrington@harringtontrust.com", phone: "+1 (212) 555-0147" },
    { name: "Marcus Okafor", sentiment: "amber", balance: dollars(8_430_000), email: "marcus@okaforholdings.com", phone: "+1 (312) 555-0188" },
    { name: "Sophie Delacroix", sentiment: "green", balance: dollars(22_150_000), email: "s.delacroix@delacroixprivate.fr", phone: "+33 1 45 55 0192" },
    { name: "Priya Venkataraman", sentiment: "green", balance: dollars(41_300_000), email: "priya@venkataramanfo.com", phone: "+44 20 7555 0123" },
    { name: "James Whitlock", sentiment: "red", balance: dollars(3_120_000), email: "james.whitlock@whitlockret.com", phone: "+1 (415) 555-0166" },
    { name: "Yuki Nakamura", sentiment: "amber", balance: dollars(9_870_000), email: "yuki.nakamura@nakamuratrust.jp", phone: "+81 3 5555 0179" },
  ],
  "ADV-002": [
    { name: "Theresa Bennett", sentiment: "green", balance: dollars(6_540_000), email: "theresa.bennett@bennettfamily.com", phone: "+1 (646) 555-0210" },
    { name: "Diego Marchetti", sentiment: "amber", balance: dollars(11_200_000), email: "diego@marchettiholdings.it", phone: "+39 02 5555 0231" },
  ],
};

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
  const { hashPassword } = await import("../lib/password");

  const passwordHash = hashPassword(DEMO_PASSWORD);

  const advisorRows = [
    { id: DEMO_ADVISOR_ID, email: "alex@rapport.demo", name: "Alex Donovan", firm: "Rapport Wealth Partners", workId: "ADV-001", role: "advisor" as const },
    { id: ADVISOR_2_ID, email: "jordan@rapport.demo", name: "Jordan Avery", firm: "Rapport Wealth Partners", workId: "ADV-002", role: "advisor" as const },
    { id: ADMIN_ID, email: "morgan@rapport.demo", name: "Morgan Reyes", firm: "Rapport Wealth Partners", workId: "ADM-001", role: "admin" as const },
  ];

  for (const a of advisorRows) {
    // Upsert by id so re-runs refresh credentials (onConflictDoNothing wouldn't).
    await db
      .insert(advisors)
      .values({ ...a, passwordHash })
      .onConflictDoUpdate({
        target: advisors.id,
        set: { email: a.email, name: a.name, firm: a.firm, workId: a.workId, role: a.role, passwordHash },
      });

    // Re-runnable: clear this advisor's clients (cascades to echoes + moves) first.
    await db.delete(clients).where(eq(clients.advisorId, a.id));
    const clientList = clientsByAdvisorWorkId[a.workId] ?? [];
    if (clientList.length) {
      await db.insert(clients).values(
        clientList.map((c) => ({
          advisorId: a.id,
          name: c.name,
          sentiment: c.sentiment,
          totalBalanceCents: c.balance,
          email: c.email,
          phone: c.phone,
          status: "active" as const,
        }))
      );
    }
  }

  // Compliance activities for advisor 1 only.
  await db.delete(activities).where(eq(activities.advisorId, DEMO_ADVISOR_ID));
  await db.insert(activities).values(
    seedActivities.map((a) => ({
      advisorId: DEMO_ADVISOR_ID,
      title: a.title,
      category: a.category,
      scheduledAt: new Date(Date.now() + a.daysFromNow * 86_400_000),
    }))
  );

  for (const a of advisorRows) {
    const rows = await db.select().from(clients).where(eq(clients.advisorId, a.id));
    console.log(`${a.workId} (${a.name}) · ${a.role} · password "${DEMO_PASSWORD}" · ${rows.length} clients`);
  }

  await pool.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
