import Link from "next/link";
import {
  availabilityLabels,
  lineLabels,
} from "@/lib/perfumes";
import {
  getPublicPerfumeBySlug,
  type PublicPerfume,
} from "@/lib/public-perfumes";
import {
  createDeliveryQuestionMessage,
  createPerfumeAvailabilityMessage,
  createPerfumeInterestMessage,
  createWhatsAppLink,
} from "@/lib/whatsapp";

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

function PerfumeImageFrame({
  src,
  alt,
  label,
  className = "aspect-[4/3]",
}: {
  src?: string;
  alt: string;
  label: string;
  className?: string;
}) {
  return (
    <div className="overflow-hidden border border-gold/20 bg-[#070604] shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
      {src ? (
        <div
          className={`flex ${className} items-center justify-center bg-[radial-gradient(circle_at_center,rgba(216,183,106,0.18),rgba(5,5,5,0.94)_62%)] p-5`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            className="max-h-full w-full object-contain drop-shadow-[0_22px_32px_rgba(0,0,0,0.55)]"
          />
        </div>
      ) : (
        <div
          className={`flex ${className} flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(216,183,106,0.16),rgba(5,5,5,0.95)_58%)] px-6 text-center`}
        >
          <div className="relative mb-5 h-24 w-16 border border-gold/45 bg-black/45 shadow-[0_0_28px_rgba(216,183,106,0.14)]">
            <div className="absolute left-1/2 top-0 h-6 w-8 -translate-x-1/2 -translate-y-6 border border-gold/35 bg-[#11100d]" />
            <div className="absolute inset-x-3 top-8 border-t border-gold/45" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            AMAROdosREIS Parfum
          </p>
          <p className="mt-3 text-sm uppercase tracking-[0.24em] text-stone-500">
            Imagem em breve
          </p>
        </div>
      )}
      <p className="border-t border-gold/10 bg-black/35 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold-light">
        {label}
      </p>
    </div>
  );
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

  const galleryImages = perfume.galleryImageUrls ?? [];
  const interestHref = createWhatsAppLink(
    createPerfumeInterestMessage(perfume.name)
  );
  const availabilityHref = createWhatsAppLink(
    createPerfumeAvailabilityMessage(perfume.name)
  );
  const deliveryHref = createWhatsAppLink(createDeliveryQuestionMessage());

  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="premium-bg relative overflow-hidden border-b border-gold/15 px-6 py-14 sm:px-10 lg:px-12">
        <div className="absolute right-[12%] top-16 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-gold">
              {perfume.collection}
            </p>
            <h1 className="mt-5 text-5xl font-semibold uppercase leading-none text-white sm:text-7xl">
              {perfume.name}
            </h1>
            <p className="mt-5 text-sm font-medium uppercase tracking-[0.22em] text-stone-400">
              Inspiracao olfativa discreta: {perfume.inspiration}
            </p>
            <p className="mt-7 max-w-2xl text-lg leading-9 text-stone-300">
              {perfume.longDescription}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="border border-gold/25 bg-black/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                  Valor
                </p>
                <p className="mt-2 text-2xl font-semibold text-gold-light">
                  {formatPrice(perfume.price)}
                </p>
              </div>
              <div className="border border-gold/25 bg-black/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                  Disponibilidade
                </p>
                <p className="mt-2 text-sm font-semibold text-gold-light">
                  {availabilityLabels[perfume.availabilityStatus]}
                </p>
              </div>
              <div className="border border-gold/25 bg-black/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                  Frasco
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-100">
                  50ml
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={interestHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light"
              >
                Consultar no WhatsApp
              </a>
              <Link
                href="/catalogo"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/45 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
              >
                Voltar ao catalogo
              </Link>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <a
                href={availabilityHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-gold/35 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
              >
                Consultar disponibilidade
              </a>
              <a
                href={deliveryHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-gold/35 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
              >
                Perguntar sobre entrega
              </a>
            </div>
          </div>

          <div className="gold-glow">
            <PerfumeImageFrame
              src={perfume.imageUrl || perfume.conceptImageUrl}
              alt={perfume.name}
              label="Foto do produto"
              className="h-[360px] sm:h-[480px]"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#080706] px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
            <article className="premium-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                Assinatura
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-white">
                Uma fragrancia para presenca marcante.
              </h2>
              <p className="mt-5 leading-8 text-stone-400">
                Ideal para quem busca uma assinatura elegante, com leitura
                autoral e inspiracao olfativa apresentada de forma discreta.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="border border-gold/20 bg-gold/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light">
                  {lineLabels[perfume.line]}
                </span>
                <span className="border border-gold/20 bg-gold/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light">
                  {perfume.family}
                </span>
              </div>
            </article>
            <PerfumeImageFrame
              src={perfume.conceptImageUrl}
              alt={`Conceito visual ${perfume.name}`}
              label="Conceito visual"
              className="aspect-[4/3]"
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
                Piramide olfativa
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-white">
                Leitura da fragrancia em tres momentos.
              </h2>
              <p className="mt-5 leading-8 text-stone-400">
                Da primeira impressao ao fundo, cada etapa ajuda a entender a
                presenca que o perfume deixa na pele.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {pyramid(perfume).map((note) => (
                <article key={note.title} className="premium-surface p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                    {note.title}
                  </p>
                  <p className="mt-5 leading-7 text-stone-400">{note.text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-12 premium-surface p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
              Combina com
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

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
              Antes de finalizar
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                "Consulte disponibilidade",
                "Combine forma de entrega",
                "Escolha a fragrancia ideal para seu momento",
              ].map((item) => (
                <article key={item} className="premium-surface p-5">
                  <p className="text-lg font-semibold text-white">{item}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#080706] px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
              Galeria da fragrancia
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Produto, conceito e detalhes em uma vitrine premium.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <PerfumeImageFrame
              src={perfume.imageUrl}
              alt={`Foto do produto ${perfume.name}`}
              label="Foto do produto"
              className="aspect-[4/3]"
            />
            <PerfumeImageFrame
              src={perfume.conceptImageUrl}
              alt={`Conceito visual ${perfume.name}`}
              label="Conceito visual"
              className="aspect-[4/3]"
            />
          </div>

          {galleryImages.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {galleryImages.map((imageUrl, index) => (
                <PerfumeImageFrame
                  key={`${imageUrl}-${index}`}
                  src={imageUrl}
                  alt={`${perfume.name} imagem ${index + 1}`}
                  label={`Galeria ${index + 1}`}
                  className="aspect-square"
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 border border-gold/20 bg-[linear-gradient(135deg,rgba(216,183,106,0.14),rgba(0,0,0,0.72)_48%,rgba(8,7,5,0.96))] p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
              Gostou dessa fragrancia?
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Consulte disponibilidade, forma de entrega e indicacao de uso
              pelo WhatsApp.
            </h2>
          </div>
          <a
            href={interestHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 w-fit items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light"
          >
            Consultar no WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
