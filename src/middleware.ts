import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ONBOARDED_COOKIE, SESSION_COOKIE } from "@/lib/auth/session";

const PUBLIC_EXACT = new Set([
  "/",
  "/login",
  "/pricing",
  "/changelog",
  "/maintenance",
  "/offline.html",
]);

/** Prefixes that allow nested routes (e.g. /help/faq). */
const PUBLIC_PREFIXES = ["/templates", "/help", "/resources", "/login", "/share", "/auth", "/more"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api") ||
    pathname === "/sw.js" ||
    pathname === "/icon.svg" ||
    pathname === "/offline.html"
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const onboarded = request.cookies.get(ONBOARDED_COOKIE)?.value === "true";

  if (pathname === "/" && session && onboarded) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (session && onboarded && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!onboarded && !pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (onboarded && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
