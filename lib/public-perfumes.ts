import {
  perfumeCommerce,
  perfumeSlug,
  type AvailabilityStatus,
  type PerfumeAudience,
  type PerfumeLine,
} from "@/lib/perfumes";
import { isSupabaseConfigured, supabase } from "@/lib/supabase-browser";

type PublicPerfumeRow = {
  slug: string;
  name: string;
  inspiration: string | null;
  category: "masculino" | "feminino" | "unissex";
  collection: string;
  bottle_type: "tradicional" | "arabe";
  price: number | string;
  olfactive_family: string | null;
  top_notes: string | null;
  heart_notes: string | null;
  base_notes: string | null;
  short_description: string | null;
  long_description: string | null;
  tags: string[] | null;
  image_url: string | null;
  availability_status: AvailabilityStatus;
  created_at: string;
  updated_at: string;
};

export type PublicPerfume = {
  slug: string;
  name: string;
  inspiration: string;
  category: "masculino" | "feminino" | "unissex";
  audience: PerfumeAudience;
  collection: string;
  bottleType: "tradicional" | "arabe";
  line: PerfumeLine;
  price: number;
  priceCents: number;
  olfactiveFamily: string;
  family: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  shortDescription: string;
  longDescription: string;
  description: string;
  tags: string[];
  imageUrl?: string;
  availabilityStatus: AvailabilityStatus;
  whatsappMessage: string;
  indicatedFor: string[];
  createdAt?: string;
  updatedAt?: string;
};

function splitTextNotes(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function categoryToAudience(
  category: PublicPerfumeRow["category"]
): PerfumeAudience {
  if (category === "masculino") {
    return "Masculino";
  }

  if (category === "feminino") {
    return "Feminino";
  }

  return "Unissex";
}

function bottleTypeToLine(bottleType: PublicPerfumeRow["bottle_type"]) {
  return bottleType === "arabe" ? "arabic_premium" : "traditional";
}

function fallbackPerfumes(): PublicPerfume[] {
  return perfumeCommerce.map((perfume) => ({
    slug: perfumeSlug(perfume),
    name: perfume.name,
    inspiration: perfume.inspiration,
    category: perfume.audience.toLowerCase() as PublicPerfume["category"],
    audience: perfume.audience,
    collection: perfume.collection,
    bottleType: perfume.line === "arabic_premium" ? "arabe" : "tradicional",
    line: perfume.line,
    price: perfume.priceCents / 100,
    priceCents: perfume.priceCents,
    olfactiveFamily: perfume.family,
    family: perfume.family,
    topNotes: [],
    heartNotes: [],
    baseNotes: [],
    shortDescription: perfume.description,
    longDescription: perfume.description,
    description: perfume.description,
    tags: perfume.tags,
    availabilityStatus: perfume.availabilityStatus,
    whatsappMessage: perfume.whatsappMessage,
    indicatedFor: perfume.indicatedFor,
  }));
}

function normalizeRow(row: PublicPerfumeRow): PublicPerfume {
  const price = Number(row.price) || 0;
  const line = bottleTypeToLine(row.bottle_type);
  const family = row.olfactive_family || "Familia olfativa autoral";
  const description =
    row.short_description ||
    row.long_description ||
    "Fragrancia autoral da Amaro dos Reis Parfum.";

  return {
    slug: row.slug,
    name: row.name,
    inspiration: row.inspiration || "Criacao autoral",
    category: row.category,
    audience: categoryToAudience(row.category),
    collection: row.collection,
    bottleType: row.bottle_type,
    line,
    price,
    priceCents: Math.round(price * 100),
    olfactiveFamily: family,
    family,
    topNotes: splitTextNotes(row.top_notes),
    heartNotes: splitTextNotes(row.heart_notes),
    baseNotes: splitTextNotes(row.base_notes),
    shortDescription: row.short_description || description,
    longDescription: row.long_description || description,
    description,
    tags: row.tags ?? [],
    imageUrl: row.image_url || undefined,
    availabilityStatus: row.availability_status,
    whatsappMessage: `Ola! Tenho interesse no perfume ${row.name} da Amaro dos Reis Parfum. Pode me passar mais informacoes?`,
    indicatedFor: row.tags?.length ? row.tags.slice(0, 3) : ["Dia a dia"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPublicPerfumes() {
  const fallback = fallbackPerfumes();

  if (!isSupabaseConfigured || !supabase) {
    return fallback;
  }

  const { data, error } = await supabase.rpc("get_amaro_public_perfumes");

  if (error || !data || data.length === 0) {
    return fallback;
  }

  return (data as PublicPerfumeRow[]).map(normalizeRow);
}

export async function getPublicPerfumeBySlug(slug: string) {
  const fallback = fallbackPerfumes().find((perfume) => perfume.slug === slug);

  if (!isSupabaseConfigured || !supabase) {
    return fallback ?? null;
  }

  const { data, error } = await supabase.rpc(
    "get_amaro_public_perfume_by_slug",
    { p_slug: slug }
  );

  const row = Array.isArray(data) ? data[0] : null;

  if (error || !row) {
    return fallback ?? null;
  }

  return normalizeRow(row as PublicPerfumeRow);
}
