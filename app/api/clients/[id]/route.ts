/**
 * `PATCH /api/clients/[id]` — edit/approve a client.
 * `DELETE /api/clients/[id]` — delete a client (cascades to its echoes/moves).
 *
 * @module api/clients/[id]
 */
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clients } from "@/db/schema";
import type { ClientStatus, Sentiment } from "@/db/schema";
import { DEMO_ADVISOR_ID } from "@/lib/constants";
import { isUuid } from "@/lib/queries";

export const runtime = "nodejs";

type PatchBody = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  sentiment?: Sentiment;
  totalBalanceCents?: number;
  note?: string | null;
  status?: ClientStatus; // set to "active" to approve a pending client
};

/**
 * Partially update a client. Pass `status: "active"` to approve a pending
 * record (the green ✓). Only the fields present in the body are changed.
 *
 * @param req - JSON body with any subset of editable client fields.
 * @param ctx - Route context with `params.id` (client UUID).
 * @returns `200 { client }`; `400` invalid id / empty update; `404` not found.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid client id." }, { status: 400 });
    }
    const body = (await req.json()) as PatchBody;

    // Build the update set from only the provided fields, normalizing blanks to null.
    const update: Partial<typeof clients.$inferInsert> = {};
    if (body.name !== undefined) update.name = body.name.trim();
    if (body.email !== undefined) update.email = body.email?.trim() || null;
    if (body.phone !== undefined) update.phone = body.phone?.trim() || null;
    if (body.sentiment !== undefined) update.sentiment = body.sentiment;
    if (body.note !== undefined) update.note = body.note ?? null;
    if (body.status !== undefined) update.status = body.status;
    if (body.totalBalanceCents !== undefined) {
      update.totalBalanceCents = Math.max(0, Math.round(body.totalBalanceCents));
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const [client] = await db
      .update(clients)
      .set(update)
      .where(and(eq(clients.id, id), eq(clients.advisorId, DEMO_ADVISOR_ID)))
      .returning();

    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }
    return NextResponse.json({ client });
  } catch (err) {
    console.error("update client error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed." },
      { status: 500 }
    );
  }
}

/**
 * Delete a client (the red ✗). Cascades to the client's echoes and portfolio
 * moves via the foreign keys.
 *
 * @param _req - Unused.
 * @param ctx - Route context with `params.id` (client UUID).
 * @returns `200 { deleted: true }`; `400` invalid id; `404` not found.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid client id." }, { status: 400 });
    }
    const [deleted] = await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.advisorId, DEMO_ADVISOR_ID)))
      .returning({ id: clients.id });

    if (!deleted) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("delete client error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed." },
      { status: 500 }
    );
  }
}
