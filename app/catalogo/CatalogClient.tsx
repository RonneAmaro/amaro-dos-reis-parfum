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
            Catalogo atualizado conforme disponibilidade. Consulte antes de
            finalizar o pedido.
          </div>

          <div className="mb-8 grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                Buscar perfume
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nome, tag, familia ou inspiracao"
                className="mt-3 min-h-12 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition placeholder:text-stone-600 focus:border-gold"
              />
            </label>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                Filtros
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {filters.map((filter) => {
                  const isActive = activeFilter === filter;

                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`min-h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                        isActive
                          ? "border-gold bg-gold text-black"
                          : "border-gold/30 bg-gold/10 text-gold-light hover:border-gold-light"
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mb-6 flex flex-col justify-between gap-3 text-sm text-stone-400 sm:flex-row sm:items-center">
            <p>
              {filteredPerfumes.length} fragrancia
              {filteredPerfumes.length === 1 ? "" : "s"} encontrada
              {filteredPerfumes.length === 1 ? "" : "s"}.
            </p>
            <Link
              href="/disponibilidade"
              className="w-fit text-xs font-semibold uppercase tracking-[0.2em] text-gold-light transition hover:text-gold"
            >
              Ver disponibilidade
            </Link>
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredPerfumes.map((perfume) => (
                <article
                  key={perfume.slug}
                  className="premium-surface flex min-h-[470px] flex-col p-6 transition hover:-translate-y-1 hover:border-gold/55"
                >
                  <div className="mb-6 overflow-hidden rounded border border-gold/20 bg-[#070604]">
                    {perfumeDisplayImage(perfume) ? (
                      <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(circle_at_center,rgba(216,183,106,0.14),transparent_58%)] p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={perfumeDisplayImage(perfume)}
                          alt={perfume.name}
                          className="max-h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[4/3] flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(216,183,106,0.16),transparent_58%)] px-6 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
                          Amaro dos Reis Parfum
                        </p>
                        <p className="mt-3 text-sm uppercase tracking-[0.24em] text-stone-500">
                          Imagem em breve
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-gold/80">
                        {perfume.collection}
                      </p>
                      <h2 className="mt-4 text-2xl font-semibold uppercase tracking-[0.08em] text-white">
                        {perfume.name}
                      </h2>
                    </div>
                    <p className="shrink-0 border border-gold/30 bg-gold/10 px-3 py-2 text-sm font-semibold text-gold-light">
                      {formatPrice(perfume.price)}
                    </p>
                  </div>

                  <div className="mt-6 border-y border-white/10 py-4">
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
                    {perfume.tags.map((tag) => (
                      <span
                        key={tag}
                        className="border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-stone-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="mt-6 flex-1 leading-7 text-stone-400">
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
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
