import Link from "next/link";
import { getPerfumeExperience } from "@/lib/perfumeExperience";
import { PublicAvailabilityBadge } from "@/app/components/PublicAvailabilityBadge";
import { getSafePublicAvailability } from "@/lib/publicAvailability";
import {
  getPublicPerfumes,
  type PublicPerfume,
} from "@/lib/supabase/perfumes";
import { createWhatsAppLink } from "@/lib/whatsapp";

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function interestMessage(name: string, availability: string) {
  return `Olá! Tenho interesse no perfume ${name}. Vi que ele está como “${availability}”. Pode confirmar para mim?`;
}

function relatedPerfumes(perfume: PublicPerfume, perfumes: PublicPerfume[]) {
  const experience = getPerfumeExperience(perfume.slug);
  const familyTerms = new Set(experience.family.toLowerCase().split(/\s+/));

  return perfumes
    .filter((candidate) => candidate.slug !== perfume.slug)
    .map((candidate) => {
      const candidateExperience = getPerfumeExperience(candidate.slug);
      let score = 0;
      if (candidate.collection === perfume.collection) score += 5;
      if (candidate.line === perfume.line) score += 2;
      if (
        candidateExperience.family
          .toLowerCase()
          .split(/\s+/)
          .some((term) => familyTerms.has(term))
      ) score += 3;
      score += candidateExperience.styleTags.filter((tag) =>
        experience.styleTags.includes(tag)
      ).length;
      return { perfume: candidate, score };
    })
    .sort((a, b) => b.score - a.score || a.perfume.name.localeCompare(b.perfume.name))
    .slice(0, 3)
    .map(({ perfume: candidate }) => candidate);
}

function NotFoundPerfume() {
  return (
    <main className="min-h-screen bg-[#050505] px-6 py-24 text-stone-100">
      <div className="mx-auto max-w-3xl border border-gold/20 bg-[#090806] p-8 sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[.34em] text-gold">
          Perfume não encontrado
        </p>
        <h1 className="mt-5 text-4xl font-semibold leading-tight text-white sm:text-6xl">
          Esta fragrância não está disponível no catálogo.
        </h1>
        <p className="mt-6 leading-8 text-stone-400">
          Ela pode ter sido removida, desativada ou ainda não publicada.
        </p>
        <Link
          href="/catalogo-olfativo"
          className="mt-9 inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-xs font-semibold uppercase tracking-[.16em] text-black"
        >
          Voltar ao Catálogo Olfativo
        </Link>
      </div>
    </main>
  );
}

const pyramidDescriptions = {
  Topo: "A primeira impressão: notas que surgem logo ao sentir a fragrância.",
  Coração: "A personalidade central, revelada após os primeiros minutos.",
  Fundo: "A assinatura que permanece na pele e sustenta o rastro.",
};

