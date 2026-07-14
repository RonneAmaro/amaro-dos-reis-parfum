import { NextResponse } from "next/server";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const checkedAt = new Date().toISOString();
  const cronSecret = (process.env.CRON_SECRET || "").trim();

  if (!cronSecret) {
    return NextResponse.json(
      {
        ok: false,
        message: "Heartbeat indisponivel: CRON_SECRET nao esta configurado.",
        checkedAt,
      },
      { status: 500 }
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      {
        ok: false,
        message: "Nao autorizado.",
        checkedAt,
      },
      { status: 401 }
    );
  }

  const supabase = createServerSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        message: "Heartbeat indisponivel: Supabase server-side nao configurado.",
        checkedAt,
      },
      { status: 503 }
    );
  }

  const { count, error } = await supabase
    .from("perfumes")
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Nao foi possivel verificar o Supabase neste momento.",
        checkedAt,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    service: "supabase-heartbeat",
    checkedAt,
    result: {
      table: "public.perfumes",
      rowCount: count ?? 0,
    },
  });
}
