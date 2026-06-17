import { NextResponse } from "next/server";
import { isAdminSyncAuthorized } from "@/lib/admin/syncAuth";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdminSyncAuthorized(request)) {
    return NextResponse.json(
      { ok: false, message: "Token de sincronização inválido." },
      { status: 401 }
    );
  }

  const supabase = createServerSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message: "Supabase server-side não configurado.",
    });
  }

  const [salesResult, inventoryResult] = await Promise.all([
    supabase.from("sales").select("id", { count: "exact", head: true }),
    supabase
      .from("inventory_items")
      .select("id", { count: "exact", head: true }),
  ]);

  if (salesResult.error || inventoryResult.error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message:
          salesResult.error?.message ??
          inventoryResult.error?.message ??
          "Não foi possível consultar o Supabase.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    salesCount: salesResult.count ?? 0,
    inventoryCount: inventoryResult.count ?? 0,
  });
}
