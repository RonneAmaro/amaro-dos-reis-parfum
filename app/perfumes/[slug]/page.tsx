import Link from "next/link";
import { notFound } from "next/navigation";
import { perfumes } from "@/lib/perfumes";

export function generateStaticParams() {
  return perfumes.map((perfume) => ({
    slug: perfume.slug,
  }));
}

type PerfumePageProps = {
  params: Promise<{ slug: string }>;
};

function formatBottleLabel(bottleType: "tradicional" | "arabe") {
  return bottleType === "tradicional"
    ? "Tradicional 50ml"
    : "Árabe Premium 50ml";
}

export default async function PerfumePage({ params }: PerfumePageProps) {
  const { slug } = await params;
  const perfume = perfumes.find((item) => item.slug === slug);

  if (!perfume) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="relative overflow-hidden border-b border-[#d8b76a]/20 bg-[radial-gradient(circle_at_top_left,rgba(216,183,106,0.2),transparent_30%),linear-gradient(135deg,#050505_0%,#11100d_52%,#050505_100%)] px-6 py-14 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d8b76a] transition hover:text-[#f2d78b]"
            >
              AMARO DOS REIS PARFUM
            </Link>
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-full border border-[#d8b76a]/40 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#f2d78b] transition hover:border-[#f2d78b] hover:bg-[#d8b76a]/10"
            >
              Voltar ao catálogo
            </Link>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d8b76a]">
                {perfume.collection}
              </p>
              <h1 className="mt-5 text-4xl font-semibold uppercase leading-tight text-white sm:text-5xl">
                {perfume.name}
              </h1>
              <p className="mt-4 text-sm uppercase tracking-[0.24em] text-stone-300">
                Inspiração olfativa discreta: {perfume.inspiration}
              </p>
              <p className="mt-6 text-lg leading-8 text-stone-300">
                {perfume.shortDescription}
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-[#d8b76a]/35 bg-white/[0.03] px-4 py-2 text-[#f2d78b]">
                  {perfume.category}
                </span>
                <span className="rounded-full border border-[#d8b76a]/35 bg-white/[0.03] px-4 py-2 text-stone-100">
                  {perfume.olfactiveFamily}
                </span>
                <span className="rounded-full border border-[#d8b76a]/35 bg-white/[0.03] px-4 py-2 text-stone-100">
                  {formatBottleLabel(perfume.bottleType)}
                </span>
              </div>

              <div className="mt-8 flex flex-wrap items-end gap-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-stone-400">
                    Preço
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[#f2d78b]">
                    R$ {perfume.price.toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Olá, quero pedir o perfume ${perfume.name} da Amaro dos Reis Parfum.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#d8b76a] px-7 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#f2d78b]"
                >
                  Pedir no WhatsApp
                </a>
              </div>
            </div>

            <div className="mx-auto w-full max-w-lg rounded-[2rem] border border-[#d8b76a]/35 bg-[linear-gradient(160deg,rgba(19,17,13,0.98),rgba(5,5,5,0.98))] p-8 shadow-[0_24px_120px_rgba(0,0,0,0.55)]">
              <div className="rounded-[1.5rem] border border-[#d8b76a]/25 bg-[radial-gradient(circle_at_top,rgba(216,183,106,0.12),transparent_35%),linear-gradient(180deg,#17130f,#090806)] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-stone-400">
                      Frasco
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatBottleLabel(perfume.bottleType)}
                    </p>
                  </div>
                  <div className="rounded-full border border-[#d8b76a]/30 px-4 py-2 text-sm text-[#f2d78b]">
                    {perfume.collection}
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">
                      Topo
                    </p>
                    <p className="mt-3 text-sm leading-7 text-stone-100">
                      {perfume.topNotes.join(", ")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">
                      Coração
                    </p>
                    <p className="mt-3 text-sm leading-7 text-stone-100">
                      {perfume.heartNotes.join(", ")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">
                      Fundo
                    </p>
                    <p className="mt-3 text-sm leading-7 text-stone-100">
                      {perfume.baseNotes.join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d8b76a]">
              Descrição
            </p>
            <p className="mt-4 text-lg leading-8 text-stone-300">
              {perfume.longDescription}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#d8b76a]/25 bg-black/30 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d8b76a]">
              Resumo sensorial
            </p>
            <div className="mt-6 space-y-5 text-sm text-stone-200">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">
                  Família olfativa
                </p>
                <p className="mt-2 text-base text-white">{perfume.olfactiveFamily}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">
                  Tipo de frasco
                </p>
                <p className="mt-2 text-base text-white">
                  {perfume.bottleType === "tradicional"
                    ? "Tradicional"
                    : "Árabe"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">
                  Categoria
                </p>
                <p className="mt-2 text-base text-white">
                  {perfume.category}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
