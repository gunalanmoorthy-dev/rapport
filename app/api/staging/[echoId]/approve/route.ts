/**
 * `POST /api/staging/[echoId]/approve` — commit a staged echo.
 *
 * @module api/staging/approve
 */
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clients, echoes, portfolioMoves } from "@/db/schema";
import { verifyMove } from "@/lib/verify";
import { DEMO_ADVISOR_ID } from "@/lib/constants";
import { isUuid } from "@/lib/queries";

export const runtime = "nodejs";

/**
 * Approve a staged echo, committing it in a transaction.
 *
 * For a money move, the math is **re-verified against the client's CURRENT
 * balance** (which may have changed since the echo was recorded) before
 * inserting the move, updating the balance, and marking the echo `committed` —
 * all atomically. An overspend at approval time is refused (`409`). A note-only
 * staged echo simply flips to `committed`.
 *
 * @param _req - Unused (no request body).
 * @param ctx - Route context with `params.echoId`.
 * @returns `200 { status: "committed", ... }`; `400` invalid id; `404` not found;
 *          `409` already resolved or overspend; `500` on failure.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ echoId: string }> }
) {
  try {
    const { echoId } = await params;
    if (!isUuid(echoId)) {
      return NextResponse.json({ error: "Invalid echo id." }, { status: 400 });
    }

    const [echo] = await db
      .select()
      .from(echoes)
      .where(and(eq(echoes.id, echoId), eq(echoes.advisorId, DEMO_ADVISOR_ID)))
      .limit(1);

    if (!echo) {
      return NextResponse.json({ error: "Echo not found." }, { status: 404 });
    }
    if (echo.status !== "staged") {
      return NextResponse.json(
        { error: `Echo is already ${echo.status}.` },
        { status: 409 }
      );
    }

    const move = echo.extracted?.move ?? null;
    const clientId = echo.extracted?.matchedClientId ?? echo.clientId ?? null;

    // Money move: re-run the deterministic check against the CURRENT balance,
    // then commit move + balance + status atomically. Overspend can't approve.
    if (move && clientId) {
      const result = await db.transaction(async (tx) => {
        const [client] = await tx
          .select()
          .from(clients)
          .where(eq(clients.id, clientId))
          .limit(1);
        if (!client) throw new Error("Client not found.");

        const v = verifyMove(client.totalBalanceCents ?? 0, move);
        if (!v.valid) return { ok: false as const, reason: v.reason };

        await tx.insert(portfolioMoves).values({
          clientId,
          echoId: echo.id,
          amountCents: move.amountCents,
          direction: move.direction,
        });
        await tx
          .update(clients)
          .set({ totalBalanceCents: v.balanceAfterCents })
          .where(eq(clients.id, clientId));
        await tx
          .update(echoes)
          .set({ status: "committed", clientId })
          .where(eq(echoes.id, echo.id));

        return { ok: true as const, balanceAfterCents: v.balanceAfterCents };
      });

      if (!result.ok) {
        return NextResponse.json({ error: result.reason }, { status: 409 });
      }
      return NextResponse.json({
        status: "committed",
        balanceAfterCents: result.balanceAfterCents,
      });
    }

    // Note-only staged echo (no money move): just commit the status.
    await db
      .update(echoes)
      .set({ status: "committed" })
      .where(eq(echoes.id, echo.id));

    return NextResponse.json({ status: "committed" });
  } catch (err) {
    console.error("approve error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Approve failed." },
      { status: 500 }
    );
  }
}
