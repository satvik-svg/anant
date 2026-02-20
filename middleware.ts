export const runtime = "nodejs";

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Public routes
  if (pathname === "/" || pathname === "/login" || pathname === "/register" || pathname.startsWith("/invite/")) {
    if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
      return Response.redirect(new URL("/dashboard", req.nextUrl));
    }
    return;
  }

  // Protected routes
  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
