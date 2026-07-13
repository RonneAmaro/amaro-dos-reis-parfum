import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin/apiAuth";
import { syncGoogleCalendarSale, type CalendarSale } from "@/lib/admin/googleCalendar";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const denied = await requireAdminApiSession(request); if (denied) return denied;
  try { const body = await request.json() as { sale?: CalendarSale }; if (!body.sale?.id) return NextResponse.json({ ok: false, message: "Venda inválida." }, { status: 400 });
    return NextResponse.json({ ok: true, ...(await syncGoogleCalendarSale(body.sale)) });
  } catch (error) { return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Não foi possível sincronizar o lembrete." }, { status: 500 }); }
}
