/**
 * `POST /api/partners/match` — map a stated client need to specialization tags
 * (AI), then rank partners by tag overlap + code-computed score.
 *
 * @module api/partners/match
 */
import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { partners } from "@/db/schema";
import { getAdvisorId } from "@/lib/auth";
import { extractNeed } from "@/lib/extractNeed";
import { matchPartners } from "@/lib/partners";
import { partnerScores } from "../route";

export const runtime = "nodejs";

/**
 * @param req - JSON body `{ need }` (free-text client need).
 * @returns `200 { tags, partners: ranked }`; `400` if no need; `401` if not signed in.
 */
export async function POST(req: Request) {
  try {
    const advisorId = await getAdvisorId();
    if (!advisorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { need } = (await req.json()) as { need?: string };
    if (!need?.trim()) {
      return NextResponse.json({ error: "Describe the client need." }, { status: 400 });
    }

    // AI interprets the need into tags; code does the ranking.
    const { specializationTags } = await extractNeed(need.trim());
    const [partnerRows, scores] = await Promise.all([
      db.select().from(partners).orderBy(asc(partners.name)),
      partnerScores(),
    ]);

    const ranked = matchPartners(specializationTags, partnerRows, scores);
    return NextResponse.json({ tags: specializationTags, partners: ranked });
  } catch (err) {
    console.error("partner match error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Match failed." },
      { status: 500 }
    );
  }
}
