"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  availabilityLabels,
  lineLabels,
} from "@/lib/perfumes";
import { type PublicPerfume } from "@/lib/public-perfumes";
import { createWhatsAppLink } from "@/lib/whatsapp";

const filters = [
  "Todas",
  "Executive Collection",
  "Oriental Collection",
  "Feminine Collection",
  "Masculino",
  "Feminino",
  "Tradicional R$ 80",
  "Arabe Premium R$ 120",
];

const momentCards = [
  {
    code: "01",
    title: "Trabalho e presenca executiva",
    query: "trabalho executivo",
  },
  {
    code: "02",
    title: "Noite e encontros",
    query: "noite encontros",
  },
  {
    code: "03",
    title: "Dias quentes e rotina",
    query: "fresco dia rotina",
  },
  {
    code: "04",
    title: "Presentear alguem",
    query: "presente",
  },
  {
    code: "05",
    title: "Marcante e intenso",
    query: "marcante intenso",
  },
  {
    code: "06",
    title: "Doce e envolvente",
    query: "doce envolvente",
  },
  {
    code: "07",
    title: "Arabe premium",
    query: "arabe premium",
  },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function matchesFilter(perfume: PublicPerfume, filter: string) {
  if (filter === "Todas") {
    return true;
  }

  if (filter === "Masculino" || filter === "Feminino") {
    return perfume.audience === filter;
  }

  if (filter === "Tradicional R$ 80") {
    return perfume.line === "traditional";
  }

  if (filter === "Arabe Premium R$ 120") {
    return perfume.line === "arabic_premium";
  }

  return perfume.collection === filter;
}

function perfumeDisplayImage(perfume: PublicPerfume) {
  return perfume.imageUrl || perfume.conceptImageUrl;
}

function PerfumePlaceholder({ className = "aspect-[4/3]" }: { className?: string }) {
  return (
    <div
      className={`flex ${className} flex-col items-center justify-center border border-gold/20 bg-[radial-gradient(circle_at_center,rgba(216,183,106,0.16),rgba(5,5,5,0.95)_58%)] px-6 text-center`}
    >
      <div className="relative mb-5 h-20 w-14 border border-gold/45 bg-black/45 shadow-[0_0_28px_rgba(216,183,106,0.14)]">
        <div className="absolute left-1/2 top-0 h-5 w-7 -translate-x-1/2 -translate-y-5 border border-gold/35 bg-[#11100d]" />
        <div className="absolute inset-x-3 top-7 border-t border-gold/45" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
        AMAROdosREIS Parfum
      </p>
      <p className="mt-3 text-sm uppercase tracking-[0.24em] text-stone-500">
        Imagem em breve
      </p>
    </div>
  );
}

export function CatalogClient({ perfumes }: { perfumes: PublicPerfume[] }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todas");

  const filteredPerfumes = useMemo(() => {
    const normalizedQuery = normalize(query.trim());

    return perfumes.filter((perfume) => {
      const searchText = normalize(
        [
          perfume.name,
          perfume.inspiration,
          perfume.collection,
          perfume.family,
          perfume.audience,
          lineLabels[perfume.line],
          ...perfume.tags,
        ].join(" ")
      );

      return (
        matchesFilter(perfume, activeFilter) &&
        (!normalizedQuery || searchText.includes(normalizedQuery))
      );
    });
  }, [activeFilter, perfumes, query]);

  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="premium-bg relative overflow-hidden border-b border-gold/15 px-6 py-16 sm:px-10 lg:px-12">
        <div className="absolute left-[12%] top-10 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.36em] text-gold">
              Catalogo
            </p>
            <h1 className="mt-5 text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
              Fragrancias autorais para presenca memoravel.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-300 sm:text-lg">
              Escolha pelo estilo, pela familia olfativa ou pela referencia
              aromatica.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 premium-surface px-5 py-4 text-sm leading-7 text-stone-300">
            Catalogo atualizado conforme disponibilidade e producao em pequenos
            lotes. Consulte antes de finalizar o pedido para escolher com mais
            seguranca.
          </div>

          <div className="mb-8 grid gap-4 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div className="premium-surface p-5">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                  Buscar por nome ou estilo
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nome, familia, momento ou inspiracao"
                  className="mt-3 min-h-12 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition placeholder:text-stone-600 focus:border-gold"
                />
              </label>
              <p className="mt-4 text-sm leading-7 text-stone-400">
                Use termos como noite, trabalho, doce, fresco, arabe ou
                presente para encontrar sua assinatura elegante.
              </p>
            </div>

            <div className="premium-surface p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                  Filtros do catalogo
                </p>
                <p className="text-sm text-stone-400">
                  {filteredPerfumes.length} fragrancia
                  {filteredPerfumes.length === 1 ? "" : "s"} encontrada
                  {filteredPerfumes.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {filters.map((filter) => {
                  const isActive = activeFilter === filter;

                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`min-h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                        isActive
                          ? "border-gold bg-gold text-black shadow-[0_0_22px_rgba(216,183,106,0.20)]"
                          : "border-gold/30 bg-gold/10 text-gold-light hover:border-gold-light hover:bg-gold/15"
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mb-10">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                  Escolha pelo seu momento
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  Encontre uma fragrancia pela ocasiao de uso.
                </h2>
              </div>
              <Link
                href="/disponibilidade"
                className="w-fit text-xs font-semibold uppercase tracking-[0.2em] text-gold-light transition hover:text-gold"
              >
                Ver disponibilidade
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {momentCards.map((card) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => {
                    setQuery(card.query);
                    setActiveFilter("Todas");
                  }}
                  className="min-h-24 border border-gold/20 bg-[linear-gradient(145deg,rgba(216,183,106,0.12),rgba(255,255,255,0.03)_46%,rgba(0,0,0,0.35))] p-4 text-left transition hover:-translate-y-0.5 hover:border-gold/50 hover:bg-gold/10"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                    {card.code}
                  </span>
                  <span className="mt-3 block text-sm font-semibold leading-5 text-stone-100">
                    {card.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {filteredPerfumes.length === 0 ? (
            <div className="premium-surface p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
                Nenhum resultado
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-white">
                Tente outra busca ou remova filtros.
              </h2>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredPerfumes.map((perfume) => (
                <article
                  key={perfume.slug}
                  className="group flex min-h-[560px] flex-col overflow-hidden border border-gold/20 bg-[linear-gradient(180deg,rgba(216,183,106,0.10),rgba(8,7,5,0.96)_34%,rgba(3,3,3,1))] shadow-[0_24px_70px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:border-gold/55 hover:shadow-[0_28px_90px_rgba(216,183,106,0.10)]"
                >
                  <div className="relative border-b border-gold/15 bg-[#070604]">
                    {perfumeDisplayImage(perfume) ? (
                      <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(circle_at_center,rgba(216,183,106,0.18),rgba(5,5,5,0.92)_62%)] p-5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={perfumeDisplayImage(perfume)}
                          alt={perfume.name}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                          className="max-h-full w-full object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)] transition duration-300 group-hover:scale-[1.02]"
                        />
                      </div>
                    ) : (
                      <PerfumePlaceholder />
                    )}
                    <div className="absolute left-4 top-4 border border-gold/35 bg-black/65 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light backdrop-blur">
                      {lineLabels[perfume.line]}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-gold/80">
                        {perfume.collection}
                      </p>
                      <h2 className="mt-3 text-3xl font-semibold uppercase tracking-[0.08em] text-white">
                        {perfume.name}
                      </h2>
                    </div>
                    <p className="shrink-0 border border-gold/35 bg-gold/15 px-3 py-2 text-base font-semibold text-gold-light">
                      {formatPrice(perfume.price)}
                    </p>
                  </div>

                  <div className="mt-5 border-y border-white/10 py-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">
                      Inspiracao discreta
                    </p>
                    <p className="mt-2 text-sm font-medium text-stone-200">
                      {perfume.inspiration}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-stone-300 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                        Familia
                      </p>
                      <p className="mt-2">{perfume.family}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                        Disponibilidade
                      </p>
                      <p className="mt-2 text-gold-light">
                        {availabilityLabels[perfume.availabilityStatus]}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {perfume.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="border border-gold/15 bg-white/[0.04] px-3 py-1 text-xs text-stone-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p
                    className="mt-5 flex-1 leading-7 text-stone-400"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {perfume.description}
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={`/perfumes/${perfume.slug}`}
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-gold px-5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-gold-light"
                    >
                      Ver detalhes
                    </Link>
                    <a
                      href={createWhatsAppLink(perfume.whatsappMessage)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-gold/45 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
                    >
                      Pedir no WhatsApp
                    </a>
                  </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
