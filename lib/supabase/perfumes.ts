import {
  perfumeCommerce,
  perfumeSlug,
  type AvailabilityStatus,
  type Perfume,
  type PerfumeAudience,
  type PerfumeLine,
} from "@/lib/perfumes";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { PerfumeRow } from "@/lib/supabase/types";

export type PublicPerfumeSource = "supabase" | "local";

export type PublicPerfume = Perfume & {
  category: "masculino" | "feminino" | "unissex";
  bottleType: "tradicional" | "arabe";
  defaultUnitCost?: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  shortDescription: string;
  longDescription: string;
  galleryImageUrls: string[];
  dataSource?: PublicPerfumeSource;
};

type SupabasePerfumeResult = {
  data: PerfumeRow[];
  error: string | null;
};

type PublicPerfumesResult = {
  data: PublicPerfume[];
  source: PublicPerfumeSource;
  error?: string;
};

function categoryToAudience(category: string | null): PerfumeAudience {
  if (category === "masculino") {
    return "Masculino";
  }

  if (category === "feminino") {
    return "Feminino";
  }

  return "Unissex";
}

function normalizeCategory(
  category: string | null
): PublicPerfume["category"] {
  if (category === "masculino" || category === "feminino") {
    return category;
  }

  return "unissex";
}

function bottleTypeToLine(bottleType: string | null): PerfumeLine {
  return bottleType === "arabe" ? "arabic_premium" : "traditional";
}

function lineToBottleType(line: PerfumeLine): PublicPerfume["bottleType"] {
  return line === "arabic_premium" ? "arabe" : "tradicional";
}

function parseNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function localPerfumes(source: PublicPerfumeSource = "local"): PublicPerfume[] {
  return perfumeCommerce.map((perfume) => {
    const slug = perfumeSlug(perfume);
    const category = normalizeCategory(perfume.audience.toLowerCase());

    return {
      ...perfume,
      slug,
      category,
      bottleType: lineToBottleType(perfume.line),
      defaultUnitCost:
        perfume.line === "arabic_premium" ? 41.4 : 24.75,
      price: perfume.priceCents / 100,
      olfactiveFamily: perfume.family,
      topNotes: [],
      heartNotes: [],
      baseNotes: [],
      shortDescription: perfume.description,
      longDescription: perfume.description,
      galleryImageUrls: perfume.galleryImageUrls ?? [],
      dataSource: source,
    };
  });
}

function fallbackForRow(row: PerfumeRow): PublicPerfume {
  const category = normalizeCategory(row.category);
  const line = bottleTypeToLine(row.bottle_type);
  const price = parseNumber(row.default_sale_price) ?? (line === "arabic_premium" ? 120 : 80);
  const description = "Fragrância autoral da Amaro dos Reis Parfum.";

  return {
    slug: row.slug,
    name: row.name,
    inspiration: row.inspiration || "Criação autoral",
    collection: row.collection || "Coleção Amaro dos Reis",
    family: "Família olfativa autoral",
    line,
    priceCents: Math.round(price * 100),
    sizeMl: 50,
    description,
    audience: categoryToAudience(category),
    whatsappMessage: `Olá! Tenho interesse no perfume ${row.name} da Amaro dos Reis Parfum. Pode me passar mais informações?`,
    indicatedFor: ["Dia a dia", "presença elegante"],
    tags: [],
    availabilityStatus: "available" as AvailabilityStatus,
    price,
    olfactiveFamily: "Família olfativa autoral",
    category,
    bottleType: row.bottle_type === "arabe" ? "arabe" : "tradicional",
    defaultUnitCost: parseNumber(row.default_unit_cost),
    topNotes: [],
    heartNotes: [],
    baseNotes: [],
    shortDescription: description,
    longDescription: description,
    galleryImageUrls: [],
    dataSource: "supabase",
  };
}

function mergeSupabaseWithLocal(row: PerfumeRow): PublicPerfume {
  const local = localPerfumes("supabase").find(
    (perfume) => perfume.slug === row.slug
  );
  const base = local ?? fallbackForRow(row);
  const category = normalizeCategory(row.category ?? base.category);
  const bottleType =
    row.bottle_type === "arabe" || row.bottle_type === "tradicional"
      ? row.bottle_type
      : base.bottleType;
  const line = bottleTypeToLine(bottleType);
  const price =
    parseNumber(row.default_sale_price) ??
    base.price ??
    (line === "arabic_premium" ? 120 : 80);

  return {
    ...base,
    slug: row.slug || base.slug,
    name: row.name || base.name,
    inspiration: row.inspiration || base.inspiration,
    collection: row.collection || base.collection,
    category,
    audience: categoryToAudience(category),
    bottleType,
    line,
    price,
    priceCents: Math.round(price * 100),
    defaultUnitCost:
      parseNumber(row.default_unit_cost) ?? base.defaultUnitCost,
    dataSource: "supabase",
  };
}

export async function getSupabasePerfumes(): Promise<SupabasePerfumeResult> {
  const client = createBrowserSupabaseClient();

  if (!client) {
    return {
      data: [],
      error: "Supabase não configurado",
    };
  }

  const { data, error } = await client
    .from("perfumes")
    .select(
      "id, slug, name, inspiration, collection, category, bottle_type, default_sale_price, default_unit_cost, created_at, updated_at"
    )
    .order("collection", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return {
      data: [],
      error: error.message,
    };
  }

  return {
    data: (data ?? []) as PerfumeRow[],
    error: null,
  };
}

export async function getPublicPerfumes(): Promise<PublicPerfumesResult> {
  const fallback = localPerfumes("local");

  try {
    const supabaseResult = await getSupabasePerfumes();

    if (supabaseResult.error) {
      return {
        data: fallback,
        source: "local",
        error: supabaseResult.error,
      };
    }

    if (supabaseResult.data.length === 0) {
      return {
        data: fallback,
        source: "local",
      };
    }

    return {
      data: supabaseResult.data.map(mergeSupabaseWithLocal),
      source: "supabase",
    };
  } catch (error) {
    return {
      data: fallback,
      source: "local",
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o Supabase",
    };
  }
}
