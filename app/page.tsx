import Link from "next/link";
import { createWhatsAppLink } from "@/lib/whatsapp";

const discoveryWhatsAppHref = createWhatsAppLink(
  "Ola! Quero conhecer os perfumes da Amaro dos Reis Parfum."
);

const curationWhatsAppHref = createWhatsAppLink(
  "Ola! Quero ajuda para escolher minha fragrancia Amaro dos Reis Parfum."
);

const collections = [
  {
    name: "Executive Collection",
    description:
      "Fragrancias de presenca sofisticada para rotina profissional, encontros e momentos de decisao.",
  },
  {
    name: "Oriental Collection",
    description:
      "Acordes ambarados, especiados e intensos, com assinatura inspirada na perfumaria arabe.",
  },
  {
    name: "Feminine Collection",
    description:
      "Perfumes luminosos e memoraveis, desenhados para expressar elegancia e personalidade.",
  },
];

const perfumes = [
  {
    name: "DOMINARE",
    inspiration: "Aventus",
    family: "Amadeirado frutado",
    line: "Linha Tradicional",
    price: "R$ 80",
    description:
      "Imponente e refinado, combina frescor vibrante com profundidade elegante.",
  },
  {
    name: "SULTAN NOIR",
    inspiration: "Asad",
    family: "Oriental especiado",
    line: "Linha Arabe Premium",
    price: "R$ 120",
    description:
      "Quente, envolvente e poderoso, com especiarias nobres sobre uma base escura.",
  },
  {
    name: "SAMARAH ROSE",
    inspiration: "Sabah Al Ward",
    family: "Floral oriental",
    line: "Linha Arabe Premium",
    price: "R$ 120",
    description:
      "Rosas delicadas, docura macia e um toque oriental feminino e radiante.",
  },
];

