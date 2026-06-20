/**
 * `GET /api/partners` — firm-wide partners with code-computed track records, plus
 * the signed-in advisor's own referrals.
 *
 * Partner scores are aggregated org-wide (a partner's reputation is firm-level,
 * and the figures are non-identifying); the referrals LIST is tenant-scoped.
 *
 * @module api/partners
 */
import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clients, partners, referrals } from "@/db/schema";
import { getAdvisorId } from "@/lib/auth";
import { computePartnerScore, type PartnerScore } from "@/lib/partners";

export const runtime = "nodejs";

/** Group referrals by partner and compute each partner's score (in code). */
export async function partnerScores(): Promise<Map<string, PartnerScore>> {
  const all = await db
    .select({
      partnerId: referrals.partnerId,
      status: referrals.status,
      introducedAt: referrals.introducedAt,
      respondedAt: referrals.respondedAt,
    })
    .from(referrals);

  const byPartner = new Map<string, typeof all>();
  for (const r of all) {
    const list = byPartner.get(r.partnerId) ?? [];
    list.push(r);
    byPartner.set(r.partnerId, list);
  }

  const scores = new Map<string, PartnerScore>();
  for (const [partnerId, list] of byPartner) {
    scores.set(partnerId, computePartnerScore(list));
  }
  return scores;
}

/**
 * @returns `200 { partners: [...with score], referrals: [...tenant-scoped] }`;
 *          `401` if not signed in.
 */
export async function GET() {
  try {
    const advisorId = await getAdvisorId();
    if (!advisorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [partnerRows, scores, myReferrals] = await Promise.all([
      db.select().from(partners).orderBy(asc(partners.name)),
      partnerScores(),
      db
        .select({
          id: referrals.id,
          status: referrals.status,
          introducedAt: referrals.introducedAt,
          respondedAt: referrals.respondedAt,
          partnerId: referrals.partnerId,
          partnerName: partners.name,
          clientName: clients.name,
        })
        .from(referrals)
        .leftJoin(partners, eq(referrals.partnerId, partners.id))
        .leftJoin(clients, eq(referrals.clientId, clients.id))
        .where(eq(referrals.advisorId, advisorId))
        .orderBy(desc(referrals.introducedAt)),
    ]);

    const withScores = partnerRows.map((p) => ({
      ...p,
      score: scores.get(p.id) ?? { successScore: null, avgResponseDays: null, activeCount: 0 },
    }));

    return NextResponse.json({ partners: withScores, referrals: myReferrals });
  } catch (err) {
    console.error("partners list error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load partners." },
      { status: 500 }
    );
  }
}
