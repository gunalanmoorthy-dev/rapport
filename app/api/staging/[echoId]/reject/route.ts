/**
 * `POST /api/staging/[echoId]/reject` — discard a staged echo.
 *
 * @module api/staging/reject
 */
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { echoes } from "@/db/schema";
import { DEMO_ADVISOR_ID } from "@/lib/constants";
import { isUuid } from "@/lib/queries";

export const runtime = "nodejs";

/**
 * Reject a staged echo. Marks it `rolled_back` and changes nothing else — no
 * portfolio move, no balance touch. Idempotency: only `staged` echoes can be
 * rejected (others return `409`).
 *
 * @param _req - Unused (no request body).
 * @param ctx - Route context with `params.echoId`.
 * @returns `200 { status: "rolled_back" }`; `400` invalid id; `404` not found;
 *          `409` already resolved; `500` on failure.
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

    // Reject changes nothing — no move, no balance touch. Just mark it.
    await db
      .update(echoes)
      .set({ status: "rolled_back" })
      .where(eq(echoes.id, echo.id));

    return NextResponse.json({ status: "rolled_back" });
  } catch (err) {
    console.error("reject error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reject failed." },
      { status: 500 }
    );
  }
}
