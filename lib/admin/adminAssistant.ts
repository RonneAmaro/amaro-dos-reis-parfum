import { getRemainingAmount, getSaleTotal, summarizeSaleItems } from "./flexibleSales";
import { addDays, nextDayOfMonth, toLocalDateInput, type ExpectedPaymentMethod } from "./receivables";

export type AdminAssistantIntent =
  | "registrar_vendas_lote"
  | "registrar_pagamento"
  | "consultar_pendencias"
  | "consultar_cobrancas_por_data"
  | "remarcar_cobranca"
  | "cancelar_cobranca_ou_marcar_recebido"
  | "registrar_uso_pessoal"
  | "registrar_brinde"
  | "ajuda"
  | "desconhecido";

export type AdminAssistantSale = {
  id: string;
  customerName: string;
  customerPhone?: string;
  perfumeName: string;
  createdAt: string;
  status: string;
  expectedPaymentDate?: string;
  amountPaid?: number;
  remainingAmount?: number;
  totalAmount?: number;
  googleCalendarEventId?: string;
  items?: Parameters<typeof summarizeSaleItems>[0]["items"];
  unitPrice?: number;
  quantity?: number;
};

export type AdminAssistantAction = {
  type: Exclude<AdminAssistantIntent, "ajuda" | "desconhecido" | "consultar_pendencias" | "consultar_cobrancas_por_data">;
  saleId?: string;
  candidateSaleIds?: string[];
  customerName?: string;
  amount?: number;
  remainingAfter?: number;
  date?: string;
  expectedPaymentDate?: string;
  paymentMethod?: ExpectedPaymentMethod;
  perfumeSlug?: string;
  perfumeName?: string;
  quantity?: number;
  resolution?: "mark_paid" | "remove_reminder";
  batchSales?: AdminAssistantBatchSale[];
};

export type AdminAssistantBatchSale = {
  customerName: string;
  identification?: string;
  perfumeSlug: string;
  perfumeName: string;
  quantity: number;
  unitPrice: number;
  saleDate: string;
  status: "pago" | "pendente";
  expectedPaymentDate?: string;
  paymentMethod?: ExpectedPaymentMethod;
  paidAt?: string;
  warnings: string[];
};

export type AdminAssistantPreview = {
  intent: AdminAssistantIntent;
  confidence: "alta" | "media" | "baixa";
  title: string;
  message: string;
  warnings: string[];
  matches: AdminAssistantSale[];
  action?: AdminAssistantAction;
  requiresConfirmation: boolean;
};

export type AdminAssistantResult = {
  ok: boolean;
  preview: AdminAssistantPreview;
};

export type AdminAssistantPerfume = {
  slug: string;
  name: string;
};

const numberWords: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5,
  seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12,
  treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16,
  dezessete: 17, dezoito: 18, dezenove: 19, vinte: 20, trinta: 30,
  quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80,
  noventa: 90, cem: 100, cento: 100,
};

export function normalizeAdminText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function parseWrittenNumber(source: string): number | undefined {
  const words = normalizeAdminText(source).split(/[^a-z]+/).filter(Boolean);
  let total = 0;
  let found = false;
  for (const word of words) {
    if (word === "e") continue;
    const value = numberWords[word];
    if (value === undefined) continue;
    total += value;
    found = true;
  }
  return found ? total : undefined;
}

function parseValue(fragment: string): number | undefined {
  const numeric = fragment.match(/(?:r\$\s*)?(\d+(?:[,.]\d+)?)/);
  if (numeric) return Number(numeric[1].replace(",", "."));
  return parseWrittenNumber(fragment);
}

function paymentMethod(source: string): ExpectedPaymentMethod | undefined {
  if (source.includes("pix")) return "pix";
  if (source.includes("dinheiro")) return "dinheiro";
  if (source.includes("cartao")) return "cartao";
  if (source.includes("salario") || source.includes("proximo pagamento")) return "salario";
  if (source.includes("outro")) return "outro";
  return undefined;
}

function relativeDate(source: string, purpose: "paid" | "future"): string | undefined {
  if (source.includes("ontem")) return addDays(toLocalDateInput(), -1);
  if (source.includes("amanha")) return addDays(toLocalDateInput(), 1);
  if (source.includes("hoje")) return toLocalDateInput();
  if (source.includes("proximo pagamento")) return nextDayOfMonth(5);
  if (source.includes("proximo mes")) {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return toLocalDateInput(date);
  }
  const day = source.match(/\bdia\s+(\d{1,2})\b/)?.[1];
  if (day) return purpose === "future" ? nextDayOfMonth(Number(day)) : undefined;
  return undefined;
}

