import type { FlexibleSaleItem } from "./flexibleSales";

type LineType = "tradicional" | "arabe";
type PaymentMethod = "dinheiro" | "pix" | "cartao" | "fiado";
type SaleStatus = "pago" | "pendente" | "fiado" | "partial";
type ExpectedPaymentMethod = "pix" | "dinheiro" | "cartao" | "salario" | "outro";

export type LocalSale = {
  id: string;
  customerName: string;
  perfumeSlug: string;
  perfumeName: string;
  lineType: LineType;
  unitPrice: number;
  unitCost?: number;
  estimatedProfit?: number;
  quantity: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes: string;
  createdAt: string;
  paidAt?: string;
  customerPhone?: string;
  expectedPaymentDate?: string;
  expectedPaymentMethod?: ExpectedPaymentMethod;
  collectionNote?: string;
  items?: FlexibleSaleItem[];
  subtotal?: number;
  discountValue?: number;
  totalAmount?: number;
  amountPaid?: number;
  remainingAmount?: number;
};

export type LocalInventoryItem = {
  perfumeSlug: string;
  perfumeName: string;
  lineType: LineType;
  stockQuantity: number;
  unitCost: number;
  salePrice: number;
  minimumStock: number;
  updatedAt: string;
};

type SupabaseSaleRecord = {
  id?: string | null;
  local_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  perfume_slug?: string | null;
  perfume_name?: string | null;
  line_type?: string | null;
  unit_price?: number | string | null;
  unit_cost?: number | string | null;
  quantity?: number | string | null;
  payment_method?: string | null;
  status?: string | null;
  notes?: string | null;
  estimated_profit?: number | string | null;
  created_at?: string | null;
  paid_at?: string | null;
  expected_payment_date?: string | null;
  expected_payment_method?: string | null;
  collection_note?: string | null;
  items?: unknown;
  subtotal?: number | string | null;
  discount_value?: number | string | null;
  total_amount?: number | string | null;
  amount_paid?: number | string | null;
  remaining_amount?: number | string | null;
};

type SupabaseInventoryRecord = {
  perfume_slug?: string | null;
  perfume_name?: string | null;
  line_type?: string | null;
  stock_quantity?: number | string | null;
  unit_cost?: number | string | null;
  sale_price?: number | string | null;
  minimum_stock?: number | string | null;
  updated_at?: string | null;
  synced_at?: string | null;
};

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function safeInteger(value: unknown, fallback = 0) {
  return Math.max(0, Math.floor(safeNumber(value, fallback)));
}

