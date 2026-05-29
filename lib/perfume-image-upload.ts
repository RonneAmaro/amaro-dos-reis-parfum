import { supabase } from "@/lib/supabase-browser";

const PERFUME_IMAGES_BUCKET = "amaro-perfumes";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type PerfumeImageKind = "main" | "concept" | "gallery";

export function sanitizeFileName(fileName: string): string {
  const sanitized = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

  return sanitized || "imagem-perfume";
}

export async function uploadPerfumeImage({
  file,
  userId,
  kind,
}: {
  file: File;
  userId: string;
  kind: PerfumeImageKind;
}): Promise<{ publicUrl: string; path: string }> {
  if (!supabase) {
    throw new Error("Sistema online nao configurado para enviar imagens.");
  }

  if (!userId) {
    throw new Error("Entre novamente no painel antes de enviar imagens.");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Use apenas imagens PNG, JPG/JPEG ou WebP.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("A imagem deve ter no maximo 5MB.");
  }

  const safeName = sanitizeFileName(file.name);
  const path = `${userId}/perfumes/${kind}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage
    .from(PERFUME_IMAGES_BUCKET)
    .upload(path, file, {
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(
      "Nao foi possivel enviar a imagem. Confira o bucket amaro-perfumes e tente novamente."
    );
  }

  const { data } = supabase.storage
    .from(PERFUME_IMAGES_BUCKET)
    .getPublicUrl(path);

  return {
    publicUrl: data.publicUrl,
    path,
  };
}
