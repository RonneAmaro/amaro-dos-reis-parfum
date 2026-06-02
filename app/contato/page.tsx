import type { Metadata } from "next";
import Link from "next/link";
import {
  createArabPremiumMessage,
  createCatalogMessage,
  createDeliveryQuestionMessage,
  createGiftRecommendationMessage,
  createPerfumeRecommendationMessage,
  createWhatsAppLink,
} from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contato | AMAROdosREIS Parfum",
  description:
    "Fale com a AMAROdosREIS Parfum para consultar perfumes, disponibilidade, indicação de fragrância e entrega.",
};

const contactOptions = [
  {
    title: "Quero conhecer o catalogo",
    text: "Veja as fragrancias de 50ml, linhas e valores antes de escolher.",
    message: createCatalogMessage(),
  },
  {
    title: "Quero ajuda para escolher",
    text: "Receba uma indicacao de acordo com estilo, ocasiao e presenca.",
    message: createPerfumeRecommendationMessage(),
  },
  {
    title: "Quero comprar para presente",
    text: "Encontre uma fragrancia elegante para transformar o presente.",
    message: createGiftRecommendationMessage(),
  },
  {
    title: "Quero saber sobre entrega",
    text: "Consulte forma de entrega, atendimento local e sua regiao.",
    message: createDeliveryQuestionMessage(),
  },
  {
    title: "Quero conhecer a Linha Arabe Premium",
    text: "Perfumes orientais, intensos e envolventes da linha premium.",
    message: createArabPremiumMessage(),
  },
];

const whatsappHref = createWhatsAppLink(createCatalogMessage());
const isWhatsAppConfigured = whatsappHref !== "#";

export default function ContatoPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="premium-bg relative overflow-hidden border-b border-gold/15 px-6 py-16 sm:px-10 lg:px-12">
        <div className="absolute right-[12%] top-16 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-gold">
            Contato
          </p>
          <h1 className="mt-5 text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
            Fale com a AMAROdosREIS Parfum.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300">
            Atendimento local, producao em pequenos lotes, perfumes 50ml, Linha
            Tradicional e Linha Arabe Premium.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappHref}
              target={isWhatsAppConfigured ? "_blank" : undefined}
              rel={isWhatsAppConfigured ? "noreferrer" : undefined}
              aria-disabled={!isWhatsAppConfigured}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light"
            >
              Chamar no WhatsApp
            </a>
            <Link
              href="/catalogo"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/45 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
            >
              Ver catalogo
            </Link>
          </div>
          {!isWhatsAppConfigured ? (
            <p className="mt-5 text-sm text-stone-500">
              WhatsApp será configurado em breve.
            </p>
          ) : null}
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
              Atendimento direto
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Escolha como deseja falar conosco.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {contactOptions.map((option) => (
              <article key={option.title} className="premium-surface p-6">
                <h3 className="text-xl font-semibold text-gold-light">
                  {option.title}
                </h3>
                <p className="mt-4 min-h-20 leading-7 text-stone-400">
                  {option.text}
                </p>
                <a
                  href={createWhatsAppLink(option.message)}
                  target={isWhatsAppConfigured ? "_blank" : undefined}
                  rel={isWhatsAppConfigured ? "noreferrer" : undefined}
                  aria-disabled={!isWhatsAppConfigured}
                  className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-gold/45 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
                >
                  WhatsApp
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
