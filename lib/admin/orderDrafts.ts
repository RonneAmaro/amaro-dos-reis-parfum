export const ORDER_DRAFTS_STORAGE_KEY = "amaro_order_drafts_v1";

export type OrderDraftStatus = "pending" | "converted" | "archived";
export type OrderDraftSource = "text" | "voice";

export type OrderDraft = {
  id: string;
  rawText: string;
  status: OrderDraftStatus;
  createdAt: string;
  updatedAt: string;
  source: OrderDraftSource;
  detectedCustomerName?: string;
  detectedAmount?: number;
  note?: string;
};

type NewOrderDraft = Pick<OrderDraft, "rawText" | "source"> & Partial<Pick<OrderDraft, "detectedCustomerName" | "detectedAmount" | "note">>;

function storageAvailable() {
  try { return typeof window !== "undefined" && Boolean(window.localStorage); }
  catch { return false; }
}

function createDraftId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function validDraft(value: unknown): value is OrderDraft {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<OrderDraft>;
  return typeof item.id === "string" && typeof item.rawText === "string"
    && (item.status === "pending" || item.status === "converted" || item.status === "archived")
    && typeof item.createdAt === "string" && typeof item.updatedAt === "string"
    && (item.source === "text" || item.source === "voice");
}

function persist(drafts: OrderDraft[]) {
  if (!storageAvailable()) return false;
  try {
    if (drafts.length) window.localStorage.setItem(ORDER_DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    else window.localStorage.removeItem(ORDER_DRAFTS_STORAGE_KEY);
    return true;
  } catch { return false; }
}

export function getOrderDrafts(): OrderDraft[] {
  if (!storageAvailable()) return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(ORDER_DRAFTS_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(validDraft).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
  } catch {
    return [];
  }
}

export function saveOrderDraft(input: NewOrderDraft): OrderDraft {
  const now = new Date().toISOString();
  const draft: OrderDraft = { id: createDraftId(), rawText: input.rawText, status: "pending", source: input.source,
    createdAt: now, updatedAt: now, detectedCustomerName: input.detectedCustomerName,
    detectedAmount: input.detectedAmount, note: input.note };
  if (!persist([draft, ...getOrderDrafts()])) throw new Error("Não foi possível salvar o rascunho neste navegador.");
  return draft;
}

export function updateOrderDraft(id: string, changes: Partial<Omit<OrderDraft, "id" | "createdAt">>): OrderDraft | null {
  let updated: OrderDraft | null = null;
  const drafts = getOrderDrafts().map((draft) => {
    if (draft.id !== id) return draft;
    updated = { ...draft, ...changes, id: draft.id, createdAt: draft.createdAt, updatedAt: new Date().toISOString() };
    return updated;
  });
  return persist(drafts) ? updated : null;
}

export const archiveOrderDraft = (id: string) => updateOrderDraft(id, { status: "archived" });
export const markOrderDraftConverted = (id: string) => updateOrderDraft(id, { status: "converted" });

export function deleteOrderDraft(id: string) {
  const drafts = getOrderDrafts();
  const remaining = drafts.filter((draft) => draft.id !== id);
  return remaining.length !== drafts.length && persist(remaining);
}

function csvCell(value: string | number | undefined) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function exportOrderDraftsCsv(drafts = getOrderDrafts()) {
  const header = ["id", "status", "origem", "criado_em", "atualizado_em", "cliente_detectado", "valor_detectado", "observacao", "texto_bruto"];
  const rows = drafts.map((draft) => [draft.id, draft.status, draft.source, draft.createdAt, draft.updatedAt,
    draft.detectedCustomerName, draft.detectedAmount, draft.note, draft.rawText].map(csvCell).join(";"));
  return `\uFEFF${header.map(csvCell).join(";")}\n${rows.join("\n")}`;
}

export function exportOrderDraftsJson(drafts = getOrderDrafts()) {
  return JSON.stringify({ version: ORDER_DRAFTS_STORAGE_KEY, exportedAt: new Date().toISOString(), drafts }, null, 2);
}
