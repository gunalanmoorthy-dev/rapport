/**
 * `POST /api/admin/partners` — an admin adds a firm partner to the ecosystem.
 * Admin-only. Partners are org-wide (no advisor scope), so any admin in the firm
 * may extend the shared partner directory.
 *
 * @module api/admin/partners
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { partners } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

type Body = {
  name?: string;
  specialization?: string;
  tags?: string; // comma-separated
  contactEmail?: string;
};

/**
 * @param req - JSON `{ name, specialization?, tags?, contactEmail? }`.
 * @returns `201 { partner }`; `400` invalid; `401` not signed in; `403` not admin.
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
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Partner name is required." }, { status: 400 });
    }

    const tags = (body.tags ?? "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const [partner] = await db
      .insert(partners)
      .values({
        name,
        specialization: body.specialization?.trim() || null,
        specializationTags: tags.length ? tags : null,
        contactEmail: body.contactEmail?.trim() || null,
      })
      .returning();

    return NextResponse.json({ partner }, { status: 201 });
  } catch (err) {
    console.error("admin add partner error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add partner." },
      { status: 500 }
    );
  }
}
