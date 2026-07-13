import { NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, isValidAdminSession } from "@/lib/admin/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const isAuthorized = await isValidAdminSession(
    request.cookies.get(adminSessionCookie.name)?.value,
    process.env.AMARO_ADMIN_SESSION_SECRET
  );

  if (isAuthorized) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
