import { nextDayOfMonth, toLocalDateInput, type ExpectedPaymentMethod } from "./receivables";
import { createFlexibleItem, type FlexibleSaleItem, type SaleItemType } from "./flexibleSales";

type AssistantPerfume = { slug: string; name: string; lineType: "tradicional" | "arabe"; unitPrice: number; unitCost: number };
export type SalesAssistantResult = { customerName: string; items: FlexibleSaleItem[];
  status: "pago" | "pendente" | "fiado" | "partial";
  amountPaid?: number;
  paymentMethod: "dinheiro" | "pix" | "cartao" | "fiado";
  expectedPaymentDate?: string; expectedPaymentMethod?: ExpectedPaymentMethod; notes: string[] };

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function parseSalesAssistant(text: string, perfumes: AssistantPerfume[]): SalesAssistantResult {
  const source = normalized(text);
  const itemType: SaleItemType = source.includes("brinde") ? "gift"
    : source.includes("uso pessoal") || source.includes("retirei") ? "personal_use"
    : source.includes("amostra") ? "sample" : source.includes("troca") ? "exchange" : "sale";
  const paymentMethod = source.includes("pix") ? "pix" : source.includes("dinheiro") ? "dinheiro"
    : source.includes("cartao") ? "cartao" : source.includes("fiado") ? "fiado" : "pix";
  const customerMatch = text.match(/(?:para|cliente)\s+([\p{L}][\p{L}\s]*?)(?=\s+\d+\s|\s+(?:um|uma)\s|$)/iu);
  const customerName = itemType === "personal_use" ? "Uso pessoal" : customerMatch?.[1]?.trim() || "Cliente não identificado";
  const discountMatch = source.match(/desconto\s+(?:de\s+)?(?:r\$\s*)?(\d+(?:[,.]\d+)?)/);
  const discount = discountMatch ? Number(discountMatch[1].replace(",", ".")) : 0;
  const found = perfumes.flatMap((perfume) => {
    const index = source.indexOf(normalized(perfume.name));
    if (index < 0) return [];
    const quantityMatch = source.slice(Math.max(0, index - 12), index).match(/(\d+)\s*$/);
    return [{ perfume, index, quantity: quantityMatch ? Number(quantityMatch[1]) : 1 }];
  }).sort((a, b) => a.index - b.index);
  const items = found.map(({ perfume, quantity }, index) => createFlexibleItem({
    id: `assistant-${Date.now()}-${index}`, perfumeSlug: perfume.slug, perfumeName: perfume.name,
    lineType: perfume.lineType, quantity, unitPrice: perfume.unitPrice,
    originalUnitPrice: perfume.unitPrice, unitCost: perfume.unitCost,
    discountValue: index === 0 ? discount : 0, itemType,
  }));
  let expectedPaymentDate: string | undefined;
  if (source.includes("amanha")) { const date = new Date(); date.setDate(date.getDate() + 1); expectedPaymentDate = toLocalDateInput(date); }
  else if (source.includes("hoje")) expectedPaymentDate = toLocalDateInput();
  else if (/dia\s*5\b/.test(source)) expectedPaymentDate = nextDayOfMonth(5);
  else if (/dia\s*15\b/.test(source)) expectedPaymentDate = nextDayOfMonth(15);
  const nextPayment = source.includes("proximo pagamento");
  const future = Boolean(expectedPaymentDate || nextPayment || source.includes("fiado"));
  const mixedPayment = items.length > 1 && source.includes("pago") && source.includes("fiado");
  return { customerName, items,
    status: itemType !== "sale" ? "pago" : mixedPayment ? "partial" : future ? (paymentMethod === "fiado" ? "fiado" : "pendente") : "pago",
    amountPaid: mixedPayment ? items[0]?.total : undefined,
    paymentMethod, expectedPaymentDate: expectedPaymentDate ?? (nextPayment ? nextDayOfMonth(5) : undefined),
    expectedPaymentMethod: nextPayment ? "salario" : paymentMethod === "fiado" ? "outro" : paymentMethod,
    notes: items.length ? [] : ["Nenhum perfume reconhecido. Revise os nomes e tente novamente."] };
}
