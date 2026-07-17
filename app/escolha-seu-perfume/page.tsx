import type { Metadata } from "next";
import { PerfumeGuideClient } from "./PerfumeGuideClient";

const title = "Guia Escolha seu Perfume | AMARO DOS REIS PARFUM";
const description = "Responda perguntas rápidas e descubra fragrâncias da AMARO DOS REIS PARFUM que combinam com seu estilo.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/escolha-seu-perfume" },
  openGraph: {
    title, description, url: "/escolha-seu-perfume", type: "website",
    images: [{ url: "/logo-amaro-parfum.png", alt: "AMARO DOS REIS PARFUM" }],
  },
};

export default function EscolhaSeuPerfumePage() {
  return <PerfumeGuideClient />;
}
