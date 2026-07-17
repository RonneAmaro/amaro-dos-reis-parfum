import { perfumes, type Perfume, type PerfumeLine } from "@/lib/perfumes";

export type GuideRecipient = "self" | "gift" | "unsure";
export type GuideProfile = "male" | "female" | "unisex" | "any";
export type GuideStyle = "sweet" | "fresh" | "woody" | "striking" | "elegant" | "oriental" | "seductive" | "daily";
export type GuideOccasion = "work" | "date" | "night" | "gift" | "versatile" | "presence";
export type GuideLine = PerfumeLine | "both";
export type GuideReference = "Good Girl" | "Fantasy" | "La Nuit Tresor" | "Aventus" | "Fahrenheit" | "Invictus" | "Allure Homme" | "Allure Homme Sport" | "Scandal" | "Yara" | "Asad" | "none";

export type PerfumeGuideAnswers = {
  recipient: GuideRecipient;
  profile: GuideProfile;
  style: GuideStyle;
  occasion: GuideOccasion;
  line: GuideLine;
  reference: GuideReference;
};

export type PerfumeGuideRecommendation = {
  perfume: Perfume;
  score: number;
  reason: string;
  matchedTags: string[];
};

type GuideProfileData = { tags: string[]; occasions: string[] };

const guideProfiles: Record<string, GuideProfileData> = {
  "SULTAN NOIR": { tags: ["masculino", "arabe", "oriental", "marcante", "intenso"], occasions: ["night", "presence"] },
  "SAMARAH ROSE": { tags: ["feminino", "arabe", "oriental", "floral", "elegante", "presente"], occasions: ["date", "gift", "night"] },
  "NOIR OUD ROYALE": { tags: ["unissex", "arabe", "oriental", "oud", "amadeirado", "marcante", "sofisticado"], occasions: ["night", "presence"] },
  YASIRAH: { tags: ["feminino", "arabe", "oriental", "doce", "delicado", "presente"], occasions: ["gift", "date", "versatile", "night"] },
  "ALTAIR ROYALE": { tags: ["unissex", "arabe", "oriental", "doce", "elegante", "sofisticado"], occasions: ["night", "date", "presence"] },
  NOBLIS: { tags: ["masculino", "elegante", "versatil", "dia a dia", "amadeirado"], occasions: ["work", "versatile"] },
  "AZURE SPORT": { tags: ["masculino", "fresco", "esportivo", "dia a dia", "versatil"], occasions: ["work", "versatile"] },
  VITORIUM: { tags: ["masculino", "marcante", "jovem", "versatil", "doce"], occasions: ["versatile", "presence", "night"] },
  DOMINARE: { tags: ["masculino", "amadeirado", "presenca", "sofisticado", "elegante", "marcante"], occasions: ["work", "presence", "versatile"] },
  IGNIS: { tags: ["masculino", "intenso", "classico", "marcante", "presenca"], occasions: ["night", "presence"] },
  "SILVERION BLACK": { tags: ["masculino", "noturno", "marcante", "elegante", "versatil"], occasions: ["night", "work", "versatile"] },
  "SCARLET NOIR": { tags: ["masculino", "sedutor", "doce", "noturno", "marcante"], occasions: ["date", "night", "presence"] },
  FLOREA: { tags: ["feminino", "floral", "elegante", "dia a dia", "presente"], occasions: ["work", "gift", "versatile"] },
  IRESIA: { tags: ["feminino", "floral", "delicado", "elegante", "presente"], occasions: ["work", "gift", "date", "versatile"] },
  "BELLE VENOM": { tags: ["feminino", "doce", "sedutor", "noite", "marcante", "elegante"], occasions: ["date", "night", "presence", "gift"] },
  LUMIARA: { tags: ["feminino", "doce", "romantico", "sedutor", "noite", "presente"], occasions: ["date", "night", "gift"] },
  "MOON CANDY": { tags: ["feminino", "doce", "jovem", "delicado", "presente"], occasions: ["gift", "date", "versatile"] },
};

