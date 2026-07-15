import "server-only";
import { assertAndConsumeDailyAiLimit, positiveInteger } from "./limits";
import { callOllama } from "./ollamaProvider";
import { buildAdminAiPrompt } from "./prompts";
import { AdminAiError, type AdminAiContext, type AdminAiItem, type AdminAiMode, type AdminAiResult, type AdminAiSale, type AdminAiSuccess } from "./types";

const modes: AdminAiMode[] = ["single_sale", "multiple_sales", "payment", "stock", "reminder", "query", "unknown"];
const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : undefined;
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : undefined;
const confidence = (value: unknown) => Math.max(0, Math.min(1, number(value) ?? 0));
const warnings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 30) : [];

function item(value: unknown): AdminAiItem | null { if (!value || typeof value !== "object") return null; const raw = value as Record<string, unknown>; const perfumeName = text(raw.perfumeName); if (!perfumeName) return null; const quantity = Math.max(1, Math.floor(number(raw.quantity) ?? 1)); return { perfumeName, quantity, unitPrice: number(raw.unitPrice), totalPrice: number(raw.totalPrice), confidence: confidence(raw.confidence), warnings: warnings(raw.warnings) }; }
function sale(value: unknown): AdminAiSale | null { if (!value || typeof value !== "object") return null; const raw = value as Record<string, unknown>; return { customerName: text(raw.customerName), customerNote: text(raw.customerNote), saleDate: text(raw.saleDate), expectedPaymentDate: text(raw.expectedPaymentDate), paymentMethod: text(raw.paymentMethod), paymentStatus: text(raw.paymentStatus), amountPaid: number(raw.amountPaid), remainingAmount: number(raw.remainingAmount), totalAmount: number(raw.totalAmount), items: Array.isArray(raw.items) ? raw.items.map(item).filter((entry): entry is AdminAiItem => Boolean(entry)).slice(0, 30) : [], warnings: warnings(raw.warnings) }; }
function validateResult(value: unknown, rawText: string): AdminAiResult { if (!value || typeof value !== "object") throw new AdminAiError("AI_INVALID_RESPONSE", "A IA local não retornou JSON estruturado válido.", 502); const raw = value as Record<string, unknown>; const mode = modes.includes(raw.mode as AdminAiMode) ? raw.mode as AdminAiMode : "unknown"; const intent = text(raw.intent); if (!intent) throw new AdminAiError("AI_INVALID_RESPONSE", "A IA local retornou JSON sem intenção válida.", 502); return { intent, confidence: confidence(raw.confidence), mode, customerName: text(raw.customerName), customerNote: text(raw.customerNote), saleDate: text(raw.saleDate), expectedPaymentDate: text(raw.expectedPaymentDate), paymentMethod: text(raw.paymentMethod), paymentStatus: text(raw.paymentStatus), amountPaid: number(raw.amountPaid), remainingAmount: number(raw.remainingAmount), totalAmount: number(raw.totalAmount), items: Array.isArray(raw.items) ? raw.items.map(item).filter((entry): entry is AdminAiItem => Boolean(entry)).slice(0, 30) : [], sales: Array.isArray(raw.sales) ? raw.sales.map(sale).filter((entry): entry is AdminAiSale => Boolean(entry)).slice(0, 30) : [], warnings: warnings(raw.warnings), needsReview: raw.needsReview !== false || confidence(raw.confidence) < 0.8, rawText }; }

export async function interpretAdminWithLocalAi(rawText: unknown, context: AdminAiContext = "admin_assistant"): Promise<AdminAiSuccess> {
  if (typeof rawText !== "string" || !rawText.trim()) throw new AdminAiError("AI_INPUT_INVALID", "Digite um comando antes de chamar a IA local.");
  const maxInputChars = positiveInteger(process.env.AI_MAX_INPUT_CHARS, 4000, 20000);
  const input = rawText.trim(); if (input.length > maxInputChars) throw new AdminAiError("AI_INPUT_TOO_LONG", `O comando excede o limite de ${maxInputChars} caracteres.`);
  const provider = (process.env.AI_PROVIDER ?? "disabled").trim().toLowerCase();
  if (provider !== "ollama" && provider !== "local") throw new AdminAiError("AI_DISABLED", "IA local desativada. Continue usando o assistente normal por regras.", 503);
  const model = (process.env.OLLAMA_MODEL ?? "qwen2.5:3b").trim(); const baseUrl = (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").trim();
  const timeoutMs = positiveInteger(process.env.AI_TIMEOUT_MS, 30000, 120000); const dailyLimit = positiveInteger(process.env.AI_DAILY_LIMIT, 50, 10000);
  assertAndConsumeDailyAiLimit(dailyLimit);
  const response = await callOllama(buildAdminAiPrompt(input, context), { baseUrl, model, timeoutMs });
  let parsed: unknown; try { parsed = JSON.parse(response); } catch { throw new AdminAiError("AI_INVALID_RESPONSE", "A IA local respondeu, mas o JSON retornado é inválido. Tente novamente ou use o assistente normal.", 502); }
  return { ok: true, provider: "ollama", model, result: validateResult(parsed, input), warnings: [] };
}
