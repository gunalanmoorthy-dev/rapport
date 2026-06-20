/**
 * `POST /api/partner/partners` — a partner adds a firm partner to the ecosystem.
 * Partner-only (admins use `/api/admin/partners`). Partners are org-wide (no
 * advisor scope), so any signed-in partner may extend the shared directory.
 *
 * @module api/partner/partners
 */
import { NextResponse } from "next/server";
import { createPartner, type NewPartnerInput } from "@/lib/partners";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * @param req - JSON `{ name, specialization?, tags?, contactEmail? }`.
 * @returns `201 { partner }`; `400` invalid; `401` not signed in; `403` not a partner.
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "partner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as NewPartnerInput;
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Partner name is required." }, { status: 400 });
    }

    const partner = await createPartner(body);
    return NextResponse.json({ partner }, { status: 201 });
  } catch (err) {
    console.error("partner add partner error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add partner." },
      { status: 500 }
    );
  }
}
