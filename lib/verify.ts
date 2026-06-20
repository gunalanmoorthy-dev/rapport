import type { MoveDirection } from "@/db/schema";

export type MoveInput = { amountCents: number; direction: MoveDirection };

export type VerifyResult = {
  valid: boolean;
  balanceBeforeCents: number;
  balanceAfterCents: number;
  reason?: string;
};

/**
 * The trust mechanic. ALL portfolio math happens here in TypeScript — the model
 * never computes a balance. Given a client's current balance and an extracted
 * move, we recompute the resulting balance deterministically and reject an
 * outflow that exceeds the balance (an overspend can never auto-commit).
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
