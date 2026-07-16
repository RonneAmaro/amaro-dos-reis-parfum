import type { Metadata } from "next";
import Link from "next/link";
import { CatalogClient } from "@/app/catalogo/CatalogClient";

export const metadata: Metadata = {
  title: "Catálogo | AMAROdosREIS Parfum",
  description:
    "Conheça fragrâncias autorais inspiradas em grandes referências internacionais e orientais.",
};

export default function CatalogoPage() {
  return (
    <>
      <div className="border-b border-gold/15 bg-[#0a0805] px-6 py-4 text-center">
        <Link
          href="/catalogo-olfativo"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-gold/45 bg-gold/10 px-6 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:bg-gold hover:text-black"
        >
          Ver Catálogo Olfativo Premium
        </Link>
      </div>
      <CatalogClient />
    </>
  );
}
