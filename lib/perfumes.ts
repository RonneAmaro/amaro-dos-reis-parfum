export type AvailabilityStatus = "available" | "limited" | "on_order";
export type PerfumeLine = "traditional" | "arabic_premium";
export type PerfumeAudience = "Masculino" | "Feminino" | "Unissex";

export type PerfumeCommerce = {
  name: string;
  inspiration: string;
  collection: string;
  family: string;
  line: PerfumeLine;
  priceCents: number;
  sizeMl: number;
  description: string;
  audience: PerfumeAudience;
  whatsappMessage: string;
  indicatedFor: string[];
  tags: string[];
  availabilityStatus: AvailabilityStatus;
};

export type Perfume = PerfumeCommerce & {
  slug: string;
  olfactiveFamily: string;
  price: number;
};

const perfumeData: Omit<PerfumeCommerce, "whatsappMessage">[] = [
  {
    name: "NOBLIS",
    inspiration: "Allure Homme",
    collection: "Executive Collection",
    family: "Aromatico amadeirado",
    line: "traditional",
    priceCents: 8000,
    sizeMl: 50,
    description: "Elegante, versatil e sofisticado para uma presenca refinada.",
    audience: "Masculino",
    indicatedFor: ["Trabalho", "reunioes", "presenca refinada"],
    tags: ["elegante", "masculino", "executivo", "classico"],
    availabilityStatus: "available",
  },
  {
    name: "AZURE SPORT",
    inspiration: "Allure Homme Sport",
    collection: "Executive Collection",
    family: "Citrico aromatico",
    line: "traditional",
    priceCents: 8000,
    sizeMl: 50,
    description: "Frescor moderno com energia limpa e assinatura elegante.",
    audience: "Masculino",
    indicatedFor: ["Dia a dia", "calor", "academia/rotina"],
    tags: ["fresco", "esportivo", "aquatico", "verao"],
    availabilityStatus: "available",
  },
  {
    name: "VITORIUM",
    inspiration: "Invictus",
    collection: "Executive Collection",
    family: "Aquatico amadeirado",
    line: "traditional",
    priceCents: 8000,
    sizeMl: 50,
    description: "Vibrante, confiante e marcante para dias de conquista.",
    audience: "Masculino",
    indicatedFor: ["Conquistas", "eventos", "uso marcante"],
    tags: ["jovem", "marcante", "aquatico", "doce"],
    availabilityStatus: "available",
  },
  {
    name: "SULTAN NOIR",
    inspiration: "Asad",
    collection: "Oriental Collection",
    family: "Oriental especiado",
    line: "arabic_premium",
    priceCents: 12000,
    sizeMl: 50,
    description:
      "Quente, intenso e poderoso, com especiarias nobres e fundo escuro.",
    audience: "Masculino",
    indicatedFor: ["Noite", "encontros", "clima frio"],
    tags: ["arabe", "intenso", "especiado", "noite"],
    availabilityStatus: "limited",
  },
  {
    name: "DOMINARE",
    inspiration: "Aventus",
    collection: "Executive Collection",
    family: "Amadeirado frutado",
    line: "traditional",
    priceCents: 8000,
    sizeMl: 50,
    description:
      "Imponente e refinado, com frescor vibrante e profundidade elegante.",
    audience: "Masculino",
    indicatedFor: ["Trabalho", "eventos", "presenca executiva"],
    tags: ["executivo", "amadeirado", "sofisticado", "masculino"],
    availabilityStatus: "available",
  },
  {
    name: "IGNIS",
    inspiration: "Fahrenheit",
    collection: "Executive Collection",
    family: "Couro aromatico",
    line: "traditional",
    priceCents: 8000,
    sizeMl: 50,
    description: "Intenso e magnetico, com couro, calor e personalidade.",
    audience: "Masculino",
    indicatedFor: ["Noite", "personalidade", "fragrancia de impacto"],
    tags: ["couro", "classico", "intenso", "masculino"],
    availabilityStatus: "available",
  },
  {
    name: "SAMARAH ROSE",
    inspiration: "Sabah Al Ward",
    collection: "Oriental Collection",
    family: "Floral oriental",
    line: "arabic_premium",
    priceCents: 12000,
    sizeMl: 50,
    description: "Rosas delicadas, docura macia e toque oriental radiante.",
    audience: "Feminino",
    indicatedFor: ["Encontros", "ocasioes especiais", "presenca feminina"],
    tags: ["feminino", "floral", "oriental", "elegante"],
    availabilityStatus: "limited",
  },
  {
    name: "FLOREA",
    inspiration: "Chloe Eau de Parfum",
    collection: "Feminine Collection",
    family: "Floral elegante",
    line: "traditional",
    priceCents: 8000,
    sizeMl: 50,
    description: "Feminino, limpo e luminoso, com elegancia atemporal.",
    audience: "Feminino",
    indicatedFor: ["Trabalho", "dia a dia", "elegancia leve"],
    tags: ["floral", "limpo", "elegante", "feminino"],
    availabilityStatus: "available",
  },
  {
    name: "SILVERION BLACK",
    inspiration: "Azzaro Silver Black",
    collection: "Executive Collection",
    family: "Aromatico especiado",
    line: "traditional",
    priceCents: 8000,
    sizeMl: 50,
    description: "Urbano, fresco e marcante para uma rotina elegante.",
    audience: "Masculino",
    indicatedFor: ["Rotina urbana", "trabalho", "saida casual"],
    tags: ["fresco", "moderno", "masculino", "versatil"],
    availabilityStatus: "available",
  },
  {
    name: "IRESIA",
    inspiration: "Irresistible Givenchy",
    collection: "Feminine Collection",
    family: "Floral frutado",
    line: "traditional",
    priceCents: 8000,
    sizeMl: 50,
    description: "Leve, envolvente e sofisticado, com brilho feminino moderno.",
    audience: "Feminino",
    indicatedFor: ["Dia a dia", "encontros", "presente feminino"],
    tags: ["floral", "frutado", "delicado", "feminino"],
    availabilityStatus: "available",
  },
  {
    name: "BELLE VENOM",
    inspiration: "Good Girl",
    collection: "Feminine Collection",
    family: "Oriental floral",
    line: "traditional",
    priceCents: 8000,
    sizeMl: 50,
    description: "Sedutor e elegante, com contraste entre docura e intensidade.",
    audience: "Feminino",
    indicatedFor: ["Noite", "eventos", "presenca sedutora"],
    tags: ["sensual", "feminino", "noite", "marcante"],
    availabilityStatus: "available",
  },
  {
    name: "NOIR OUD ROYALE",
    inspiration: "Club de Nuit Oud Armaf",
    collection: "Oriental Collection",
    family: "Oud amadeirado",
    line: "arabic_premium",
    priceCents: 12000,
    sizeMl: 50,
    description: "Nobre, profundo e luxuoso, com rastro oriental de oud.",
    audience: "Unissex",
    indicatedFor: ["Noite", "eventos especiais", "rastro luxuoso"],
    tags: ["oud", "arabe", "luxo", "intenso"],
    availabilityStatus: "limited",
  },
  {
    name: "YASIRAH",
    inspiration: "Yara Lattafa",
    collection: "Oriental Collection",
    family: "Gourmand oriental",
    line: "arabic_premium",
    priceCents: 12000,
    sizeMl: 50,
    description: "Cremoso, doce e feminino, com delicadeza oriental.",
    audience: "Feminino",
    indicatedFor: ["Uso casual", "encontros", "presente feminino"],
    tags: ["arabe", "doce", "cremoso", "feminino"],
    availabilityStatus: "limited",
  },
  {
    name: "ALTAIR ROYALE",
    inspiration: "Althair Parfums de Marly",
    collection: "Oriental Collection",
    family: "Baunilha ambarada",
    line: "arabic_premium",
    priceCents: 12000,
    sizeMl: 50,
    description: "Ambarado, cremoso e sofisticado, com calor envolvente.",
    audience: "Unissex",
    indicatedFor: ["Clima frio", "noite", "sofisticacao cremosa"],
    tags: ["baunilha", "arabe", "sofisticado", "quente"],
    availabilityStatus: "limited",
  },
  {
    name: "SCARLET NOIR",
    inspiration: "Scandal Pour Homme",
    collection: "Executive Collection",
    family: "Ambarado amadeirado",
    line: "traditional",
    priceCents: 8000,
    sizeMl: 50,
    description: "Marcante e provocante, com elegancia intensa.",
    audience: "Masculino",
    indicatedFor: ["Encontros", "eventos", "presenca provocante"],
    tags: ["doce", "noturno", "sedutor", "masculino"],
    availabilityStatus: "limited",
  },
  {
    name: "LUMIARA",
    inspiration: "La Nuit Tresor",
    collection: "Feminine Collection",
    family: "Oriental gourmand",
    line: "traditional",
    priceCents: 8000,
    sizeMl: 50,
    description: "Romantico, profundo e envolvente, com rastro memoravel.",
    audience: "Feminino",
    indicatedFor: ["Noite", "romance", "ocasioes especiais"],
    tags: ["romantico", "doce", "feminino", "noite"],
    availabilityStatus: "limited",
  },
  {
    name: "MOON CANDY",
    inspiration: "Fantasy",
    collection: "Feminine Collection",
    family: "Gourmand floral",
    line: "traditional",
    priceCents: 8000,
    sizeMl: 50,
    description: "Doce, encantador e jovial, com rastro cremoso.",
    audience: "Feminino",
    indicatedFor: ["Uso casual", "encontros", "presente feminino"],
    tags: ["doce", "gourmand", "jovem", "presente"],
    availabilityStatus: "available",
  },
];

