/**
 * `POST /api/cpd`  — record a verified CPD credit (minutes decided in code).
 * `GET  /api/cpd`  — the advisor's CPD tally vs. the annual requirement.
 *
 * @module api/cpd
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { cpdEntries } from "@/db/schema";
import type { CpdSourceType } from "@/db/schema";
import { getActivities } from "@/lib/queries";
import { getAdvisorId } from "@/lib/auth";
import { creditFor, tallyCpd } from "@/lib/cpd";

export const runtime = "nodejs";

const VALID_SOURCES: ReadonlySet<CpdSourceType> = new Set([
  "regulatory_brief",
  "market_update",
  "research",
  "seminar",
  "field_brief",
]);

type CreateBody = {
  sourceType?: string;
  sourceRef?: string;
  category?: string;
};

/**
 * Record a CPD credit. The minutes are NEVER taken from the request — they are
 * computed by {@link creditFor} from the (validated) source type.
 *
 * @param req - JSON body `{ sourceType, sourceRef?, category? }`.
 * @returns `201 { entry }`; `400` for an invalid source type; `401` if not signed in.
 */
export async function POST(req: Request) {
  try {
    const advisorId = await getAdvisorId();
    if (!advisorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CreateBody;
    const sourceType = body.sourceType as CpdSourceType;
    if (!sourceType || !VALID_SOURCES.has(sourceType)) {
      return NextResponse.json({ error: "Invalid source type." }, { status: 400 });
    }

    const minutes = creditFor(sourceType); // code decides, not the caller
    const [entry] = await db
      .insert(cpdEntries)
      .values({
        advisorId,
        sourceType,
        sourceRef: body.sourceRef?.trim() || null,
        category: body.category?.trim() || null,
        minutes,
        verifiedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    console.error("cpd create error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to record CPD." },
      { status: 500 }
    );
  }
}

/**
 * Return the advisor's CPD tally — CPD entries plus existing activities,
 * computed deterministically by {@link tallyCpd}.
 *
 * @returns `200` with the tally; `401` if not signed in.
 */
export async function GET() {
  try {
    const advisorId = await getAdvisorId();
    if (!advisorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [entries, activities] = await Promise.all([
      db.select().from(cpdEntries).where(eq(cpdEntries.advisorId, advisorId)),
      getActivities(advisorId),
    ]);

    return NextResponse.json(tallyCpd(entries, activities));
  } catch (err) {
    console.error("cpd tally error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to tally CPD." },
      { status: 500 }
    );
  }
}
