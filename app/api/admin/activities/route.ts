/**
 * `POST /api/admin/activities` — an admin logs a compliance activity FOR one of
 * their advisors. Admin-only and firm-scoped (the target must be an advisor in
 * the admin's firm). This is the one place an admin writes advisor data.
 *
 * @module api/admin/activities
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { activities } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getAdvisorById } from "@/lib/queries";
import { getManagedAdvisor } from "@/lib/admin";

export const runtime = "nodejs";

type Body = {
  advisorId?: string;
  title?: string;
  category?: string;
  scheduledAt?: string;
};

/**
 * @param req - JSON `{ advisorId, title, category?, scheduledAt? }`.
 * @returns `201 { activity }`; `400` invalid; `401` not signed in; `403` not an
 *          admin or the target isn't in the admin's firm.
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as Body;
    const title = body.title?.trim();
    if (!body.advisorId || !title) {
      return NextResponse.json({ error: "advisorId and title are required." }, { status: 400 });
    }

    // The admin may only write to an advisor in their own firm.
    const admin = await getAdvisorById(session.advisorId);
    const target = await getManagedAdvisor(admin?.firm ?? null, body.advisorId);
    if (!target) {
      return NextResponse.json({ error: "Advisor not in your firm." }, { status: 403 });
    }

    let scheduledAt: Date | null = null;
    if (body.scheduledAt) {
      const d = new Date(body.scheduledAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid date/time." }, { status: 400 });
      }
      scheduledAt = d;
    }

    const [activity] = await db
      .insert(activities)
      .values({ advisorId: target.id, title, category: body.category?.trim() || null, scheduledAt })
      .returning();

    return NextResponse.json({ activity }, { status: 201 });
  } catch (err) {
    console.error("admin add activity error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add activity." },
      { status: 500 }
    );
  }
}
