"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getPerfumeExperience,
  type PerfumeExperience,
} from "@/lib/perfumeExperience";
import { availabilityLabels } from "@/lib/perfumes";
import {
  getPublicPerfumes,
  type PublicPerfume,
} from "@/lib/supabase/perfumes";
import { createCatalogMessage, createWhatsAppLink } from "@/lib/whatsapp";
import { CatalogoViewer } from "./CatalogoViewer";

const filters = [
  ["all", "Todos"], ["male", "Masculinos"], ["female", "Femininos"],
  ["arabic", "Árabes Premium"], ["traditional", "Tradicionais"],
  ["marcante", "Marcantes"], ["doce", "Doces"], ["fresco", "Frescos"],
  ["amadeirado", "Amadeirados"], ["presente", "Presentes"],
  ["dia a dia", "Dia a dia"], ["noite", "Noite"],
] as const;

const quickChoices = [
  ["marcante", "Quero algo marcante"], ["doce", "Quero algo doce"],
  ["fresco", "Quero algo fresco"], ["presente", "Quero para presente"],
  ["trabalho", "Quero para trabalhar"], ["noite", "Quero para noite"],
  ["arabic", "Quero árabe premium"], ["feminino elegante", "Quero feminino elegante"],
  ["masculino versátil", "Quero masculino versátil"],
] as const;

const collections = [
  ["Executive Collection", "Assinaturas masculinas sofisticadas, marcantes e versáteis."],
  ["Feminine Collection", "Perfumes femininos envolventes, elegantes e memoráveis."],
  ["Oriental Collection", "Fragrâncias árabes premium com intensidade e personalidade."],
] as const;

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function interestMessage(name: string) {
  return `Olá! Tenho interesse no perfume ${name} da AMARO DOS REIS PARFUM. Vi no catálogo olfativo e gostaria de saber se está disponível.`;
}

function searchableText(perfume: PublicPerfume, experience: PerfumeExperience) {
  return normalize([
    perfume.name, perfume.inspiration, perfume.collection, perfume.family,
    perfume.description, perfume.audience, perfume.line === "arabic_premium" ? "árabe premium" : "tradicional",
    ...perfume.tags, ...perfume.indicatedFor, experience.family, experience.mood,
    experience.shortStory, ...experience.mainAccords, ...experience.topNotes,
    ...experience.heartNotes, ...experience.baseNotes, ...experience.occasions,
    ...experience.styleTags,
  ].join(" "));
}

function matchesFilter(perfume: PublicPerfume, experience: PerfumeExperience, filter: string) {
  if (filter === "all") return true;
  if (filter === "male") return perfume.audience === "Masculino";
  if (filter === "female") return perfume.audience === "Feminino";
  if (filter === "arabic") return perfume.line === "arabic_premium";
  if (filter === "traditional") return perfume.line === "traditional";
  return searchableText(perfume, experience).includes(normalize(filter));
}

function NotesPyramid({ experience, compact = false }: { experience: PerfumeExperience; compact?: boolean }) {
  const levels = [
    ["Topo", experience.topNotes], ["Coração", experience.heartNotes], ["Fundo", experience.baseNotes],
  ] as const;
  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-1" : "sm:grid-cols-3"}`}>
      {levels.map(([label, notes]) => (
        <div key={label} className="border border-white/10 bg-black/25 p-3">
          <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-white/55">{label}</p>
          <p className="mt-2 text-xs leading-5 text-white/85">{notes.join(" • ")}</p>
        </div>
      ))}
    </div>
  );
}

