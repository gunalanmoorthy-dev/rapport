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

/** Issue a session cookie for an advisor (called from the login route). */
export async function setSession(advisorId: string): Promise<void> {
  const token = await signSession(advisorId);
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
 * The current advisor's id from the session cookie, or `null` if not signed in.
 * Use in API routes to return `401` when null.
 */
export async function getAdvisorId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token);
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
