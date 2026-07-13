import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server";
import { expectedPaymentMethodLabel } from "./receivables";
import { getRemainingAmount, getSaleItems, getSaleTotal, summarizeSaleItems, type FlexibleSaleItem } from "./flexibleSales";

const INTEGRATION_ID = "google_calendar";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_API_URL = "https://www.googleapis.com/calendar/v3";

type IntegrationRow = { encrypted_access_token: string | null; encrypted_refresh_token: string | null;
  expires_at: string | null; token_type: string | null; scope: string | null; calendar_id: string | null;
  connected_email: string | null; connected_at: string | null; updated_at: string | null };
export type CalendarSale = { id: string; customerName: string; customerPhone?: string; perfumeName: string;
  quantity: number; unitPrice: number; status: string; expectedPaymentDate?: string;
  expectedPaymentMethod?: "pix" | "dinheiro" | "cartao" | "salario" | "outro";
  collectionNote?: string; items?: FlexibleSaleItem[]; totalAmount?: number; amountPaid?: number;
  remainingAmount?: number; googleCalendarEventId?: string };

function config() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
  const encryptionKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim();
  if (!clientId || !clientSecret || !redirectUri || !encryptionKey) throw new Error("Integração Google Agenda ainda não configurada.");
  return { clientId, clientSecret, redirectUri, encryptionKey,
    calendarId: process.env.GOOGLE_CALENDAR_ID?.trim() || "primary",
    timeZone: process.env.NEXT_PUBLIC_BUSINESS_TIME_ZONE?.trim() || "America/Porto_Velho" };
}

function encryptionBuffer() { return createHash("sha256").update(config().encryptionKey).digest(); }
export function encryptGoogleToken(value: string) {
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", encryptionBuffer(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}
export function decryptGoogleToken(value: string) {
  const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  if (!iv || !tag || !encrypted) throw new Error("Token Google armazenado é inválido.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionBuffer(), iv); decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function createGoogleAuthorizationUrl(state: string) {
  const { clientId, redirectUri } = config();
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri,
    response_type: "code", access_type: "offline", prompt: "consent", state,
    scope: "openid email https://www.googleapis.com/auth/calendar.events" });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

async function tokenRequest(values: Record<string, string>) {
  const response = await fetch(GOOGLE_TOKEN_URL, { method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(values), cache: "no-store" });
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok || typeof data.access_token !== "string") throw new Error("O Google não autorizou a conexão. Tente novamente.");
  return data as { access_token: string; refresh_token?: string; expires_in?: number; token_type?: string; scope?: string };
}

async function readIntegration() {
  const supabase = createServerSupabaseAdminClient(); if (!supabase) throw new Error("Supabase server-side não configurado.");
  const { data, error } = await supabase.from("admin_google_integrations").select("*").eq("id", INTEGRATION_ID).maybeSingle();
  if (error) throw new Error("Não foi possível consultar a integração Google.");
  return data as IntegrationRow | null;
}

