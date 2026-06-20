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

  // Role separation: admins live in /admin, advisors live in the main app.
  const isAdmin = session.role === "admin";
  const isAdminPath =
    pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin");

  if (isAdmin && !isAdminPath) {
    if (isApi) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  if (!isAdmin && isAdminPath) {
    if (isApi) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.redirect(new URL("/digest", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and files with an extension.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
