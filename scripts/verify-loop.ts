/**
 * Unit test for the trust-critical core loop — no server, no DB, no AI.
 *
 * Asserts the deterministic money math in {@link verifyMove} and the
 * commit-vs-stage decision used by `app/api/echo/process`: a change auto-commits
 * ONLY when the model is confident AND the math is sound; everything else stages.
 */
import { verifyMove } from "../lib/verify";
import { AUTO_COMMIT_THRESHOLD } from "../lib/constants";

let pass = 0;
let fail = 0;
const check = (label: string, ok: boolean, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"} · ${label}${extra ? ` — ${extra}` : ""}`);
  ok ? pass++ : fail++;
};

// --- verifyMove: the money math ---
const inflow = verifyMove(1_000_000, { amountCents: 200_000, direction: "in" });
check("inflow is valid", inflow.valid);
check("inflow recomputes balance", inflow.balanceAfterCents === 1_200_000, `${inflow.balanceAfterCents}`);

const outflow = verifyMove(1_000_000, { amountCents: 50_000, direction: "out" });
check("outflow is valid", outflow.valid);
check("outflow recomputes balance", outflow.balanceAfterCents === 950_000, `${outflow.balanceAfterCents}`);

const overspend = verifyMove(1_000_000, { amountCents: 5_000_000, direction: "out" });
check("overspend is rejected", !overspend.valid);
check("overspend leaves balance unchanged", overspend.balanceAfterCents === 1_000_000);
check("overspend gives a reason", typeof overspend.reason === "string" && overspend.reason!.length > 0);

const exact = verifyMove(1_000_000, { amountCents: 1_000_000, direction: "out" });
check("withdraw-to-zero is valid (not an overspend)", exact.valid && exact.balanceAfterCents === 0);

const bad = verifyMove(1_000_000, { amountCents: -1, direction: "in" });
check("negative amount is rejected", !bad.valid);

// --- commit-vs-stage decision (mirrors app/api/echo/process) ---
function shouldCommit(opts: {
  confidence: number;
  hasMove: boolean;
  matched: boolean;
  mathValid: boolean;
}): boolean {
  const { confidence, hasMove, matched, mathValid } = opts;
  const flaggedInvalid = hasMove && matched && !mathValid;
  const canCommitMove = hasMove ? matched && mathValid : true;
  return confidence >= AUTO_COMMIT_THRESHOLD && !flaggedInvalid && canCommitMove;
}

check("high-confidence valid move commits", shouldCommit({ confidence: 0.97, hasMove: true, matched: true, mathValid: true }));
check("high-confidence note (no move) commits", shouldCommit({ confidence: 0.93, hasMove: false, matched: false, mathValid: true }));
check("low-confidence stages", !shouldCommit({ confidence: 0.2, hasMove: false, matched: false, mathValid: true }));
check("overspend stages even at high confidence", !shouldCommit({ confidence: 0.96, hasMove: true, matched: true, mathValid: false }));
check("unmatched client move stages", !shouldCommit({ confidence: 0.95, hasMove: true, matched: false, mathValid: true }));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
