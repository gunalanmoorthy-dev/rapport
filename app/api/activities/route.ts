/**
 * `POST /api/activities` — log a continuing-education activity / seminar.
 *
 * @module api/activities
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { activities } from "@/db/schema";
import { DEMO_ADVISOR_ID } from "@/lib/constants";

export const runtime = "nodejs";

type CreateBody = {
  title?: string;
  category?: string;
  /** ISO date-time string (e.g. from a `datetime-local` input). */
  scheduledAt?: string;
};

/**
 * Create an activity. `scheduledAt` may be in the future (upcoming seminar) or
 * past (attended) — the Compliance screen splits them by date.
 *
 * @param req - JSON body `{ title, category?, scheduledAt? }`.
 * @returns `201 { activity }`; `400` if `title` is missing or the date is invalid.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateBody;
    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
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
      .values({
        advisorId: DEMO_ADVISOR_ID,
        title,
        category: body.category?.trim() || null,
        scheduledAt,
      })
      .returning();

    return NextResponse.json({ activity }, { status: 201 });
  } catch (err) {
    console.error("create activity error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Create failed." },
      { status: 500 }
    );
  }
}
