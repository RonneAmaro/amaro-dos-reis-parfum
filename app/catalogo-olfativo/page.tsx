import type { Metadata } from "next";
import { CatalogoOlfativoClient } from "./CatalogoOlfativoClient";

const title = "Catálogo Olfativo | AMARO DOS REIS PARFUM";
const description =
  "Conheça fragrâncias inspiradas em perfumes importados e árabes premium. Linha Tradicional por R$80 e Árabe Premium por R$120.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/catalogo-olfativo" },
  openGraph: {
    title,
    description,
    url: "/catalogo-olfativo",
    type: "website",
    images: [{ url: "/logo-amaro-parfum.png", alt: "AMARO DOS REIS PARFUM" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/logo-amaro-parfum.png"],
  },
};

export default function CatalogoOlfativoPage() {
  return <CatalogoOlfativoClient />;
}
