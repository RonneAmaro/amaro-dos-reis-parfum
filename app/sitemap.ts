import type { MetadataRoute } from "next";
import { perfumes } from "@/lib/perfumes";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

const staticRoutes = [
  "",
  "/catalogo",
  "/colecoes",
  "/apresentacao",
  "/sobre",
  "/contato",
  "/disponibilidade",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const perfumeRoutes = perfumes.map((perfume) => `/perfumes/${perfume.slug}`);

  return [...staticRoutes, ...perfumeRoutes].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/perfumes/") ? 0.7 : 0.8,
  }));
}
