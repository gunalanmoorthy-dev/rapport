/**
 * `DELETE /api/activities/[id]` — remove a logged activity.
 *
 * @module api/activities/[id]
 */
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { activities } from "@/db/schema";
import { DEMO_ADVISOR_ID } from "@/lib/constants";
import { isUuid } from "@/lib/queries";

export const runtime = "nodejs";

/**
 * Delete an activity owned by the demo advisor.
 *
 * @param _req - Unused.
 * @param ctx - Route context with `params.id` (activity UUID).
 * @returns `200 { deleted: true }`; `400` invalid id; `404` not found.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid activity id." }, { status: 400 });
    }
    const [deleted] = await db
      .delete(activities)
      .where(and(eq(activities.id, id), eq(activities.advisorId, DEMO_ADVISOR_ID)))
      .returning({ id: activities.id });

    if (!deleted) {
      return NextResponse.json({ error: "Activity not found." }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("delete activity error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed." },
      { status: 500 }
    );
  }
}
