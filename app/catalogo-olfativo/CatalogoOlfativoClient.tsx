"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { availabilityLabels } from "@/lib/perfumes";
import {
  getPublicPerfumes,
  type PublicPerfume,
} from "@/lib/supabase/perfumes";
import {
  createCatalogMessage,
  createPerfumeInterestMessage,
  createWhatsAppLink,
} from "@/lib/whatsapp";
import { CatalogoViewer } from "./CatalogoViewer";

const filters = [
  ["all", "Todos"],
  ["male", "Masculinos"],
  ["female", "Femininos"],
  ["arabic", "Árabes Premium"],
  ["traditional", "Tradicionais"],
  ["available", "Disponíveis"],
  ["limited", "Poucas unidades"],
  ["on_order", "Sob encomenda"],
] as const;

const styles = [
  ["marcante", "Marcante"],
  ["doce", "Doce"],
  ["amadeirado", "Amadeirado"],
  ["elegante sofisticado", "Elegante"],
  ["fresco citrico aquatico", "Fresco"],
  ["presente", "Presenteável"],
  ["dia rotina trabalho", "Dia a dia"],
  ["noite eventos ocasioes", "Noite / ocasião especial"],
] as const;

const collections = [
  [
    "Executive Collection",
    "Fragrâncias masculinas sofisticadas, marcantes e versáteis.",
  ],
  [
    "Feminine Collection",
    "Perfumes femininos envolventes, elegantes e memoráveis.",
  ],
  [
    "Oriental Collection",
    "Fragrâncias árabes premium com intensidade, presença e personalidade.",
  ],
] as const;

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesFilter(perfume: PublicPerfume, filter: string) {
  if (filter === "all") return true;
  if (filter === "male") return perfume.audience === "Masculino";
  if (filter === "female") return perfume.audience === "Feminino";
  if (filter === "arabic") return perfume.line === "arabic_premium";
  if (filter === "traditional") return perfume.line === "traditional";
  return perfume.availabilityStatus === filter;
}

function searchableText(perfume: PublicPerfume) {
  return normalize(
    [
      perfume.name,
      perfume.inspiration,
      perfume.collection,
      perfume.family,
      perfume.description,
      perfume.audience,
      ...perfume.tags,
      ...perfume.indicatedFor,
    ].join(" ")
  );
}