function PerfumeCard({ perfume, onOpen }: { perfume: PublicPerfume; onOpen: () => void }) {
  const experience = getPerfumeExperience(perfume.slug);
  const price = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(perfume.price);
  return (
    <article
      className="group relative flex flex-col overflow-hidden border border-white/15 shadow-[0_28px_80px_rgba(0,0,0,.45)] transition duration-300 hover:-translate-y-1 hover:border-white/35"
      style={{ background: experience.gradient }}
    >
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-white/10 bg-white/[.04]" />
      <div className="relative flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[.22em] text-white/60">{perfume.collection}</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[.08em] text-white">{perfume.name}</h3>
            <p className="mt-2 text-xs text-white/50">Referência olfativa: {perfume.inspiration}</p>
          </div>
          <p className="shrink-0 text-xl font-semibold" style={{ color: experience.accentColor }}>{price}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-[9px] font-semibold uppercase tracking-[.13em]">
          <span className="border border-white/20 bg-black/25 px-3 py-2 text-white/85">{perfume.line === "arabic_premium" ? "Árabe Premium" : "Tradicional"}</span>
          <span className="border border-white/20 bg-black/25 px-3 py-2 text-white/85">{perfume.audience}</span>
          <span className="border border-white/20 bg-black/25 px-3 py-2 text-white/85">{availabilityLabels[perfume.availabilityStatus]}</span>
        </div>
        <p className="mt-5 text-sm font-semibold" style={{ color: experience.accentColor }}>{experience.family}</p>
        <p className="mt-3 text-sm leading-7 text-white/75">{experience.shortStory}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {experience.mainAccords.map((accord) => <span key={accord} className="rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-[10px] text-white/80">{accord}</span>)}
        </div>
        <div className="mt-5"><NotesPyramid experience={experience} compact /></div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-xs">
          <div><p className="text-white/45">Ocasião ideal</p><p className="mt-1 text-white/85">{experience.occasions.slice(0, 2).join(" • ")}</p></div>
          <div><p className="text-white/45">Presença</p><p className="mt-1 text-white/85">{experience.intensity} • {experience.projection}</p></div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={onOpen} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 bg-black/20 px-4 text-xs font-semibold uppercase tracking-[.12em] text-white hover:bg-white/10">Conhecer fragrância</button>
          <a href={createWhatsAppLink(interestMessage(perfume.name))} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full px-4 text-xs font-semibold uppercase tracking-[.12em] text-black transition hover:brightness-110" style={{ backgroundColor: experience.accentColor }}>Quero este</a>
        </div>
      </div>
    </article>
  );
}

function PerfumeModal({ perfume, onClose }: { perfume: PublicPerfume; onClose: () => void }) {
  const experience = getPerfumeExperience(perfume.slug);
  const price = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(perfume.price);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", closeOnEscape); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="perfume-modal-title" className="max-h-[92vh] w-full max-w-4xl overflow-y-auto border border-white/20 shadow-2xl sm:rounded-2xl" style={{ background: experience.gradient }}>
        <div className="sticky top-0 z-10 flex justify-end bg-black/35 p-3 backdrop-blur-md"><button type="button" onClick={onClose} aria-label="Fechar detalhes" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-2xl text-white">×</button></div>
        <div className="px-5 pb-8 sm:px-9 sm:pb-10">
          <p className="text-xs uppercase tracking-[.22em] text-white/55">{perfume.collection} • {perfume.line === "arabic_premium" ? "Árabe Premium" : "Tradicional"}</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3"><div><h2 id="perfume-modal-title" className="text-3xl font-semibold tracking-[.08em] text-white sm:text-5xl">{perfume.name}</h2><p className="mt-2 text-sm text-white/55">Inspirado em {perfume.inspiration}</p></div><p className="text-3xl font-semibold" style={{ color: experience.accentColor }}>{price}</p></div>
          <p className="mt-6 max-w-3xl text-base leading-8 text-white/80">{perfume.longDescription || perfume.description} {experience.shortStory}</p>
          <div className="mt-7"><h3 className="mb-3 text-xs font-semibold uppercase tracking-[.2em] text-white/60">Pirâmide olfativa</h3><NotesPyramid experience={experience} /></div>
          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <div><h3 className="text-xs font-semibold uppercase tracking-[.2em] text-white/60">Acordes principais</h3><div className="mt-3 flex flex-wrap gap-2">{experience.mainAccords.map((item) => <span key={item} className="rounded-full border border-white/20 bg-black/25 px-4 py-2 text-xs text-white">{item}</span>)}</div></div>
            <div><h3 className="text-xs font-semibold uppercase tracking-[.2em] text-white/60">Ocasiões</h3><p className="mt-3 text-sm text-white/80">{experience.occasions.join(" • ")}</p></div>
          </div>
          <div className="mt-7 grid grid-cols-3 gap-2 text-center"><div className="border border-white/10 bg-black/25 p-3"><p className="text-[9px] uppercase text-white/45">Intensidade</p><p className="mt-2 text-xs text-white">{experience.intensity}</p></div><div className="border border-white/10 bg-black/25 p-3"><p className="text-[9px] uppercase text-white/45">Projeção</p><p className="mt-2 text-xs text-white">{experience.projection}</p></div><div className="border border-white/10 bg-black/25 p-3"><p className="text-[9px] uppercase text-white/45">Longevidade</p><p className="mt-2 text-xs text-white">{experience.longevity}</p></div></div>
          <div className="mt-7 border-l-2 pl-4" style={{ borderColor: experience.accentColor }}><p className="text-xs uppercase tracking-[.18em] text-white/50">Para quem é</p><p className="mt-2 text-sm leading-7 text-white/80">{experience.customerProfile}</p></div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2"><a href={createWhatsAppLink(interestMessage(perfume.name))} target="_blank" rel="noreferrer" className="inline-flex min-h-13 items-center justify-center rounded-full px-6 text-xs font-semibold uppercase tracking-[.14em] text-black" style={{ backgroundColor: experience.accentColor }}>Quero este</a><Link href={`/perfumes/${perfume.slug}`} className="inline-flex min-h-13 items-center justify-center rounded-full border border-white/35 px-6 text-xs font-semibold uppercase tracking-[.14em] text-white">Ver página completa</Link></div>
        </div>
      </div>
    </div>
  );
}

