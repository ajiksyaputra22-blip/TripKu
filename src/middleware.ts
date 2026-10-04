import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "./lib/jwt";
import { isAuthorizedRoute } from "./lib/rbac";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and internal next routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  const authCheck = isAuthorizedRoute(pathname, user);

  if (!authCheck.allowed && authCheck.redirectUrl) {
    const url = new URL(authCheck.redirectUrl, request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
