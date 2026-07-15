export type AdminAiContext = "admin_assistant" | "order_draft" | "sale_conversion";
export type AdminAiMode = "single_sale" | "multiple_sales" | "payment" | "stock" | "reminder" | "query" | "unknown";
export type AdminAiItem = { perfumeName: string; quantity: number; unitPrice?: number; totalPrice?: number; confidence: number; warnings: string[] };
export type AdminAiSale = { customerName?: string; customerNote?: string; saleDate?: string; expectedPaymentDate?: string; paymentMethod?: string; paymentStatus?: string; amountPaid?: number; remainingAmount?: number; totalAmount?: number; items: AdminAiItem[]; warnings: string[] };
export type AdminAiResult = { intent: string; confidence: number; mode: AdminAiMode; customerName?: string; customerNote?: string; saleDate?: string; expectedPaymentDate?: string; paymentMethod?: string; paymentStatus?: string; amountPaid?: number; remainingAmount?: number; totalAmount?: number; items: AdminAiItem[]; sales: AdminAiSale[]; warnings: string[]; needsReview: boolean; rawText: string };
export type AdminAiSuccess = { ok: true; provider: "ollama"; model: string; result: AdminAiResult; warnings: string[] };
export type AdminAiErrorCode = "AI_DISABLED" | "AI_LIMIT_REACHED" | "AI_INPUT_INVALID" | "AI_INPUT_TOO_LONG" | "AI_TIMEOUT" | "AI_UNAVAILABLE" | "AI_MODEL_UNAVAILABLE" | "AI_INVALID_RESPONSE";
export class AdminAiError extends Error { constructor(public code: AdminAiErrorCode, message: string, public status = 400) { super(message); this.name = "AdminAiError"; } }
