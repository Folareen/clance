import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE } from "@/lib/constants";

const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];
const PUBLIC = [...AUTH_PAGES, "/invite"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get(REFRESH_COOKIE)?.value;

  if (
    pathname === "/" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  if (session && AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
