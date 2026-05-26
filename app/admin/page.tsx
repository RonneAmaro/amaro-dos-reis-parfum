"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_COST_SETTINGS,
  calculateSaleProfit,
  getEstimatedUnitCost,
  type LineType,
} from "@/lib/costs";
import {
  lineLabels,
  perfumeCommerce,
  perfumeSlug,
  type PerfumeLine,
} from "@/lib/perfumes";

const STORAGE_KEY = "amaro_sales_v1";

type StoredPaymentMethod = "dinheiro" | "pix" | "cartao" | "cartão" | "fiado";
type PaymentMethod = "dinheiro" | "pix" | "cartão" | "fiado";
type SaleStatus = "pago" | "pendente";
type SaleFilter = "todos" | "pagos" | "pendentes";
type PaymentFilter = "todos" | PaymentMethod;

export type Sale = {
  id: string;
  customerName: string;
  perfumeSlug: string;
  perfumeName: string;
  lineType: PerfumeLine;
  unitPrice: number;
  quantity: number;
  paymentMethod: StoredPaymentMethod;
  status: SaleStatus;
  notes: string;
  createdAt: string;
  paidAt?: string;
};

type SaleForm = {
  customerName: string;
  perfumeSlug: string;
  lineType: PerfumeLine;
  quantity: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes: string;
};

const defaultPerfume = perfumeCommerce[0];

const initialForm: SaleForm = {
  customerName: "",
  perfumeSlug: perfumeSlug(defaultPerfume),
  lineType: defaultPerfume.line,
  quantity: 1,
  paymentMethod: "pix",
  status: "pago",
  notes: "",
};

const paymentLabels: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartão: "Cartao",
  fiado: "Fiado / receber depois",
};

const statusLabels: Record<SaleStatus, string> = {
  pago: "Pago",
  pendente: "Pendente",
};

function getLinePrice(lineType: PerfumeLine) {
  return lineType === "arabic_premium" ? 120 : 80;
}

function toCostLine(lineType: PerfumeLine | string): LineType {
  return lineType === "arabic_premium" || lineType === "arabe"
    ? "arabe"
    : "tradicional";
}

function normalizePaymentMethod(method: StoredPaymentMethod): PaymentMethod {
  return method === "cartao" ? "cartão" : method;
}

