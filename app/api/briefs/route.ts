/**
 * `POST /api/briefs` — turn an already-transcribed field note into a scrubbed,
 *   reusable brief. (The frontend calls the existing `/api/echo/transcribe`
 *   first; this route never touches that one.)
 * `GET  /api/briefs?q=` — tenant-scoped search over the advisor's briefs.
 *
 * @module api/briefs
 */
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { fieldBriefs } from "@/db/schema";
import { getClients } from "@/lib/queries";
import { getAdvisorId } from "@/lib/auth";
import { extractBrief } from "@/lib/extractBrief";
import { scrub } from "@/lib/scrub";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Create a brief: interpret (AI) → scrub (code, the gate) → store. Nothing is
 * written unscrubbed; the advisor's own client names are redacted too.
 *
 * @param req - JSON body `{ transcript }` (already transcribed).
 * @returns `201 { brief, redactionsCount }`; `400` if no transcript; `401` if not signed in.
 */
export async function POST(req: Request) {
  try {
    const advisorId = await getAdvisorId();
    if (!advisorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { transcript?: string };
    const transcript = body.transcript?.trim();
    if (!transcript) {
      return NextResponse.json({ error: "Missing transcript." }, { status: 400 });
    }

    // AI interprets only.
    const extraction = await extractBrief(transcript);

    // CODE decides what is safe to store — redact before insert.
    const clientNames = (await getClients(advisorId))
      .map((c) => c.name ?? "")
      .filter(Boolean);
    const scrubbedTranscript = scrub(transcript, clientNames);
    const scrubbedSummary = scrub(extraction.summary, clientNames);
    const scrubbedTags = extraction.tags.map((t) => scrub(t, clientNames).text);
    const redactionsCount =
      scrubbedTranscript.redactionsCount + scrubbedSummary.redactionsCount;

    const [brief] = await db
      .insert(fieldBriefs)
      .values({
        advisorId,
        transcript: scrubbedTranscript.text,
        summary: scrubbedSummary.text,
        problemDomain: extraction.problemDomain,
        tags: scrubbedTags,
        scrubbed: true,
      })
      .returning();

    return NextResponse.json({ brief, redactionsCount }, { status: 201 });
  } catch (err) {
    console.error("brief create error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save brief." },
      { status: 500 }
    );
  }
}

/**
 * Search the advisor's briefs by free text over summary, tags, and domain.
 *
 * @param req - Request; optional `?q=` query.
 * @returns `200 { briefs }`; `401` if not signed in.
 */
export async function GET(req: Request) {
  try {
    const advisorId = await getAdvisorId();
    if (!advisorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = new URL(req.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
    const rows = await db
      .select()
      .from(fieldBriefs)
      .where(eq(fieldBriefs.advisorId, advisorId))
      .orderBy(desc(fieldBriefs.createdAt));

    const briefs = q
      ? rows.filter((b) => {
          const hay = [
            b.summary ?? "",
            b.problemDomain ?? "",
            ...(b.tags ?? []),
          ]
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        })
      : rows;

    return NextResponse.json({ briefs });
  } catch (err) {
    console.error("brief search error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load briefs." },
      { status: 500 }
    );
  }
}