export function CatalogoOlfativoClient() {
  const [perfumes, setPerfumes] = useState<PublicPerfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<PublicPerfume | null>(null);
  const catalogWhatsApp = createWhatsAppLink(createCatalogMessage());

  useEffect(() => { let active = true; getPublicPerfumes().then(({ data }) => { if (active) { setPerfumes(data); setLoading(false); } }); return () => { active = false; }; }, []);
  const results = useMemo(() => { const terms = normalize(query).trim().split(/\s+/).filter(Boolean); return perfumes.filter((perfume) => { const experience = getPerfumeExperience(perfume.slug); return matchesFilter(perfume, experience, filter) && terms.every((term) => searchableText(perfume, experience).includes(term)); }); }, [filter, perfumes, query]);
  function applyChoice(value: string) { if (["arabic", "male", "female", "traditional"].includes(value)) { setFilter(value); setQuery(""); } else { setFilter("all"); setQuery(value); } document.getElementById("fragrancias")?.scrollIntoView({ behavior: "smooth" }); }

  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="premium-bg relative overflow-hidden border-b border-gold/15 px-6 py-20 sm:px-10 lg:px-12 lg:py-28"><div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" /><div className="relative mx-auto max-w-7xl text-center"><p className="text-xs font-semibold uppercase tracking-[.36em] text-gold">Vitrine premium • 50 ml</p><h1 className="mx-auto mt-6 max-w-5xl text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">Catálogo Olfativo <span className="text-gold-light">AMARO DOS REIS PARFUM</span></h1><p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-stone-300 sm:text-lg">Descubra cada fragrância como uma experiência própria — sua atmosfera, suas notas e a presença que ela revela.</p><div className="mx-auto mt-9 flex max-w-2xl flex-col justify-center gap-3 sm:flex-row"><a href="#fragrancias" className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-7 text-xs font-semibold uppercase tracking-[.16em] text-black hover:bg-gold-light">Explorar fragrâncias</a><a href={catalogWhatsApp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/55 px-7 text-xs font-semibold uppercase tracking-[.16em] text-gold-light hover:bg-gold/10">Pedir uma indicação</a></div></div></section>

      <section className="border-b border-white/10 px-6 py-16 sm:px-10 lg:px-12"><div className="mx-auto max-w-7xl"><p className="text-xs font-semibold uppercase tracking-[.3em] text-gold">Experiência por fragrância</p><div className="mt-4 grid gap-6 lg:grid-cols-[1fr_.8fr] lg:items-end"><h2 className="max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-5xl">Cada perfume possui seu próprio ecossistema.</h2><p className="text-sm leading-7 text-stone-400 sm:text-base">Cores, acordes e notas traduzem a personalidade de cada criação. Explore com calma e encontre a assinatura que combina com você.</p></div><div className="mt-10 grid gap-3 sm:grid-cols-3"><div className="premium-surface p-5"><p className="text-gold">01</p><p className="mt-3 text-sm text-stone-300">Sinta a atmosfera e os acordes.</p></div><div className="premium-surface p-5"><p className="text-gold">02</p><p className="mt-3 text-sm text-stone-300">Conheça a pirâmide olfativa.</p></div><div className="premium-surface p-5"><p className="text-gold">03</p><p className="mt-3 text-sm text-stone-300">Escolha pela ocasião e personalidade.</p></div></div></div></section>

      <section id="fragrancias" className="scroll-mt-24 px-6 py-16 sm:px-10 lg:px-12"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.3em] text-gold">Vitrine olfativa</p><h2 className="mt-4 text-3xl font-semibold text-white">Encontre sua fragrância</h2></div><p className="text-sm text-stone-400">{loading ? "Carregando catálogo..." : `${results.length} fragrância${results.length === 1 ? "" : "s"}`}</p></div><label className="mt-8 block"><span className="sr-only">Buscar fragrância</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque por nome, referência, notas, acordes ou ocasião" className="min-h-14 w-full border border-gold/25 bg-black/50 px-5 text-sm text-white outline-none placeholder:text-stone-600 focus:border-gold" /></label><div className="-mx-6 mt-4 flex gap-2 overflow-x-auto px-6 pb-3 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">{filters.map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={`min-h-11 shrink-0 rounded-full border px-4 text-xs font-semibold uppercase tracking-[.1em] ${filter === value ? "border-gold bg-gold text-black" : "border-gold/25 bg-gold/[.06] text-gold-light"}`}>{label}</button>)}</div>{!loading && results.length === 0 ? <div className="mt-8 border border-gold/20 p-10 text-center text-stone-400">Nenhuma fragrância encontrada. Experimente outro termo ou filtro.</div> : <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{results.map((perfume) => <PerfumeCard key={perfume.slug} perfume={perfume} onOpen={() => setSelected(perfume)} />)}</div>}</div></section>

      <section className="border-y border-white/10 bg-[#090806] px-6 py-16 sm:px-10 lg:px-12"><div className="mx-auto max-w-7xl"><p className="text-xs font-semibold uppercase tracking-[.3em] text-gold">Curadoria rápida</p><div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><h2 className="text-3xl font-semibold text-white">Não sabe qual escolher?</h2><p className="mt-3 text-sm text-stone-400">Conte como você quer se sentir e veja uma seleção compatível.</p></div><Link href="/escolha-seu-perfume" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-gold px-7 text-xs font-semibold uppercase tracking-[.14em] text-black hover:bg-gold-light">Me ajude a escolher</Link></div><div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">{quickChoices.map(([value, label]) => <button key={label} type="button" onClick={() => applyChoice(value)} className="min-h-16 border border-gold/20 bg-gold/[.06] p-4 text-sm font-semibold text-gold-light transition hover:border-gold/60 hover:bg-gold/15">{label}</button>)}</div></div></section>

      <section className="px-6 py-16 sm:px-10 lg:px-12"><div className="mx-auto max-w-7xl"><div className="grid gap-4 md:grid-cols-3">{collections.map(([name, text]) => <article key={name} className="premium-surface p-6"><p className="text-xs uppercase tracking-[.22em] text-gold">Coleção</p><h2 className="mt-3 text-xl font-semibold text-white">{name}</h2><p className="mt-4 text-sm leading-7 text-stone-400">{text}</p></article>)}</div><div className="mt-6 grid gap-4 md:grid-cols-2"><article className="premium-surface p-7"><p className="text-xs uppercase tracking-[.25em] text-gold">Linha Tradicional</p><p className="mt-4 text-4xl font-semibold text-gold-light">R$ 80</p><p className="mt-2 text-sm text-stone-300">50 ml</p></article><article className="premium-surface p-7"><p className="text-xs uppercase tracking-[.25em] text-gold">Linha Árabe Premium</p><p className="mt-4 text-4xl font-semibold text-gold-light">R$ 120</p><p className="mt-2 text-sm text-stone-300">50 ml</p></article></div></div></section>

      <CatalogoViewer whatsappUrl={catalogWhatsApp} />

      <section className="px-6 py-20 sm:px-10 lg:px-12"><div className="mx-auto max-w-5xl text-center"><p className="text-xs font-semibold uppercase tracking-[.3em] text-gold">Como comprar</p><h2 className="mt-4 text-3xl font-semibold text-white">Da escolha à entrega, sem complicação.</h2><ol className="mt-9 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">{["Explore as fragrâncias", "Abra os detalhes", "Clique em “Quero este”", "Combine pagamento e entrega"].map((step, index) => <li key={step} className="border border-gold/20 p-5"><span className="text-xs font-semibold text-gold">0{index + 1}</span><p className="mt-3 text-sm text-stone-300">{step}</p></li>)}</ol><a href={catalogWhatsApp} target="_blank" rel="noreferrer" className="mt-9 inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-xs font-semibold uppercase tracking-[.16em] text-black hover:bg-gold-light">Falar no WhatsApp</a></div></section>
      {selected ? <PerfumeModal perfume={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}
