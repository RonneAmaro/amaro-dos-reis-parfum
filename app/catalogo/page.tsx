"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { perfumes, type Perfume } from "@/lib/perfumes";

const collections = [
  "Todas",
  "Executive Collection",
  "Oriental Collection",
  "Feminine Collection",
] as const;

function bottleLabel(bottleType: Perfume["bottleType"]) {
  return bottleType === "tradicional"
    ? "Tradicional 50ml"
    : "Árabe Premium 50ml";
}

export default function CatalogoPage() {
  const [selectedCollection, setSelectedCollection] =
    useState<(typeof collections)[number]>("Todas");

  const filteredPerfumes = useMemo(() => {
    if (selectedCollection === "Todas") {
      return perfumes;
    }

    return perfumes.filter((perfume) => perfume.collection === selectedCollection);
  }, [selectedCollection]);

  return (
    <main className="bg-[#050505] text-stone-100">
      <section className="relative overflow-hidden border-b border-[#d8b76a]/20 bg-[radial-gradient(circle_at_top,rgba(216,183,106,0.2),transparent_32%),linear-gradient(135deg,#050505_0%,#11100d_54%,#050505_100%)] px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.36em] text-[#d8b76a]">
              Catálogo
            </p>
            <h1 className="mt-5 text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
              Catálogo Amaro dos Reis Parfum
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-300 sm:text-lg">
              Cada perfume tem nome autoral e referência olfativa própria, com
              composição pensada para entregar presença, elegância e memorabilidade.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {collections.map((collection) => {
              const active = selectedCollection === collection;

              return (
                <button
                  key={collection}
                  type="button"
                  onClick={() => setSelectedCollection(collection)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                    active
                      ? "border-[#d8b76a] bg-[#d8b76a] text-black"
                      : "border-[#d8b76a]/35 bg-white/[0.03] text-stone-100 hover:border-[#f2d78b]"
                  }`}
                >
                  {collection}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-14 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPerfumes.map((perfume) => (
              <article
                key={perfume.slug}
                className="flex min-h-[460px] flex-col rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-white/[0.065] to-white/[0.02] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.26em] text-stone-500">
                      {perfume.collection}
                    </p>
                    <h2 className="mt-4 text-2xl font-semibold uppercase tracking-[0.08em] text-[#f2d78b]">
                      {perfume.name}
                    </h2>
                    <p className="mt-2 text-sm uppercase tracking-[0.24em] text-stone-300">
                      {perfume.inspiration}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-full border border-[#d8b76a]/35 px-3 py-2 text-sm font-semibold text-[#f2d78b]">
                    R$ {perfume.price.toFixed(2).replace(".", ",")}
                  </div>
                </div>

                <p className="mt-5 text-sm leading-7 text-stone-300">
                  {perfume.shortDescription}
                </p>

                <div className="mt-6 grid gap-3 text-sm text-stone-200 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">
                      Tipo
                    </p>
                    <p className="mt-2">{bottleLabel(perfume.bottleType)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">
                      Família
                    </p>
                    <p className="mt-2">{perfume.olfactiveFamily}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">
                      Topo
                    </p>
                    <p className="mt-2 leading-7 text-stone-200">
                      {perfume.topNotes.join(", ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">
                      Coração
                    </p>
                    <p className="mt-2 leading-7 text-stone-200">
                      {perfume.heartNotes.join(", ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">
                      Fundo
                    </p>
                    <p className="mt-2 leading-7 text-stone-200">
                      {perfume.baseNotes.join(", ")}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`/perfumes/${perfume.slug}`}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#d8b76a]/40 px-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#f2d78b] transition hover:border-[#f2d78b] hover:bg-[#d8b76a]/10"
                  >
                    Ver detalhes
                  </Link>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Olá, quero pedir o perfume ${perfume.name} da Amaro dos Reis Parfum.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#d8b76a] px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#f2d78b]"
                  >
                    Pedir no WhatsApp
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
