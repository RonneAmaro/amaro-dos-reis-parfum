import type { Metadata } from "next";
import Link from "next/link";
import {
  availabilityLabels,
  type AvailabilityStatus,
} from "@/lib/perfumes";
import { getPublicPerfumes } from "@/lib/public-perfumes";
import {
  createCatalogMessage,
  createLocalDeliveryMessage,
  createPerfumeAvailabilityMessage,
  createPerfumeRecommendationMessage,
  createWhatsAppLink,
} from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Disponibilidade | AMAROdosREIS Parfum",
  description:
    "Consulte disponibilidade e encomendas de perfumes da AMAROdosREIS Parfum.",
};

const statusGroups: { status: AvailabilityStatus; title: string }[] = [
  { status: "available", title: "Disponiveis" },
  { status: "limited", title: "Poucas unidades" },
  { status: "on_order", title: "Sob encomenda" },
];

const whatsappHref = createWhatsAppLink(createCatalogMessage());
const recommendationHref = createWhatsAppLink(
  createPerfumeRecommendationMessage()
);
const localDeliveryHref = createWhatsAppLink(createLocalDeliveryMessage());

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function PerfumeThumb({
  src,
  alt,
}: {
  src?: string;
  alt: string;
}) {
  return (
    <div className="h-24 w-24 shrink-0 overflow-hidden border border-gold/20 bg-[radial-gradient(circle_at_center,rgba(216,183,106,0.16),rgba(5,5,5,0.95)_62%)]">
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            className="h-full w-full object-contain p-2"
          />
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center px-2 text-center">
          <div className="mb-2 h-8 w-5 border border-gold/45" />
          <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-gold">
            AMAROdosREIS Parfum
          </p>
          <p className="mt-1 text-[8px] uppercase tracking-[0.12em] text-stone-500">
            Imagem em breve
          </p>
        </div>
      )}
    </div>
  );
}

export default async function DisponibilidadePage() {
  const publicPerfumes = await getPublicPerfumes();

  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="premium-bg relative overflow-hidden border-b border-gold/15 px-6 py-16 sm:px-10 lg:px-12">
        <div className="absolute right-[14%] top-12 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-gold">
            Encomendas
          </p>
          <h1 className="mt-5 text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
            Disponibilidade e encomendas
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-9 text-stone-300">
            A producao e feita em pequenos lotes. Algumas fragrancias podem
            estar disponiveis, em poucas unidades ou sob encomenda.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light"
            >
              Consultar disponibilidade pelo WhatsApp
            </a>
            <a
              href={recommendationHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/45 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
            >
              Quero ajuda para escolher
            </a>
            <a
              href={localDeliveryHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/45 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
            >
              Entrega local
            </a>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
          {statusGroups.map((group) => {
            const perfumes = publicPerfumes.filter(
              (perfume) => perfume.availabilityStatus === group.status
            );

            return (
              <section key={group.status}>
                <div className="mb-4 flex items-end justify-between gap-4 border-b border-gold/15 pb-4">
                  <h2 className="text-2xl font-semibold text-white">
                    {group.title}
                  </h2>
                  <p className="border border-gold/25 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-gold">
                    {perfumes.length}
                  </p>
                </div>

                <div className="grid gap-4">
                  {perfumes.length === 0 ? (
                    <article className="premium-surface p-5">
                      <p className="text-sm text-stone-500">
                        Nenhuma fragrancia nesta categoria agora.
                      </p>
                    </article>
                  ) : (
                    perfumes.map((perfume) => (
                      <article
                        key={perfume.slug}
                        className="border border-gold/20 bg-[linear-gradient(145deg,rgba(216,183,106,0.10),rgba(8,7,5,0.96)_42%,rgba(3,3,3,1))] p-4 transition hover:border-gold/50"
                      >
                        <div className="flex gap-4">
                          <PerfumeThumb
                            src={perfume.imageUrl || perfume.conceptImageUrl}
                            alt={perfume.name}
                          />
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.22em] text-gold/80">
                              {perfume.collection}
                            </p>
                            <h3 className="mt-3 text-xl font-semibold uppercase tracking-[0.08em] text-white">
                              {perfume.name}
                            </h3>
                            <p className="mt-2 text-sm text-stone-400">
                              {perfume.family}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-300">
                          <span className="border border-white/10 bg-black/30 px-3 py-1">
                            {formatPrice(perfume.price)}
                          </span>
                          <span className="border border-gold/25 bg-gold/10 px-3 py-1 text-gold-light">
                            {availabilityLabels[perfume.availabilityStatus]}
                          </span>
                        </div>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                          <Link
                            href={`/perfumes/${perfume.slug}`}
                            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-gold px-4 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-gold-light"
                          >
                            Ver detalhes
                          </Link>
                          <a
                            href={createWhatsAppLink(
                              createPerfumeAvailabilityMessage(perfume.name)
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-gold/45 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
                          >
                            Consultar este perfume
                          </a>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
