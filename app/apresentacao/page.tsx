import Link from "next/link";
import {
  createPerfumeMessage,
  formatPerfumePrice,
  getPerfumeCommerce,
  perfumeSlug,
  type PerfumeCommerce,
} from "@/lib/perfumes";
import { createWhatsAppLink } from "@/lib/whatsapp";

const catalogWhatsAppHref = createWhatsAppLink(
  "Ola! Quero conhecer o catalogo premium da Amaro dos Reis Parfum."
);

const styleGroups = [
  {
    title: "Para o trabalho",
    description:
      "Assinaturas elegantes, limpas e confiantes para rotina, reunioes e presenca executiva.",
    names: ["DOMINARE", "NOBLIS", "SILVERION BLACK"],
  },
  {
    title: "Para dias quentes",
    description:
      "Perfumes frescos, aquaticos e energicos para calor, movimento e uso diario.",
    names: ["AZURE SPORT", "VITORIUM"],
  },
  {
    title: "Para noite e presenca marcante",
    description:
      "Fragrancias intensas para encontros, eventos e momentos em que voce quer ser lembrado.",
    names: ["SULTAN NOIR", "SCARLET NOIR", "IGNIS"],
  },
  {
    title: "Para mulheres elegantes",
    description:
      "Florais, orientais e femininos com delicadeza sofisticada e rastro memoravel.",
    names: ["FLOREA", "IRESIA", "SAMARAH ROSE"],
  },
  {
    title: "Para quem gosta de doce",
    description:
      "Gourmand, cremosos e envolventes para quem ama docura com personalidade.",
    names: ["MOON CANDY", "YASIRAH", "LUMIARA", "BELLE VENOM"],
  },
  {
    title: "Para luxo arabe",
    description:
      "Fragrancias orientais, intensas e sofisticadas com presenca premium.",
    names: ["SULTAN NOIR", "NOIR OUD ROYALE", "ALTAIR ROYALE", "YASIRAH"],
  },
];

const featuredNames = [
  "DOMINARE",
  "SULTAN NOIR",
  "AZURE SPORT",
  "SAMARAH ROSE",
  "MOON CANDY",
  "BELLE VENOM",
];

const choosingTips = [
  {
    title: "Gosta de perfume fresco?",
    text: "Procure fragrancias aquaticas, citricas e leves.",
  },
  {
    title: "Gosta de perfume marcante?",
    text: "Procure fragrancias amadeiradas, orientais e especiadas.",
  },
  {
    title: "Gosta de perfume doce?",
    text: "Procure fragrancias gourmand, baunilha, caramelo e frutas.",
  },
  {
    title: "Quer algo elegante para o dia a dia?",
    text: "Procure fragrancias limpas, florais e amadeiradas suaves.",
  },
];

function perfumeByName(name: string) {
  const perfume = getPerfumeCommerce(name);

  if (!perfume) {
    throw new Error(`Perfume not found: ${name}`);
  }

  return perfume;
}

function perfumeHref(perfume: PerfumeCommerce) {
  return `/perfumes/${perfumeSlug(perfume)}`;
}

