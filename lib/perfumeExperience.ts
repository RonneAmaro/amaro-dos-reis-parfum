export type PerfumeExperience = {
  slug: string;
  gradient: string;
  accentColor: string;
  family: string;
  mainAccords: string[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  mood: string;
  occasions: string[];
  intensity: string;
  projection: string;
  longevity: string;
  styleTags: string[];
  shortStory: string;
  customerProfile: string;
};

type ExperienceSeed = Omit<PerfumeExperience, "slug">;

const seeds: Record<string, ExperienceSeed> = {
  noblis: {
    gradient: "linear-gradient(145deg,#071526 0%,#123c55 46%,#050505 100%)", accentColor: "#82c8e5", family: "Aromático amadeirado", mainAccords: ["Cítrico", "Aromático", "Amadeirado"], topNotes: ["Mandarina", "Limão", "Bergamota"], heartNotes: ["Pimenta", "Jasmim", "Vetiver"], baseNotes: ["Sândalo", "Cedro", "Âmbar"], mood: "Elegante, clássico e versátil", occasions: ["Trabalho", "Reuniões", "Dia a dia"], intensity: "Moderada", projection: "Equilibrada", longevity: "Duradoura", styleTags: ["fresco", "amadeirado", "trabalho", "dia a dia", "masculino versátil", "presente"], shortStory: "Frescor polido e madeiras limpas para uma presença segura, sem excessos.", customerProfile: "Homens que buscam uma assinatura refinada e fácil de usar.",
  },
  "azure-sport": {
    gradient: "linear-gradient(145deg,#032c46 0%,#087ca7 48%,#031018 100%)", accentColor: "#55d9ff", family: "Cítrico aromático", mainAccords: ["Cítrico", "Fresco", "Almiscarado"], topNotes: ["Laranja", "Mandarina", "Notas marinhas"], heartNotes: ["Pimenta", "Néroli", "Cedro"], baseNotes: ["Musk", "Fava tonka", "Vetiver"], mood: "Limpo, fresco e dinâmico", occasions: ["Dia a dia", "Calor", "Atividade"], intensity: "Moderada", projection: "Fresca", longevity: "Confortável", styleTags: ["fresco", "dia a dia", "trabalho", "masculino versátil"], shortStory: "Energia azul e cítrica que acompanha o ritmo de um dia em movimento.", customerProfile: "Quem prefere perfumes limpos, esportivos e modernos.",
  },
  vitorium: {
    gradient: "linear-gradient(145deg,#064761 0%,#1591a9 45%,#3a4248 100%)", accentColor: "#79edff", family: "Aquático amadeirado", mainAccords: ["Aquático", "Cítrico", "Amadeirado"], topNotes: ["Toranja", "Acorde marinho", "Mandarina"], heartNotes: ["Louro", "Jasmim", "Notas metálicas"], baseNotes: ["Madeira guaiac", "Âmbar cinza", "Patchouli"], mood: "Energético, esportivo e vencedor", occasions: ["Eventos", "Encontros", "Dia ativo"], intensity: "Marcante", projection: "Expansiva", longevity: "Duradoura", styleTags: ["fresco", "marcante", "dia a dia", "noite", "masculino versátil"], shortStory: "Um acorde de conquista: oceano, metal e madeira em movimento contínuo.", customerProfile: "Perfis competitivos, jovens e confiantes.",
  },
  "sultan-noir": {
    gradient: "linear-gradient(145deg,#050505 0%,#38240d 52%,#0b0703 100%)", accentColor: "#e2ad4f", family: "Oriental especiado", mainAccords: ["Especiado", "Ambarado", "Amadeirado"], topNotes: ["Pimenta-preta", "Abacaxi", "Tabaco"], heartNotes: ["Café", "Patchouli", "Íris"], baseNotes: ["Baunilha", "Âmbar", "Madeiras secas"], mood: "Oriental, poderoso e noturno", occasions: ["Noite", "Clima frio", "Ocasiões especiais"], intensity: "Intensa", projection: "Alta", longevity: "Muito duradoura", styleTags: ["árabe", "marcante", "amadeirado", "noite", "presente"], shortStory: "Especiarias douradas emergem da escuridão com autoridade e magnetismo.", customerProfile: "Quem deseja presença oriental forte e sofisticada.",
  },
  dominare: {
    gradient: "linear-gradient(145deg,#050505 0%,#263519 45%,#6e5b25 100%)", accentColor: "#d7c06a", family: "Amadeirado frutado", mainAccords: ["Frutado", "Defumado", "Amadeirado"], topNotes: ["Abacaxi", "Bergamota", "Maçã"], heartNotes: ["Bétula", "Jasmim", "Patchouli"], baseNotes: ["Musk", "Musgo", "Baunilha"], mood: "Confiante, executivo e marcante", occasions: ["Trabalho", "Eventos", "Reuniões"], intensity: "Marcante", projection: "Presente", longevity: "Duradoura", styleTags: ["marcante", "amadeirado", "trabalho", "masculino versátil", "presente"], shortStory: "Frutas vibrantes encontram madeiras e musk em uma assinatura de liderança.", customerProfile: "Homens seguros que valorizam imagem e presença profissional.",
  },
  ignis: {
    gradient: "linear-gradient(145deg,#160905 0%,#8c3518 48%,#2b1608 100%)", accentColor: "#ff9a45", family: "Couro aromático", mainAccords: ["Couro", "Especiado", "Amadeirado"], topNotes: ["Mandarina", "Bergamota", "Noz-moscada"], heartNotes: ["Folha de violeta", "Cravo", "Cedro"], baseNotes: ["Couro", "Vetiver", "Patchouli"], mood: "Intenso, quente e marcante", occasions: ["Noite", "Clima ameno", "Momentos de impacto"], intensity: "Intensa", projection: "Marcante", longevity: "Muito duradoura", styleTags: ["marcante", "amadeirado", "noite", "masculino versátil"], shortStory: "Couro aquecido, especiarias e madeira desenham uma personalidade impossível de ignorar.", customerProfile: "Personalidades autênticas que não seguem o óbvio.",
  },
  "samarah-rose": {
    gradient: "linear-gradient(145deg,#2a1019 0%,#9b4764 50%,#3d2615 100%)", accentColor: "#f4a7bd", family: "Floral oriental", mainAccords: ["Rosa", "Floral", "Ambarado"], topNotes: ["Pimenta-rosa", "Tangerina", "Frutas vermelhas"], heartNotes: ["Rosa", "Jasmim", "Flor de laranjeira"], baseNotes: ["Baunilha", "Âmbar", "Sândalo"], mood: "Romântico, elegante e envolvente", occasions: ["Encontros", "Festas", "Presente"], intensity: "Marcante", projection: "Envolvente", longevity: "Duradoura", styleTags: ["árabe", "doce", "noite", "presente", "feminino elegante"], shortStory: "Uma rosa oriental banhada em ouro, macia no início e inesquecível no rastro.", customerProfile: "Mulheres românticas que apreciam presença e sofisticação.",
  },
  florea: {
    gradient: "linear-gradient(145deg,#271a20 0%,#b77d91 48%,#ece1dc 100%)", accentColor: "#ffd2df", family: "Floral elegante", mainAccords: ["Floral", "Rosa", "Limpo"], topNotes: ["Peônia", "Lichia", "Frésia"], heartNotes: ["Rosa", "Magnólia", "Lírio-do-vale"], baseNotes: ["Cedro", "Âmbar", "Musk"], mood: "Delicado, elegante e feminino", occasions: ["Trabalho", "Dia a dia", "Presente"], intensity: "Suave", projection: "Delicada", longevity: "Confortável", styleTags: ["fresco", "dia a dia", "trabalho", "presente", "feminino elegante"], shortStory: "Pétalas claras e musk limpo traduzem elegância natural e atemporal.", customerProfile: "Mulheres que preferem florais delicados e muito elegantes.",
  },
  "silverion-black": {
    gradient: "linear-gradient(145deg,#050505 0%,#353b42 50%,#9ca5ad 100%)", accentColor: "#dbe4ea", family: "Aromático especiado", mainAccords: ["Aromático", "Cítrico", "Especiado"], topNotes: ["Limão", "Maçã", "Bergamota"], heartNotes: ["Cardamomo", "Coentro", "Zimbro"], baseNotes: ["Patchouli", "Vetiver", "Musk"], mood: "Urbano, masculino e elegante", occasions: ["Trabalho", "Saída casual", "Dia a dia"], intensity: "Moderada", projection: "Equilibrada", longevity: "Duradoura", styleTags: ["fresco", "amadeirado", "trabalho", "dia a dia", "masculino versátil"], shortStory: "A precisão da prata encontra o preto em um aromático urbano e seguro.", customerProfile: "Homens modernos que buscam versatilidade com personalidade.",
  },
  iresia: {
    gradient: "linear-gradient(145deg,#41182c 0%,#b9587d 48%,#f2aebd 100%)", accentColor: "#ffd0dc", family: "Floral frutado", mainAccords: ["Frutado", "Rosa", "Floral"], topNotes: ["Pera", "Ambreta", "Frutas vermelhas"], heartNotes: ["Rosa", "Íris", "Jasmim"], baseNotes: ["Cedro", "Musk", "Baunilha"], mood: "Sofisticado, feminino e radiante", occasions: ["Dia a dia", "Encontros", "Presente"], intensity: "Moderada", projection: "Luminosa", longevity: "Duradoura", styleTags: ["doce", "dia a dia", "presente", "feminino elegante"], shortStory: "Frutas luminosas e rosa moderna criam um sorriso olfativo sofisticado.", customerProfile: "Mulheres radiantes que gostam de florais contemporâneos.",
  },
  "belle-venom": {
    gradient: "linear-gradient(145deg,#050505 0%,#292326 48%,#d8d1c9 100%)", accentColor: "#f0d5c5", family: "Oriental floral", mainAccords: ["Floral branco", "Doce", "Café"], topNotes: ["Amêndoa", "Café", "Bergamota"], heartNotes: ["Jasmim", "Tuberosa", "Flor de laranjeira"], baseNotes: ["Fava tonka", "Cacau", "Baunilha"], mood: "Poderosa, feminina e elegante", occasions: ["Noite", "Eventos", "Encontros"], intensity: "Intensa", projection: "Marcante", longevity: "Muito duradoura", styleTags: ["doce", "marcante", "noite", "presente", "feminino elegante"], shortStory: "Luz e sombra se encontram entre flores brancas, café e uma doçura provocante.", customerProfile: "Mulheres confiantes que gostam de contrastes sedutores.",
  },
  "noir-oud-royale": {
    gradient: "linear-gradient(145deg,#030303 0%,#28170e 48%,#4c1723 100%)", accentColor: "#c99755", family: "Oud amadeirado", mainAccords: ["Oud", "Rosa", "Amadeirado"], topNotes: ["Açafrão", "Pimenta-rosa", "Bergamota"], heartNotes: ["Rosa", "Oud", "Jasmim"], baseNotes: ["Madeiras escuras", "Âmbar", "Patchouli"], mood: "Intenso, luxuoso e árabe", occasions: ["Noite", "Eventos especiais", "Clima frio"], intensity: "Muito intensa", projection: "Alta", longevity: "Excepcional", styleTags: ["árabe", "marcante", "amadeirado", "noite", "presente"], shortStory: "Oud escuro e rosa opulenta compõem um ritual de luxo e profundidade.", customerProfile: "Quem aprecia perfumaria árabe intensa, nobre e exclusiva.",
  },
  yasirah: {
    gradient: "linear-gradient(145deg,#4b2636 0%,#d58fa8 50%,#f4d4d0 100%)", accentColor: "#ffe0e6", family: "Gourmand oriental", mainAccords: ["Baunilha", "Frutado", "Cremoso"], topNotes: ["Orquídea", "Tangerina", "Heliotrópio"], heartNotes: ["Frutas tropicais", "Acorde gourmand", "Rosa"], baseNotes: ["Baunilha", "Musk", "Sândalo"], mood: "Delicado, feminino e doce", occasions: ["Dia a dia", "Encontros", "Presente"], intensity: "Moderada", projection: "Cremosa", longevity: "Duradoura", styleTags: ["árabe", "doce", "dia a dia", "presente", "feminino elegante"], shortStory: "Frutas macias e baunilha envolvem a pele como um abraço cor-de-rosa.", customerProfile: "Mulheres delicadas que adoram fragrâncias doces e cremosas.",
  },
  "altair-royale": {
    gradient: "linear-gradient(145deg,#221006 0%,#9b5d23 48%,#d3a452 100%)", accentColor: "#ffd586", family: "Baunilha ambarada", mainAccords: ["Baunilha", "Âmbar", "Especiado"], topNotes: ["Flor de laranjeira", "Canela", "Bergamota"], heartNotes: ["Baunilha bourbon", "Elemi", "Cardamomo"], baseNotes: ["Pralinê", "Musk", "Madeira guaiac"], mood: "Premium, oriental e sofisticado", occasions: ["Noite", "Clima frio", "Eventos especiais"], intensity: "Intensa", projection: "Envolvente", longevity: "Muito duradoura", styleTags: ["árabe", "doce", "marcante", "noite", "presente"], shortStory: "Baunilha nobre, especiarias e âmbar constroem um luxo quente e cremoso.", customerProfile: "Quem busca um gourmand oriental sofisticado e memorável.",
  },
  "scarlet-noir": {
    gradient: "linear-gradient(145deg,#160306 0%,#741523 50%,#32150d 100%)", accentColor: "#ff6572", family: "Ambarado amadeirado", mainAccords: ["Caramelo", "Especiado", "Amadeirado"], topNotes: ["Mandarina", "Sálvia", "Pimenta"], heartNotes: ["Caramelo", "Fava tonka", "Gerânio"], baseNotes: ["Vetiver", "Cedro", "Âmbar"], mood: "Provocante, moderno e marcante", occasions: ["Noite", "Encontros", "Festas"], intensity: "Intensa", projection: "Alta", longevity: "Muito duradoura", styleTags: ["doce", "marcante", "amadeirado", "noite"], shortStory: "Caramelo escuro e especiarias acendem uma presença moderna e provocante.", customerProfile: "Homens extrovertidos que gostam de perfumes noturnos e sedutores.",
  },
  lumiara: {
    gradient: "linear-gradient(145deg,#19050f 0%,#681737 48%,#32111f 100%)", accentColor: "#ec719d", family: "Oriental gourmand", mainAccords: ["Frutado", "Baunilha", "Ambarado"], topNotes: ["Pera", "Framboesa", "Bergamota"], heartNotes: ["Rosa negra", "Orquídea", "Jasmim"], baseNotes: ["Baunilha", "Pralinê", "Patchouli"], mood: "Feminino, sedutor e sofisticado", occasions: ["Noite", "Romance", "Ocasiões especiais"], intensity: "Intensa", projection: "Envolvente", longevity: "Muito duradoura", styleTags: ["doce", "marcante", "noite", "presente", "feminino elegante"], shortStory: "Frutas escuras e baunilha iluminam a noite com romance e mistério.", customerProfile: "Mulheres sofisticadas que preferem perfumes doces e noturnos.",
  },
  "moon-candy": {
    gradient: "linear-gradient(145deg,#3c1739 0%,#b95b9e 48%,#ef9ac4 100%)", accentColor: "#ffd0ed", family: "Gourmand floral", mainAccords: ["Doce", "Frutado", "Baunilha"], topNotes: ["Kiwi", "Lichia", "Marmelo"], heartNotes: ["Chocolate branco", "Cupcake", "Jasmim"], baseNotes: ["Baunilha", "Musk", "Madeiras claras"], mood: "Doce, jovem e divertido", occasions: ["Dia a dia", "Encontros", "Presente"], intensity: "Moderada", projection: "Divertida", longevity: "Duradoura", styleTags: ["doce", "dia a dia", "presente", "feminino elegante"], shortStory: "Frutas coloridas e baunilha criam uma fantasia cremosa, leve e irresistível.", customerProfile: "Mulheres jovens de espírito que amam gourmands alegres.",
  },
};

export const perfumeExperiences: Record<string, PerfumeExperience> =
  Object.fromEntries(
    Object.entries(seeds).map(([slug, experience]) => [slug, { slug, ...experience }])
  );

export function getPerfumeExperience(slug: string): PerfumeExperience {
  return perfumeExperiences[slug] ?? {
    slug,
    gradient: "linear-gradient(145deg,#111 0%,#352b1b 55%,#050505 100%)",
    accentColor: "#d8b76a",
    family: "Família olfativa autoral",
    mainAccords: ["Elegante", "Equilibrado", "Autoral"],
    topNotes: ["Abertura luminosa"],
    heartNotes: ["Coração envolvente"],
    baseNotes: ["Fundo elegante"],
    mood: "Elegante e memorável",
    occasions: ["Dia a dia", "Ocasiões especiais"],
    intensity: "Moderada",
    projection: "Equilibrada",
    longevity: "Confortável",
    styleTags: ["elegante", "presente"],
    shortStory: "Uma experiência olfativa criada para revelar presença e identidade.",
    customerProfile: "Para quem procura uma fragrância elegante e autoral.",
  };
}
