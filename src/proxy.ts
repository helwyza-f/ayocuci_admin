import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16 Proxy Convention
 * This replaces the old middleware.ts
 */
export function proxy(request: NextRequest) {
  // 1. Get the token from the cookie
  const token = request.cookies.get("admin_token")?.value;
  const { pathname } = request.nextUrl;

  // 2. Logic for Admin Protection
  const isLoginPage = pathname === "/login";

  // If no token and not on login page -> Redirect to login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If already has token and trying to access login -> Redirect to dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// The config remains the same for filtering which paths the proxy hits
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
