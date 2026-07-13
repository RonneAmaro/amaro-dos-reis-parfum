import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin/apiAuth";
import { removeGoogleCalendarEvent } from "@/lib/admin/googleCalendar";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const denied = await requireAdminApiSession(request); if (denied) return denied;
  try {
    const body = await request.json() as { eventId?: string };
    if (!body.eventId) return NextResponse.json({ ok: false, message: "Evento inválido." }, { status: 400 });
    await removeGoogleCalendarEvent(body.eventId); return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Não foi possível remover o lembrete." }, { status: 500 }); }
}