export default function ApresentacaoPage() {
  const featuredPerfumes = featuredNames.map(perfumeByName);

  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="premium-bg relative overflow-hidden border-b border-gold/15 px-6 py-16 sm:px-10 lg:px-12">
        <div className="absolute right-[12%] top-12 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.72fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.36em] text-gold">
              Vitrine rapida
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
              Catalogo Premium Amaro dos Reis Parfum
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-9 text-stone-300">
              Perfumes autorais inspirados em grandes fragrancias
              internacionais e orientais, criados para valorizar presenca,
              estilo e personalidade.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                "50ml",
                "Producao em pequenos lotes",
                "Linha Tradicional R$ 80",
                "Linha Arabe Premium R$ 120",
              ].map((seal) => (
                <span
                  key={seal}
                  className="border border-gold/30 bg-black/35 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold-light"
                >
                  {seal}
                </span>
              ))}
            </div>

            <a
              href={catalogWhatsAppHref}
              target="_blank"
              rel="noreferrer"
              className="mt-9 inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light"
            >
              Falar no WhatsApp
            </a>
          </div>

          <div className="premium-surface p-6 gold-glow">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">
              Escolha simples
            </p>
            <p className="mt-5 text-3xl font-semibold text-white">
              Mostre por estilo, ocasiao e personalidade.
            </p>
            <p className="mt-5 leading-8 text-stone-400">
              Uma apresentacao pensada para venda local no celular: rapida,
              bonita e direta ao ponto.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
              Escolha pelo seu estilo
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Uma rota simples para encontrar o perfume certo.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {styleGroups.map((group) => (
              <article key={group.title} className="premium-surface flex flex-col p-6">
                <h3 className="text-2xl font-semibold text-white">
                  {group.title}
                </h3>
                <p className="mt-4 flex-1 leading-7 text-stone-400">
                  {group.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {group.names.map((name) => {
                    const perfume = perfumeByName(name);

                    return (
                      <Link
                        key={name}
                        href={perfumeHref(perfume)}
                        className="border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-gold-light transition hover:border-gold/50"
                      >
                        {name}
                      </Link>
                    );
                  })}
                </div>
                <a
                  href={createWhatsAppLink(
                    `Ola! Quero uma sugestao de perfume para ${group.title.toLowerCase()} na Amaro dos Reis Parfum.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-gold/45 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
                >
                  Pedir sugestao no WhatsApp
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0b0906] px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
              Destaques da colecao
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Fragrancias faceis de apresentar e vender.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredPerfumes.map((perfume) => (
              <article
                key={perfume.name}
                className="premium-surface flex min-h-[390px] flex-col p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                      Inspiracao discreta: {perfume.inspiration}
                    </p>
                    <h3 className="mt-4 text-2xl font-semibold uppercase tracking-[0.08em] text-gold-light">
                      {perfume.name}
                    </h3>
                  </div>
                  <p className="shrink-0 border border-gold/30 bg-gold/10 px-3 py-2 text-sm font-semibold text-gold-light">
                    {formatPerfumePrice(perfume)}
                  </p>
                </div>
                <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-stone-300">
                  {perfume.family}
                </p>
                <p className="mt-5 flex-1 leading-7 text-stone-400">
                  {perfume.description}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={perfumeHref(perfume)}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-gold px-5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-gold-light"
                  >
                    Ver detalhes
                  </Link>
                  <a
                    href={createWhatsAppLink(createPerfumeMessage(perfume.name))}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-gold/45 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
                  >
                    Quero esse
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
              Como escolher seu perfume
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Comece pela sensacao que voce quer passar.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {choosingTips.map((tip) => (
              <article key={tip.title} className="premium-surface p-6">
                <h3 className="text-xl font-semibold text-gold-light">
                  {tip.title}
                </h3>
                <p className="mt-4 leading-7 text-stone-400">{tip.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#080706] px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
            Linhas da marca
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="premium-surface p-6">
              <h3 className="text-2xl font-semibold text-white">
                Linha Tradicional 50ml — R$ 80
              </h3>
              <p className="mt-4 leading-8 text-stone-400">
                Frascos modernos, fragrancias inspiradas em grandes classicos
                internacionais.
              </p>
            </article>
            <article className="premium-surface p-6">
              <h3 className="text-2xl font-semibold text-white">
                Linha Arabe Premium 50ml — R$ 120
              </h3>
              <p className="mt-4 leading-8 text-stone-400">
                Frascos arabes, presenca intensa, luxo oriental e fragrancias
                sofisticadas.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
            Escolha acompanhada
          </p>
          <h2 className="mt-5 text-3xl font-semibold text-white sm:text-5xl">
            Nao sabe qual escolher? Eu te ajudo a encontrar a fragrancia que
            combina com voce.
          </h2>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={createWhatsAppLink(
                "Ola! Quero uma indicacao de perfume da Amaro dos Reis Parfum."
              )}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light"
            >
              Pedir indicacao no WhatsApp
            </a>
            <Link
              href="/catalogo"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/45 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
            >
              Ver catalogo completo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
