"use client";

import { useEffect, useRef, useState } from "react";
import { AdminIcon } from "./AdminDashboardVisuals";
import {
  archiveOrderDraft, deleteOrderDraft, exportOrderDraftsCsv, exportOrderDraftsJson,
  getOrderDrafts, markOrderDraftConverted, saveOrderDraft, type OrderDraft, type OrderDraftSource,
} from "@/lib/admin/orderDrafts";
import { convertOrderDraftToSales, type ConvertedDraftSale, type OrderDraftConversionResult, type OrderDraftConverterPerfume } from "@/lib/admin/orderDraftConverter";

type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; abort(): void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null; onerror: ((event: { error?: string }) => void) | null;
};

function download(content: string, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url; link.download = fileName; link.click();
  URL.revokeObjectURL(url);
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

type Props = {
  onSendToAssistant: (text: string) => void;
  perfumes: OrderDraftConverterPerfume[];
  onConfirmConversion: (draftId: string, conversion: OrderDraftConversionResult) => Promise<{ ok: boolean; message: string }>;
};

export default function OrderDraftBox({ onSendToAssistant, perfumes, onConfirmConversion }: Props) {
  const [drafts, setDrafts] = useState<OrderDraft[]>([]);
  const [rawText, setRawText] = useState("");
  const [source, setSource] = useState<OrderDraftSource>("text");
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [conversion, setConversion] = useState<{ draftId: string; result: OrderDraftConversionResult } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const listeningRef = useRef(false);
  const finalTextRef = useRef("");
  const latestTextRef = useRef("");
  const restartRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDrafts(getOrderDrafts()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => () => {
    listeningRef.current = false;
    if (restartRef.current) window.clearTimeout(restartRef.current);
    recognitionRef.current?.abort();
  }, []);

  function refresh() { setDrafts(getOrderDrafts()); }

  function save() {
    const text = rawText.trim();
    if (!text) { setMessage("Digite ou fale o pedido antes de salvar."); return; }
    try {
      saveOrderDraft({ rawText: text, source });
      setRawText(""); setSource("text"); refresh();
      setMessage("Pedido salvo como rascunho. Você pode organizar depois.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o rascunho.");
    }
  }

  function startVoice() {
    type Constructor = new () => Recognition;
    const speechWindow = window as typeof window & { SpeechRecognition?: Constructor; webkitSpeechRecognition?: Constructor };
    const RecognitionApi = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!RecognitionApi) { setMessage("Voz indisponível neste navegador. Digite o pedido normalmente."); return; }
    const recognition = new RecognitionApi();
    recognition.lang = "pt-BR"; recognition.continuous = true; recognition.interimResults = true;
    finalTextRef.current = rawText.trim(); latestTextRef.current = rawText.trim(); listeningRef.current = true;
    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0].transcript.trim();
        if (event.results[index].isFinal) finalTextRef.current = `${finalTextRef.current} ${text}`.trim();
        else interim = `${interim} ${text}`.trim();
      }
      latestTextRef.current = `${finalTextRef.current} ${interim}`.trim();
      setRawText(latestTextRef.current); setSource("voice");
    };
    recognition.onend = () => {
      if (!listeningRef.current) { setIsListening(false); recognitionRef.current = null; return; }
      finalTextRef.current = latestTextRef.current;
      restartRef.current = window.setTimeout(() => {
        if (!listeningRef.current) return;
        try { recognition.start(); } catch { /* aguarda o encerramento interno do navegador */ }
      }, 250);
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        listeningRef.current = false; setIsListening(false); setMessage("Permissão do microfone bloqueada.");
      }
    };
    recognitionRef.current = recognition; setMessage(""); setIsListening(true); recognition.start();
  }

  function stopVoice(cancel: boolean) {
    listeningRef.current = false;
    if (restartRef.current) window.clearTimeout(restartRef.current);
    if (cancel) recognitionRef.current?.abort(); else recognitionRef.current?.stop();
    recognitionRef.current = null; setIsListening(false);
    if (cancel) { setRawText(""); setSource("text"); setMessage("Ditado cancelado."); }
    else { setRawText(latestTextRef.current); setSource("voice"); setMessage("Ditado concluído. Revise e salve o rascunho."); }
  }

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setMessage("Texto copiado."); }
    catch { setMessage("Não foi possível copiar automaticamente."); }
  }

  function startConversion(draft: OrderDraft) {
    const result = convertOrderDraftToSales(draft.rawText, { perfumes, sourceDraftId: draft.id });
    setConversion({ draftId: draft.id, result });
    setMessage(result.ok ? `${result.sales.length} venda(s) detectada(s). Revise antes de confirmar.` : result.warnings.join(" "));
  }

  function updateSale(index: number, update: (sale: ConvertedDraftSale) => ConvertedDraftSale) {
    setConversion((current) => current ? { ...current, result: { ...current.result,
      sales: current.result.sales.map((sale, saleIndex) => saleIndex === index ? update(sale) : sale) } } : current);
  }

  async function confirmConversion() {
    if (!conversion) return;
    setIsConfirming(true);
    const response = await onConfirmConversion(conversion.draftId, conversion.result);
    setIsConfirming(false); setMessage(response.message);
    if (response.ok) { markOrderDraftConverted(conversion.draftId); refresh(); setConversion(null); }
  }

  const visibleDrafts = [...drafts].sort((a, b) => {
    const priority = { pending: 0, converted: 1, archived: 2 };
    return priority[a.status] - priority[b.status] || b.createdAt.localeCompare(a.createdAt);
  });
  const statusLabel = { pending: "Pendente", converted: "Resolvido", archived: "Arquivado" };

  return <section id="caixa-rapida" className="scroll-mt-24 rounded-3xl border border-gold/25 bg-gradient-to-br from-gold/[0.12] via-white/[0.035] to-black p-5 sm:p-7">
    <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold text-black"><AdminIcon name="sale" className="h-6 w-6"/></span>
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Capture agora, organize depois</p><h2 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">Caixa Rápida de Pedidos</h2><p className="mt-2 text-sm text-stone-400">Salva qualquer texto, mesmo incompleto ou bagunçado.</p></div></div>
    <textarea value={rawText} onChange={(event) => { setRawText(event.target.value); setSource("text"); setMessage(""); }} rows={4}
      placeholder="Ex.: Kauane da secretaria pegou Silverion Black para pagar dia 24; Franciele cuidadora pegou Scarlet Noir..."
      className="mt-5 min-h-32 w-full resize-y rounded-2xl border border-gold/25 bg-black/70 px-5 py-4 text-base text-white outline-none placeholder:text-stone-600 focus:border-gold focus:ring-4 focus:ring-gold/10" />
    {!isListening ? <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
      <button type="button" onClick={startVoice} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gold/10 px-5 text-sm font-bold text-gold-light"><AdminIcon name="mic"/> Falar pedido</button>
      <button type="button" onClick={save} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-black"><AdminIcon name="check"/> Salvar rascunho</button>
      <button type="button" onClick={() => { setRawText(""); setSource("text"); setMessage(""); }} className="min-h-13 rounded-xl border border-white/15 px-5 text-sm font-semibold text-stone-300">Limpar</button>
    </div> : <div className="mt-3 flex items-center gap-3 rounded-2xl border border-gold/35 bg-black/80 p-3">
      <span className="relative grid h-11 w-11 place-items-center rounded-full bg-gold text-black"><span className="absolute inset-0 animate-ping rounded-full bg-gold/30"/><AdminIcon name="mic"/></span>
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-white">Ouvindo pedido…</p><p className="truncate text-xs text-stone-500">Pode pausar e continuar.</p></div>
      <button type="button" onClick={() => stopVoice(true)} aria-label="Cancelar ditado" className="grid h-12 w-12 place-items-center rounded-xl border border-red-400/35 text-red-200"><AdminIcon name="close"/></button>
      <button type="button" onClick={() => stopVoice(false)} aria-label="Concluir ditado" className="grid h-12 w-12 place-items-center rounded-xl bg-gold text-black"><AdminIcon name="check"/></button>
    </div>}
    {message ? <p className="mt-3 rounded-xl border border-gold/15 bg-black/40 p-3 text-sm text-gold-light">{message}</p> : null}

    {conversion ? <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-black/65 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Prévia obrigatória</p><h3 className="mt-1 text-xl font-semibold text-white">{conversion.result.sales.length} venda(s) detectada(s)</h3>
        <p className="mt-1 text-sm text-stone-400">Total {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(conversion.result.sales.reduce((sum, sale) => sum + sale.totalAmount, 0))} · {conversion.result.sales.filter((sale) => sale.paymentStatus !== "pago").length} pendente(s) · {conversion.result.sales.filter((sale) => sale.paymentStatus === "pago").length} paga(s)</p></div>
        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">{conversion.result.mode === "needs_review" ? "Revisão necessária" : "Pronto para revisar"}</span></div>
      {conversion.result.warnings.length ? <div className="mt-4 grid gap-2">{conversion.result.warnings.map((warning) => <p key={warning} className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-100">{warning}</p>)}</div> : null}
      <div className="mt-5 grid gap-4">{conversion.result.sales.map((sale, index) => <article key={`${sale.sourceDraftId}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
        <div className="mb-4 flex items-center justify-between"><p className="font-semibold text-white">Venda {index + 1}</p><span className="text-sm font-semibold text-gold-light">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(sale.totalAmount)}</span></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label><span className="text-xs text-stone-500">Cliente</span><input value={sale.customerName} onChange={(event) => updateSale(index, (current) => ({ ...current, customerName: event.target.value }))} className="mt-1 w-full rounded-lg border border-white/15 bg-black px-3 py-3 text-sm text-white outline-none focus:border-gold"/></label>
          <label><span className="text-xs text-stone-500">Identificação</span><input value={sale.customerNote ?? ""} onChange={(event) => updateSale(index, (current) => ({ ...current, customerNote: event.target.value, collectionNote: event.target.value }))} className="mt-1 w-full rounded-lg border border-white/15 bg-black px-3 py-3 text-sm text-white outline-none focus:border-gold"/></label>
          <label><span className="text-xs text-stone-500">Perfume</span><select value={sale.items[0].perfumeSlug} onChange={(event) => updateSale(index, (current) => { const selected = perfumes.find((perfume) => perfume.slug === event.target.value)!; const item = { ...current.items[0], perfumeSlug: selected.slug, perfumeName: selected.name, unitPrice: selected.defaultUnitPrice, totalPrice: selected.defaultUnitPrice * current.items[0].quantity }; return { ...current, items: [item], subtotal: item.totalPrice, totalAmount: item.totalPrice, remainingAmount: current.paymentStatus === "pago" ? 0 : item.totalPrice - current.amountPaid }; })} className="mt-1 w-full rounded-lg border border-white/15 bg-black px-3 py-3 text-sm text-white outline-none focus:border-gold">{perfumes.map((perfume) => <option key={perfume.slug} value={perfume.slug}>{perfume.name}</option>)}</select></label>
          <label><span className="text-xs text-stone-500">Valor total</span><input type="number" min={0} step="0.01" value={sale.totalAmount} onChange={(event) => updateSale(index, (current) => { const total = Math.max(0, Number(event.target.value) || 0); const item = { ...current.items[0], unitPrice: total / current.items[0].quantity, totalPrice: total }; return { ...current, items: [item], subtotal: total, totalAmount: total, amountPaid: current.paymentStatus === "pago" ? total : Math.min(current.amountPaid, total), remainingAmount: current.paymentStatus === "pago" ? 0 : Math.max(0, total - current.amountPaid) }; })} className="mt-1 w-full rounded-lg border border-white/15 bg-black px-3 py-3 text-sm text-white outline-none focus:border-gold"/></label>
          <label><span className="text-xs text-stone-500">Status</span><select value={sale.paymentStatus} onChange={(event) => updateSale(index, (current) => { const status = event.target.value as ConvertedDraftSale["paymentStatus"]; return { ...current, paymentStatus: status, paymentMethod: status === "pendente" ? "fiado" : current.paymentMethod === "fiado" ? "pix" : current.paymentMethod, amountPaid: status === "pago" ? current.totalAmount : status === "pendente" ? 0 : current.amountPaid, remainingAmount: status === "pago" ? 0 : status === "pendente" ? current.totalAmount : Math.max(0, current.totalAmount - current.amountPaid), expectedPaymentDate: status === "pago" ? undefined : current.expectedPaymentDate }; })} className="mt-1 w-full rounded-lg border border-white/15 bg-black px-3 py-3 text-sm text-white"><option value="pendente">Pendente</option><option value="partial">Parcial</option><option value="pago">Pago</option></select></label>
          <label><span className="text-xs text-stone-500">Data de recebimento</span><input type="date" disabled={sale.paymentStatus === "pago"} value={sale.expectedPaymentDate ?? ""} onChange={(event) => updateSale(index, (current) => ({ ...current, expectedPaymentDate: event.target.value || undefined }))} className="mt-1 w-full rounded-lg border border-white/15 bg-black px-3 py-3 text-sm text-white disabled:opacity-40"/></label>
        </div>
        {sale.paymentStatus === "partial" ? <div className="mt-3 grid grid-cols-2 gap-3"><label><span className="text-xs text-stone-500">Valor pago</span><input type="number" min={0} step="0.01" value={sale.amountPaid} onChange={(event) => updateSale(index, (current) => { const paid = Math.min(current.totalAmount, Math.max(0, Number(event.target.value) || 0)); return { ...current, amountPaid: paid, remainingAmount: current.totalAmount - paid }; })} className="mt-1 w-full rounded-lg border border-white/15 bg-black px-3 py-3 text-sm text-white"/></label><div><p className="text-xs text-stone-500">Restante</p><p className="mt-3 font-semibold text-gold-light">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(sale.remainingAmount)}</p></div></div> : null}
      </article>)}</div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:flex"><button type="button" onClick={() => setConversion(null)} className="min-h-13 rounded-xl border border-white/20 px-5 text-sm font-semibold text-stone-300">Cancelar</button><button type="button" disabled={isConfirming || !conversion.result.ok} onClick={() => void confirmConversion()} className="min-h-13 rounded-xl bg-emerald-300 px-5 text-sm font-bold text-black disabled:opacity-40">{isConfirming ? "Criando…" : "Confirmar criação das vendas"}</button></div>
    </div> : null}

    <div className="mt-7 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold text-white">Rascunhos</h3><p className="text-xs text-stone-500">{drafts.filter((draft) => draft.status === "pending").length} pendente(s)</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" disabled={!drafts.length} onClick={() => download(exportOrderDraftsJson(drafts), `rascunhos-pedidos-${Date.now()}.json`, "application/json")} className="min-h-10 rounded-lg border border-white/15 px-3 text-xs font-semibold text-stone-300 disabled:opacity-40">Exportar JSON</button>
        <button type="button" disabled={!drafts.length} onClick={() => download(exportOrderDraftsCsv(drafts), `rascunhos-pedidos-${Date.now()}.csv`, "text/csv;charset=utf-8")} className="min-h-10 rounded-lg border border-white/15 px-3 text-xs font-semibold text-stone-300 disabled:opacity-40">Exportar CSV</button></div></div>
    <div className="mt-4 grid gap-3">{visibleDrafts.length ? visibleDrafts.map((draft) => <article key={draft.id} className="rounded-2xl border border-white/10 bg-black/50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-stone-500">{dateTime(draft.createdAt)} · {draft.source === "voice" ? "voz" : "texto"}</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${draft.status === "pending" ? "bg-gold/15 text-gold-light" : draft.status === "converted" ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-stone-400"}`}>{statusLabel[draft.status]}</span></div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-200">{draft.rawText}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:flex lg:flex-wrap">
        <button type="button" onClick={() => void copy(draft.rawText)} className="min-h-11 rounded-lg border border-white/15 px-3 text-xs font-semibold text-stone-300">Copiar texto</button>
        <button type="button" onClick={() => startConversion(draft)} className="min-h-11 rounded-lg border border-gold/35 bg-gold/10 px-3 text-xs font-bold text-gold-light">Converter em venda</button>
        <button type="button" onClick={() => onSendToAssistant(draft.rawText)} className="min-h-11 rounded-lg bg-emerald-300 px-3 text-xs font-bold text-black">Enviar para Assistente</button>
        <button type="button" disabled={draft.status === "converted"} onClick={() => { markOrderDraftConverted(draft.id); refresh(); }} className="min-h-11 rounded-lg border border-emerald-400/25 px-3 text-xs font-semibold text-emerald-200 disabled:opacity-40">Marcar resolvido</button>
        <button type="button" disabled={draft.status === "archived"} onClick={() => { archiveOrderDraft(draft.id); refresh(); }} className="min-h-11 rounded-lg border border-white/15 px-3 text-xs font-semibold text-stone-300 disabled:opacity-40">Arquivar</button>
        <button type="button" onClick={() => { if (window.confirm("Excluir este rascunho permanentemente?")) { deleteOrderDraft(draft.id); refresh(); } }} className="min-h-11 rounded-lg border border-red-400/25 px-3 text-xs font-semibold text-red-200">Excluir</button>
      </div>
    </article>) : <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-stone-500">Nenhum rascunho salvo.</div>}</div>
  </section>;
}
