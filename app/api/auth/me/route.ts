/**
 * `GET /api/auth/me` — the signed-in advisor's display info (for the app header).
 *
 * @module api/auth/me
 */
import { NextResponse } from "next/server";
import { getAdvisorId } from "@/lib/auth";
import { getAdvisorById } from "@/lib/queries";

export const runtime = "nodejs";

/**
 * Return the current advisor's name, work id, and firm.
 *
 * @returns `200 { name, workId, firm }`; `401` if not signed in.
 */
export async function GET() {
  const advisorId = await getAdvisorId();
  if (!advisorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const advisor = await getAdvisorById(advisorId);
  if (!advisor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    name: advisor.name,
    workId: advisor.workId,
    firm: advisor.firm,
    role: advisor.role ?? "advisor",
  });
}
