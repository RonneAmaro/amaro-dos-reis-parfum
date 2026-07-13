import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin/apiAuth";
import { exchangeGoogleCode } from "@/lib/admin/googleCalendar";
export const runtime = "nodejs";
function matches(left?: string | null, right?: string | null) { if (!left || !right) return false; const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && timingSafeEqual(a, b); }
export async function GET(request: NextRequest) {
  const denied = await requireAdminApiSession(request);
  if (denied) {
    const response = NextResponse.redirect(new URL("/admin/login?error=google-calendar-session", request.url));
    response.cookies.set("amaro_google_oauth_state", "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    return response;
  }
  const code = request.nextUrl.searchParams.get("code"); const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get("amaro_google_oauth_state")?.value;
  const target = new URL("/admin", request.url);
  try { if (!code || !state || !matches(state, storedState)) throw new Error("OAuth inválido"); await exchangeGoogleCode(code); target.searchParams.set("googleCalendar", "connected"); }
  catch { target.searchParams.set("googleCalendar", "error"); }
  const response = NextResponse.redirect(target);
  response.cookies.set("amaro_google_oauth_state", "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return response;
}
