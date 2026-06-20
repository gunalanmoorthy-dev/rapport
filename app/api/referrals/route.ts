/**
 * `POST /api/referrals` — introduce a client to a partner (tenant-scoped).
 *
 * @module api/referrals
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { partners, referrals } from "@/db/schema";
import { getAdvisorId } from "@/lib/auth";
import { getClientById, isUuid } from "@/lib/queries";

export const runtime = "nodejs";

/**
 * Create an introduction (status `introduced`).
 *
 * @param req - JSON body `{ clientId, partnerId }`.
 * @returns `201 { referral }`; `400`/`404` for bad/foreign client or partner; `401` if not signed in.
 */
export async function POST(req: Request) {
  try {
    const advisorId = await getAdvisorId();
    if (!advisorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId, partnerId } = (await req.json()) as {
      clientId?: string;
      partnerId?: string;
    };
    if (!clientId || !partnerId || !isUuid(clientId) || !isUuid(partnerId)) {
      return NextResponse.json({ error: "Valid clientId and partnerId are required." }, { status: 400 });
    }

    // Client must belong to this advisor.
    const client = await getClientById(clientId, advisorId);
    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }
    const [partner] = await db.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
    if (!partner) {
      return NextResponse.json({ error: "Partner not found." }, { status: 404 });
    }

    const [referral] = await db
      .insert(referrals)
      .values({ advisorId, clientId, partnerId, status: "introduced", introducedAt: new Date() })
      .returning();

    return NextResponse.json({ referral }, { status: 201 });
  } catch (err) {
    console.error("referral create error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create referral." },
      { status: 500 }
    );
  }
}
