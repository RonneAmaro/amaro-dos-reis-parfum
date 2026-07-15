import "server-only";
import { AdminAiError } from "./types";
type DailyCounter = { date: string; count: number };
const globalCounters = globalThis as typeof globalThis & { __amaroAiDailyCounter?: DailyCounter };
export function positiveInteger(value: string | undefined, fallback: number, maximum: number) { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), maximum) : fallback; }
export function assertAndConsumeDailyAiLimit(limit: number, now = new Date()) { const date = now.toISOString().slice(0, 10); const counter = globalCounters.__amaroAiDailyCounter; if (!counter || counter.date !== date) globalCounters.__amaroAiDailyCounter = { date, count: 0 }; const current = globalCounters.__amaroAiDailyCounter!; if (current.count >= limit) throw new AdminAiError("AI_LIMIT_REACHED", "Limite diário da IA local atingido. Use o assistente normal ou tente amanhã.", 429); current.count += 1; return { used: current.count, remaining: Math.max(0, limit - current.count) }; }
