/**
 * The trust mechanic: deterministic balance math, in code, never in the model.
 *
 * The LLM only ever reports the figure it heard. Every balance computation and
 * the overspend rule live here so the money path is auditable and impossible for
 * the model to get wrong. Both the auto-commit flow and the staging-approval
 * flow run this same check.
 *
 * @module lib/verify
 */
import type { MoveDirection } from "@/db/schema";

/** A money movement to verify: amount in integer cents and its direction. */
export type MoveInput = { amountCents: number; direction: MoveDirection };

/** Outcome of {@link verifyMove}: validity, the before/after balances, and why if invalid. */
export type VerifyResult = {
  /** `false` when the move must NOT be applied (e.g. an overspend). */
  valid: boolean;
  balanceBeforeCents: number;
  /** The recomputed balance. Equals `balanceBeforeCents` when `valid` is `false`. */
  balanceAfterCents: number;
  /** Human-readable explanation, present only when `valid` is `false`. */
  reason?: string;
};

/**
 * Recompute a client's resulting balance for a move and decide if it may apply.
 *
 * Rejects (a) a missing/negative/non-finite amount and (b) an outflow larger than
 * the available balance — an overspend can never auto-commit. For a valid move the
 * resulting balance is `before + amount` (in) or `before - amount` (out).
 *
 * @param balanceBeforeCents - The client's current balance, in integer cents.
 * @param move - The extracted move (`amountCents`, `direction`).
 * @returns A {@link VerifyResult}; when invalid, `balanceAfterCents` is left equal
 *          to `balanceBeforeCents` and `reason` explains the rejection.
 */
export function verifyMove(balanceBeforeCents: number, move: MoveInput): VerifyResult {
  const amount = Math.round(move.amountCents);

  if (!Number.isFinite(amount) || amount < 0) {
    return {
      valid: false,
      balanceBeforeCents,
      balanceAfterCents: balanceBeforeCents,
      reason: "Move amount is missing or not a valid figure.",
    };
  }

  if (move.direction === "out" && amount > balanceBeforeCents) {
    return {
      valid: false,
      balanceBeforeCents,
      balanceAfterCents: balanceBeforeCents,
      reason: `Outflow of ${amount} cents exceeds the available balance of ${balanceBeforeCents} cents.`,
    };
  }

  const balanceAfterCents =
    move.direction === "in" ? balanceBeforeCents + amount : balanceBeforeCents - amount;

  return { valid: true, balanceBeforeCents, balanceAfterCents };
}
