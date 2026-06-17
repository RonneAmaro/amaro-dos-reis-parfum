import type { Metadata } from "next";
import { CatalogClient } from "@/app/catalogo/CatalogClient";

export const metadata: Metadata = {
  title: "Catálogo | AMAROdosREIS Parfum",
  description:
    "Conheça fragrâncias autorais inspiradas em grandes referências internacionais e orientais.",
};

export default function CatalogoPage() {
  return <CatalogClient />;
}
