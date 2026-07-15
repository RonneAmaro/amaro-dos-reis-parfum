import "server-only";
import { AdminAiError } from "./types";
export async function callOllama(prompt: string, config: { baseUrl: string; model: string; timeoutMs: number }) {
  let endpoint: URL; try { endpoint = new URL("/api/generate", config.baseUrl); } catch { throw new AdminAiError("AI_UNAVAILABLE", "Endereço do Ollama inválido.", 503); }
  if (!/^https?:$/.test(endpoint.protocol)) throw new AdminAiError("AI_UNAVAILABLE", "Endereço do Ollama inválido.", 503);
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try { const response = await fetch(endpoint, { method: "POST", signal: controller.signal, cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: config.model, prompt, stream: false, format: "json", options: { temperature: 0.1 } }) });
    if (!response.ok) { const body = await response.text(); if (response.status === 404 || /model.*not found/i.test(body)) throw new AdminAiError("AI_MODEL_UNAVAILABLE", "Modelo do Ollama não encontrado. Baixe o modelo configurado e tente novamente.", 503); throw new AdminAiError("AI_UNAVAILABLE", "Ollama não respondeu corretamente. Confirme se o serviço está aberto.", 503); }
    const body = await response.json() as { response?: unknown }; if (typeof body.response !== "string") throw new AdminAiError("AI_INVALID_RESPONSE", "A IA local retornou uma resposta inválida.", 502); return body.response;
  } catch (error) { if (error instanceof AdminAiError) throw error; if (error instanceof Error && error.name === "AbortError") throw new AdminAiError("AI_TIMEOUT", "A IA local demorou demais para responder. Tente novamente.", 504); throw new AdminAiError("AI_UNAVAILABLE", "IA local desativada ou indisponível. Confirme se o Ollama está aberto.", 503); } finally { clearTimeout(timer); }
}