function detectIntent(source: string): AdminAssistantIntent {
  if (/\b(vendi|tambem vendi|(?:fazer|registrar|cadastrar|anota) essas?(?: \w+)? vendas?)\b/.test(source)
    || (source.match(/\bvendi\b/g)?.length ?? 0) > 1) return "registrar_vendas_lote";
  if (/\b(ajuda|o que posso falar|exemplos? de comandos?)\b/.test(source)) return "ajuda";
  if (/\b(retirei|peguei)\b/.test(source) && /\b(uso pessoal|para mim)\b/.test(source)) return "registrar_uso_pessoal";
  if (/\b(dei|presente|brinde)\b/.test(source) && /\b(brinde|presente|dei)\b/.test(source)) return "registrar_brinde";
  if (/\b(remarca|remarcar|joga|muda)\b/.test(source)) return "remarcar_cobranca";
  if (/\b(cancela|cancelar|tira o lembrete|marca.+como pag[ao]|ja pagou)\b/.test(source)) return "cancelar_cobranca_ou_marcar_recebido";
  if (/\b(pagou|pago|recebi)\b/.test(source)) return "registrar_pagamento";
  if (/\b(cobrar)\b/.test(source) && /\b(hoje|amanha|dia|pagamento)\b/.test(source)) return "consultar_cobrancas_por_data";
  if (/\b(devendo|pendentes?|falta pagar|atrasadas?)\b/.test(source)) return "consultar_pendencias";
  return "desconhecido";
}

