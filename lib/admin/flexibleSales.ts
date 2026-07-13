export type FlexibleLineType = "tradicional" | "arabe" | "outro";
export type SaleItemType = "sale" | "gift" | "personal_use" | "sample" | "exchange";
export type FlexiblePaymentStatus = "pago" | "pendente" | "fiado" | "partial";

export type FlexibleSaleItem = {
  id: string;
  perfumeSlug?: string;
  perfumeName: string;
  lineType: FlexibleLineType;
  quantity: number;
  unitPrice: number;
  originalUnitPrice: number;
  unitCost: number;
  discountValue: number;
  subtotal: number;
  total: number;
  itemType: SaleItemType;
  notes?: string;
};

export type FlexibleSaleLike = {
  id: string;
  perfumeSlug?: string;
  perfumeName?: string;
  lineType?: FlexibleLineType;
  quantity?: number;
  unitPrice?: number;
  unitCost?: number;
  items?: FlexibleSaleItem[];
  subtotal?: number;
  discountValue?: number;
  totalAmount?: number;
  amountPaid?: number;
  remainingAmount?: number;
};

export function createFlexibleItem(input: Omit<FlexibleSaleItem, "subtotal" | "total">): FlexibleSaleItem {
  const quantity = Math.max(1, Math.floor(Number(input.quantity) || 1));
  const originalUnitPrice = Math.max(0, Number(input.originalUnitPrice) || 0);
  const unitPrice = Math.max(0, Number(input.unitPrice) || 0);
  const subtotal = originalUnitPrice * quantity;
  const discountValue = Math.min(Math.max(0, Number(input.discountValue) || 0), unitPrice * quantity);
  const total = input.itemType === "sale" ? Math.max(0, unitPrice * quantity - discountValue) : 0;
  return { ...input, quantity, originalUnitPrice, unitPrice, discountValue, subtotal, total };
}

export function getSaleItems(sale: FlexibleSaleLike): FlexibleSaleItem[] {
  if (Array.isArray(sale.items) && sale.items.length > 0) return sale.items;
  return [createFlexibleItem({
    id: `${sale.id}-legacy`, perfumeSlug: sale.perfumeSlug,
    perfumeName: sale.perfumeName || "Perfume sem nome",
    lineType: sale.lineType ?? "tradicional", quantity: sale.quantity ?? 1,
    unitPrice: sale.unitPrice ?? 0, originalUnitPrice: sale.unitPrice ?? 0,
    unitCost: sale.unitCost ?? 0, discountValue: 0, itemType: "sale",
  })];
}

export function calculateFlexibleSale(items: FlexibleSaleItem[], amountPaid = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
  const discountValue = items.reduce((sum, item) => sum + item.discountValue, 0);
  const estimatedCost = items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
  const paid = Math.min(Math.max(0, Number(amountPaid) || 0), totalAmount);
  return { subtotal, discountValue, totalAmount, amountPaid: paid,
    remainingAmount: Math.max(0, totalAmount - paid), estimatedCost,
    estimatedProfit: totalAmount - estimatedCost,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0), itemCount: items.length };
}

export function getSaleTotal(sale: FlexibleSaleLike) {
  return sale.totalAmount ?? getSaleItems(sale).reduce((sum, item) => sum + item.total, 0);
}

export function getRemainingAmount(sale: FlexibleSaleLike & { status?: string }) {
  if (typeof sale.remainingAmount === "number") return Math.max(0, sale.remainingAmount);
  return sale.status === "pago" ? 0 : getSaleTotal(sale);
}

export function summarizeSaleItems(sale: FlexibleSaleLike) {
  return getSaleItems(sale).map((item) => `${item.quantity}x ${item.perfumeName}`).join(" + ");
}

export function itemTypeLabel(type: SaleItemType) {
  return { sale: "Venda", gift: "Brinde", personal_use: "Uso pessoal", sample: "Amostra", exchange: "Troca" }[type];
}
