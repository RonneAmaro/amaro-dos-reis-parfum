export type PerfumeCategory = "masculino" | "feminino" | "unissex";

export type Perfume = {
  slug: string;
  name: string;
  inspiration: string;
  category: PerfumeCategory;
  collection: "Executive Collection" | "Oriental Collection" | "Feminine Collection";
  price: number;
  shortDescription: string;
  olfactiveFamily: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  longDescription: string;
  bottleType: "tradicional" | "arabe";
};

export const perfumes: Perfume[] = [
  {
    slug: "noblis",
    name: "NOBLIS",
    inspiration: "Allure Homme",
    category: "masculino",
    collection: "Executive Collection",
    price: 80,
    shortDescription:
      "Fragrância masculina refinada, pensada para quem busca elegância discreta, presença limpa e sofisticação no dia a dia.",
    olfactiveFamily: "Amadeirado especiado elegante",
    topNotes: ["cítricos frescos", "mandarina", "especiarias suaves"],
    heartNotes: ["pimenta", "cedro", "acordes aromáticos"],
    baseNotes: ["sândalo", "âmbar", "baunilha", "almíscar"],
    longDescription:
      "Fragrância masculina refinada, pensada para quem busca elegância discreta, presença limpa e sofisticação no dia a dia.",
    bottleType: "tradicional",
  },
  {
    slug: "azure-sport",
    name: "AZURE SPORT",
    inspiration: "Allure Homme Sport",
    category: "masculino",
    collection: "Executive Collection",
    price: 80,
    shortDescription:
      "Fragrância fresca e energética, com sensação limpa, esportiva e elegante, ideal para dias quentes e rotina ativa.",
    olfactiveFamily: "Fresco aquático amadeirado",
    topNotes: ["laranja", "mandarina", "notas aquáticas"],
    heartNotes: ["néroli", "pimenta", "cedro"],
    baseNotes: ["almíscar branco", "âmbar", "baunilha"],
    longDescription:
      "Fragrância fresca e energética, com sensação limpa, esportiva e elegante, ideal para dias quentes e rotina ativa.",
    bottleType: "tradicional",
  },
  {
    slug: "vitorium",
    name: "VITORIUM",
    inspiration: "Invictus",
    category: "masculino",
    collection: "Executive Collection",
    price: 80,
    shortDescription:
      "Perfume moderno, jovem e marcante, com contraste entre frescor aquático e fundo adocicado de presença.",
    olfactiveFamily: "Aquático doce amadeirado",
    topNotes: ["toranja", "acordes marinhos", "frescor cítrico"],
    heartNotes: ["louro", "jasmim", "notas aromáticas"],
    baseNotes: ["madeira guaiac", "âmbar cinza", "patchouli"],
    longDescription:
      "Perfume moderno, jovem e marcante, com contraste entre frescor aquático e fundo adocicado de presença.",
    bottleType: "tradicional",
  },
  {
    slug: "dominare",
    name: "DOMINARE",
    inspiration: "Aventus",
    category: "masculino",
    collection: "Executive Collection",
    price: 80,
    shortDescription:
      "Fragrância de liderança, sucesso e confiança, com abertura frutada elegante e fundo amadeirado executivo.",
    olfactiveFamily: "Frutado amadeirado sofisticado",
    topNotes: ["abacaxi", "bergamota", "maçã", "groselha preta"],
    heartNotes: ["bétula", "patchouli", "jasmim", "rosa"],
    baseNotes: ["almíscar", "musgo", "âmbar gris", "baunilha"],
    longDescription:
      "Fragrância de liderança, sucesso e confiança, com abertura frutada elegante e fundo amadeirado executivo.",
    bottleType: "tradicional",
  },
  {
    slug: "ignis",
    name: "IGNIS",
    inspiration: "Fahrenheit",
    category: "masculino",
    collection: "Executive Collection",
    price: 80,
    shortDescription:
      "Perfume intenso e clássico, com personalidade quente, couro marcante e presença madura.",
    olfactiveFamily: "Couro amadeirado aromático",
    topNotes: ["mandarina", "lavanda", "noz-moscada"],
    heartNotes: ["violeta", "cedro", "notas especiadas"],
    baseNotes: ["couro", "vetiver", "âmbar", "madeira"],
    longDescription:
      "Perfume intenso e clássico, com personalidade quente, couro marcante e presença madura.",
    bottleType: "tradicional",
  },
  {
    slug: "silverion-black",
    name: "SILVERION BLACK",
    inspiration: "Azzaro Silver Black",
    category: "masculino",
    collection: "Executive Collection",
    price: 80,
    shortDescription:
      "Fragrância masculina moderna, limpa e versátil, com frescor elegante e fundo amadeirado.",
    olfactiveFamily: "Aromático fresco amadeirado",
    topNotes: ["maçã", "limão", "bergamota"],
    heartNotes: ["coentro", "zimbro", "cardamomo"],
    baseNotes: ["almíscar", "sândalo", "vetiver"],
    longDescription:
      "Fragrância masculina moderna, limpa e versátil, com frescor elegante e fundo amadeirado.",
    bottleType: "tradicional",
  },
  {
    slug: "scarlet-noir",
    name: "SCARLET NOIR",
    inspiration: "Scandal Pour Homme",
    category: "masculino",
    collection: "Executive Collection",
    price: 80,
    shortDescription:
      "Fragrância sedutora, noturna e marcante, com doçura envolvente e presença masculina ousada.",
    olfactiveFamily: "Âmbar doce amadeirado",
    topNotes: ["mandarina", "sálvia esclareia"],
    heartNotes: ["caramelo", "fava tonka"],
    baseNotes: ["vetiver", "notas amadeiradas"],
    longDescription:
      "Fragrância sedutora, noturna e marcante, com doçura envolvente e presença masculina ousada.",
    bottleType: "tradicional",
  },
  {
    slug: "sultan-noir",
    name: "SULTAN NOIR",
    inspiration: "Asad",
    category: "masculino",
    collection: "Oriental Collection",
    price: 120,
    shortDescription:
      "Perfume oriental intenso, misterioso e poderoso, com assinatura quente, especiada e luxuosa.",
    olfactiveFamily: "Oriental especiado ambarado",
    topNotes: ["pimenta preta", "tabaco", "abacaxi"],
    heartNotes: ["café", "patchouli", "íris"],
    baseNotes: ["baunilha", "âmbar", "madeira seca", "benjoim"],
    longDescription:
      "Perfume oriental intenso, misterioso e poderoso, com assinatura quente, especiada e luxuosa.",
    bottleType: "arabe",
  },
  {
    slug: "noir-oud-royale",
    name: "NOIR OUD ROYALE",
    inspiration: "Club de Nuit Oud Armaf",
    category: "unissex",
    collection: "Oriental Collection",
    price: 120,
    shortDescription:
      "Fragrância rica, intensa e sofisticada, com oud marcante e presença oriental premium.",
    olfactiveFamily: "Oud oriental luxuoso",
    topNotes: ["frutas exóticas", "bergamota", "especiarias"],
    heartNotes: ["rosa", "jasmim", "oud"],
    baseNotes: ["âmbar", "baunilha", "almíscar", "madeiras nobres"],
    longDescription:
      "Fragrância rica, intensa e sofisticada, com oud marcante e presença oriental premium.",
    bottleType: "arabe",
  },
  {
    slug: "yasirah",
    name: "YASIRAH",
    inspiration: "Yara Lattafa",
    category: "feminino",
    collection: "Oriental Collection",
    price: 120,
    shortDescription:
      "Perfume feminino doce, cremoso e delicado, com assinatura oriental macia e muito envolvente.",
    olfactiveFamily: "Oriental gourmand cremoso",
    topNotes: ["orquídea", "heliotrópio", "tangerina"],
    heartNotes: ["frutas tropicais", "notas gourmand"],
    baseNotes: ["baunilha", "almíscar", "sândalo"],
    longDescription:
      "Perfume feminino doce, cremoso e delicado, com assinatura oriental macia e muito envolvente.",
    bottleType: "arabe",
  },
  {
    slug: "altair-royale",
    name: "ALTAIR ROYALE",
    inspiration: "Althaïr Parfums de Marly",
    category: "masculino",
    collection: "Oriental Collection",
    price: 120,
    shortDescription:
      "Fragrância sofisticada com baunilha nobre, especiarias elegantes e fundo quente de luxo.",
    olfactiveFamily: "Baunilha oriental amadeirada",
    topNotes: ["flor de laranjeira", "bergamota", "canela"],
    heartNotes: ["baunilha bourbon", "elemi"],
    baseNotes: ["madeira guaiac", "ambroxan", "almíscar", "pralinê"],
    longDescription:
      "Fragrância sofisticada com baunilha nobre, especiarias elegantes e fundo quente de luxo.",
    bottleType: "arabe",
  },
  {
    slug: "samarah-rose",
    name: "SAMARAH ROSE",
    inspiration: "Sabah Al Ward",
    category: "feminino",
    collection: "Oriental Collection",
    price: 120,
    shortDescription:
      "Fragrância feminina elegante, floral e delicada, com toque oriental suave e romântico.",
    olfactiveFamily: "Floral oriental feminino",
    topNotes: ["rosa", "pimenta rosa", "notas frutadas"],
    heartNotes: ["flores brancas", "jasmim", "peônia"],
    baseNotes: ["almíscar", "baunilha", "âmbar suave"],
    longDescription:
      "Fragrância feminina elegante, floral e delicada, com toque oriental suave e romântico.",
    bottleType: "arabe",
  },
  {
    slug: "florea",
    name: "FLORÉA",
    inspiration: "Chloé Eau de Parfum",
    category: "feminino",
    collection: "Feminine Collection",
    price: 80,
    shortDescription:
      "Perfume feminino refinado, fresco e elegante, com assinatura floral limpa e sofisticada.",
    olfactiveFamily: "Floral limpo sofisticado",
    topNotes: ["peônia", "lichia", "frésia"],
    heartNotes: ["rosa", "lírio-do-vale", "magnólia"],
    baseNotes: ["âmbar", "cedro", "almíscar"],
    longDescription:
      "Perfume feminino refinado, fresco e elegante, com assinatura floral limpa e sofisticada.",
    bottleType: "tradicional",
  },
  {
    slug: "iresia",
    name: "IRÉSIA",
    inspiration: "Irresistible Givenchy",
    category: "feminino",
    collection: "Feminine Collection",
    price: 80,
    shortDescription:
      "Fragrância feminina luminosa, delicada e envolvente, com toque frutado moderno e floral elegante.",
    olfactiveFamily: "Floral frutado feminino",
    topNotes: ["pera", "ambrette"],
    heartNotes: ["rosa", "íris"],
    baseNotes: ["almíscar", "cedro"],
    longDescription:
      "Fragrância feminina luminosa, delicada e envolvente, com toque frutado moderno e floral elegante.",
    bottleType: "tradicional",
  },
  {
    slug: "belle-venom",
    name: "BELLE VENOM",
    inspiration: "Good Girl",
    category: "feminino",
    collection: "Feminine Collection",
    price: 80,
    shortDescription:
      "Perfume feminino sensual, marcante e sofisticado, com contraste entre doçura, flores brancas e fundo quente.",
    olfactiveFamily: "Oriental floral gourmand",
    topNotes: ["amêndoa", "café"],
    heartNotes: ["tuberosa", "jasmim sambac"],
    baseNotes: ["fava tonka", "cacau", "baunilha", "sândalo"],
    longDescription:
      "Perfume feminino sensual, marcante e sofisticado, com contraste entre doçura, flores brancas e fundo quente.",
    bottleType: "tradicional",
  },
  {
    slug: "lumiara",
    name: "LUMIARA",
    inspiration: "La Nuit Trésor",
    category: "feminino",
    collection: "Feminine Collection",
    price: 80,
    shortDescription:
      "Fragrância feminina romântica, intensa e sedutora, com doçura sofisticada e presença noturna.",
    olfactiveFamily: "Oriental baunilha frutado",
    topNotes: ["pera", "bergamota", "tangerina"],
    heartNotes: ["rosa negra", "orquídea baunilha", "maracujá"],
    baseNotes: ["pralinê", "caramelo", "baunilha", "patchouli"],
    longDescription:
      "Fragrância feminina romântica, intensa e sedutora, com doçura sofisticada e presença noturna.",
    bottleType: "tradicional",
  },
  {
    slug: "moon-candy",
    name: "MOON CANDY",
    inspiration: "Fantasy",
    category: "feminino",
    collection: "Feminine Collection",
    price: 80,
    shortDescription:
      "Perfume doce, jovem e divertido, com assinatura gourmand cremosa e toque romântico.",
    olfactiveFamily: "Gourmand doce frutado",
    topNotes: ["kiwi", "lichia", "marmelo"],
    heartNotes: ["chocolate branco", "cupcake", "orquídea", "jasmim"],
    baseNotes: ["almíscar", "raiz de lírio", "madeiras"],
    longDescription:
      "Perfume doce, jovem e divertido, com assinatura gourmand cremosa e toque romântico.",
    bottleType: "tradicional",
  },
];