function saleProfit(sale: {
  lineType: PerfumeLine | string;
  unitPrice: number;
  quantity: number;
  paymentMethod: StoredPaymentMethod;
}) {
  return calculateSaleProfit(
    {
      lineType: toCostLine(sale.lineType),
      unitPrice: Number(sale.unitPrice) || 0,
      quantity: Math.max(1, Number(sale.quantity) || 1),
      paymentMethod: normalizePaymentMethod(sale.paymentMethod),
    },
    DEFAULT_COST_SETTINGS
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeCsv(value: string | number) {
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}

export default function AdminPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [form, setForm] = useState<SaleForm>(initialForm);
  const [statusFilter, setStatusFilter] = useState<SaleFilter>("todos");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("todos");
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const unitPrice = getLinePrice(form.lineType);

  useEffect(() => {
    const storedSales = window.localStorage.getItem(STORAGE_KEY);

    if (!storedSales) {
      setIsStorageLoaded(true);
      return;
    }

    try {
      const parsedSales = JSON.parse(storedSales) as Sale[];
      setSales(Array.isArray(parsedSales) ? parsedSales : []);
    } catch {
      setSales([]);
    } finally {
      setIsStorageLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isStorageLoaded) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
    }
  }, [isStorageLoaded, sales]);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const paymentMethod = normalizePaymentMethod(sale.paymentMethod);
      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "pagos" && sale.status === "pago") ||
        (statusFilter === "pendentes" && sale.status === "pendente");
      const matchesPayment =
        paymentFilter === "todos" || paymentMethod === paymentFilter;

      return matchesStatus && matchesPayment;
    });
  }, [paymentFilter, sales, statusFilter]);

  const summary = useMemo(() => {
    const totals = sales.reduce(
      (acc, sale) => {
        const profit = saleProfit(sale);

        acc.revenue += profit.revenue;
        acc.estimatedCost += profit.estimatedCost;
        acc.cardFees += profit.cardFee;
        acc.netProfit += profit.netProfit;
        acc.salesCount += 1;
        acc.itemsCount += Math.max(1, Number(sale.quantity) || 1);

        if (sale.status === "pago") {
          acc.totalReceived += profit.revenue;
        } else {
          acc.totalPending += profit.revenue;
        }

        return acc;
      },
      {
        revenue: 0,
        totalReceived: 0,
        totalPending: 0,
        estimatedCost: 0,
        cardFees: 0,
        netProfit: 0,
        salesCount: 0,
        itemsCount: 0,
      }
    );

    return {
      ...totals,
      averageMargin:
        totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : 0,
    };
  }, [sales]);

  const preview = useMemo(
    () =>
      calculateSaleProfit(
        {
          lineType: toCostLine(form.lineType),
          unitPrice,
          quantity: Math.max(1, Number(form.quantity) || 1),
          paymentMethod: form.paymentMethod,
        },
        DEFAULT_COST_SETTINGS
      ),
    [form.lineType, form.paymentMethod, form.quantity, unitPrice]
  );

  function handlePerfumeChange(nextSlug: string) {
    const perfume = perfumeCommerce.find((item) => perfumeSlug(item) === nextSlug);

    setForm((current) => ({
      ...current,
      perfumeSlug: nextSlug,
      lineType: perfume?.line ?? current.lineType,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const perfume = perfumeCommerce.find(
      (item) => perfumeSlug(item) === form.perfumeSlug
    );

    if (!perfume || !form.customerName.trim()) {
      return;
    }

    const sale: Sale = {
      id: createId(),
      customerName: form.customerName.trim(),
      perfumeSlug: form.perfumeSlug,
      perfumeName: perfume.name,
      lineType: form.lineType,
      unitPrice,
      quantity: Math.max(1, Number(form.quantity) || 1),
      paymentMethod: form.paymentMethod,
      status: form.status,
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
      paidAt: form.status === "pago" ? new Date().toISOString() : undefined,
    };

    setSales((current) => [sale, ...current]);
    setForm(initialForm);
  }

  function markAsPaid(id: string) {
    setSales((current) =>
      current.map((sale) =>
        sale.id === id
          ? { ...sale, status: "pago", paidAt: new Date().toISOString() }
          : sale
      )
    );
  }

  function deleteSale(id: string) {
    setSales((current) => current.filter((sale) => sale.id !== id));
  }

  function exportCsv() {
    const header = [
      "cliente",
      "perfume",
      "linha",
      "preco_unitario",
      "quantidade",
      "total",
      "forma_pagamento",
      "status",
      "data",
      "observacao",
      "custo_estimado",
      "taxa_cartao",
      "lucro_estimado",
      "margem_percentual",
    ];

    const rows = sales.map((sale) => {
      const profit = saleProfit(sale);
      const paymentMethod = normalizePaymentMethod(sale.paymentMethod);

      return [
        sale.customerName,
        sale.perfumeName,
        lineLabels[sale.lineType] ?? sale.lineType,
        sale.unitPrice,
        sale.quantity,
        profit.revenue,
        paymentLabels[paymentMethod],
        statusLabels[sale.status],
        formatDate(sale.createdAt),
        sale.notes,
        profit.estimatedCost.toFixed(2),
        profit.cardFee.toFixed(2),
        profit.netProfit.toFixed(2),
        profit.marginPercent.toFixed(2),
      ];
    });

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "amaro-vendas.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const summaryCards = [
    ["Faturamento total", formatCurrency(summary.revenue)],
    ["Total recebido", formatCurrency(summary.totalReceived)],
    ["Total pendente", formatCurrency(summary.totalPending)],
    ["Custo estimado", formatCurrency(summary.estimatedCost)],
    ["Lucro liquido estimado", formatCurrency(summary.netProfit)],
    ["Margem media", formatPercent(summary.averageMargin)],
    ["Taxas de cartao estimadas", formatCurrency(summary.cardFees)],
    ["Perfumes vendidos", summary.itemsCount],
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="premium-bg border-b border-gold/15 px-6 py-12 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-gold">
            Controle local
          </p>
          <h1 className="mt-5 text-4xl font-semibold uppercase leading-tight text-white sm:text-5xl">
            Painel interno &mdash; Amaro dos Reis Parfum
          </h1>
          <p className="mt-5 max-w-3xl leading-8 text-stone-300">
            Versao local: os dados ficam salvos apenas neste navegador.
            Futuramente sera integrado ao Supabase.
          </p>
        </div>
      </section>

      <section className="px-6 py-10 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map(([label, value]) => (
              <article key={label} className="premium-surface p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                  {label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-gold-light">
                  {value}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
            <section className="premium-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                Custos e margem
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="border border-white/10 bg-black/25 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                    Custo estimado tradicional
                  </p>
                  <p className="mt-2 text-xl font-semibold text-gold-light">
                    {formatCurrency(
                      getEstimatedUnitCost("tradicional", DEFAULT_COST_SETTINGS)
                    )}
                  </p>
                </div>
                <div className="border border-white/10 bg-black/25 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                    Custo estimado arabe
                  </p>
                  <p className="mt-2 text-xl font-semibold text-gold-light">
                    {formatCurrency(
                      getEstimatedUnitCost("arabe", DEFAULT_COST_SETTINGS)
                    )}
                  </p>
                </div>
                <div className="border border-white/10 bg-black/25 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                    Taxa de cartao configurada
                  </p>
                  <p className="mt-2 text-xl font-semibold text-gold-light">
                    {DEFAULT_COST_SETTINGS.cardFeePercent.toFixed(1).replace(".", ",")}%
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-stone-400">
                Os valores sao estimativas para controle interno e podem ser
                ajustados futuramente.
              </p>
            </section>

            <section className="premium-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                Como usar este painel
              </p>
              <div className="mt-5 grid gap-3 text-sm leading-7 text-stone-400 sm:grid-cols-2">
                <p>Registre toda venda no momento em que entregar o perfume.</p>
                <p>Use status pendente quando a pessoa for pagar depois.</p>
                <p>Marque como pago quando receber.</p>
                <p>Exporte CSV regularmente para backup.</p>
                <p className="sm:col-span-2">
                  Acompanhe lucro estimado para saber se a precificacao esta
                  saudavel.
                </p>
              </div>
            </section>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[0.82fr_1.18fr]">
            <form onSubmit={handleSubmit} className="premium-surface p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                    Cadastro de venda
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">
                    Registrar atendimento
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(initialForm)}
                  className="min-h-10 rounded-full border border-gold/35 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold"
                >
                  Limpar formulario
                </button>
              </div>

              <div className="mt-6 grid gap-4">
                <label>
                  <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                    Nome do cliente
                  </span>
                  <input
                    required
                    value={form.customerName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        customerName: event.target.value,
                      }))
                    }
                    className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                  />
                </label>

                <label>
                  <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                    Perfume vendido
                  </span>
                  <select
                    value={form.perfumeSlug}
                    onChange={(event) => handlePerfumeChange(event.target.value)}
                    className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                  >
                    {perfumeCommerce.map((perfume) => (
                      <option key={perfume.name} value={perfumeSlug(perfume)}>
                        {perfume.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      Tipo da linha
                    </span>
                    <select
                      value={form.lineType}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          lineType: event.target.value as PerfumeLine,
                        }))
                      }
                      className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                    >
                      <option value="traditional">Tradicional</option>
                      <option value="arabic_premium">Arabe Premium</option>
                    </select>
                  </label>

                  <div>
                    <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      Preco automatico
                    </span>
                    <div className="mt-2 flex min-h-11 items-center border border-gold/25 bg-gold/10 px-4 text-sm font-semibold text-gold-light">
                      {formatCurrency(unitPrice)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label>
                    <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      Quantidade
                    </span>
                    <input
                      min={1}
                      type="number"
                      value={form.quantity}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          quantity: Number(event.target.value),
                        }))
                      }
                      className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                    />
                  </label>

                  <label>
                    <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      Pagamento
                    </span>
                    <select
                      value={form.paymentMethod}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          paymentMethod: event.target.value as PaymentMethod,
                        }))
                      }
                      className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="pix">Pix</option>
                      <option value="cartão">Cartao</option>
                      <option value="fiado">Fiado / receber depois</option>
                    </select>
                  </label>

                  <label>
                    <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      Status
                    </span>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          status: event.target.value as SaleStatus,
                        }))
                      }
                      className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                    >
                      <option value="pago">Pago</option>
                      <option value="pendente">Pendente</option>
                    </select>
                  </label>
                </div>

                <div className="border border-gold/20 bg-gold/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                    Resumo da venda
                  </p>
                  <div className="mt-4 grid gap-3 text-sm text-stone-300 sm:grid-cols-2">
                    <p>Valor total: {formatCurrency(preview.revenue)}</p>
                    <p>Custo estimado: {formatCurrency(preview.estimatedCost)}</p>
                    <p>Taxa cartao: {formatCurrency(preview.cardFee)}</p>
                    <p>Lucro estimado: {formatCurrency(preview.netProfit)}</p>
                  </div>
                </div>

                <label>
                  <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                    Observacao
                  </span>
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    rows={4}
                    className="mt-2 w-full resize-none border border-gold/25 bg-black/45 px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
                  />
                </label>

                <button
                  type="submit"
                  className="min-h-12 rounded-full bg-gold px-6 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light"
                >
                  Registrar venda
                </button>
              </div>
            </form>

            <section className="premium-surface p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                    Vendas registradas
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">
                    Clientes, fiados e pagamentos
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={exportCsv}
                  className="min-h-10 rounded-full border border-gold/35 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold"
                >
                  Exportar CSV
                </button>
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  Status
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    ["todos", "Todos"],
                    ["pagos", "Pagos"],
                    ["pendentes", "Pendentes"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatusFilter(value as SaleFilter)}
                      className={`min-h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                        statusFilter === value
                          ? "border-gold bg-gold text-black"
                          : "border-gold/30 bg-gold/10 text-gold-light hover:border-gold-light"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  Forma de pagamento
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    ["todos", "Todos"],
                    ["dinheiro", "Dinheiro"],
                    ["pix", "Pix"],
                    ["cartão", "Cartao"],
                    ["fiado", "Fiado / receber depois"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPaymentFilter(value as PaymentFilter)}
                      className={`min-h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                        paymentFilter === value
                          ? "border-gold bg-gold text-black"
                          : "border-gold/30 bg-gold/10 text-gold-light hover:border-gold-light"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {filteredSales.length === 0 ? (
                  <div className="border border-white/10 bg-black/25 p-6 text-center">
                    <p className="text-sm text-stone-500">
                      Nenhuma venda registrada neste filtro.
                    </p>
                  </div>
                ) : (
                  filteredSales.map((sale) => {
                    const profit = saleProfit(sale);
                    const isPaid = sale.status === "pago";
                    const paymentMethod = normalizePaymentMethod(sale.paymentMethod);

                    return (
                      <article
                        key={sale.id}
                        className="border border-white/10 bg-black/25 p-5"
                      >
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-xl font-semibold text-white">
                                {sale.customerName}
                              </h3>
                              <span
                                className={`border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                                  isPaid
                                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                    : "border-gold/35 bg-gold/10 text-gold-light"
                                }`}
                              >
                                {statusLabels[sale.status]}
                              </span>
                            </div>
                            <p className="mt-3 text-sm text-stone-300">
                              {sale.perfumeName} &bull; {sale.quantity} un. &bull;{" "}
                              {formatCurrency(profit.revenue)}
                            </p>
                            <p className="mt-2 text-sm text-stone-500">
                              {paymentLabels[paymentMethod]} &bull;{" "}
                              {formatDate(sale.createdAt)}
                            </p>

                            <div className="mt-4 grid gap-2 text-sm text-stone-300 sm:grid-cols-2">
                              <p>Venda: {formatCurrency(profit.revenue)}</p>
                              <p>Custo: {formatCurrency(profit.estimatedCost)}</p>
                              <p>
                                Taxa cartao: {formatCurrency(profit.cardFee)}
                              </p>
                              <p>
                                Lucro estimado:{" "}
                                {formatCurrency(profit.netProfit)}
                              </p>
                              <p>Margem: {formatPercent(profit.marginPercent)}</p>
                            </div>

                            {sale.notes ? (
                              <p className="mt-3 leading-7 text-stone-400">
                                {sale.notes}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {!isPaid ? (
                              <button
                                type="button"
                                onClick={() => markAsPaid(sale.id)}
                                className="min-h-10 rounded-full border border-emerald-400/30 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300 transition hover:bg-emerald-400/10"
                              >
                                Marcar como pago
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => deleteSale(sale.id)}
                              className="min-h-10 rounded-full border border-red-400/30 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-red-300 transition hover:bg-red-400/10"
                            >
                              Excluir venda
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <div className="mt-8 premium-surface p-6">
            <p className="text-sm leading-7 text-stone-400">
              Este painel e uma versao inicial para controle pessoal. Nao use
              como sistema fiscal. Faca backup das informacoes exportando CSV
              regularmente.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
