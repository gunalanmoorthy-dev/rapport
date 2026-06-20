/**
 * Server-side auth helpers: read/set the session cookie and resolve the current
 * advisor. Used by Server Components and Node route handlers (uses `next/headers`
 * and `next/navigation`, so it is NOT edge/middleware-safe).
 *
 * @module lib/auth
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSession,
  verifySession,
} from "./session";

/** Issue a session cookie for an advisor + role (called from the login route). */
export async function setSession(advisorId: string, role: string = "advisor"): Promise<void> {
  const token = await signSession(advisorId, role);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Clear the session cookie (logout). */
export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * The current session (advisor id + role) from the cookie, or `null`.
 */
export async function getSession(): Promise<{ advisorId: string; role: string } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

/**
 * The current advisor's id from the session cookie, or `null` if not signed in.
 * Use in API routes to return `401` when null.
 */
export async function getAdvisorId(): Promise<string | null> {
  return (await getSession())?.advisorId ?? null;
}

/**
 * The current advisor's id, or a redirect to `/login` if not signed in.
 * Use in Server Component pages.
 */
export async function requireAdvisorId(): Promise<string> {
  const id = await getAdvisorId();
  if (!id) redirect("/login");
  return id;
}

/**
 * Require an authenticated ADMIN. Redirects to `/login` if signed out, or to
 * `/digest` (the advisor home) if the user is an advisor, not an admin.
 *
 * @returns The admin's advisor id.
 */
export async function requireAdmin(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/digest");
  return session.advisorId;
}

/**
 * Require an authenticated PARTNER. Redirects to `/login` if signed out, or to
 * the role's home if the user is not a partner.
 *
 * @returns The partner's account id.
 */
export async function requirePartner(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "partner") {
    redirect(session.role === "admin" ? "/admin" : "/digest");
  }
  return session.advisorId;
}
