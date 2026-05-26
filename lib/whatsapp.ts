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