export default async function PerfumePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const publicPerfumes = await getPublicPerfumes();
  const perfume = publicPerfumes.data.find((item) => item.slug === slug);

  if (!perfume) return <NotFoundPerfume />;

  const experience = getPerfumeExperience(perfume.slug);
  const related = relatedPerfumes(perfume, publicPerfumes.data);
  const availability = getSafePublicAvailability(perfume);
  const whatsappHref = createWhatsAppLink(interestMessage(perfume.name, availability.label));
  const pyramid = [
    ["Topo", experience.topNotes],
    ["Coração", experience.heartNotes],
    ["Fundo", experience.baseNotes],
  ] as const;

  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section
        className="relative overflow-hidden border-b border-white/10 px-6 py-14 sm:px-10 sm:py-20 lg:px-12 lg:py-24"
        style={{ background: experience.gradient }}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full border border-white/10 bg-white/[.04]" />
        <div className="pointer-events-none absolute bottom-12 right-[12%] h-44 w-44 rounded-full border border-white/10 bg-black/10 backdrop-blur-sm" />
        <div className="pointer-events-none absolute bottom-28 right-[28%] h-16 w-16 rounded-full" style={{ backgroundColor: `${experience.accentColor}30` }} />

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[.16em]">
              <span className="border border-white/20 bg-black/20 px-3 py-2 text-white/80">
                {perfume.collection}
              </span>
              <span className="border border-white/20 bg-black/20 px-3 py-2 text-white/80">
                {perfume.line === "arabic_premium" ? "Árabe Premium" : "Tradicional"}
              </span>
              <PublicAvailabilityBadge availability={availability} />
            </div>
            <h1 className="mt-7 text-5xl font-semibold uppercase leading-none tracking-[.06em] text-white sm:text-7xl lg:text-8xl">
              {perfume.name}
            </h1>
            <p className="mt-4 text-xs uppercase tracking-[.22em] text-white/50">
              Referência olfativa: {perfume.inspiration}
            </p>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
              {experience.shortStory}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {experience.mainAccords.map((accord) => (
                <span
                  key={accord}
                  className="rounded-full border border-white/20 bg-black/20 px-4 py-2 text-xs text-white/85"
                >
                  {accord}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-13 items-center justify-center rounded-full px-7 text-center text-xs font-semibold uppercase tracking-[.14em] text-black transition hover:brightness-110"
                style={{ backgroundColor: experience.accentColor }}
              >
                Quero este no WhatsApp
              </a>
              <Link
                href="/catalogo-olfativo"
                className="inline-flex min-h-13 items-center justify-center rounded-full border border-white/40 bg-black/15 px-7 text-center text-xs font-semibold uppercase tracking-[.14em] text-white hover:bg-white/10"
              >
                Voltar ao Catálogo Olfativo
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center">
            <div className="absolute inset-[8%] rounded-full border border-white/15 bg-black/10 shadow-[inset_0_0_80px_rgba(0,0,0,.25)]" />
            <div className="absolute inset-[22%] rounded-full border border-white/20 bg-white/[.04] backdrop-blur-sm" />
            <div className="absolute left-[10%] top-[18%] h-20 w-20 rounded-full border border-white/10" style={{ backgroundColor: `${experience.accentColor}28` }} />
            <div className="absolute bottom-[16%] right-[8%] h-28 w-28 rounded-full border border-white/10 bg-black/15" />
            <div className="relative px-10 text-center">
              <p className="text-[10px] uppercase tracking-[.3em] text-white/50">Família olfativa</p>
              <p className="mt-4 text-2xl font-semibold text-white sm:text-3xl">{experience.family}</p>
              <p className="mt-4 text-sm leading-6 text-white/65">{experience.mood}</p>
              <p className="mt-6 text-3xl font-semibold" style={{ color: experience.accentColor }}>
                {formatPrice(perfume.price)}
              </p>
              <p className="mt-1 text-xs text-white/45">50 ml</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-6 py-10 sm:px-10 lg:px-12">
        <div className="premium-surface mx-auto flex max-w-7xl flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.24em] text-gold">Disponibilidade</p>
            <PublicAvailabilityBadge availability={availability} showDescription className="mt-4" />
            <p className="mt-4 text-sm leading-6 text-stone-400">Para confirmar disponibilidade e prazo, fale comigo no WhatsApp.</p>
          </div>
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-gold px-7 text-center text-xs font-semibold uppercase tracking-[.14em] text-black hover:bg-gold-light">Consultar no WhatsApp</a>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[.3em]" style={{ color: experience.accentColor }}>
            Evolução na pele
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Pirâmide olfativa</h2>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {pyramid.map(([title, notes], index) => (
              <article key={title} className="relative overflow-hidden border border-white/10 bg-[#0a0908] p-6 sm:p-7">
                <span className="absolute right-5 top-4 text-5xl font-semibold text-white/[.035]">0{index + 1}</span>
                <p className="text-xs font-semibold uppercase tracking-[.25em]" style={{ color: experience.accentColor }}>{title}</p>
                <p className="mt-4 min-h-12 text-sm leading-6 text-stone-500">{pyramidDescriptions[title]}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {notes.map((note) => <span key={note} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-xs text-stone-200">{note}</span>)}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#090806] px-6 py-16 sm:px-10 lg:px-12 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.3em]" style={{ color: experience.accentColor }}>Assinatura</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Identidade da fragrância</h2>
            <p className="mt-5 text-base leading-8 text-stone-400">{perfume.longDescription || perfume.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Família", experience.family], ["Sensação", experience.mood],
              ["Intensidade", experience.intensity], ["Projeção", experience.projection],
              ["Longevidade", experience.longevity], ["Linha", perfume.line === "arabic_premium" ? "Árabe Premium" : "Tradicional"],
            ].map(([label, value]) => (
              <div key={label} className="border border-white/10 bg-black/25 p-4 sm:p-5">
                <p className="text-[9px] uppercase tracking-[.18em] text-stone-600">{label}</p>
                <p className="mt-3 text-sm font-medium leading-6 text-stone-200">{value}</p>
                <div className="mt-4 h-px w-full bg-white/10"><div className="h-px w-2/3" style={{ backgroundColor: experience.accentColor }} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="border border-white/10 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[.28em]" style={{ color: experience.accentColor }}>Ocasiões ideais</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">Para quem combina</h2>
            <div className="mt-7 flex flex-wrap gap-3">
              {experience.occasions.map((occasion) => <span key={occasion} className="rounded-full border border-white/15 bg-white/[.04] px-4 py-2 text-sm text-stone-200">{occasion}</span>)}
            </div>
          </div>
          <div className="border border-white/10 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[.28em]" style={{ color: experience.accentColor }}>Perfil e estilo</p>
            <p className="mt-5 text-lg leading-8 text-stone-300">{experience.customerProfile}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {experience.styleTags.map((tag) => <span key={tag} className="border border-white/10 px-3 py-2 text-xs capitalize text-stone-500">{tag}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[.3em]" style={{ color: experience.accentColor }}>Curadoria Amaro</p>
          <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Você também pode gostar</h2>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {related.map((candidate) => {
              const candidateExperience = getPerfumeExperience(candidate.slug);
              return (
                <article key={candidate.slug} className="relative overflow-hidden border border-white/10 p-6" style={{ background: candidateExperience.gradient }}>
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full border border-white/10 bg-white/[.04]" />
                  <p className="relative text-[10px] uppercase tracking-[.2em] text-white/55">{candidate.collection}</p>
                  <h3 className="relative mt-4 text-2xl font-semibold tracking-[.06em] text-white">{candidate.name}</h3>
                  <p className="relative mt-2 text-sm text-white/60">{candidateExperience.family}</p>
                  <p className="relative mt-5 text-xl font-semibold" style={{ color: candidateExperience.accentColor }}>{formatPrice(candidate.price)}</p>
                  <Link href={`/perfumes/${candidate.slug}`} className="relative mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/35 bg-black/15 px-5 text-xs font-semibold uppercase tracking-[.12em] text-white hover:bg-white/10">Ver fragrância</Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl overflow-hidden border border-white/15 p-7 sm:p-10" style={{ background: experience.gradient }}>
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.3em] text-white/55">Atendimento pessoal</p>
              <h2 className="mt-4 text-3xl font-semibold text-white sm:text-5xl">Gostou desta fragrância?</h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/70">Fale comigo no WhatsApp para consultar disponibilidade, entrega e forma de pagamento.</p>
            </div>
            <div className="flex min-w-64 flex-col gap-3">
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex min-h-13 items-center justify-center rounded-full px-6 text-center text-xs font-semibold uppercase tracking-[.14em] text-black" style={{ backgroundColor: experience.accentColor }}>Quero este perfume</a>
              <Link href="/catalogo-olfativo" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 px-6 text-center text-xs font-semibold uppercase tracking-[.14em] text-white">Ver catálogo olfativo</Link>
              <Link href="/catalogo" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-6 text-center text-xs font-semibold uppercase tracking-[.14em] text-white/75">Ver outras fragrâncias</Link>
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Navegação da fragrância" className="border-t border-white/10 px-6 py-8 sm:px-10 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-center sm:flex-row sm:justify-center">
          <Link href="/catalogo-olfativo" className="px-5 py-3 text-xs font-semibold uppercase tracking-[.14em] text-gold-light">Voltar ao Catálogo Olfativo</Link>
          <Link href="/catalogo" className="px-5 py-3 text-xs font-semibold uppercase tracking-[.14em] text-gold-light">Ver Catálogo Completo</Link>
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="px-5 py-3 text-xs font-semibold uppercase tracking-[.14em] text-gold-light">WhatsApp</a>
        </div>
      </nav>
    </main>
  );
}