function safeIso(value: unknown, fallback = new Date().toISOString()) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function optionalIso(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeLineType(value: unknown): LineType {
  return value === "arabe" || value === "arabic_premium"
    ? "arabe"
    : "tradicional";
}

function normalizePaymentMethod(value: unknown): PaymentMethod {
  if (
    value === "dinheiro" ||
    value === "pix" ||
    value === "cartao" ||
    value === "fiado"
  ) {
    return value;
  }

  return "cartao";
}

function normalizeStatus(value: unknown): SaleStatus {
  return value === "pendente" || value === "fiado" || value === "partial" ? value : "pago";
}

function normalizeExpectedPaymentMethod(value: unknown): ExpectedPaymentMethod | undefined {
  return value === "pix" || value === "dinheiro" || value === "cartao" || value === "salario" || value === "outro"
    ? value
    : undefined;
}

function defaultSalePrice(lineType: LineType) {
  return lineType === "arabe" ? 120 : 80;
}

function defaultUnitCost(lineType: LineType) {
  return lineType === "arabe" ? 41.4 : 24.75;
}

export function mapLocalSaleToSupabaseInsert(sale: LocalSale) {
  const lineType = normalizeLineType(sale.lineType);
  const quantity = Math.max(1, safeInteger(sale.quantity, 1));
  const unitPrice = safeNumber(sale.unitPrice, defaultSalePrice(lineType));
  const unitCost =
    sale.unitCost === undefined
      ? null
      : safeNumber(sale.unitCost, defaultUnitCost(lineType));
  const estimatedProfit =
    sale.estimatedProfit === undefined
      ? unitCost === null
        ? null
        : (unitPrice - unitCost) * quantity
      : safeNumber(sale.estimatedProfit, 0);
  const createdAt = safeIso(sale.createdAt);

  return {
    local_id: safeString(sale.id, `${createdAt}-${safeString(sale.perfumeSlug)}`),
    customer_name: safeString(sale.customerName, "Cliente sem nome"),
    customer_phone: safeString(sale.customerPhone) || null,
    perfume_slug: safeString(sale.perfumeSlug),
    perfume_name: safeString(sale.perfumeName, "Perfume sem nome"),
    line_type: lineType,
    unit_price: unitPrice,
    unit_cost: unitCost,
    quantity,
    payment_method: normalizePaymentMethod(sale.paymentMethod),
    status: normalizeStatus(sale.status),
    notes: safeString(sale.notes) || null,
    estimated_profit: estimatedProfit,
    created_at: createdAt,
    paid_at: optionalIso(sale.paidAt),
    expected_payment_date: safeString(sale.expectedPaymentDate) || null,
    expected_payment_method: sale.expectedPaymentMethod ?? null,
    collection_note: safeString(sale.collectionNote) || null,
    items: sale.items ?? null,
    subtotal: sale.subtotal ?? null,
    discount_value: sale.discountValue ?? null,
    total_amount: sale.totalAmount ?? null,
    amount_paid: sale.amountPaid ?? null,
    remaining_amount: sale.remainingAmount ?? null,
    synced_at: new Date().toISOString(),
  };
}

export function mapSupabaseSaleToLocal(row: SupabaseSaleRecord): LocalSale {
  const lineType = normalizeLineType(row.line_type);
  const quantity = Math.max(1, safeInteger(row.quantity, 1));
  const unitPrice = safeNumber(row.unit_price, defaultSalePrice(lineType));
  const unitCost =
    row.unit_cost === null || row.unit_cost === undefined
      ? undefined
      : safeNumber(row.unit_cost, defaultUnitCost(lineType));
  const estimatedProfit =
    row.estimated_profit === null || row.estimated_profit === undefined
      ? unitCost === undefined
        ? undefined
        : (unitPrice - unitCost) * quantity
      : safeNumber(row.estimated_profit, 0);

  return {
    id: safeString(row.local_id, safeString(row.id, `${Date.now()}`)),
    customerName: safeString(row.customer_name, "Cliente sem nome"),
    perfumeSlug: safeString(row.perfume_slug),
    perfumeName: safeString(row.perfume_name, "Perfume sem nome"),
    lineType,
    unitPrice,
    unitCost,
    estimatedProfit,
    quantity,
    paymentMethod: normalizePaymentMethod(row.payment_method),
    status: normalizeStatus(row.status),
    notes: safeString(row.notes),
    createdAt: safeIso(row.created_at),
    paidAt: optionalIso(row.paid_at) ?? undefined,
    customerPhone: safeString(row.customer_phone) || undefined,
    expectedPaymentDate: safeString(row.expected_payment_date) || undefined,
    expectedPaymentMethod: normalizeExpectedPaymentMethod(row.expected_payment_method),
    collectionNote: safeString(row.collection_note) || undefined,
    items: Array.isArray(row.items) ? row.items as FlexibleSaleItem[] : undefined,
    subtotal: row.subtotal == null ? undefined : safeNumber(row.subtotal),
    discountValue: row.discount_value == null ? undefined : safeNumber(row.discount_value),
    totalAmount: row.total_amount == null ? undefined : safeNumber(row.total_amount),
    amountPaid: row.amount_paid == null ? undefined : safeNumber(row.amount_paid),
    remainingAmount: row.remaining_amount == null ? undefined : safeNumber(row.remaining_amount),
  };
}

export function mapLocalInventoryToSupabaseUpsert(item: LocalInventoryItem) {
  const lineType = normalizeLineType(item.lineType);

  return {
    perfume_slug: safeString(item.perfumeSlug),
    perfume_name: safeString(item.perfumeName, "Perfume sem nome"),
    line_type: lineType,
    stock_quantity: safeInteger(item.stockQuantity, 0),
    unit_cost: safeNumber(item.unitCost, defaultUnitCost(lineType)),
    sale_price: safeNumber(item.salePrice, defaultSalePrice(lineType)),
    minimum_stock: safeInteger(item.minimumStock, 0),
    updated_at: safeIso(item.updatedAt),
    synced_at: new Date().toISOString(),
  };
}

export function mapSupabaseInventoryToLocal(
  row: SupabaseInventoryRecord
): LocalInventoryItem {
  const lineType = normalizeLineType(row.line_type);

  return {
    perfumeSlug: safeString(row.perfume_slug),
    perfumeName: safeString(row.perfume_name, "Perfume sem nome"),
    lineType,
    stockQuantity: safeInteger(row.stock_quantity, 0),
    unitCost: safeNumber(row.unit_cost, defaultUnitCost(lineType)),
    salePrice: safeNumber(row.sale_price, defaultSalePrice(lineType)),
    minimumStock: safeInteger(row.minimum_stock, 0),
    updatedAt: safeIso(row.updated_at ?? row.synced_at),
  };
}
