import { NextResponse } from "next/server";
import {
  type LocalInventoryItem,
  type LocalSale,
  mapLocalInventoryToSupabaseUpsert,
  mapLocalSaleToSupabaseInsert,
} from "@/lib/admin/syncTypes";
import { isAdminSyncAuthorized } from "@/lib/admin/syncAuth";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
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

  const payload = (await request.json().catch(() => null)) as unknown;

  if (
    !isRecord(payload) ||
    !Array.isArray(payload.sales) ||
    !Array.isArray(payload.inventory)
  ) {
    return NextResponse.json(
      {
        ok: false,
        message: "Envie sales e inventory como listas.",
      },
      { status: 400 }
    );
  }

  if (payload.sales.length > 1000 || payload.inventory.length > 500) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Limite excedido. Envie até 1000 vendas e até 500 itens de estoque por vez.",
      },
      { status: 400 }
    );
  }

  const inventoryRows = payload.inventory.map((item) =>
    mapLocalInventoryToSupabaseUpsert(item as LocalInventoryItem)
  );
  const saleRows = payload.sales.map((sale) =>
    mapLocalSaleToSupabaseInsert(sale as LocalSale)
  );

  if (inventoryRows.length > 0) {
    const { error } = await supabase
      .from("inventory_items")
      .upsert(inventoryRows, { onConflict: "perfume_slug,line_type" });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          message: error.message,
        },
        { status: 500 }
      );
    }
  }

  if (saleRows.length > 0) {
    const { error } = await supabase
      .from("sales")
      .upsert(saleRows, { onConflict: "local_id" });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          message: error.message,
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    pushedSales: saleRows.length,
    pushedInventory: inventoryRows.length,
    message: "Dados locais enviados ao Supabase com sucesso.",
  });
}
