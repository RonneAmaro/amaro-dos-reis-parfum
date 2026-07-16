"use client";

import { useState } from "react";

const catalogPages = Array.from(
  { length: 7 },
  (_, index) => `/catalogo/image-gen-${index + 1}.png`
);

const pdfUrl = "/catalogo/catalogo-amaro.pdf";

type CatalogoViewerProps = {
  whatsappUrl: string;
};

export function CatalogoViewer({ whatsappUrl }: CatalogoViewerProps) {
  const [activePage, setActivePage] = useState(0);
  const [failedPages, setFailedPages] = useState<Set<number>>(() => new Set());

  const markAsUnavailable = (page: number) => {
    setFailedPages((current) => {
      const next = new Set(current);
      next.add(page);
      return next;
    });
  };

  return (
    <section
      aria-labelledby="catalogo-online-title"
      className="relative overflow-hidden border-b border-gold/20 bg-[#090806] px-4 py-16 sm:px-10 lg:px-12 lg:py-20"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/[.08] blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[.32em] text-gold">
            Experiência digital
          </p>
          <h2
            id="catalogo-online-title"
            className="mt-4 text-3xl font-semibold text-white sm:text-4xl"
          >
            Folheie o catálogo online
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-400 sm:text-base">
            Veja todas as páginas do catálogo diretamente aqui, sem precisar fazer
            download.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-5xl border border-gold/25 bg-black/60 p-3 shadow-[0_30px_90px_rgba(0,0,0,.55)] sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-gold/15 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-gold-light">
              Página {activePage + 1} de {catalogPages.length}
            </p>
            <span className="hidden text-xs text-stone-500 sm:inline">
              Selecione uma miniatura para navegar
            </span>
          </div>

          <div className="flex min-h-[360px] items-center justify-center bg-[radial-gradient(circle,rgba(216,183,106,.1),rgba(0,0,0,.85)_68%)] sm:min-h-[560px]">
            {failedPages.has(activePage) ? (
              <div
                role="status"
                className="flex min-h-[360px] w-full items-center justify-center border border-dashed border-gold/25 px-6 text-center text-sm text-stone-400 sm:min-h-[560px]"
              >
                Página do catálogo indisponível no momento.
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={catalogPages[activePage]}
                src={catalogPages[activePage]}
                alt={`Página ${activePage + 1} do catálogo AMARO DOS REIS PARFUM`}
                onError={() => markAsUnavailable(activePage)}
                className="max-h-[78vh] min-h-0 w-full object-contain"
              />
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center">
            <button
              type="button"
              onClick={() => setActivePage((page) => Math.max(0, page - 1))}
              disabled={activePage === 0}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/45 px-5 text-xs font-semibold uppercase tracking-[.12em] text-gold-light transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Página anterior
            </button>
            <button
              type="button"
              onClick={() =>
                setActivePage((page) => Math.min(catalogPages.length - 1, page + 1))
              }
              disabled={activePage === catalogPages.length - 1}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-5 text-xs font-semibold uppercase tracking-[.12em] text-black transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-35"
            >
              Próxima página
            </button>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/45 px-5 text-center text-xs font-semibold uppercase tracking-[.12em] text-gold-light transition hover:bg-gold/10"
            >
              Abrir PDF em nova aba
            </a>
            <a
              href={pdfUrl}
              download="catalogo-amaro.pdf"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/45 px-5 text-xs font-semibold uppercase tracking-[.12em] text-gold-light transition hover:bg-gold/10"
            >
              Baixar PDF
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="col-span-2 inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-500/50 px-5 text-xs font-semibold uppercase tracking-[.12em] text-emerald-300 transition hover:bg-emerald-500/10 sm:col-span-1"
            >
              Chamar no WhatsApp
            </a>
          </div>

          <div
            aria-label="Páginas do catálogo"
            className="-mx-3 mt-7 flex snap-x gap-3 overflow-x-auto px-3 pb-3 sm:mx-0 sm:grid sm:grid-cols-7 sm:px-0"
          >
            {catalogPages.map((page, index) => {
              const isActive = index === activePage;
              const hasFailed = failedPages.has(index);

              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => setActivePage(index)}
                  aria-label={`Exibir página ${index + 1}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative aspect-[3/4] w-24 shrink-0 snap-start overflow-hidden border-2 bg-black transition sm:w-full ${
                    isActive
                      ? "border-gold shadow-[0_0_22px_rgba(216,183,106,.3)]"
                      : "border-white/10 opacity-65 hover:border-gold/50 hover:opacity-100"
                  }`}
                >
                  {hasFailed ? (
                    <span className="flex h-full items-center justify-center px-2 text-[10px] leading-4 text-stone-500">
                      Indisponível
                    </span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={page}
                      alt=""
                      onError={() => markAsUnavailable(index)}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <span className="absolute bottom-0 left-0 bg-black/85 px-2 py-1 text-[10px] font-semibold text-gold-light">
                    {index + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
