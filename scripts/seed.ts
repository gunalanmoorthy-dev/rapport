/**
 * Seed script: three advisors (each with login credentials) and their client books.
 *
 * Idempotent — safe to re-run. Upserts the advisors by fixed id and replaces each
 * advisor's clients/activities/staged echoes. Run with: `pnpm run seed`.
 *
 * Demo credentials (work id / password):
 *   ADV-001 / rapport2026  → Alex Donovan (advisor, 6 clients)
 *   ADV-002 / rapport2026  → Jordan Avery (advisor, 2 clients)
 *   ADV-003 / rapport2026  → Riley Chen (advisor, 3 clients)
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
const ADVISOR_3_ID = "00000000-0000-0000-0000-000000000004";
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
  "ADV-003": [
    { name: "Amara Nwosu", sentiment: "green", balance: dollars(18_900_000), email: "amara@nwosucapital.com", phone: "+1 (713) 555-0244" },
    { name: "Henrik Larsson", sentiment: "amber", balance: dollars(7_360_000), email: "henrik.larsson@larssonfo.se", phone: "+46 8 5555 0277" },
    { name: "Isabella Rossi", sentiment: "red", balance: dollars(4_180_000), email: "isabella.rossi@rossifamily.it", phone: "+39 06 5555 0299" },
  ],
};

/** A few continuing-education activities (past + upcoming) for the Compliance log. */
const seedActivities = [
  { title: "Fixed income & duration risk workshop", category: "CPD", daysFromNow: -2 },
  { title: "Suitability & concentration risk module", category: "Ethics", daysFromNow: -5 },
  { title: "SEC Marketing Rule Q3 refresher", category: "Regulatory", daysFromNow: 9 },
  { title: "Alternatives & private credit due diligence", category: "CPD", daysFromNow: 21 },
];

/**
 * Staged (unconfirmed) echoes per advisor. Confidence stays < 0.9 so they remain
 * in the staging queue. `clientIndex` references that advisor's client array above.
 */
const stagedEchoesByWorkId: Record<
  string,
  { clientIndex: number; transcript: string; summary: string; confidence: number }[]
> = {
  "ADV-001": [
    {
      clientIndex: 1,
      transcript: "Marcus wants to revisit his risk profile after the TSLA trim — flag for a call.",
      summary: "Risk profile review requested — concentration follow-up",
      confidence: 0.62,
    },
    {
      clientIndex: 4,
      transcript: "James sounded unhappy on the call, possible retention risk, sentiment may be red.",
      summary: "Retention risk — sentiment downgrade pending verbal confirmation",
      confidence: 0.58,
    },
  ],
  "ADV-002": [
    {
      clientIndex: 0,
      transcript: "Theresa asked about adding a 529 plan for her grandchild.",
      summary: "New 529 plan opening — awaiting funding confirmation",
      confidence: 0.71,
    },
  ],
  "ADV-003": [
    {
      clientIndex: 0,
      transcript: "Amara wants to rotate part of the equity sleeve into private credit next quarter.",
      summary: "Private credit allocation — proposed Q3 rotation",
      confidence: 0.66,
    },
    {
      clientIndex: 2,
      transcript: "Isabella raised liquidity concerns ahead of a property purchase.",
      summary: "Liquidity need flagged — property purchase, amount TBC",
      confidence: 0.54,
    },
  ],
};

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — add it to .env.local before seeding.");
  }

  const { eq } = await import("drizzle-orm");
  const { db, pool } = await import("../db/client");
  const { advisors, clients, activities, echoes } = await import("../db/schema");
  const { DEMO_ADVISOR_ID } = await import("../lib/constants");
  const { hashPassword } = await import("../lib/password");

  const passwordHash = hashPassword(DEMO_PASSWORD);

  const advisorRows = [
    { id: DEMO_ADVISOR_ID, email: "alex@rapport.demo", name: "Alex Donovan", firm: "Rapport Wealth Partners", workId: "ADV-001", role: "advisor" as const },
    { id: ADVISOR_2_ID, email: "jordan@rapport.demo", name: "Jordan Avery", firm: "Rapport Wealth Partners", workId: "ADV-002", role: "advisor" as const },
    { id: ADVISOR_3_ID, email: "riley@rapport.demo", name: "Riley Chen", firm: "Rapport Wealth Partners", workId: "ADV-003", role: "advisor" as const },
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

  // Compliance activities + staged echoes for every advisor (skip admins).
  for (const a of advisorRows) {
    if (a.role !== "advisor") continue;

    // Compliance log.
    await db.delete(activities).where(eq(activities.advisorId, a.id));
    await db.insert(activities).values(
      seedActivities.map((act) => ({
        advisorId: a.id,
        title: act.title,
        category: act.category,
        scheduledAt: new Date(Date.now() + act.daysFromNow * 86_400_000),
      }))
    );

    // Staged echoes (unconfirmed, low confidence) for the staging queue.
    await db.delete(echoes).where(eq(echoes.advisorId, a.id));
    const stagedFixtures = stagedEchoesByWorkId[a.workId] ?? [];
    if (stagedFixtures.length) {
      const advisorClients = await db.select().from(clients).where(eq(clients.advisorId, a.id));
      await db.insert(echoes).values(
        stagedFixtures.map((s) => {
          const client = advisorClients[s.clientIndex];
          return {
            advisorId: a.id,
            clientId: client?.id ?? null,
            transcript: s.transcript,
            confidence: String(s.confidence),
            status: "staged" as const,
            extracted: {
              matchedClientId: client?.id ?? null,
              matchedClientName: client?.name ?? null,
              intents: [],
              move: null,
              summary: s.summary,
            },
          };
        })
      );
    }
  }

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
