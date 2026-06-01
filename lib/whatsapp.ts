export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

function sanitizeWhatsAppNumber(number: string): string {
  return number.replace(/\D/g, "");
}

export function createWhatsAppLink(message: string): string {
  const sanitizedNumber = sanitizeWhatsAppNumber(WHATSAPP_NUMBER);

  if (sanitizedNumber.length < 10) {
    return "#";
  }

  return `https://wa.me/${sanitizedNumber}?text=${encodeURIComponent(message)}`;
}

export function createGeneralContactMessage() {
  return "Ola! Quero conhecer os perfumes da AMAROdosREIS Parfum.";
}

export function createCatalogMessage() {
  return "Ola! Vi o catalogo da AMAROdosREIS Parfum e gostaria de ajuda para escolher uma fragrancia.";
}

export function createPerfumeInterestMessage(perfumeName: string) {
  return `Ola! Tenho interesse no perfume ${perfumeName} da AMAROdosREIS Parfum. Gostaria de consultar disponibilidade, valor e forma de entrega.`;
}

export function createPerfumeAvailabilityMessage(perfumeName: string) {
  return `Ola! Gostaria de consultar a disponibilidade do perfume ${perfumeName} da AMAROdosREIS Parfum.`;
}

export function createPerfumeRecommendationMessage() {
  return "Ola! Quero uma indicacao de perfume da AMAROdosREIS Parfum. Pode me ajudar a escolher uma fragrancia de acordo com meu estilo?";
}

export function createDeliveryQuestionMessage() {
  return "Ola! Gostaria de saber sobre entrega dos perfumes da AMAROdosREIS Parfum na minha regiao.";
}

export function createGiftRecommendationMessage() {
  return "Ola! Quero comprar um perfume para presentear alguem. Pode me ajudar a escolher uma fragrancia da AMAROdosREIS Parfum?";
}

export function createLocalDeliveryMessage() {
  return "Ola! Moro em Ariquemes/RO e gostaria de saber sobre entrega local dos perfumes da AMAROdosREIS Parfum.";
}

export function createArabPremiumMessage() {
  return "Ola! Quero conhecer a Linha Arabe Premium da AMAROdosREIS Parfum. Pode me indicar uma fragrancia?";
}
