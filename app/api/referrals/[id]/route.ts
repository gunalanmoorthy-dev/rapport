/**
 * `PATCH /api/referrals/[id]` — advance a referral's status (tenant-scoped).
 *
 * @module api/referrals/[id]
 */
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { referrals } from "@/db/schema";
import type { ReferralStatus } from "@/db/schema";
import { getAdvisorId } from "@/lib/auth";
import { isUuid } from "@/lib/queries";

export const runtime = "nodejs";

const VALID: ReadonlySet<ReferralStatus> = new Set([
  "introduced",
  "responded",
  "progressing",
  "closed",
]);

/**
 * Advance a referral's status. Moving to `responded` stamps `respondedAt` (once),
 * which feeds the code-computed response-time velocity.
 *
 * @param req - JSON body `{ status }`.
 * @param ctx - Route context with `params.id`.
 * @returns `200 { referral }`; `400` invalid; `404` not found; `401` if not signed in.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const advisorId = await getAdvisorId();
    if (!advisorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid referral id." }, { status: 400 });
    }
    const { status } = (await req.json()) as { status?: ReferralStatus };
    if (!status || !VALID.has(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(referrals)
      .where(and(eq(referrals.id, id), eq(referrals.advisorId, advisorId)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Referral not found." }, { status: 404 });
    }

    const update: { status: ReferralStatus; respondedAt?: Date } = { status };
    // Stamp the first response time, which drives avgResponseDays in code.
    if (status === "responded" && !existing.respondedAt) {
      update.respondedAt = new Date();
    }

    const [referral] = await db
      .update(referrals)
      .set(update)
      .where(and(eq(referrals.id, id), eq(referrals.advisorId, advisorId)))
      .returning();

    return NextResponse.json({ referral });
  } catch (err) {
    console.error("referral update error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update referral." },
      { status: 500 }
    );
  }
}
