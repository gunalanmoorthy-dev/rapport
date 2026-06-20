/**
 * `POST /api/auth/login` — advisor sign-in with work id + password.
 *
 * @module api/auth/login
 */
import { NextResponse } from "next/server";
import { getAdvisorByWorkId } from "@/lib/queries";
import { verifyPassword } from "@/lib/password";
import { setSession } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Authenticate an advisor and issue a session cookie.
 *
 * @param req - JSON body `{ workId, password }`.
 * @returns `200 { name }` and a session cookie on success; `400` if fields are
 *          missing; `401` for an unknown work id or wrong password (same message
 *          either way, so we don't reveal which work ids exist).
 */
export async function POST(req: Request) {
  try {
    const { workId, password } = (await req.json()) as {
      workId?: string;
      password?: string;
    };
    if (!workId?.trim() || !password) {
      return NextResponse.json(
        { error: "Work ID and password are required." },
        { status: 400 }
      );
    }

    const advisor = await getAdvisorByWorkId(workId.trim());
    if (!advisor || !verifyPassword(password, advisor.passwordHash)) {
      return NextResponse.json(
        { error: "Invalid work ID or password." },
        { status: 401 }
      );
    }

    const role = advisor.role ?? "advisor";
    await setSession(advisor.id, role);
    return NextResponse.json({ name: advisor.name, role });
  } catch (err) {
    console.error("login error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Login failed." },
      { status: 500 }
    );
  }
}
