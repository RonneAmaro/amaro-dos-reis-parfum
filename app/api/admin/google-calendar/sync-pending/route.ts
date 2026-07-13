import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin/apiAuth";
import { syncGoogleCalendarSale, type CalendarSale } from "@/lib/admin/googleCalendar";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const denied = await requireAdminApiSession(request); if (denied) return denied;
  try {
    const body = await request.json() as { sales?: CalendarSale[] };
    if (!Array.isArray(body.sales) || body.sales.length > 500) return NextResponse.json({ ok: false, message: "Lista de vendas inválida." }, { status: 400 });
    const eligible = body.sales.filter((sale) => sale.id && sale.status !== "pago" && sale.expectedPaymentDate);
    const results: Array<{ saleId: string; eventId?: string; eventLink?: string; status?: string; syncedAt?: string; error?: string }> = [];
    for (const sale of eligible) {
      try { results.push({ saleId: sale.id, ...(await syncGoogleCalendarSale(sale)) }); }
      catch (error) { results.push({ saleId: sale.id, error: error instanceof Error ? error.message : "Falha ao sincronizar." }); }
    }
    return NextResponse.json({ ok: true, results });
  } catch { return NextResponse.json({ ok: false, message: "Não foi possível sincronizar as cobranças." }, { status: 500 }); }
}
