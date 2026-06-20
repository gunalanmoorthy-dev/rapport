import { config } from "dotenv";
config({ path: ".env.local" });

// Smoke test for the deterministic core loop (no OpenAI): inserts staged echoes
// with money moves, drives the real approve/reject endpoints, and asserts the
// balance math + status transitions. Run with the dev server up.
async function main() {
  const { eq } = await import("drizzle-orm");
  const { db, pool } = await import("../db/client");
  const { clients, echoes } = await import("../db/schema");
  const { DEMO_ADVISOR_ID } = await import("../lib/constants");
  const { verifyMove } = await import("../lib/verify");

  const base = "http://localhost:3000";
  const all = await db.select().from(clients).where(eq(clients.advisorId, DEMO_ADVISOR_ID));
  const priya = all.find((c) => c.name === "Priya Venkataraman")!;
  const james = all.find((c) => c.name === "James Whitlock")!;

  let pass = 0;
  let fail = 0;
  const check = (label: string, ok: boolean, extra = "") => {
    console.log(`${ok ? "PASS" : "FAIL"} · ${label}${extra ? ` — ${extra}` : ""}`);
    ok ? pass++ : fail++;
  };

  // 1) Valid inflow staged for Priya -> approve -> committed, balance += amount.
  const inflow = 200_000_000; // $2,000,000
  const before = priya.totalBalanceCents ?? 0;
  const v = verifyMove(before, { amountCents: inflow, direction: "in" });
  const [stagedValid] = await db
    .insert(echoes)
    .values({
      advisorId: DEMO_ADVISOR_ID,
      clientId: priya.id,
      transcript: "[verify] Priya contributing two million dollars.",
      extracted: {
        matchedClientId: priya.id,
        matchedClientName: priya.name,
        intents: ["add funds"],
        move: { amountCents: inflow, direction: "in" },
        summary: "Contribution of $2,000,000",
        balanceBeforeCents: v.balanceBeforeCents,
        balanceAfterCents: v.balanceAfterCents,
      },
      confidence: "0.6",
      status: "staged",
    })
    .returning({ id: echoes.id });

  const r1 = await fetch(`${base}/api/staging/${stagedValid.id}/approve`, { method: "POST" });
  const j1 = await r1.json();
  const priyaAfter = (await db.select().from(clients).where(eq(clients.id, priya.id)))[0];
  check("approve valid inflow returns committed", r1.ok && j1.status === "committed", JSON.stringify(j1));
  check(
    "Priya balance increased by inflow",
    (priyaAfter.totalBalanceCents ?? 0) === before + inflow,
    `${before} -> ${priyaAfter.totalBalanceCents}`
  );
  const echoValidRow = (await db.select().from(echoes).where(eq(echoes.id, stagedValid.id)))[0];
  check("valid echo status is committed", echoValidRow.status === "committed");

  // 2) Overspend staged for James -> approve must be rejected (409), no change.
  const overspend = 5_000_000_000; // $50,000,000 >> James balance
  const jamesBefore = james.totalBalanceCents ?? 0;
  const [stagedInvalid] = await db
    .insert(echoes)
    .values({
      advisorId: DEMO_ADVISOR_ID,
      clientId: james.id,
      transcript: "[verify] James withdraw fifty million dollars.",
      extracted: {
        matchedClientId: james.id,
        matchedClientName: james.name,
        intents: ["withdraw"],
        move: { amountCents: overspend, direction: "out" },
        summary: "Withdrawal of $50,000,000",
        invalid: true,
        invalidReason: "Outflow exceeds balance.",
        balanceBeforeCents: jamesBefore,
        balanceAfterCents: jamesBefore,
      },
      confidence: "0.95",
      status: "staged",
    })
    .returning({ id: echoes.id });

  const r2 = await fetch(`${base}/api/staging/${stagedInvalid.id}/approve`, { method: "POST" });
  const j2 = await r2.json();
  const jamesAfter = (await db.select().from(clients).where(eq(clients.id, james.id)))[0];
  check("approve overspend is blocked (409)", r2.status === 409, JSON.stringify(j2));
  check("James balance unchanged after blocked approve", (jamesAfter.totalBalanceCents ?? 0) === jamesBefore);

  // 3) Reject the overspend echo -> rolled_back, still no change.
  const r3 = await fetch(`${base}/api/staging/${stagedInvalid.id}/reject`, { method: "POST" });
  const j3 = await r3.json();
  const jamesAfter2 = (await db.select().from(clients).where(eq(clients.id, james.id)))[0];
  const echoInvalidRow = (await db.select().from(echoes).where(eq(echoes.id, stagedInvalid.id)))[0];
  check("reject returns rolled_back", r3.ok && j3.status === "rolled_back", JSON.stringify(j3));
  check("rejected echo status is rolled_back", echoInvalidRow.status === "rolled_back");
  check("James balance still unchanged after reject", (jamesAfter2.totalBalanceCents ?? 0) === jamesBefore);

  console.log(`\n${pass} passed, ${fail} failed`);
  await pool.end();
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
