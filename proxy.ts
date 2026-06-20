/**
 * Route guard (Next.js "proxy" convention — formerly `middleware.ts`). Verifies
 * the session cookie on the edge and:
 *  - lets public routes through (landing, login, auth API, static assets),
 *  - redirects unauthenticated page requests to /login (preserving `from`),
 *  - returns 401 for unauthenticated API requests,
 *  - keeps admins in /admin and advisors in the main app.
 *
 * Runs before every matched request; see `config.matcher`.
 */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Public paths that never require a session.
const PUBLIC_PATHS = new Set(["/", "/login", "/signup"]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const isApi = pathname.startsWith("/api/");

  if (!session) {
    if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Role separation: admins live in /admin, partners live in /partner, and
  // advisors live in the main app. Each role is kept inside its own area.
  const isAdminPath =
    pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin");
  const isPartnerPath =
    pathname === "/partner" || pathname.startsWith("/partner/") || pathname.startsWith("/api/partner");

  const forbid = (home: string) =>
    isApi
      ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
      : NextResponse.redirect(new URL(home, req.url));

  if (session.role === "admin") {
    if (!isAdminPath) return forbid("/admin");
  } else if (session.role === "partner") {
    if (!isPartnerPath) return forbid("/partner");
  } else {
    // advisor — kept out of both admin and partner areas
    if (isAdminPath) return forbid("/digest");
    if (isPartnerPath) return forbid("/digest");
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and files with an extension.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
