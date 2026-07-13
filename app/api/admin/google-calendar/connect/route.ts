import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin/apiAuth";
import { createGoogleAuthorizationUrl } from "@/lib/admin/googleCalendar";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const denied = await requireAdminApiSession(request); if (denied) return denied;
  try { const state = randomBytes(24).toString("base64url"); const response = NextResponse.redirect(createGoogleAuthorizationUrl(state));
    response.cookies.set("amaro_google_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 }); return response;
  } catch { return NextResponse.redirect(new URL("/admin?googleCalendar=error", request.url)); }
}