const reasons = [
  {
    title: "Nomes autorais",
    text: "Cada perfume ganha identidade propria, com nome e presenca pensados para a marca.",
  },
  {
    title: "Referencias olfativas premium",
    text: "Inspiracoes internacionais e orientais reinterpretadas em uma leitura elegante.",
  },
  {
    title: "Atendimento proximo",
    text: "Curadoria direta para ajudar na escolha da fragrancia ideal para cada ocasiao.",
  },
  {
    title: "Fragrancias acessiveis",
    text: "Experiencia sofisticada em frascos de 50ml com precos claros e competitivos.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="premium-bg relative isolate overflow-hidden border-b border-gold/15">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-70" />
        <div className="absolute left-1/2 top-16 h-80 w-80 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />

        <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-12 px-6 py-16 sm:px-10 lg:grid-cols-[1.02fr_0.98fr] lg:px-12">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.36em] text-gold">
              Perfumaria autoral premium
            </p>
            <h1 className="text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl lg:text-7xl">
              Amaro dos Reis Parfum
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-300 sm:text-xl">
              Fragrancias autorais inspiradas em grandes referencias
              internacionais e orientais, criadas para presenca, elegancia e
              memoria.
            </p>

            <div className="mt-7 inline-flex w-fit items-center border border-gold/30 bg-black/35 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold-light gold-glow">
              50ml &bull; Producao em pequenos lotes
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/catalogo"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-7 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light"
              >
                Ver catalogo
              </Link>
              <a
                href={discoveryWhatsAppHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/60 px-7 text-sm font-semibold uppercase tracking-[0.18em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
              >
                Falar no WhatsApp
              </a>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <div className="premium-surface p-5">
                <p className="text-xs uppercase tracking-[0.26em] text-stone-400">
                  Linha Tradicional
                </p>
                <p className="mt-2 text-3xl font-semibold text-gold-light">
                  R$ 80
                </p>
                <p className="mt-2 text-sm text-stone-500">Frasco 50ml</p>
              </div>
              <div className="premium-surface p-5">
                <p className="text-xs uppercase tracking-[0.26em] text-stone-400">
                  Linha Arabe Premium
                </p>
                <p className="mt-2 text-3xl font-semibold text-gold-light">
                  R$ 120
                </p>
                <p className="mt-2 text-sm text-stone-500">Frasco 50ml</p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto flex aspect-[4/5] w-full max-w-md items-end justify-center">
            <div className="absolute bottom-3 h-28 w-80 rounded-full bg-gold/20 blur-3xl" />
            <div className="relative h-[82%] w-[60%] border border-gold/40 bg-gradient-to-b from-[#221d12] via-[#090909] to-black shadow-2xl shadow-black gold-glow">
              <div className="absolute left-1/2 top-0 h-12 w-20 -translate-x-1/2 -translate-y-12 border border-gold/40 bg-[#11100d]" />
              <div className="absolute left-1/2 top-16 h-28 w-28 -translate-x-1/2 rounded-full border border-gold/40 bg-gold/10" />
              <div className="absolute inset-x-7 top-[41%] border-y border-gold/35 py-8 text-center">
                <p className="text-xs uppercase tracking-[0.32em] text-gold">
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

      <section className="border-b border-white/10 bg-[#090806] px-6 py-20 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
              Colecoes
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Linhas para diferentes presencas.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {collections.map((collection) => (
              <article
                key={collection.name}
                className="premium-surface p-6 transition hover:border-gold/55"
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

      <section className="px-6 py-20 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
                Destaques
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                Perfumes com nome, identidade e intencao.
              </h2>
            </div>
            <p className="max-w-sm leading-7 text-stone-400">
              Uma selecao inicial de fragrancias para quem busca elegancia,
              presenca e rastro memoravel.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {perfumes.map((perfume) => (
              <article
                key={perfume.name}
                className="premium-surface flex min-h-[360px] flex-col p-6 transition hover:-translate-y-1 hover:border-gold/55"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                    {perfume.line}
                  </p>
                  <p className="border border-gold/30 px-3 py-2 text-sm font-semibold text-gold-light">
                    {perfume.price}
                  </p>
                </div>
                <h3 className="mt-6 text-2xl font-semibold uppercase tracking-[0.08em] text-gold-light">
                  {perfume.name}
                </h3>
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-stone-500">
                  Inspiracao: {perfume.inspiration}
                </p>
                <p className="mt-5 text-sm font-medium uppercase tracking-[0.2em] text-stone-300">
                  {perfume.family}
                </p>
                <p className="mt-5 flex-1 leading-7 text-stone-400">
                  {perfume.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0b0906] px-6 py-20 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
              Por que escolher
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Por que escolher Amaro dos Reis Parfum?
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((reason) => (
              <article key={reason.title} className="premium-surface p-6">
                <h3 className="text-lg font-semibold text-gold-light">
                  {reason.title}
                </h3>
                <p className="mt-4 leading-7 text-stone-400">{reason.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#080706] px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
              Producao em pequenos lotes
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Consulte disponibilidade antes de escolher sua fragrancia.
            </h2>
            <p className="mt-5 leading-8 text-stone-400">
              Algumas fragrancias ficam disponiveis em poucas unidades ou sob
              encomenda. A consulta evita espera e ajuda a encontrar a melhor
              opcao para o seu momento.
            </p>
          </div>
          <Link
            href="/disponibilidade"
            className="inline-flex min-h-12 w-fit items-center justify-center rounded-full border border-gold/45 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
          >
            Ver disponibilidade
          </Link>
        </div>
      </section>

      <section className="px-6 py-20 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
            Sua proxima fragrancia
          </p>
          <h2 className="mt-5 text-3xl font-semibold text-white sm:text-5xl">
            Consulte a disponibilidade e receba uma recomendacao direta para o
            seu estilo.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-stone-400">
            Conte como voce pretende usar a fragrancia e indicamos as melhores
            opcoes entre a Linha Tradicional e a Linha Arabe Premium.
          </p>
          <a
            href={curationWhatsAppHref}
            target="_blank"
            rel="noreferrer"
            className="mt-9 inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light"
          >
            Falar no WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
