import type { Metadata } from "next";
import { CatalogClient } from "@/app/catalogo/CatalogClient";
import { getPublicPerfumes } from "@/lib/public-perfumes";

export const metadata: Metadata = {
  title: "Catálogo | AMAROdosREIS Parfum",
  description:
    "Conheça fragrâncias autorais inspiradas em grandes referências internacionais e orientais.",
};

export default async function CatalogoPage() {
  const perfumes = await getPublicPerfumes();

  return <CatalogClient perfumes={perfumes} />;
}
