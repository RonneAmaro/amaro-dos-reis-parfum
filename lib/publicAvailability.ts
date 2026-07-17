export type PublicAvailabilityStatus =
  | "available"
  | "limited"
  | "on_order"
  | "sold_out"
  | "unknown";

export type PublicAvailabilityTone =
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "neutral";

export type SafePublicAvailability = {
  status: PublicAvailabilityStatus;
  label: string;
  description: string;
  tone: PublicAvailabilityTone;
};

const availability: Record<PublicAvailabilityStatus, Omit<SafePublicAvailability, "status">> = {
  available: {
    label: "Disponível",
    description: "Pronto para pedido.",
    tone: "success",
  },
  limited: {
    label: "Poucas unidades",
    description: "Consulte antes de finalizar.",
    tone: "warning",
  },
  on_order: {
    label: "Sob encomenda",
    description: "Verifique prazo pelo WhatsApp.",
    tone: "info",
  },
  sold_out: {
    label: "Esgotado",
    description: "Consulte reposição.",
    tone: "danger",
  },
  unknown: {
    label: "Consultar disponibilidade",
    description: "Confirme pelo WhatsApp.",
    tone: "neutral",
  },
};

function normalizePublicAvailabilityStatus(status: unknown): PublicAvailabilityStatus {
  return typeof status === "string" && status in availability
    ? status as PublicAvailabilityStatus
    : "unknown";
}

export function getPublicAvailabilityLabel(status: unknown) {
  return availability[normalizePublicAvailabilityStatus(status)].label;
}

export function getPublicAvailabilityTone(status: unknown) {
  return availability[normalizePublicAvailabilityStatus(status)].tone;
}

export function getPublicAvailabilityDescription(status: unknown) {
  return availability[normalizePublicAvailabilityStatus(status)].description;
}

export function getSafePublicAvailability(
  perfume?: { availabilityStatus?: unknown } | null,
): SafePublicAvailability {
  const status = normalizePublicAvailabilityStatus(perfume?.availabilityStatus);
  return { status, ...availability[status] };
}
