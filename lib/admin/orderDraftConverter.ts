import { normalizeAdminText, resolveAdminAssistantPerfumeReference, type AdminAssistantPerfume } from "./adminAssistant";
import { nextDayOfMonth, toLocalDateInput } from "./receivables";

export type ConvertedDraftItem = {
  perfumeSlug: string;
  perfumeName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  confidence: "alta" | "media" | "baixa";
  warnings: string[];
};

export type ConvertedDraftSale = {
  customerName: string;
  customerNote?: string;
  saleDate: string;
  items: ConvertedDraftItem[];
  subtotal: number;
  discountValue: number;
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  paymentStatus: "pago" | "pendente" | "partial";
  paymentMethod: "pix" | "dinheiro" | "cartao" | "fiado";
  expectedPaymentDate?: string;
  collectionNote?: string;
  sourceDraftId?: string;
  paidAt?: string;
  warnings: string[];
};

export type OrderDraftConversionResult = {
  ok: boolean;
  mode: "single_sale" | "multiple_sales" | "needs_review" | "failed";
  sales: ConvertedDraftSale[];
  warnings: string[];
  originalText: string;
};

export type OrderDraftConverterPerfume = AdminAssistantPerfume & { defaultUnitPrice: number };
export type OrderDraftConverterOptions = { perfumes: OrderDraftConverterPerfume[]; sourceDraftId?: string; today?: Date };

const months: Record<string, number> = { janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12 };