export async function exchangeGoogleCode(code: string) {
  const { clientId, clientSecret, redirectUri, calendarId } = config();
  const tokens = await tokenRequest({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" });
  const existing = await readIntegration();
  const emailResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` }, cache: "no-store" });
  const profile = emailResponse.ok ? await emailResponse.json() as { email?: string } : {};
  const now = new Date(); const expiresAt = new Date(now.getTime() + (tokens.expires_in ?? 3600) * 1000).toISOString();
  const supabase = createServerSupabaseAdminClient(); if (!supabase) throw new Error("Supabase server-side não configurado.");
  const { error } = await supabase.from("admin_google_integrations").upsert({ id: INTEGRATION_ID,
    encrypted_access_token: encryptGoogleToken(tokens.access_token),
    encrypted_refresh_token: tokens.refresh_token ? encryptGoogleToken(tokens.refresh_token) : existing?.encrypted_refresh_token,
    token_type: tokens.token_type ?? "Bearer", scope: tokens.scope ?? null, expires_at: expiresAt,
    calendar_id: calendarId, connected_email: profile.email ?? existing?.connected_email ?? null,
    connected_at: existing?.connected_at ?? now.toISOString(), updated_at: now.toISOString() });
  if (error) throw new Error("Não foi possível salvar a conexão Google com segurança.");
}

async function accessToken() {
  const row = await readIntegration();
  if (!row?.encrypted_access_token) throw new Error("Google Agenda não está conectado.");
  if (row.expires_at && new Date(row.expires_at).getTime() > Date.now() + 60_000) return { token: decryptGoogleToken(row.encrypted_access_token), row };
  if (!row.encrypted_refresh_token) throw new Error("A autorização Google expirou. Conecte novamente.");
  const { clientId, clientSecret } = config();
  const tokens = await tokenRequest({ client_id: clientId, client_secret: clientSecret,
    refresh_token: decryptGoogleToken(row.encrypted_refresh_token), grant_type: "refresh_token" });
  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();
  const supabase = createServerSupabaseAdminClient();
  await supabase?.from("admin_google_integrations").update({ encrypted_access_token: encryptGoogleToken(tokens.access_token), expires_at: expiresAt, updated_at: new Date().toISOString() }).eq("id", INTEGRATION_ID);
  return { token: tokens.access_token, row: { ...row, expires_at: expiresAt } };
}

export async function getGoogleCalendarStatus() {
  const row = await readIntegration(); return { connected: Boolean(row?.encrypted_refresh_token || row?.encrypted_access_token),
    connectedEmail: row?.connected_email ?? undefined, calendarId: row?.calendar_id ?? config().calendarId,
    lastSync: row?.updated_at ?? undefined };
}

export async function disconnectGoogleCalendar() {
  const supabase = createServerSupabaseAdminClient(); if (!supabase) throw new Error("Supabase server-side não configurado.");
  const { error } = await supabase.from("admin_google_integrations").delete().eq("id", INTEGRATION_ID);
  if (error) throw new Error("Não foi possível desconectar o Google Agenda.");
}

function eventBody(sale: CalendarSale) {
  if (!sale.expectedPaymentDate || sale.status === "pago" || getRemainingAmount(sale) <= 0) {
    throw new Error("Esta venda não possui uma cobrança pendente com data definida.");
  }
  const { timeZone } = config(); const items = getSaleItems(sale);
  const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  const description = ["AMARO DOS REIS PARFUM", `Cliente: ${sale.customerName}`,
    sale.customerPhone ? `Telefone: ${sale.customerPhone}` : "",
    `Itens: ${summarizeSaleItems(sale)}`, `Quantidade: ${items.reduce((sum, item) => sum + item.quantity, 0)}`,
    `Total da venda: ${money(getSaleTotal(sale))}`, `Valor pago: ${money(sale.amountPaid ?? 0)}`,
    `Valor pendente: ${money(getRemainingAmount(sale))}`,
    `Forma prevista: ${expectedPaymentMethodLabel(sale.expectedPaymentMethod)}`,
    sale.collectionNote ? `Observação: ${sale.collectionNote}` : "", "Painel administrativo: /admin"
  ].filter(Boolean).join("\n");
  return { summary: `Receber perfume - ${sale.customerName}`, description,
    start: { dateTime: `${sale.expectedPaymentDate}T08:00:00`, timeZone },
    end: { dateTime: `${sale.expectedPaymentDate}T08:30:00`, timeZone },
    reminders: { useDefault: false, overrides: [
      { method: "popup", minutes: 0 }, { method: "popup", minutes: 1440 }, { method: "email", minutes: 1440 }
    ] } };
}

async function calendarFetch(path: string, init: RequestInit = {}) {
  const { token, row } = await accessToken(); const calendarId = row.calendar_id || config().calendarId;
  const response = await fetch(`${GOOGLE_API_URL}/calendars/${encodeURIComponent(calendarId)}${path}`,
    { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) }, cache: "no-store" });
  if (!response.ok) { const detail = await response.text(); console.error("Google Calendar API error", response.status, detail.slice(0, 300));
    throw new Error("O Google Agenda não conseguiu processar o lembrete."); }
  return response.status === 204 ? null : response.json();
}

export async function syncGoogleCalendarSale(sale: CalendarSale) {
  const body = JSON.stringify(eventBody(sale));
  const data = await calendarFetch(sale.googleCalendarEventId
    ? `/events/${encodeURIComponent(sale.googleCalendarEventId)}` : "/events",
    { method: sale.googleCalendarEventId ? "PUT" : "POST", body }) as { id: string; htmlLink?: string };
  const syncedAt = new Date().toISOString();
  await createServerSupabaseAdminClient()?.from("admin_google_integrations").update({ updated_at: syncedAt }).eq("id", INTEGRATION_ID);
  return { eventId: data.id, eventLink: data.htmlLink, status: "synced", syncedAt };
}

export async function removeGoogleCalendarEvent(eventId: string) {
  await calendarFetch(`/events/${encodeURIComponent(eventId)}`, { method: "DELETE" });
}
