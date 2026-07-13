import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin/apiAuth";
import { getGoogleCalendarStatus } from "@/lib/admin/googleCalendar";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const denied = await requireAdminApiSession(request); if (denied) return denied;
  try { return NextResponse.json({ ok: true, ...(await getGoogleCalendarStatus()) }); }
  catch (error) { return NextResponse.json({ ok: false, connected: false, message: error instanceof Error ? error.message : "Não foi possível consultar o Google Agenda." }); }
}
