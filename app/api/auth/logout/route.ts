/**
 * `POST /api/auth/logout` — clear the session cookie.
 *
 * @module api/auth/logout
 */
import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Sign the current advisor out by deleting the session cookie.
 *
 * @returns `200 { ok: true }`.
 */
export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
