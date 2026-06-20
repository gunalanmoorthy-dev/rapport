/**
 * `POST /api/clients` — create a client (starts as `pending`).
 *
 * @module api/clients
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { clients } from "@/db/schema";
import type { Sentiment } from "@/db/schema";
import { getAdvisorId } from "@/lib/auth";

export const runtime = "nodejs";

type CreateBody = {
  name?: string;
  email?: string;
  phone?: string;
  sentiment?: Sentiment;
  totalBalanceCents?: number;
};

/**
 * Create a new client for the demo advisor. New records are `pending` until an
 * advisor approves them (green ✓ on the Clients page).
 *
 * @param req - JSON body `{ name, email?, phone?, sentiment?, totalBalanceCents? }`.
 * @returns `201 { client }`; `400` if `name` is missing.
 */
export async function POST(req: Request) {
  try {
    const advisorId = await getAdvisorId();
    if (!advisorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CreateBody;
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const [client] = await db
      .insert(clients)
      .values({
        advisorId,
        name,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        sentiment: body.sentiment ?? "green",
        totalBalanceCents: Math.max(0, Math.round(body.totalBalanceCents ?? 0)),
        status: "pending",
      })
      .returning();

    return NextResponse.json({ client }, { status: 201 });
  } catch (err) {
    console.error("create client error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Create failed." },
      { status: 500 }
    );
  }
}
