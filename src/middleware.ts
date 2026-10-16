import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidEdgeSessionToken } from "@/lib/auth/edge-session";

export const SESSION_COOKIE_NAME = "bizflow_session";

// Routes that require authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/sales",
  "/customers",
  "/products",
  "/inventory",
  "/expenses",
  "/reports",
  "/staff",
  "/subscription",
  "/settings",
];

// Auth routes where already-authenticated users should be redirected to dashboard
const AUTH_ROUTES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Immediately bypass service worker, offline fallback, and manifest
  if (
    pathname === "/sw.js" ||
    pathname === "/offline.html" ||
    pathname === "/manifest.webmanifest"
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = await isValidEdgeSessionToken(
    sessionCookie,
    process.env.JWT_SECRET
  );

  // Check protected routes
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/register
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - PWA files (sw.js, offline.html, manifest)
     * - public files (images, icons)
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|offline\\.html|manifest\\.webmanifest|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
