import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, unseal } from "@/lib/session-crypto";

const PUBLIC_ROUTES = new Set(["/login"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.has(pathname);

  const session = unseal(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  // Unauthenticated users hitting a protected route -> login.
  if (!session && !isPublic) {
    const url = new URL("/login", request.nextUrl);
    if (pathname !== "/") url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated users hitting the login page -> dashboard.
  if (session && isPublic) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals, asset proxy, and files.
  matcher: ["/((?!api|_next/static|_next/image|assets|favicon.ico|.*\\..*).*)"],
};