function PerfumeCard({ perfume }: { perfume: PublicPerfume }) {
  const image = perfume.imageUrl || perfume.conceptImageUrl;
  const price = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(perfume.price);

  return (
    <article className="group flex flex-col overflow-hidden border border-gold/20 bg-[linear-gradient(180deg,rgba(216,183,106,.1),rgba(5,5,5,.98)_42%)] shadow-[0_24px_70px_rgba(0,0,0,.35)] transition hover:-translate-y-1 hover:border-gold/55">
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden border-b border-gold/15 bg-[radial-gradient(circle,rgba(216,183,106,.18),#050505_65%)] p-6">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={perfume.name}
            className="h-full w-full object-contain transition group-hover:scale-105"
          />
        ) : (
          <div className="text-center">
            <div className="mx-auto h-24 w-16 border border-gold/45 bg-black/50" />
            <p className="mt-4 text-[10px] uppercase tracking-[.3em] text-gold">
              Imagem em breve
            </p>
          </div>
        )}
        <span className="absolute left-4 top-4 border border-gold/35 bg-black/75 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.16em] text-gold-light">
          {perfume.line === "arabic_premium" ? "Árabe Premium" : "Tradicional"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[.22em] text-gold/80">
              {perfume.collection}
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[.06em] text-white">
              {perfume.name}
            </h3>
          </div>
          <p className="shrink-0 text-xl font-semibold text-gold-light">{price}</p>
        </div>
        <p className="mt-3 text-xs text-stone-500">
          Inspirado em {perfume.inspiration}
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[.14em]">
          <span className="border border-white/10 px-3 py-2 text-stone-300">
            {perfume.audience}
          </span>
          <span className="border border-gold/25 px-3 py-2 text-gold-light">
            {availabilityLabels[perfume.availabilityStatus]}
          </span>
        </div>
        <p className="mt-5 text-sm font-medium text-stone-200">{perfume.family}</p>
        <p className="mt-3 flex-1 text-sm leading-7 text-stone-400">
          {perfume.description}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a
            href={createWhatsAppLink(createPerfumeInterestMessage(perfume.name))}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-5 text-xs font-semibold uppercase tracking-[.14em] text-black hover:bg-gold-light"
          >
            Quero este
          </a>
          <Link
            href={`/perfumes/${perfume.slug}`}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/45 px-5 text-xs font-semibold uppercase tracking-[.14em] text-gold-light hover:bg-gold/10"
          >
            Ver detalhes
          </Link>
        </div>
      </div>
    </article>
  );
}

export function CatalogoOlfativoClient() {
  const [perfumes, setPerfumes] = useState<PublicPerfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const catalogWhatsApp = createWhatsAppLink(createCatalogMessage());

  useEffect(() => {
    let active = true;
    getPublicPerfumes().then(({ data }) => {
      if (active) {
        setPerfumes(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const results = useMemo(() => {
    const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
    return perfumes.filter(
      (perfume) =>
        matchesFilter(perfume, filter) &&
        terms.every((term) => searchableText(perfume).includes(term))
    );
  }, [filter, perfumes, query]);

  function chooseStyle(value: string) {
    setFilter("all");
    setQuery(value);
    document
      .getElementById("fragrancias")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="premium-bg relative overflow-hidden border-b border-gold/15 px-6 py-20 sm:px-10 lg:px-12 lg:py-28">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[.36em] text-gold">
            Vitrine premium • 50 ml
          </p>
          <h1 className="mx-auto mt-6 max-w-5xl text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
            Catálogo Olfativo{" "}
            <span className="text-gold-light">AMARO DOS REIS PARFUM</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-stone-300 sm:text-lg">
            Fragrâncias inspiradas em grandes perfumes importados e árabes,
            selecionadas para quem busca presença, elegância e identidade.
          </p>
          <p className="mt-4 text-sm uppercase tracking-[.2em] text-gold/80">
            Escolha por estilo, ocasião ou coleção.
          </p>
          <div className="mx-auto mt-9 flex max-w-3xl flex-col justify-center gap-3 sm:flex-row">
            <a href="#fragrancias" className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-7 text-xs font-semibold uppercase tracking-[.16em] text-black hover:bg-gold-light">
              Ver fragrâncias
            </a>
            <a href="/catalogo/catalogo-amaro.pdf" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/55 px-7 text-xs font-semibold uppercase tracking-[.16em] text-gold-light hover:bg-gold/10">
              Baixar catálogo em PDF
            </a>
            <a href={catalogWhatsApp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/55 px-7 text-xs font-semibold uppercase tracking-[.16em] text-gold-light hover:bg-gold/10">
              Chamar no WhatsApp
            </a>
          </div>
          <p className="mt-4 text-xs text-stone-500">
            Caso o PDF ainda não esteja disponível, consulte o catálogo online abaixo.
          </p>
        </div>
      </section>

      <CatalogoViewer whatsappUrl={catalogWhatsApp} />

      <section className="border-b border-white/10 px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[.3em] text-gold">Escolha pelo seu estilo</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Qual presença combina com você?</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {styles.map(([value, label]) => (
              <button key={label} onClick={() => chooseStyle(value)} className="min-h-20 border border-gold/20 bg-gold/[.07] p-4 text-sm font-semibold text-gold-light transition hover:border-gold/60 hover:bg-gold/15">
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-3">
            {collections.map(([name, text]) => (
              <article key={name} className="premium-surface p-6">
                <p className="text-xs uppercase tracking-[.22em] text-gold">Coleção</p>
                <h2 className="mt-3 text-xl font-semibold text-white">{name}</h2>
                <p className="mt-4 text-sm leading-7 text-stone-400">{text}</p>
              </article>
            ))}
          </div>

          <div id="fragrancias" className="scroll-mt-48 pt-20">
            <p className="text-xs font-semibold uppercase tracking-[.3em] text-gold">Ver catálogo online</p>
            <div className="mt-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <h2 className="text-3xl font-semibold text-white">Encontre sua fragrância</h2>
              <p className="text-sm text-stone-400">
                {loading ? "Carregando catálogo..." : `${results.length} fragrância${results.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <label className="mt-8 block">
              <span className="sr-only">Buscar fragrância</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque por nome, referência, coleção, notas ou descrição" className="min-h-14 w-full border border-gold/25 bg-black/50 px-5 text-sm text-white outline-none placeholder:text-stone-600 focus:border-gold" />
            </label>
            <div className="-mx-6 mt-4 flex gap-2 overflow-x-auto px-6 pb-3 [scrollbar-width:none] sm:mx-0 sm:px-0">
              {filters.map(([value, label]) => (
                <button key={value} onClick={() => setFilter(value)} className={`min-h-11 shrink-0 rounded-full border px-4 text-xs font-semibold uppercase tracking-[.12em] ${filter === value ? "border-gold bg-gold text-black" : "border-gold/25 bg-gold/[.06] text-gold-light"}`}>
                  {label}
                </button>
              ))}
            </div>
            {!loading && results.length === 0 ? (
              <div className="mt-8 border border-gold/20 p-10 text-center text-stone-400">Nenhuma fragrância encontrada. Limpe a busca ou escolha outro filtro.</div>
            ) : (
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {results.map((perfume) => <PerfumeCard key={perfume.slug} perfume={perfume} />)}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#090806] px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2">
          <article className="premium-surface p-7">
            <p className="text-xs uppercase tracking-[.25em] text-gold">Linha Tradicional</p><p className="mt-4 text-4xl font-semibold text-gold-light">R$ 80</p><p className="mt-2 text-sm text-stone-300">50 ml</p><p className="mt-5 leading-7 text-stone-400">Fragrâncias inspiradas em grandes clássicos importados.</p>
          </article>
          <article className="premium-surface p-7">
            <p className="text-xs uppercase tracking-[.25em] text-gold">Linha Árabe Premium</p><p className="mt-4 text-4xl font-semibold text-gold-light">R$ 120</p><p className="mt-2 text-sm text-stone-300">50 ml</p><p className="mt-5 leading-7 text-stone-400">Fragrâncias intensas, sofisticadas e de alta presença.</p>
          </article>
        </div>
      </section>

      <section className="px-6 py-20 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[.3em] text-gold">Como comprar</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Da escolha à entrega, sem complicação.</h2>
          <ol className="mt-9 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
            {["Escolha sua fragrância", "Clique em “Quero este”", "Fale comigo no WhatsApp", "Combine pagamento e entrega"].map((step, index) => (
              <li key={step} className="border border-gold/20 p-5"><span className="text-xs font-semibold text-gold">0{index + 1}</span><p className="mt-3 text-sm text-stone-300">{step}</p></li>
            ))}
          </ol>
          <a href={catalogWhatsApp} target="_blank" rel="noreferrer" className="mt-9 inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-xs font-semibold uppercase tracking-[.16em] text-black hover:bg-gold-light">Falar no WhatsApp</a>
        </div>
      </section>
    </main>
  );
}