function dateValue(day: number, month: number, year: number) {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return undefined;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function historicalDate(fragment: string, today: Date) {
  const slash = fragment.match(/\bdia\s+(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{2,4}))?/);
  if (slash) { const raw = slash[3] ? Number(slash[3]) : today.getFullYear(); return dateValue(Number(slash[1]), Number(slash[2]), raw < 100 ? 2000 + raw : raw); }
  const named = fragment.match(/\bdia\s+(\d{1,2})\s+(?:de\s+)?(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/);
  if (named) return dateValue(Number(named[1]), months[named[2]], today.getFullYear());
  const day = fragment.match(/\bdia\s+(\d{1,2})\b/)?.[1];
  return day ? dateValue(Number(day), today.getMonth() + 1, today.getFullYear()) : undefined;
}

function expectedDate(fragment: string, today: Date) {
  if (fragment.includes("proximo pagamento")) return nextDayOfMonth(5, today);
  const explicit = historicalDate(fragment, today);
  if (!explicit) return undefined;
  const hasMonth = /\d{1,2}\s*\/\s*\d{1,2}|(?:janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/.test(fragment);
  if (!hasMonth && explicit < toLocalDateInput(today)) return nextDayOfMonth(Number(explicit.slice(-2)), today);
  return explicit;
}

function parseNumber(value: string | undefined) { return value ? Number(value.replace(",", ".")) : undefined; }

function customerFromPrefix(rawPrefix: string) {
  let prefix = rawPrefix.replace(/[;,]/g, " ").replace(/\b(?:tambem\s+)?vendi(?:\s+dia\s+\d{1,2}(?:\/\d{1,2})?)?\s+(?:para\s+)?/g, " ")
    .replace(/\bdia\s+\d{1,2}(?:\/\d{1,2})?(?:\s+de\s+\w+)?\b/g, " ").replace(/^.*\bpara\s+/, " ")
    .replace(/^\s*(?:e\s+|outra\s+|mais\s+uma\s+)?/, " ").trim();
  const nameFirst = prefix.match(/\b([a-z]{2,})\s+(da\s+secretaria|cuidadora|professora)(?:\s+da?\s+escola\s+([a-z\s]+?))?(?:\s+(?:pegou|levou))?\s*$/);
  if (nameFirst) {
    const school = nameFirst[3]?.trim();
    return { customerName: title(nameFirst[1]), customerNote: school ? `secretaria da Escola ${school.split(/\s+/).map(title).join(" ")}` : nameFirst[2].replace("da ", "") };
  }
  const roleFirst = prefix.match(/\b(cuidadora|professora|secretaria)\s+([a-z]{2,})\s*$/);
  if (roleFirst) return { customerName: title(roleFirst[2]), customerNote: roleFirst[1] };
  prefix = prefix.replace(/\b(?:pegou|levou|comprou)\s*$/, "").trim();
  const lastName = prefix.match(/([a-z]{2,})\s*$/)?.[1];
  return lastName ? { customerName: title(lastName) } : { customerName: "Cliente não identificado", customerNote: undefined };
}

function title(value: string) { return value ? value[0].toLocaleUpperCase("pt-BR") + value.slice(1) : value; }

export function convertOrderDraftToSales(rawText: string, options: OrderDraftConverterOptions): OrderDraftConversionResult {
  const source = normalizeAdminText(rawText);
  if (!source) return { ok: false, mode: "failed", sales: [], warnings: ["Rascunho vazio."], originalText: rawText };
  const matches: Array<ReturnType<typeof resolveAdminAssistantPerfumeReference> & { start: number; end: number }> = [];
  let offset = 0;
  while (offset < source.length) {
    const match = resolveAdminAssistantPerfumeReference(source.slice(offset), options.perfumes);
    if (!match) break;
    const start = offset + match.index;
    matches.push({ ...match, start, end: start + match.alias.length });
    offset = start + match.alias.length;
  }
  if (!matches.length) return { ok: false, mode: "failed", sales: [], warnings: ["Nenhum perfume cadastrado foi identificado."], originalText: rawText };

  const today = options.today ?? new Date();
  const saleDateFound = historicalDate(source.slice(0, matches[0].start), today);
  const saleDate = saleDateFound ?? toLocalDateInput(today);
  const globalPrice = parseNumber(source.match(/\b(?:cada um|cada uma|cada perfume|todos|valor de)\b[\s\S]*?(?:por|de)?\s*(?:r\$\s*)?(\d+(?:[,.]\d+)?)(?:\s*(?:reais|cada))?/)?.[1]);
  const collectionFragment = source.match(/\b(?:receber|pagar|ficou(?:\s+\d+(?:[,.]\d+)?)?\s+para)\s+(dia\s+\d{1,2}(?:\/\d{1,2})?(?:\s+de\s+\w+)?|proximo pagamento)/)?.[1];
  const globalExpectedDate = collectionFragment ? expectedDate(collectionFragment, today) : undefined;
  const sales: ConvertedDraftSale[] = [];

  matches.forEach((match, index) => {
    const previousEnd = index ? matches[index - 1].end : 0;
    const prefix = source.slice(previousEnd, match.start);
    const nextStart = matches[index + 1]?.start ?? source.length;
    const rawAfter = source.slice(match.end, nextStart);
    const localAfter = matches.length === 1 ? rawAfter : rawAfter.split(/[,;]/)[0];
    const customer = customerFromPrefix(prefix);
    const perfume = options.perfumes.find((item) => item.slug === match.perfume.slug)!;
    const localPrice = parseNumber(`${prefix} ${localAfter}`.match(/\bpor\s*(?:r\$\s*)?(\d+(?:[,.]\d+)?)/)?.[1]);
    const unitPrice = localPrice ?? globalPrice ?? perfume.defaultUnitPrice;
    const itemWarnings: string[] = [];
    if (match.legacy) itemWarnings.push("Perfume identificado por referência antiga/original. Confira antes de salvar.");
    if (localPrice === undefined && globalPrice === undefined) itemWarnings.push(`Preço padrão de R$ ${unitPrice.toFixed(2).replace(".", ",")} aplicado. Confira antes de salvar.`);
    const quantity = Math.max(1, Number(prefix.match(/(\d+)\s*$/)?.[1] ?? 1));
    const totalAmount = unitPrice * quantity;
    const paidNow = parseNumber(localAfter.match(/\bpagou\s+(\d+(?:[,.]\d+)?)/)?.[1]);
    const statedRemaining = parseNumber(localAfter.match(/\bficou\s+(?:devendo\s+)?(\d+(?:[,.]\d+)?)/)?.[1]);
    const method: ConvertedDraftSale["paymentMethod"] = localAfter.includes("pix") ? "pix" : localAfter.includes("dinheiro") ? "dinheiro" : localAfter.includes("cartao") ? "cartao" : "fiado";
    const clearlyPaid = /\b(pago|recebi|a vista)\b/.test(localAfter) || (/\bno pix\b/.test(localAfter) && paidNow === undefined);
    const partial = paidNow !== undefined && paidNow < totalAmount;
    const amountPaid = partial ? paidNow : clearlyPaid ? totalAmount : 0;
    const remainingAmount = partial ? statedRemaining ?? Math.max(0, totalAmount - amountPaid) : clearlyPaid ? 0 : totalAmount;
    const warnings = [...itemWarnings];
    if (customer.customerName === "Cliente não identificado") warnings.push("Cliente não identificado. Informe um nome antes de confirmar.");
    if (!saleDateFound) warnings.push("Data da venda não informada; hoje foi aplicado. Confira antes de salvar.");
    if (matches.length > 1 && method === "pix") warnings.push("Pix aplicado somente a esta venda por proximidade no texto. Confira antes de salvar.");
    const paymentStatus = remainingAmount <= 0 ? "pago" : amountPaid > 0 ? "partial" : "pendente";
    const localCollection = localAfter.match(/(?:para|ficou)[\s\S]*?(dia\s+\d{1,2}(?:\/\d{1,2})?(?:\s+de\s+\w+)?|proximo pagamento)/)?.[1];
    const expectedPaymentDate = paymentStatus === "pago" ? undefined : localCollection ? expectedDate(localCollection, today) : globalExpectedDate;
    sales.push({ ...customer, saleDate, items: [{ perfumeSlug: perfume.slug, perfumeName: perfume.name, quantity, unitPrice,
      totalPrice: totalAmount, confidence: warnings.length ? "media" : "alta", warnings: itemWarnings }], subtotal: totalAmount,
      discountValue: 0, totalAmount, amountPaid, remainingAmount, paymentStatus, paymentMethod: paymentStatus === "pago" || paymentStatus === "partial" ? method : "fiado",
      expectedPaymentDate, collectionNote: customer.customerNote, sourceDraftId: options.sourceDraftId,
      paidAt: paymentStatus === "pago" ? `${saleDate}T12:00:00.000Z` : undefined, warnings });
  });
  const warnings = sales.flatMap((sale, index) => sale.warnings.map((warning) => `Venda ${index + 1}: ${warning}`));
  const needsReview = warnings.length > 0 || sales.some((sale) => !sale.expectedPaymentDate && sale.paymentStatus !== "pago");
  return { ok: true, mode: needsReview ? "needs_review" : sales.length > 1 ? "multiple_sales" : "single_sale", sales, warnings, originalText: rawText };
}
