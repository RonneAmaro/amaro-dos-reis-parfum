import type { Metadata } from "next";
import Link from "next/link";
import {
  createPerfumeRecommendationMessage,
  createWhatsAppLink,
} from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Apresentação | AMAROdosREIS Parfum",
  description:
    "Conheça a proposta da AMAROdosREIS Parfum: fragrâncias autorais, marcantes e acessíveis para quem deseja deixar presença.",
};

const recommendationWhatsAppHref = createWhatsAppLink(
  createPerfumeRecommendationMessage()
);

const choiceCards = [
  {
    title: "Para presenca executiva",
    text: "Fragrancias elegantes, limpas e confiantes para rotina profissional, reunioes e momentos de decisao.",
  },
  {
    title: "Para momentos marcantes",
    text: "Aromas de rastro memoravel para encontros, eventos e ocasioes em que voce deseja ser lembrado.",
  },
  {
    title: "Para dias leves",
    text: "Perfumes frescos, luminosos e confortaveis para movimento, calor e uso diario.",
  },
  {
    title: "Para noites intensas",
    text: "Composicoes envolventes, orientais e especiadas para uma presenca mais poderosa.",
  },
  {
    title: "Para presentear",
    text: "Opcoes versateis e sofisticadas para transformar um gesto simples em uma lembranca especial.",
  },
];

const lines = [
  {
    title: "Linha Tradicional 50ml",
    price: "R$ 80",
    text: "Fragrancias inspiradas em grandes referencias internacionais, com leitura elegante, acessivel e autoral.",
  },
  {
    title: "Linha Arabe Premium 50ml",
    price: "R$ 120",
    text: "Perfumes com presenca oriental, intensidade marcante e proposta sensorial mais luxuosa.",
  },
];

const reasons = [
  {
    title: "Identidade autoral",
    text: "Nomes proprios, proposta sensorial clara e uma marca em fase premium, mais madura e memoravel.",
  },
  {
    title: "Producao cuidadosa",
    text: "Pequenos lotes, atencao ao preparo e respeito ao tempo de maturacao de cada fragrancia.",
  },
  {
    title: "Experiencia olfativa",
    text: "Perfumes pensados para comunicar presenca, estilo e emocao antes mesmo das palavras.",
  },
  {
    title: "Atendimento direto",
    text: "Curadoria proxima para orientar a escolha conforme ocasiao, personalidade e intensidade desejada.",
  },
];

export default function ApresentacaoPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="premium-bg relative overflow-hidden border-b border-gold/15 px-6 py-16 sm:px-10 lg:px-12">
        <div className="absolute right-[12%] top-12 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.72fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.36em] text-gold">
              AMAROdosREIS Parfum
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
              Perfume e presenca.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-9 text-stone-300">
              Fragrancias autorais inspiradas em grandes referencias
              internacionais e orientais, criadas para quem deseja deixar uma
              marca por onde passa.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {["50ml", "Desde 2019", "Pequenos lotes", "Atendimento proximo"].map(
                (seal) => (
                  <span
                    key={seal}
                    className="border border-gold/30 bg-black/35 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold-light"
                  >
                    {seal}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="premium-surface p-6 gold-glow">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">
              Assinatura olfativa
            </p>
            <p className="mt-5 text-3xl font-semibold text-white">
              Um aroma pode chegar antes de voce e permanecer depois.
            </p>
            <p className="mt-5 leading-8 text-stone-400">
              A escolha certa nao apenas combina com o momento. Ela comunica
              personalidade, cria memoria e transforma presenca em lembranca.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
              Conquiste ou seja conquistado
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Sua presenca tambem tem cheiro.
            </h2>
          </div>
          <div className="space-y-5 text-lg leading-9 text-stone-300">
            <p>
              O olfato tem uma ligacao direta com memoria e emocao. Um perfume
              pode trazer de volta um encontro, uma fase da vida, uma pessoa ou
              uma sensacao que parecia guardada.
            </p>
            <p>
              Por isso, para a Amaro dos Reis Parfum, fragrancia nao e apenas
              cheiro. E assinatura pessoal. E a forma como voce chega,
              permanece e e lembrado.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#0b0906] px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
              Como escolher sua fragrancia
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Comece pela marca que voce quer deixar.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {choiceCards.map((card) => (
              <article key={card.title} className="premium-surface p-6">
                <h3 className="text-xl font-semibold text-gold-light">
                  {card.title}
                </h3>
                <p className="mt-4 leading-7 text-stone-400">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
            Linhas da marca
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {lines.map((line) => (
              <article key={line.title} className="premium-surface p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-2xl font-semibold text-white">
                    {line.title}
                  </h3>
                  <p className="w-fit border border-gold/30 bg-gold/10 px-4 py-2 text-lg font-semibold text-gold-light">
                    {line.price}
                  </p>
                </div>
                <p className="mt-5 leading-8 text-stone-400">{line.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#080706] px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
              Por que escolher
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Por que escolher AMAROdosREIS Parfum?
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

      <section className="px-6 py-20 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
            Escolha com ajuda
          </p>
          <h2 className="mt-5 text-3xl font-semibold text-white sm:text-5xl">
            Receba uma indicacao personalizada.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-stone-400">
            Se voce ainda nao sabe qual fragrancia combina com seu estilo, fale
            conosco e receba uma indicacao personalizada.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/catalogo"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light"
            >
              Ver catalogo
            </Link>
            <a
              href={recommendationWhatsAppHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/45 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
            >
              Receber indicacao pelo WhatsApp
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
