/**
 * Unit tests for Feature B: scrub (PII redaction) + extractBrief mock shape.
 * No network, no DB. Run with: `pnpm tsx scripts/test-feature-b.ts`
 *
 * @module scripts/test-feature-b
 */
import { scrub } from "../lib/scrub";
import { extractBrief } from "../lib/extractBrief";

let pass = 0;
let fail = 0;
const check = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"} · ${label}${extra ? ` — ${extra}` : ""}`);
  cond ? pass++ : fail++;
};

// --- scrub: each PII type ---
const email = scrub("Reach me at eleanor.harrington@trust.com please");
check("scrub email", email.text.includes("[redacted email]") && !email.text.includes("@trust.com"), email.text);

const phone = scrub("Call +60 12-345 6789 tomorrow");
check("scrub phone", phone.text.includes("[redacted phone]") && !/6789/.test(phone.text), phone.text);

const nric = scrub("NRIC 880101-14-5678 on file");
check("scrub NRIC (dashed)", nric.text.includes("[redacted id]") && !/5678/.test(nric.text), nric.text);

const nricPlain = scrub("id 880101145678 noted");
check("scrub NRIC (plain 12)", nricPlain.text.includes("[redacted id]"), nricPlain.text);

const card = scrub("card 4111 1111 1111 1111 on record");
check("scrub card", card.text.includes("[redacted card]") && !/4111/.test(card.text), card.text);

const name = scrub("Spoke with Eleanor Harrington about treasuries", ["Eleanor Harrington"]);
check("scrub client name", name.text.includes("[redacted name]") && !/Eleanor/.test(name.text), name.text);

check("scrub counts redactions", email.redactionsCount === 1 && name.redactionsCount === 1);

const clean = scrub("Moved proceeds into short-duration treasuries", ["Eleanor Harrington"]);
check("scrub leaves clean text untouched", clean.text === "Moved proceeds into short-duration treasuries" && clean.redactionsCount === 0);

// --- extractBrief mock shape (isAiMock true with no GEMINI_API_KEY) ---
async function main() {
  const b = await extractBrief("Some field note about de-risking ahead of a property purchase.");
  check("extractBrief returns summary string", typeof b.summary === "string" && b.summary.length > 0);
  check("extractBrief returns tags array", Array.isArray(b.tags) && b.tags.every((t) => typeof t === "string"));
  check("extractBrief returns problemDomain (string|null)", b.problemDomain === null || typeof b.problemDomain === "string");

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
