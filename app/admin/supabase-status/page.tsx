"use client";

import Link from "next/link";
import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabasePerfumes } from "@/lib/supabase/perfumes";
import type { PerfumeRow } from "@/lib/supabase/types";

export default function SupabaseStatusPage() {
  const [perfumes, setPerfumes] = useState<PerfumeRow[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabaseConfigured = isSupabaseConfigured();

  async function testPerfumeRead() {
    setIsLoading(true);
    setMessage("");
    setPerfumes([]);

    if (!supabaseConfigured) {
      setMessage(
        "Supabase ainda não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local."
      );
      setIsLoading(false);
      return;
    }

    try {
      const result = await getSupabasePerfumes();

      if (result.error) {
        setMessage(
          `Não foi possível ler os perfumes agora. Detalhe: ${result.error}`
        );
        return;
      }

      setPerfumes(result.data);
      setMessage("Leitura concluída com sucesso.");
    } catch {
      setMessage(
        "Não foi possível testar a leitura. Confira as variáveis e se a tabela perfumes existe."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-stone-100">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
              Painel interno
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Status Supabase
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-400">
              Verificação opcional da futura conexão. Esta página não migra
              vendas, não altera estoque e não substitui o painel local.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gold-light">
              Este teste lê apenas a tabela public.perfumes. O catálogo público
              usa fallback local para manter o site funcionando mesmo se o
              Supabase falhar.
            </p>
          </div>
          <Link
            href="/admin"
            className="min-h-11 rounded-md border border-gold/45 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold hover:bg-gold/10"
          >
            Voltar ao painel
          </Link>
        </div>

        <section className="rounded-lg border border-gold/20 bg-white/[0.045] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Configuração
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                Supabase configurado: {supabaseConfigured ? "Sim" : "Não"}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-400">
                {supabaseConfigured
                  ? "As variáveis públicas estão presentes. O teste abaixo apenas tenta ler a tabela perfumes."
                  : "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local quando chegar a fase de integração."}
              </p>
            </div>
            <button
              type="button"
              onClick={testPerfumeRead}
              disabled={isLoading}
              className="min-h-11 rounded-md bg-gold px-5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Testando..." : "Testar leitura dos perfumes"}
            </button>
          </div>

          {message ? (
            <p
              className={`mt-5 rounded-md border p-3 text-sm ${
                perfumes.length > 0
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : "border-gold/30 bg-gold/10 text-gold-light"
              }`}
            >
              {message}
            </p>
          ) : null}
        </section>

        <section className="rounded-lg border border-gold/20 bg-white/[0.045] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Resultado
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                Perfumes encontrados diretamente no Supabase: {perfumes.length}
              </h2>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gold/20 text-xs uppercase tracking-[0.16em] text-stone-500">
                  <th className="py-3 pr-4 font-semibold">Nome</th>
                  <th className="py-3 pr-4 font-semibold">Inspiração</th>
                  <th className="py-3 pr-4 font-semibold">Coleção</th>
                  <th className="py-3 pr-4 font-semibold">Frasco</th>
                </tr>
              </thead>
              <tbody>
                {perfumes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-10 text-center text-sm text-stone-500"
                    >
                      Nenhuma leitura executada ou nenhum perfume encontrado.
                    </td>
                  </tr>
                ) : (
                  perfumes.map((perfume) => (
                    <tr
                      key={perfume.id}
                      className="border-b border-white/10 text-stone-300 last:border-0"
                    >
                      <td className="py-4 pr-4 font-medium text-white">
                        {perfume.name}
                      </td>
                      <td className="py-4 pr-4">
                        {perfume.inspiration || "-"}
                      </td>
                      <td className="py-4 pr-4">
                        {perfume.collection || "-"}
                      </td>
                      <td className="py-4 pr-4">
                        {perfume.bottle_type || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