export const perfumeCommerce: PerfumeCommerce[] = perfumeData.map(
  (perfume) => ({
    ...perfume,
    whatsappMessage: `Ola! Tenho interesse no perfume ${perfume.name} da Amaro dos Reis Parfum. Pode me passar mais informacoes?`,
  })
);

export const perfumes: Perfume[] = perfumeCommerce.map((perfume) => ({
  ...perfume,
  slug: perfumeSlug(perfume),
  olfactiveFamily: perfume.family,
  price: perfume.priceCents / 100,
}));

export const availabilityLabels: Record<AvailabilityStatus, string> = {
  available: "Disponivel",
  limited: "Poucas unidades",
  on_order: "Sob encomenda",
};

export const lineLabels: Record<PerfumeLine, string> = {
  traditional: "Tradicional R$ 80",
  arabic_premium: "Arabe Premium R$ 120",
};

export function formatPerfumePrice(perfume: Pick<PerfumeCommerce, "priceCents">) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(perfume.priceCents / 100);
}

export function perfumeSlug(perfume: Pick<PerfumeCommerce, "name">) {
  return perfume.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getPerfumeCommerce(name?: string | null) {
  return perfumeCommerce.find((perfume) => perfume.name === name);
}

export function getPerfumeBySlug(slug: string) {
  return perfumeCommerce.find((perfume) => perfumeSlug(perfume) === slug);
}

export function createPerfumeMessage(name?: string | null) {
  return (
    getPerfumeCommerce(name)?.whatsappMessage ??
    "Ola! Tenho interesse nos perfumes da Amaro dos Reis Parfum. Pode me passar mais informacoes?"
  );
}

export function getPerfumeIndications(name?: string | null) {
  return (
    getPerfumeCommerce(name)?.indicatedFor ?? [
      "Dia a dia",
      "encontros",
      "presenca elegante",
    ]
  );
}
