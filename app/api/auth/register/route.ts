/**
 * `POST /api/auth/register` — self-service advisor sign-up.
 *
 * @module api/auth/register
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { advisors } from "@/db/schema";
import { getAdvisorByWorkId, getAdvisorByEmail } from "@/lib/queries";
import { hashPassword } from "@/lib/password";
import { setSession } from "@/lib/auth";

export const runtime = "nodejs";

type RegisterBody = {
  name?: string;
  email?: string;
  workId?: string;
  password?: string;
  firm?: string;
  role?: string;
};

/**
 * Create a new advisor account and sign them in. New advisors start with an
 * empty book of clients. Work id and email must be unique.
 *
 * @param req - JSON body `{ name, email, workId, password, firm?, role? }`
 *   (`role` is `"advisor"` by default, or `"admin"`).
 * @returns `201 { name }` + a session cookie; `400` for missing/invalid fields;
 *          `409` if the work id or email is already taken.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterBody;
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const workId = body.workId?.trim();
    const password = body.password ?? "";
    const firm = body.firm?.trim() || null;
    // Self-service role choice. NOTE: this lets anyone register as an admin, who
    // can then oversee every advisor in the firm they typed. Fine for the demo;
    // in production this should be invite/approval-gated.
    const role = body.role === "admin" ? "admin" : "advisor";

    if (!name || !email || !workId || !password) {
      return NextResponse.json(
        { error: "Name, email, work ID, and password are all required." },
        { status: 400 }
      );
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    if (await getAdvisorByWorkId(workId)) {
      return NextResponse.json({ error: "That work ID is already taken." }, { status: 409 });
    }
    if (await getAdvisorByEmail(email)) {
      return NextResponse.json({ error: "That email is already registered." }, { status: 409 });
    }

    const [advisor] = await db
      .insert(advisors)
      .values({ name, email, workId, firm, role, passwordHash: hashPassword(password) })
      .returning();

    await setSession(advisor.id, role);
    return NextResponse.json({ name: advisor.name, role }, { status: 201 });
  } catch (err) {
    console.error("register error", err);
    // Unique-constraint race (work id / email) → friendly conflict.
    if (err instanceof Error && /unique|duplicate/i.test(err.message)) {
      return NextResponse.json(
        { error: "That work ID or email is already registered." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sign-up failed." },
      { status: 500 }
    );
  }
}
