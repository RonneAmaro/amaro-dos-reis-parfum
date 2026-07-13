import { NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, isValidAdminSession } from "./session";

export async function requireAdminApiSession(request: NextRequest) {
  const valid = await isValidAdminSession(
    request.cookies.get(adminSessionCookie.name)?.value,
    process.env.AMARO_ADMIN_SESSION_SECRET
  );
  return valid
    ? null
    : NextResponse.json(
        { ok: false, message: "Sessão administrativa inválida." },
        { status: 401 }
      );
}