const monthNumbers: Record<string, number> = {
  janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

const perfumeAliases: Array<{ canonical: string; aliases: string[] }> = [
  { canonical: "Silverion Black", aliases: ["silverion black", "silver black", "azzaro silver black"] },
  { canonical: "Scarlet Noir", aliases: ["scarlet noir", "scarle noir", "scarlat noir", "scandalo", "scandal", "scandal pour homme", "escandalo"] },
  { canonical: "Sultan Noir", aliases: ["sultan noir", "sultan"] },
  { canonical: "Samarah Rose", aliases: ["samarah rose", "samarah"] },
  { canonical: "Belle Venom", aliases: ["belle venom", "good girl"] },
  { canonical: "Moon Candy", aliases: ["moon candy", "fantasy"] },
  { canonical: "Lumiara", aliases: ["lumiara", "la nuit tresor"] },
];

function dateInput(day: number, month: number, year = new Date().getFullYear()) {
  const safe = new Date(year, month - 1, day);
  if (safe.getFullYear() !== year || safe.getMonth() !== month - 1 || safe.getDate() !== day) return undefined;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function explicitDate(fragment: string) {
  const numeric = fragment.match(/\bdia\s+(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{2,4}))?/);
  if (numeric) {
    const rawYear = numeric[3] ? Number(numeric[3]) : new Date().getFullYear();
    return dateInput(Number(numeric[1]), Number(numeric[2]), rawYear < 100 ? 2000 + rawYear : rawYear);
  }
  const named = fragment.match(/\bdia\s+(\d{1,2})(?:\s+(?:agora\s+)?(?:no\s+mes\s+)?de?\s*)?(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/);
  return named ? dateInput(Number(named[1]), monthNumbers[named[2]]) : undefined;
}

function findBatchPerfume(segment: string, perfumes: AdminAssistantPerfume[]) {
  const candidates = perfumeAliases.flatMap((entry) => entry.aliases.map((alias) => ({ ...entry, alias })))
    .sort((a, b) => b.alias.length - a.alias.length);
  for (const candidate of candidates) {
    const index = segment.indexOf(candidate.alias);
    if (index < 0) continue;
    const perfume = perfumes.find((item) => normalizeAdminText(item.name) === normalizeAdminText(candidate.canonical));
    if (perfume) return { perfume, alias: candidate.alias, index, legacy: candidate.alias !== normalizeAdminText(candidate.canonical) };
  }
  const direct = perfumes.map((perfume) => ({ perfume, alias: normalizeAdminText(perfume.name) }))
    .sort((a, b) => b.alias.length - a.alias.length).find((item) => segment.includes(item.alias));
  return direct ? { ...direct, index: segment.indexOf(direct.alias), legacy: false } : undefined;
}

function titleName(value: string) {
  return value ? value[0].toLocaleUpperCase("pt-BR") + value.slice(1) : value;
}

function batchCustomer(segment: string, perfumeIndex: number, perfumeAlias: string) {
  const beforePerfume = segment.slice(0, perfumeIndex);
  const afterPerfume = segment.slice(perfumeIndex + perfumeAlias.length);
  const beforeMatch = beforePerfume.match(/\bpara\s+(?:a\s+|o\s+)?(?:(cuidadora|professora|secretaria)\s+)?([a-z]{3,})([\s\S]*)$/);
  const afterMatch = afterPerfume.match(/\bpara\s+(?:a\s+|o\s+)?(?:(cuidadora|professora|secretaria)\s+)?([a-z]{3,})/);
  const match = beforeMatch ?? afterMatch;
  if (!match) return undefined;
  const roleBefore = match[1];
  const customerName = titleName(match[2]);
  const suffix = beforeMatch?.[3] ?? "";
  let identification = roleBefore;
  if (/\bcuidadora\b/.test(suffix)) identification = "cuidadora";
  else if (/\bprofessora\b/.test(suffix)) identification = "professora";
  else if (/\bsecretaria\b/.test(suffix)) {
    const school = suffix.match(/\bescola\s+([a-z\s]+?)(?=\s+(?:um|uma|\d+)\s+(?:perfume\s+)?$|$)/)?.[1]?.trim();
    identification = school ? `secretaria da Escola ${school.split(" ").map(titleName).join(" ")}` : "secretaria";
  }
  return { customerName, identification };
}

function parseBatchSales(source: string, perfumes: AdminAssistantPerfume[]) {
  const globalValueFragment = source.match(/\b(?:cada perfume|cada um|cada uma|todos)\b[\s\S]*?(?:(?:no\s+)?valor\s+de|por|de)?\s*(?:r\$\s*)?(\d+(?:[,.]\d+)?)/);
  const globalValue = globalValueFragment ? Number(globalValueFragment[1].replace(",", ".")) : undefined;
  const chunks = source.replace(/\s+(?:e\s+)?tambem\s+vendi\b/g, " ||| vendi").split("|||")
    .map((part) => part.trim()).filter((part) => /\bvendi\b/.test(part));
  const batch: AdminAssistantBatchSale[] = [];
  let inheritedSaleDate: string | undefined;
  for (const chunk of chunks) {
    const perfumeMatch = findBatchPerfume(chunk, perfumes);
    if (!perfumeMatch) continue;
    const customer = batchCustomer(chunk, perfumeMatch.index, perfumeMatch.alias);
    if (!customer) continue;
    const receiveFragment = chunk.match(/\b(?:para\s+receber|receber|para\s+pagar|pagar)\b([\s\S]*?)(?=\b(?:isso|cada perfume|cada um|cada uma|todos|fazer essas|$))/)?.[1];
    const beforeReceive = chunk.split(/\b(?:para\s+receber|receber|para\s+pagar|pagar)\b/)[0];
    const ownSaleDate = explicitDate(beforeReceive);
    const saleDate = ownSaleDate ?? inheritedSaleDate ?? toLocalDateInput();
    inheritedSaleDate = saleDate;
    const expectedPaymentDate = receiveFragment ? explicitDate(receiveFragment)
      ?? (() => { const day = receiveFragment.match(/\bdia\s+(\d{1,2})\b/)?.[1]; return day ? dateInput(Number(day), new Date().getMonth() + 1) : undefined; })() : undefined;
    const localPricePart = chunk.split(/\b(?:cada perfume|cada um|cada uma|todos)\b/)[0];
    const localValueMatch = localPricePart.match(/\b(?:por|valor de)\s*(?:r\$\s*)?(\d+(?:[,.]\d+)?)/);
    const unitPrice = localValueMatch ? Number(localValueMatch[1].replace(",", ".")) : globalValue ?? 0;
    const quantityFragment = chunk.slice(Math.max(0, perfumeMatch.index - 24), perfumeMatch.index);
    const quantity = Math.max(1, Math.floor(parseValue(quantityFragment) ?? 1));
    const paid = /\b(recebi|pago|pagou)\b[\s\S]*?\b(pix|a vista)\b|\ba vista\b/.test(chunk);
    const warnings: string[] = [];
    if (perfumeMatch.legacy) warnings.push("Perfume identificado por referência antiga/original. Confira antes de salvar.");
    if (!ownSaleDate && batch.length > 0) warnings.push("Data da venda herdada da venda anterior. Confira antes de salvar.");
    if (!unitPrice) warnings.push("Valor não identificado. Confira antes de salvar.");
    batch.push({ ...customer, perfumeSlug: perfumeMatch.perfume.slug, perfumeName: perfumeMatch.perfume.name,
      quantity, unitPrice, saleDate, status: paid ? "pago" : "pendente",
      expectedPaymentDate: paid ? undefined : expectedPaymentDate, paymentMethod: paid ? paymentMethod(chunk) ?? "outro" : undefined,
      paidAt: paid ? `${saleDate}T12:00:00.000Z` : undefined, warnings });
  }
  return batch;
}

function findCustomer(source: string, sales: AdminAssistantSale[]): string | undefined {
  const names = [...new Set(sales.map((sale) => sale.customerName).filter(Boolean))]
    .sort((a, b) => b.length - a.length);
  const sourceWords = source.split(/[^a-z0-9]+/).filter((word) => word.length >= 3);
  return names.find((name) => {
    const normalizedName = normalizeAdminText(name);
    if (source.includes(normalizedName)) return true;
    return normalizedName.split(/[^a-z0-9]+/).some((nameWord) =>
      nameWord.length >= 3 && sourceWords.some((sourceWord) =>
        nameWord.startsWith(sourceWord) || sourceWord.startsWith(nameWord)
      )
    );
  });
}

function pendingMatches(customer: string | undefined, sales: AdminAssistantSale[]) {
  const pending = sales.filter((sale) => sale.status !== "pago" && getRemainingAmount(sale) > 0);
  if (!customer) return [];
  const target = normalizeAdminText(customer);
  return pending.filter((sale) => {
    const name = normalizeAdminText(sale.customerName);
    return name === target || name.includes(target) || target.includes(name);
  });
}

function describeSale(sale: AdminAssistantSale) {
  const date = sale.expectedPaymentDate ? new Intl.DateTimeFormat("pt-BR").format(new Date(`${sale.expectedPaymentDate}T12:00:00`)) : "sem data";
  return `${sale.customerName}: ${summarizeSaleItems(sale)}, saldo ${formatCurrency(getRemainingAmount(sale))}, cobrança ${date}`;
}

function basePreview(intent: AdminAssistantIntent, title: string, message: string): AdminAssistantPreview {
  return { intent, confidence: "baixa", title, message, warnings: [], matches: [], requiresConfirmation: false };
}

function parsePaymentAmount(source: string): number | undefined {
  if (source.includes("restante")) return undefined;
  const withoutDates = source.replace(/\bdia\s+\d{1,2}\b/g, "");
  const afterPaid = withoutDates.match(/\bpagou\b([\s\S]*?)(?=\be ficou\b|\bpara\b|$)/)?.[1] ?? "";
  return parseValue(afterPaid);
}

function parseRemainingAfter(source: string): number | undefined {
  const fragment = source.match(/\bficou\s+([\s\S]*?)(?=\bpara\b|$)/)?.[1];
  return fragment ? parseValue(fragment) : undefined;
}

export function interpretAdminCommand(
  text: string,
  sales: AdminAssistantSale[],
  perfumes: AdminAssistantPerfume[]
): AdminAssistantResult {
  const source = normalizeAdminText(text);
  const intent = detectIntent(source);

  if (!source || intent === "desconhecido") {
    return { ok: false, preview: basePreview("desconhecido", "Comando não reconhecido", "Não consegui entender com segurança. Tente informar cliente, ação, valor e data.") };
  }
  if (intent === "registrar_vendas_lote") {
    const batchSales = parseBatchSales(source, perfumes);
    if (!batchSales.length) {
      return { ok: false, preview: basePreview(intent, "Vendas não identificadas", "Não encontrei detalhes suficientes para montar as vendas. Informe cliente e perfume em cada venda.") };
    }
    const warnings = batchSales.flatMap((sale, index) => sale.warnings.map((warning) => `Venda ${index + 1}: ${warning}`));
    const complete = batchSales.every((sale) => sale.customerName && sale.perfumeSlug && sale.unitPrice > 0);
    return { ok: true, preview: {
      intent, confidence: complete && warnings.length === 0 ? "alta" : "media",
      title: `${batchSales.length} venda(s) detectada(s)`,
      message: "Revise cada venda abaixo. O lote só será criado depois da sua confirmação.",
      warnings, matches: [], requiresConfirmation: true,
      action: { type: intent, batchSales },
    } };
  }
  if (intent === "ajuda") {
    return { ok: true, preview: { ...basePreview(intent, "Exemplos de comandos", "Você pode consultar pendências e cobranças, registrar pagamentos, remarcar datas, quitar cobranças e registrar brindes ou uso pessoal. Toda alteração exige confirmação."), confidence: "alta" } };
  }
  if (intent === "consultar_pendencias") {
    const today = toLocalDateInput();
    const matches = sales.filter((sale) => sale.status !== "pago" && getRemainingAmount(sale) > 0
      && (!source.includes("atrasad") || Boolean(sale.expectedPaymentDate && sale.expectedPaymentDate < today)));
    const message = matches.length ? matches.map(describeSale).join("\n") : "Não há pendências registradas.";
    return { ok: true, preview: { ...basePreview(intent, "Pendências encontradas", message), confidence: "alta", matches } };
  }
  if (intent === "consultar_cobrancas_por_data") {
    const date = relativeDate(source, "future");
    if (!date) return { ok: false, preview: basePreview(intent, "Data não identificada", "Informe hoje, amanhã, dia 5, dia 15 ou próximo pagamento.") };
    const matches = sales.filter((sale) => sale.status !== "pago" && sale.expectedPaymentDate === date && getRemainingAmount(sale) > 0);
    const message = matches.length ? matches.map(describeSale).join("\n") : "Não há cobranças nessa data.";
    return { ok: true, preview: { ...basePreview(intent, "Cobranças por data", message), confidence: "alta", matches } };
  }

  if (intent === "registrar_uso_pessoal" || intent === "registrar_brinde") {
    const perfume = perfumes.find((item) => source.includes(normalizeAdminText(item.name)));
    if (!perfume) return { ok: false, preview: basePreview(intent, "Perfume não identificado", "Não encontrei um perfume cadastrado no comando. Confira o nome e tente novamente.") };
    const beforePerfume = source.slice(0, source.indexOf(normalizeAdminText(perfume.name)));
    const quantity = Math.max(1, Math.floor(parseValue(beforePerfume) ?? 1));
    const customerMatch = intent === "registrar_brinde" ? text.match(/(?:para|presente\s+para)\s+([\p{L}][\p{L}\s]*)$/iu) : undefined;
    const customerName = intent === "registrar_uso_pessoal" ? "Uso pessoal" : customerMatch?.[1]?.trim() || "Cliente não identificado";
    const label = intent === "registrar_uso_pessoal" ? "uso pessoal" : `brinde para ${customerName}`;
    return { ok: true, preview: {
      intent, confidence: customerName === "Cliente não identificado" ? "media" : "alta",
      title: intent === "registrar_uso_pessoal" ? "Registrar uso pessoal" : "Registrar brinde",
      message: `Será registrada a retirada de ${quantity}x ${perfume.name} como ${label}. O estoque será reduzido somente após a confirmação.`,
      warnings: customerName === "Cliente não identificado" ? ["O nome do destinatário não foi identificado."] : [], matches: [], requiresConfirmation: true,
      action: { type: intent, perfumeSlug: perfume.slug, perfumeName: perfume.name, quantity, customerName },
    } };
  }

  const customer = findCustomer(source, sales);
  const matches = pendingMatches(customer, sales);
  if (!customer || matches.length === 0) {
    return { ok: false, preview: { ...basePreview(intent, "Pendência não encontrada", customer ? `Não encontrei dívida pendente para ${customer}. Confira o nome ou consulte as pendências.` : "Não identifiquei um cliente cadastrado no comando."), confidence: customer ? "media" : "baixa" } };
  }
  const candidateSaleIds = matches.map((sale) => sale.id);
  const selectionWarning = matches.length > 1 ? ["Há mais de uma pendência. Escolha a venda correta antes de confirmar."] : [];

  if (intent === "remarcar_cobranca") {
    const date = relativeDate(source, "future");
    if (!date) return { ok: false, preview: basePreview(intent, "Nova data não identificada", "Informe a nova data da cobrança, como amanhã, dia 5 ou dia 15.") };
    return { ok: true, preview: { intent, confidence: matches.length === 1 ? "alta" : "media", title: "Remarcar cobrança",
      message: `A cobrança de ${customer} será remarcada para ${date}.`, warnings: selectionWarning, matches, requiresConfirmation: true,
      action: { type: intent, saleId: matches.length === 1 ? matches[0].id : undefined, candidateSaleIds, customerName: customer, date } } };
  }
  if (intent === "cancelar_cobranca_ou_marcar_recebido") {
    const removeReminderOnly = source.includes("tira o lembrete")
      && !source.includes("pagou") && !source.includes("paga") && !source.includes("pago");
    return { ok: true, preview: { intent, confidence: matches.length === 1 ? "alta" : "media",
      title: removeReminderOnly ? "Cancelar lembrete de cobrança" : "Marcar cobrança como recebida",
      message: removeReminderOnly
        ? `O lembrete de cobrança de ${customer} será cancelado, sem marcar a venda como paga.`
        : `A pendência de ${customer} será marcada como paga.`,
      warnings: selectionWarning, matches, requiresConfirmation: true,
      action: { type: intent, saleId: matches.length === 1 ? matches[0].id : undefined, candidateSaleIds, customerName: customer,
        date: relativeDate(source, "paid") ?? toLocalDateInput(), resolution: removeReminderOnly ? "remove_reminder" : "mark_paid" } } };
  }

  const amount = parsePaymentAmount(source);
  const remainingAfter = parseRemainingAfter(source);
  const amountMatchedSales = matches.filter((sale) => {
    const balance = getRemainingAmount(sale);
    return (amount !== undefined && Math.abs(balance - amount) <= 0.01)
      || (amount !== undefined && remainingAfter !== undefined && Math.abs(balance - amount - remainingAfter) <= 0.01);
  });
  const paymentMatches = matches.length > 1 && amountMatchedSales.length === 1 ? amountMatchedSales : matches;
  const selected = paymentMatches.length === 1 ? paymentMatches[0] : undefined;
  const balance = selected ? getRemainingAmount(selected) : undefined;
  const effectiveAmount = source.includes("restante") && balance !== undefined ? balance : amount;
  const paymentCandidateSaleIds = paymentMatches.map((sale) => sale.id);
  const warnings = paymentMatches.length > 1 ? ["Há mais de uma pendência. Escolha a venda correta antes de confirmar."] : [];
  if (effectiveAmount === undefined && remainingAfter === undefined) warnings.push("O valor não foi identificado; ao confirmar será usado o saldo total da venda escolhida.");
  if (balance !== undefined && effectiveAmount !== undefined && effectiveAmount > balance) warnings.push("Valor pago maior que o saldo pendente. Confira antes de confirmar.");
  if (balance !== undefined && effectiveAmount !== undefined && remainingAfter !== undefined
    && Math.abs(balance - effectiveAmount - remainingAfter) > 0.01) {
    warnings.push(`Os valores informados não fecham com o saldo atual de ${formatCurrency(balance)}. Confira antes de confirmar.`);
  }
  return { ok: true, preview: { intent, confidence: paymentMatches.length === 1 && (effectiveAmount !== undefined || source.includes("restante")) ? "alta" : "media",
    title: "Registrar pagamento", message: `Pagamento de ${customer}: ${effectiveAmount === undefined ? "saldo restante" : formatCurrency(effectiveAmount)}${remainingAfter !== undefined ? `, permanecendo ${formatCurrency(remainingAfter)}` : ""}, via ${paymentMethod(source) ?? "forma não informada"}, em ${relativeDate(source, "paid") ?? toLocalDateInput()}.`,
    warnings, matches: paymentMatches, requiresConfirmation: true,
    action: { type: intent, saleId: selected?.id, candidateSaleIds: paymentCandidateSaleIds, customerName: customer, amount: effectiveAmount, remainingAfter,
      date: relativeDate(source, "paid") ?? toLocalDateInput(),
      expectedPaymentDate: remainingAfter !== undefined ? relativeDate(source, "future") : undefined,
      paymentMethod: paymentMethod(source) } } };
}

export function resolveAdminAssistantSale(action: AdminAssistantAction, saleId: string): AdminAssistantAction {
  if (!action.candidateSaleIds?.includes(saleId)) return action;
  return { ...action, saleId };
}

export function paymentUpdateForAction(sale: AdminAssistantSale, action: AdminAssistantAction) {
  const total = getSaleTotal(sale);
  const currentPaid = Math.max(0, sale.amountPaid ?? (sale.status === "pago" ? total : total - getRemainingAmount(sale)));
  const currentRemaining = getRemainingAmount(sale);
  const paidNow = action.amount ?? currentRemaining;
  const remainingAmount = action.remainingAfter !== undefined
    ? Math.max(0, action.remainingAfter)
    : Math.max(0, currentRemaining - paidNow);
  const amountPaid = Math.min(total, Math.max(currentPaid, total - remainingAmount));
  return { total, paidNow, amountPaid, remainingAmount, status: remainingAmount <= 0 ? "pago" as const : "partial" as const };
}
