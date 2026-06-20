/**
 * `POST /api/echo/process` — the heart of the product.
 *
 * Takes a transcript, extracts intent (Gemini), verifies the money math in code,
 * then either auto-commits the change in a transaction or routes it to Staging.
 *
 * @module api/echo/process
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clients, echoes, portfolioMoves } from "@/db/schema";
import type { ExtractedIntent, Client } from "@/db/schema";
import { getClients } from "@/lib/queries";
import { extractIntent } from "@/lib/extract";
import { verifyMove } from "@/lib/verify";
import { getAdvisorId } from "@/lib/auth";
import { AUTO_COMMIT_THRESHOLD } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Resolve the model's matched name to an actual client row.
 *
 * Tries an exact (case-insensitive) name match first, then falls back to a
 * loose substring match either direction (handles "Priya" ↔ "Priya
 * Venkataraman"). Returns `null` when nothing matches — the caller treats an
 * unmatched money move as ambiguous and stages it.
 *
 * @param name - The name the model reported, or `null`.
 * @param list - The advisor's clients to match against.
 * @returns The matched client, or `null`.
 */
function matchClient(name: string | null, list: Client[]): Client | null {
  if (!name) return null;
  const needle = name.trim().toLowerCase();
  const exact = list.find((c) => c.name?.toLowerCase() === needle);
  if (exact) return exact;
  return (
    list.find(
      (c) =>
        c.name &&
        (c.name.toLowerCase().includes(needle) ||
          needle.includes(c.name.toLowerCase()))
    ) ?? null
  );
}

/**
 * Process a transcript end-to-end: extract → verify → commit-or-stage.
 *
 * Side effects: always inserts one `echoes` row. On auto-commit it additionally
 * inserts a `portfolio_moves` row and updates the client's balance — all three
 * writes happen in a single transaction that rolls back on any failure.
 *
 * @param req - Request with JSON body `{ transcript: string }`.
 * @returns `200` with the outcome (`status: "committed" | "staged"`, the
 *          extracted intent, and commit/stage details); `400` if the transcript
 *          is missing; `500` on failure.
 */
export async function POST(req: Request) {
  try {
    const advisorId = await getAdvisorId();
    if (!advisorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { transcript?: string };
    const transcript = body.transcript?.trim();
    if (!transcript) {
      return NextResponse.json({ error: "Missing transcript." }, { status: 400 });
    }

    const clientList = await getClients(advisorId);
    const raw = await extractIntent(
      transcript,
      clientList.map((c) => c.name ?? "").filter(Boolean)
    );

    const confidence = raw.confidence;
    const matched = matchClient(raw.matchedClientName, clientList);

    // Convert the stated dollar figure to cents in CODE (model does no math).
    const move = raw.move
      ? { amountCents: Math.round(raw.move.amount * 100), direction: raw.move.direction }
      : null;

    // Deterministic verification — only meaningful when we have a real client.
    const verify = move && matched ? verifyMove(matched.totalBalanceCents ?? 0, move) : null;

    // Confidence tiering. A change auto-commits ONLY when the model is confident
    // AND the math is sound. A move with no matched client can't be applied to a
    // balance, so it's treated as "not committable" and falls through to staging.
    // A note-only echo (no move) is committable on confidence alone.
    const flaggedInvalid = !!verify && !verify.valid;
    const canCommitMove = move ? !!matched && !!verify && verify.valid : true;
    const highConfidence = confidence >= AUTO_COMMIT_THRESHOLD;
    const shouldCommit = highConfidence && !flaggedInvalid && canCommitMove;

    const extracted: ExtractedIntent = {
      matchedClientId: matched?.id ?? null,
      matchedClientName: matched?.name ?? raw.matchedClientName ?? null,
      intents: raw.intents,
      move,
      summary: raw.summary,
      ...(flaggedInvalid ? { invalid: true, invalidReason: verify?.reason } : {}),
      ...(verify
        ? {
            balanceBeforeCents: verify.balanceBeforeCents,
            balanceAfterCents: verify.balanceAfterCents,
          }
        : {}),
    };

    // Why staged, for the UI.
    let reason: string;
    if (shouldCommit) reason = "Auto-committed — high confidence and math verified.";
    else if (flaggedInvalid) reason = "Overspend: outflow exceeds balance — routed to Staging.";
    else if (move && !matched) reason = "Couldn't match a client confidently — routed to Staging.";
    else if (!highConfidence) reason = "Low confidence — routed to Staging.";
    else reason = "Needs review — routed to Staging.";

    if (shouldCommit) {
      const echoId = await db.transaction(async (tx) => {
        const [echo] = await tx
          .insert(echoes)
          .values({
            advisorId,
            clientId: matched?.id ?? null,
            transcript,
            extracted,
            confidence: confidence.toString(),
            status: "committed",
          })
          .returning({ id: echoes.id });

        if (move && matched && verify) {
          await tx.insert(portfolioMoves).values({
            clientId: matched.id,
            echoId: echo.id,
            amountCents: move.amountCents,
            direction: move.direction,
          });
          await tx
            .update(clients)
            .set({ totalBalanceCents: verify.balanceAfterCents })
            .where(eq(clients.id, matched.id));
        }
        return echo.id;
      });

      return NextResponse.json({
        status: "committed",
        echoId,
        reason,
        confidence,
        clientName: matched?.name ?? null,
        move,
        balanceAfterCents: verify?.balanceAfterCents ?? null,
        extracted,
      });
    }

    // Stage — no balance change.
    const [echo] = await db
      .insert(echoes)
      .values({
        advisorId,
        clientId: matched?.id ?? null,
        transcript,
        extracted,
        confidence: confidence.toString(),
        status: "staged",
      })
      .returning({ id: echoes.id });

    return NextResponse.json({
      status: "staged",
      echoId: echo.id,
      reason,
      confidence,
      clientName: matched?.name ?? raw.matchedClientName ?? null,
      move,
      invalid: flaggedInvalid,
      extracted,
    });
  } catch (err) {
    console.error("process error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing failed." },
      { status: 500 }
    );
  }
}
