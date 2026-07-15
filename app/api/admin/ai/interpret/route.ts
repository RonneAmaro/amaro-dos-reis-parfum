import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin/apiAuth";
import { interpretAdminWithLocalAi } from "@/lib/ai/adminAiInterpreter";
import { AdminAiError, type AdminAiContext } from "@/lib/ai/types";

export const runtime = "nodejs";
const contexts: AdminAiContext[] = ["admin_assistant", "order_draft", "sale_conversion"];

export async function POST(request: NextRequest) {
  const denied = await requireAdminApiSession(request); if (denied) return denied;
  try {
    const body = await request.json() as { text?: unknown; context?: unknown };
    const context = contexts.includes(body.context as AdminAiContext) ? body.context as AdminAiContext : "admin_assistant";
    return NextResponse.json(await interpretAdminWithLocalAi(body.text, context), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AdminAiError) return NextResponse.json({ ok: false, message: error.message, code: error.code }, { status: error.status });
    return NextResponse.json({ ok: false, message: "Não foi possível interpretar o comando com a IA local.", code: "AI_UNAVAILABLE" }, { status: 500 });
  }
}