const styleTags: Record<GuideStyle, string[]> = {
  sweet: ["doce", "gourmand", "baunilha", "cremoso"],
  fresh: ["fresco", "aquatico", "citrico", "limpo", "esportivo"],
  woody: ["amadeirado", "oud", "couro"],
  striking: ["marcante", "intenso", "presenca", "noturno"],
  elegant: ["elegante", "sofisticado", "classico", "executivo"],
  oriental: ["oriental", "arabe", "oud", "especiado"],
  seductive: ["sedutor", "sensual", "romantico", "noturno"],
  daily: ["dia a dia", "versatil", "fresco", "limpo", "esportivo"],
};

const referenceMatches: Partial<Record<GuideReference, string>> = {
  "Good Girl": "BELLE VENOM", Fantasy: "MOON CANDY", "La Nuit Tresor": "LUMIARA",
  Aventus: "DOMINARE", Fahrenheit: "IGNIS", Invictus: "VITORIUM",
  "Allure Homme": "NOBLIS", "Allure Homme Sport": "AZURE SPORT",
  Scandal: "SCARLET NOIR", Yara: "YASIRAH", Asad: "SULTAN NOIR",
};

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeGuideAnswers(answers: Partial<PerfumeGuideAnswers>): PerfumeGuideAnswers {
  return {
    recipient: answers.recipient ?? "unsure",
    profile: answers.profile ?? "any",
    style: answers.style ?? "elegant",
    occasion: answers.occasion ?? "versatile",
    line: answers.line ?? "both",
    reference: answers.reference ?? "none",
  };
}

export function scorePerfumeForGuide(perfume: Perfume, rawAnswers: Partial<PerfumeGuideAnswers>) {
  const answers = normalizeGuideAnswers(rawAnswers);
  const extra = guideProfiles[perfume.name] ?? { tags: [], occasions: [] };
  const allTags = [...new Set([...extra.tags, ...perfume.tags.map(normalize), ...perfume.indicatedFor.map(normalize), normalize(perfume.family)])];
  let score = 0;
  const matches = new Set<string>();

  if (answers.profile !== "any") {
    const requested = answers.profile === "male" ? "Masculino" : answers.profile === "female" ? "Feminino" : "Unissex";
    if (perfume.audience === requested) score += 24;
    else if (perfume.audience === "Unissex") score += 11;
    else score -= 18;
  }
  if (answers.line !== "both") score += perfume.line === answers.line ? 20 : -28;
  for (const tag of styleTags[answers.style]) {
    if (allTags.some((candidate) => candidate.includes(tag))) {
      score += 9;
      matches.add(tag);
    }
  }
  if (extra.occasions.includes(answers.occasion)) {
    score += 14;
    matches.add(answers.occasion);
  }
  if (answers.recipient === "gift" && (allTags.includes("presente") || extra.occasions.includes("gift"))) {
    score += 10;
    matches.add("presente");
  }
  if (referenceMatches[answers.reference] === perfume.name) {
    score += 100;
    matches.add(`estilo ${answers.reference}`);
  }
  return { score, matchedTags: [...matches] };
}

function recommendationReason(answers: PerfumeGuideAnswers, tags: string[]) {
  if (answers.reference !== "none" && tags.some((tag) => tag.startsWith("estilo "))) {
    return `É a correspondência mais próxima da referência ${answers.reference} dentro da coleção.`;
  }
  if (answers.recipient === "gift" && tags.includes("presente")) {
    return "Uma escolha presenteável que combina com o perfil e o estilo informado.";
  }
  return tags.length
    ? `Combina com sua busca por ${tags.slice(0, 2).join(" e ")}.`
    : "Uma opção equilibrada e versátil para o perfil informado.";
}

export function getPerfumeGuideRecommendations(rawAnswers: Partial<PerfumeGuideAnswers>, limit = 5): PerfumeGuideRecommendation[] {
  const answers = normalizeGuideAnswers(rawAnswers);
  return perfumes
    .map((perfume, index) => ({ perfume, index, ...scorePerfumeForGuide(perfume, answers) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, Math.max(3, Math.min(5, limit)))
    .map(({ perfume, score, matchedTags }) => ({
      perfume, score, matchedTags, reason: recommendationReason(answers, matchedTags),
    }));
}
