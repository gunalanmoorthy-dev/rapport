/**
 * Route guard. Verifies the session cookie on the edge and:
 *  - lets public routes through (landing, login, auth API, static assets),
 *  - redirects unauthenticated page requests to /login (preserving `from`),
 *  - returns 401 for unauthenticated API requests.
 *
 * Runs before every matched request; see `config.matcher`.
 */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Public paths that never require a session.
const PUBLIC_PATHS = new Set(["/", "/login"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const advisorId = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (advisorId) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next internals and files with an extension.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
