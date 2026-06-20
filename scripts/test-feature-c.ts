/**
 * Unit tests for Feature C: computePartnerScore (incl. zero-referral),
 * matchPartners ranking, and the extractNeed mock shape. No network, no DB.
 * Run with: `pnpm tsx scripts/test-feature-c.ts`
 *
 * @module scripts/test-feature-c
 */
import { computePartnerScore, matchPartners, type PartnerScore } from "../lib/partners";
import { extractNeed } from "../lib/extractNeed";

let pass = 0;
let fail = 0;
const check = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"} · ${label}${extra ? ` — ${extra}` : ""}`);
  cond ? pass++ : fail++;
};

const day = 86_400_000;
const intro = new Date("2026-01-01T00:00:00Z");
const resp = (d: number) => new Date(intro.getTime() + d * day);

// --- computePartnerScore: zero-referral case ---
const empty = computePartnerScore([]);
check("zero referrals → null score (not fake 0)", empty.successScore === null && empty.avgResponseDays === null);
check("zero referrals → activeCount 0", empty.activeCount === 0);

// --- computePartnerScore: mixed ---
const score = computePartnerScore([
  { status: "closed", introducedAt: intro, respondedAt: resp(4) },
  { status: "progressing", introducedAt: intro, respondedAt: resp(2) },
  { status: "introduced", introducedAt: intro, respondedAt: null },
  { status: "responded", introducedAt: intro, respondedAt: resp(6) },
]);
check("successScore = 50% (closed+progressing / 4)", score.successScore === 50, String(score.successScore));
check("activeCount = 3 (introduced+responded+progressing; closed excluded)", score.activeCount === 3, String(score.activeCount));
check("avgResponseDays = 4 ((4+2+6)/3)", score.avgResponseDays === 4, String(score.avgResponseDays));

// --- matchPartners: ranking by overlap then successScore ---
const partners = [
  { id: "a", specializationTags: ["estate-planning", "trust"] },
  { id: "b", specializationTags: ["estate-planning", "tax-planning"] },
  { id: "c", specializationTags: ["insurance"] },
];
const scores = new Map<string, PartnerScore>([
  ["a", { successScore: 40, avgResponseDays: 3, activeCount: 2 }],
  ["b", { successScore: 90, avgResponseDays: 2, activeCount: 1 }],
]);
const ranked = matchPartners(["estate-planning", "trust"], partners, scores);
check("excludes non-overlapping partner", !ranked.some((p) => p.id === "c"));
check("ranks higher overlap first (a: 2 tags)", ranked[0]?.id === "a", ranked.map((p) => p.id).join(","));
check("tie-break by successScore (b before none)", ranked[1]?.id === "b");

// --- extractNeed mock shape ---
async function main() {
  const n = await extractNeed("client needs estate and will planning plus cross-border tax");
  check("extractNeed returns tags array", Array.isArray(n.specializationTags) && n.specializationTags.length > 0);
  check("extractNeed maps estate keyword", n.specializationTags.includes("estate-planning"), n.specializationTags.join(","));
  const fallback = await extractNeed("something totally unrelated zzz");
  check("extractNeed falls back to general-advisory", fallback.specializationTags.includes("general-advisory"));

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
