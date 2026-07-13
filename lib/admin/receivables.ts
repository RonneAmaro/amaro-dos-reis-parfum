export type ReceivableStatus = "pago" | "pendente" | "fiado";
export type ExpectedPaymentMethod =
  | "pix"
  | "dinheiro"
  | "cartao"
  | "salario"
  | "outro";

export type ReceivableSale = {
  customerName: string;
  customerPhone?: string;
  perfumeName: string;
  quantity: number;
  unitPrice: number;
  status: ReceivableStatus;
  expectedPaymentDate?: string;
  expectedPaymentMethod?: ExpectedPaymentMethod;
  collectionNote?: string;
  paidAt?: string;
};

export function toLocalDateInput(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function nextDayOfMonth(day: number, today = new Date()): string {
  const target = new Date(today.getFullYear(), today.getMonth(), day);
  if (today.getDate() > day) target.setMonth(target.getMonth() + 1);
  return toLocalDateInput(target);
}

export function addDays(dateValue: string, days: number): string {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day + days);
  return toLocalDateInput(date);
}

export function formatReceivableDate(value?: string): string {
  if (!value) return "Sem data definida";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return "Sem data definida";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

export function expectedPaymentMethodLabel(method?: ExpectedPaymentMethod) {
  return {
    pix: "Pix",
    dinheiro: "Dinheiro",
    cartao: "Cartão",
    salario: "Salário / próximo pagamento",
    outro: "Outro",
  }[method ?? "outro"];
}

export function createCollectionMessage(sale: ReceivableSale): string {
  const total = sale.unitPrice * sale.quantity;
  const value = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(total);
  return `Olá${sale.customerName ? `, ${sale.customerName}` : ""}, tudo bem? Passando para lembrar do pagamento do perfume AMARO DOS REIS PARFUM. Referente ao perfume ${sale.perfumeName}, no valor de ${value}. Qualquer coisa fico à disposição.`;
}

export function createWhatsAppCollectionUrl(sale: ReceivableSale): string {
  const phone = (sale.customerPhone ?? "").replace(/\D/g, "");
  const message = encodeURIComponent(createCollectionMessage(sale));
  return phone
    ? `https://wa.me/${phone}?text=${message}`
    : `https://wa.me/?text=${message}`;
}

export function createGoogleCalendarUrl(sale: ReceivableSale): string | null {
  if (!sale.expectedPaymentDate) return null;
  const start = sale.expectedPaymentDate.replace(/-/g, "");
  const end = addDays(sale.expectedPaymentDate, 1).replace(/-/g, "");
  const total = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(sale.unitPrice * sale.quantity);
  const details = [
    `Cliente: ${sale.customerName}`,
    `Perfume: ${sale.perfumeName}`,
    `Quantidade: ${sale.quantity}`,
    `Valor: ${total}`,
    `Forma prevista: ${expectedPaymentMethodLabel(sale.expectedPaymentMethod)}`,
    sale.collectionNote ? `Observação: ${sale.collectionNote}` : "",
    "Marca: AMARO DOS REIS PARFUM",
  ].filter(Boolean).join("\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Receber perfume - ${sale.customerName}`,
    dates: `${start}/${end}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
