/**
 * Unit tests for the deterministic CPD logic (lib/cpd.ts). No network, no DB.
 * Run with: `pnpm tsx scripts/test-cpd.ts`
 *
 * @module scripts/test-cpd
 */
import { creditFor, tallyCpd, type CpdPeriod } from "../lib/cpd";
import { CPD_ANNUAL_REQUIREMENT_MINUTES } from "../lib/constants";

let pass = 0;
let fail = 0;
const check = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"} · ${label}${extra ? ` — ${extra}` : ""}`);
  cond ? pass++ : fail++;
};

// Fixed window so the test is deterministic.
const period: CpdPeriod = { startMs: Date.parse("2026-01-01"), endMs: Date.parse("2026-12-31") };
const inWindow = Date.parse("2026-06-01");
const outOfWindow = Date.parse("2030-01-01");

// creditFor
check("creditFor seminar = 60", creditFor("seminar") === 60);
check("creditFor regulatory_brief = 15", creditFor("regulatory_brief") === 15);
check("creditFor duration override", creditFor("market_update", { durationMinutes: 45 }) === 45);
check("creditFor ignores non-positive override", creditFor("research", { durationMinutes: -5 }) === 20);

// tallyCpd — under requirement
const under = tallyCpd(
  [
    { minutes: 15, category: "Regulatory", verifiedAt: new Date(inWindow) },
    { minutes: 20, category: "Product", verifiedAt: new Date(inWindow) },
  ],
  [],
  period
);
check("under: total = 35", under.totalMinutes === 35, String(under.totalMinutes));
check("under: not met", under.metRequirement === false);
check("under: byCategory split", under.byCategory.Regulatory === 15 && under.byCategory.Product === 20);
check("under: requirement surfaced", under.requirementMinutes === CPD_ANNUAL_REQUIREMENT_MINUTES);

// tallyCpd — over requirement (entries + activities, with out-of-window excluded)
const bigEntries = Array.from({ length: 40 }, () => ({
  minutes: 60,
  category: "CPD",
  verifiedAt: new Date(inWindow),
})); // 2400 min
const over = tallyCpd(
  [...bigEntries, { minutes: 999, category: "CPD", verifiedAt: new Date(outOfWindow) }],
  [{ category: "Ethics", scheduledAt: new Date(inWindow) }], // +60
  period
);
check("over: excludes out-of-window entry", over.totalMinutes === 2400 + 60, String(over.totalMinutes));
check("over: meets requirement", over.metRequirement === true);
check("over: activity credited as seminar (60) under Ethics", over.byCategory.Ethics === 60);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
