import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AMARO DOS REIS PARFUM",
    short_name: "Amaro Parfum",
    description: "Catálogo e painel administrativo da AMARO DOS REIS PARFUM",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#c89b3c",
    icons: [
      { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
