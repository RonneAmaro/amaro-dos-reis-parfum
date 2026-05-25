import Link from "next/link";

export const dynamic = "force-dynamic";

type PerfumeRow = {
  id?: string;
  name?: string | null;
  inspiration?: string | null;
  collection?: string | null;
  gender?: string | null;
  price?: number | string | null;
  price_cents?: number | null;
  bottle_type?: string | null;
  size_ml?: number | null;
  olfactory_family?: string | null;
  family?: string | null;
  description?: string | null;
  is_active?: boolean | null;
};

type CatalogResult =
  | {
      perfumes: PerfumeRow[];
      error: null;
    }
  | {
      perfumes: [];
      error: string;
    };

function formatPrice(perfume: PerfumeRow) {
  if (typeof perfume.price === "string" && perfume.price.trim()) {
    return perfume.price;
  }

  if (typeof perfume.price === "number") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(perfume.price);
  }

  if (typeof perfume.price_cents === "number") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(perfume.price_cents / 100);
  }

  return "Sob consulta";
}

function formatBottle(perfume: PerfumeRow) {
  if (perfume.bottle_type) {
    return perfume.bottle_type;
  }

  if (perfume.size_ml) {
    return `${perfume.size_ml}ml`;
  }

  return "Frasco premium";
}

export default async function CatalogoPage() {
  async function getPerfumes(): Promise<CatalogResult> {
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const { data, error } = await supabase
        .from("perfumes")
        .select("*")
        .eq("is_active", true)
        .order("collection", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        return { perfumes: [], error: error.message };
      }

      return { perfumes: (data ?? []) as PerfumeRow[], error: null };
    } catch (error) {
      return {
        perfumes: [],
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar o catalogo.",
      };
    }
  }

  const { perfumes: activePerfumes, error } = await getPerfumes();

  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="relative overflow-hidden border-b border-[#d8b76a]/15 bg-[radial-gradient(circle_at_top,rgba(216,183,106,0.2),transparent_36%),linear-gradient(135deg,#050505_0%,#11100d_54%,#050505_100%)] px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <nav className="flex flex-col gap-4 text-xs font-semibold uppercase tracking-[0.24em] text-stone-400 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="text-[#d8b76a] transition hover:text-[#f2d78b]"
            >
              AMARO DOS REIS PARFUM
            </Link>
            <Link
              href="/"
              className="inline-flex w-fit items-center border border-[#d8b76a]/30 px-4 py-3 text-[#f2d78b] transition hover:border-[#f2d78b] hover:bg-[#d8b76a]/10"
            >
              Voltar ao inicio
            </Link>
          </nav>
          <div className="mt-12 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.36em] text-[#d8b76a]">
              Catálogo
            </p>
            <h1 className="mt-5 text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
              Fragrâncias autorais para presença memorável.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-300 sm:text-lg">
              Conheça os perfumes ativos da Amaro dos Reis Parfum, com
              inspirações internacionais e orientais em uma leitura elegante,
              acessível e própria.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          {error ? (
            <div className="border border-[#d8b76a]/25 bg-white/[0.04] p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d8b76a]">
                Catálogo indisponível
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-white">
                Não foi possível carregar os perfumes agora.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl leading-7 text-stone-400">
                Tente novamente em alguns instantes ou fale diretamente pelo
                WhatsApp para receber a seleção atual de fragrâncias.
              </p>
            </div>
          ) : activePerfumes.length === 0 ? (
            <div className="border border-[#d8b76a]/25 bg-white/[0.04] p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d8b76a]">
                Em curadoria
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-white">
                Nenhum perfume ativo encontrado.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl leading-7 text-stone-400">
                O catálogo público será exibido aqui assim que as fragrâncias
                estiverem disponíveis.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activePerfumes.map((perfume) => (
                <article
                  key={perfume.id ?? perfume.name ?? perfume.inspiration}
                  className="flex min-h-[360px] flex-col border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.025] p-6 transition hover:border-[#d8b76a]/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                        {perfume.collection ?? "Coleção autoral"}
                      </p>
                      <h2 className="mt-4 text-2xl font-semibold uppercase tracking-[0.08em] text-[#f2d78b]">
                        {perfume.name ?? "Perfume autoral"}
                      </h2>
                    </div>
                    <p className="shrink-0 border border-[#d8b76a]/25 px-3 py-2 text-sm font-semibold text-[#f2d78b]">
                      {formatPrice(perfume)}
                    </p>
                  </div>

                  <p className="mt-4 text-xs uppercase tracking-[0.24em] text-stone-500">
                    Inspiração olfativa: {perfume.inspiration ?? "Exclusiva"}
                  </p>

                  <div className="mt-6 grid gap-3 text-sm text-stone-300 sm:grid-cols-3">
                    <div className="border-t border-white/10 pt-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                        Gênero
                      </p>
                      <p className="mt-2">{perfume.gender ?? "Unissex"}</p>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                        Frasco
                      </p>
                      <p className="mt-2">{formatBottle(perfume)}</p>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                        Família
                      </p>
                      <p className="mt-2">
                        {perfume.olfactory_family ??
                          perfume.family ??
                          "Assinatura premium"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-6 flex-1 leading-7 text-stone-400">
                    {perfume.description ??
                      "Fragrância autoral com proposta elegante, pensada para valorizar presença, estilo e personalidade."}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
