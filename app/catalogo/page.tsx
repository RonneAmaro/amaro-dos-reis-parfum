import { CatalogClient } from "@/app/catalogo/CatalogClient";
import { getPublicPerfumes } from "@/lib/public-perfumes";

export default async function CatalogoPage() {
  const perfumes = await getPublicPerfumes();

  return <CatalogClient perfumes={perfumes} />;
}
