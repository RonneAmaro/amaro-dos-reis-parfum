import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin/apiAuth";
import { disconnectGoogleCalendar } from "@/lib/admin/googleCalendar";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const denied = await requireAdminApiSession(request); if (denied) return denied;
  try { await disconnectGoogleCalendar(); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Não foi possível desconectar." }, { status: 500 }); }
}
