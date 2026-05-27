import Link from "next/link";
import {
  availabilityLabels,
  lineLabels,
} from "@/lib/perfumes";
import {
  getPublicPerfumeBySlug,
  type PublicPerfume,
} from "@/lib/public-perfumes";
import { createWhatsAppLink } from "@/lib/whatsapp";

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function pyramid(perfume: PublicPerfume) {
  const fallback = [
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

  return [
    {
      title: "Topo",
      text: perfume.topNotes.length
        ? perfume.topNotes.join(", ")
        : fallback[0].text,
    },
    {
      title: "Coracao",
      text: perfume.heartNotes.length
        ? perfume.heartNotes.join(", ")
        : fallback[1].text,
    },
    {
      title: "Fundo",
      text: perfume.baseNotes.length
        ? perfume.baseNotes.join(", ")
        : fallback[2].text,
    },
  ];
}

function NotFoundPerfume() {
  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="premium-bg border-b border-gold/15 px-6 py-20 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-gold">
            Perfume nao encontrado
          </p>
          <h1 className="mt-5 text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
            Esta fragrancia nao esta disponivel no catalogo.
          </h1>
          <p className="mt-6 leading-8 text-stone-300">
            Ela pode ter sido removida, desativada ou ainda nao publicada.
          </p>
          <Link
            href="/catalogo"
            className="mt-9 inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light"
          >
            Voltar ao catalogo
          </Link>
        </div>
      </section>
    </main>
  );
}

export default async function PerfumePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const perfume = await getPublicPerfumeBySlug(slug);

  if (!perfume) {
    return <NotFoundPerfume />;
  }

  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="premium-bg relative overflow-hidden border-b border-gold/15 px-6 py-16 sm:px-10 lg:px-12">
        <div className="absolute right-[12%] top-16 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.78fr] lg:items-center">
          <div className="premium-surface overflow-hidden p-0 gold-glow">
            {perfume.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={perfume.imageUrl}
                alt={perfume.name}
                className="h-72 w-full object-cover"
              />
            ) : (
              <div className="flex h-72 items-center justify-center bg-black/45 px-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-gold">
                  Amaro dos Reis Parfum
                </p>
              </div>
            )}
            <div className="p-8 sm:p-10">
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
                {perfume.longDescription}
              </p>
            </div>
          </div>

          <aside className="premium-surface p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
              Valor
            </p>
            <p className="mt-3 text-4xl font-semibold text-gold-light">
              {formatPrice(perfume.price)}
            </p>
            <div className="mt-6 grid gap-4 text-sm text-stone-300">
              <div className="border-t border-white/10 pt-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                  Frasco
                </p>
                <p className="mt-2">50ml</p>
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
              {perfume.indicatedFor.map((indication) => (
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
              href={createWhatsAppLink(perfume.whatsappMessage)}
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
