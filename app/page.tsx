import { perfumes } from "@/lib/perfumes";

const collections = [
  {
    name: "Executive Collection",
    description:
      "Fragrâncias de presença sofisticada, criadas para rotina profissional, encontros e momentos de decisão.",
  },
  {
    name: "Oriental Collection",
    description:
      "Acordes ambarados, especiados e intensos, com assinatura marcante inspirada na perfumaria árabe.",
  },
  {
    name: "Feminine Collection",
    description:
      "Perfumes envolventes, luminosos e memoráveis, desenhados para expressar elegância e personalidade.",
  },
];

const featuredPerfumes = perfumes.slice(0, 3);

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(202,162,82,0.22),transparent_34%),linear-gradient(135deg,#050505_0%,#11100d_48%,#050505_100%)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d8b76a] to-transparent opacity-70" />
        <header className="absolute inset-x-0 top-0 z-10 px-6 py-5 sm:px-10 lg:px-12">
          <nav className="mx-auto flex max-w-7xl flex-col gap-4 text-xs font-semibold uppercase tracking-[0.24em] text-stone-400 sm:flex-row sm:items-center sm:justify-between">
            <a href="/" className="text-[#d8b76a] transition hover:text-[#f2d78b]">
              AMARO DOS REIS
            </a>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <a href="/" className="transition hover:text-[#f2d78b]">
                Inicio
              </a>
              <a href="/catalogo" className="transition hover:text-[#f2d78b]">
                Catalogo
              </a>
              <a
                href="https://api.whatsapp.com/send?text=Ola,%20quero%20conhecer%20os%20perfumes%20da%20Amaro%20dos%20Reis%20Parfum."
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-[#f2d78b]"
              >
                WhatsApp
              </a>
            </div>
          </nav>
        </header>
        <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-16 sm:px-10 lg:grid-cols-[1.04fr_0.96fr] lg:px-12">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.36em] text-[#d8b76a]">
              Perfumaria autoral premium
            </p>
            <h1 className="text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl lg:text-7xl">
              AMARO DOS REIS PARFUM
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-300 sm:text-xl">
              Perfumes autorais inspirados em grandes fragrâncias
              internacionais e orientais.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="/catalogo"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#d8b76a] px-7 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#f2d78b]"
              >
                Ver catálogo
              </a>
              <a
                href="https://api.whatsapp.com/send?text=Olá,%20quero%20conhecer%20os%20perfumes%20da%20Amaro%20dos%20Reis%20Parfum."
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#d8b76a]/70 px-7 text-sm font-semibold uppercase tracking-[0.18em] text-[#f2d78b] transition hover:border-[#f2d78b] hover:bg-[#d8b76a]/10"
              >
                Falar no WhatsApp
              </a>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <div className="border border-[#d8b76a]/25 bg-white/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.26em] text-stone-400">
                  Linha Tradicional 50ml
                </p>
                <p className="mt-2 text-3xl font-semibold text-[#f2d78b]">
                  R$ 80
                </p>
              </div>
              <div className="border border-[#d8b76a]/25 bg-white/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.26em] text-stone-400">
                  Linha Árabe Premium 50ml
                </p>
                <p className="mt-2 text-3xl font-semibold text-[#f2d78b]">
                  R$ 120
                </p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto flex aspect-[4/5] w-full max-w-md items-end justify-center">
            <div className="absolute bottom-5 h-24 w-72 rounded-full bg-[#d8b76a]/20 blur-3xl" />
            <div className="relative h-[78%] w-[58%] border border-[#d8b76a]/35 bg-gradient-to-b from-[#1f1b14] via-[#0b0b0b] to-black shadow-2xl shadow-black">
              <div className="absolute left-1/2 top-0 h-10 w-20 -translate-x-1/2 -translate-y-10 border border-[#d8b76a]/40 bg-[#11100d]" />
              <div className="absolute left-1/2 top-16 h-28 w-28 -translate-x-1/2 rounded-full border border-[#d8b76a]/40 bg-[#d8b76a]/10" />
              <div className="absolute inset-x-8 top-[42%] border-y border-[#d8b76a]/35 py-8 text-center">
                <p className="text-xs uppercase tracking-[0.32em] text-[#d8b76a]">
                  Amaro
                </p>
                <p className="mt-2 text-2xl font-semibold uppercase tracking-[0.18em] text-white">
                  Reis
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-stone-400">
                  Parfum 50ml
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#090806] px-6 py-20 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d8b76a]">
              Coleções
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Linhas para diferentes presenças.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {collections.map((collection) => (
              <article
                key={collection.name}
                className="border border-[#d8b76a]/20 bg-black/35 p-6 transition hover:border-[#d8b76a]/55"
              >
                <h3 className="text-xl font-semibold text-white">
                  {collection.name}
                </h3>
                <p className="mt-4 leading-7 text-stone-400">
                  {collection.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="catalogo" className="px-6 py-20 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d8b76a]">
                Destaques
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                Perfumes com nome, identidade e intenção.
              </h2>
            </div>
            <p className="max-w-sm leading-7 text-stone-400">
              Seleção inicial de fragrâncias autorais para quem busca elegância,
              presença e um rastro memorável.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredPerfumes.map((perfume) => (
              <article
                key={perfume.slug}
                className="border border-white/10 bg-gradient-to-b from-white/[0.055] to-white/[0.025] p-6"
              >
                <p className="text-xs uppercase tracking-[0.26em] text-stone-500">
                  Inspiração olfativa: {perfume.inspiration}
                </p>
                <h3 className="mt-4 text-2xl font-semibold tracking-[0.08em] text-[#f2d78b]">
                  {perfume.name}
                </h3>
                <p className="mt-3 text-sm font-medium uppercase tracking-[0.22em] text-stone-300">
                  {perfume.olfactiveFamily}
                </p>
                <p className="mt-5 leading-7 text-stone-400">
                  {perfume.shortDescription}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-[#d8b76a]/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#f2d78b]">
                    {perfume.collection}
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-200">
                    R$ {perfume.price.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0b0906] px-6 py-20 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d8b76a]">
              Sobre a marca
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Elegância acessível, assinatura própria.
            </h2>
          </div>
          <p className="text-lg leading-9 text-stone-300">
            A Amaro dos Reis Parfum nasceu do desejo de transformar fragrâncias
            marcantes em experiências acessíveis, elegantes e memoráveis. Cada
            perfume recebe nome próprio, identidade própria e uma proposta
            olfativa pensada para valorizar presença, estilo e personalidade.
          </p>
        </div>
      </section>

      <section id="contato" className="px-6 py-20 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d8b76a]">
            Sua próxima fragrância
          </p>
          <h2 className="mt-5 text-3xl font-semibold text-white sm:text-5xl">
            Escolha sua fragrância e descubra qual combina com sua presença.
          </h2>
          <a
            href="https://api.whatsapp.com/send?text=Olá,%20quero%20ajuda%20para%20escolher%20minha%20fragrância%20Amaro%20dos%20Reis%20Parfum."
            target="_blank"
            rel="noreferrer"
            className="mt-9 inline-flex min-h-12 items-center justify-center rounded-full bg-[#d8b76a] px-8 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#f2d78b]"
          >
            Falar no WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
