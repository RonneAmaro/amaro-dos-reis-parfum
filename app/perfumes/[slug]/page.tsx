import Link from "next/link";
import { notFound } from "next/navigation";
import {
  availabilityLabels,
  createPerfumeMessage,
  formatPerfumePrice,
  getPerfumeBySlug,
  getPerfumeIndications,
  lineLabels,
  type PerfumeCommerce,
} from "@/lib/perfumes";
import { createWhatsAppLink } from "@/lib/whatsapp";

function pyramid(perfume: PerfumeCommerce) {
  return [
    {
      title: "Topo",
      text: `Primeira impressao inspirada em ${perfume.inspiration}, com abertura elegante e memoravel.`,
    },
    {
      title: "Coracao",
      text: `A identidade central revela a familia ${perfume.family.toLowerCase()}, trazendo corpo e personalidade.`,
    },
    {
      title: "Fundo",
      text: "Fixacao pensada para deixar rastro sofisticado, com presenca confortavel no uso diario.",
    },
  ];
}

export default async function PerfumePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const perfume = getPerfumeBySlug(slug);

  if (!perfume) {
    notFound();
  }

  const indications = getPerfumeIndications(perfume.name);

  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="premium-bg relative overflow-hidden border-b border-gold/15 px-6 py-16 sm:px-10 lg:px-12">
        <div className="absolute right-[12%] top-16 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.78fr] lg:items-center">
          <div className="premium-surface p-8 gold-glow sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-gold">
              {perfume.collection}
            </p>
            <h1 className="mt-5 text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
              {perfume.name}
            </h1>
            <p className="mt-5 text-sm font-medium uppercase tracking-[0.22em] text-stone-300">
              Inspiracao olfativa: {perfume.inspiration}
            </p>
            <p className="mt-7 max-w-2xl text-lg leading-9 text-stone-300">
              {perfume.description}
            </p>
          </div>

          <aside className="premium-surface p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
              Valor
            </p>
            <p className="mt-3 text-4xl font-semibold text-gold-light">
              {formatPerfumePrice(perfume)}
            </p>
            <div className="mt-6 grid gap-4 text-sm text-stone-300">
              <div className="border-t border-white/10 pt-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                  Frasco
                </p>
                <p className="mt-2">{perfume.sizeMl}ml</p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                  Linha
                </p>
                <p className="mt-2">{lineLabels[perfume.line]}</p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                  Disponibilidade
                </p>
                <p className="mt-2 text-gold-light">
                  {availabilityLabels[perfume.availabilityStatus]}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
              Piramide olfativa
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white">
              Leitura da fragrancia em tres momentos.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {pyramid(perfume).map((note) => (
              <article key={note.title} className="premium-surface p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                  {note.title}
                </p>
                <p className="mt-5 leading-7 text-stone-400">{note.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 premium-surface p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
              Indicado para
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {indications.map((indication) => (
                <span
                  key={indication}
                  className="border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-medium text-gold-light"
                >
                  {indication}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href={createWhatsAppLink(createPerfumeMessage(perfume.name))}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light"
            >
              Pedir pelo WhatsApp
            </a>
            <Link
              href="/catalogo"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/45 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
            >
              Voltar ao catalogo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
