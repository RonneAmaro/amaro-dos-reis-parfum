import type { ReactNode } from "react";

export type AdminIconName =
  | "sale" | "assistant" | "stock" | "calendar" | "google" | "backup" | "sync" | "report"
  | "paid" | "pending" | "overdue" | "profit" | "mic" | "check" | "close";

export function AdminIcon({ name, className = "h-5 w-5" }: { name: AdminIconName; className?: string }) {
  const paths: Record<AdminIconName, ReactNode> = {
    sale: <><path d="M6 2h9l3 3v15H6z"/><path d="M9 9h6M9 13h6M9 17h3"/></>,
    assistant: <><path d="M12 3v2M5.6 5.6 7 7M18.4 5.6 17 7"/><rect x="5" y="7" width="14" height="12" rx="4"/><path d="M9 12h.01M15 12h.01M9 16h6"/></>,
    stock: <><path d="m4 7 8-4 8 4-8 4z"/><path d="m4 7 8 4 8-4v10l-8 4-8-4zM12 11v10"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18M8 14h3M13 14h3M8 17h3"/></>,
    google: <><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 5v7h-7"/></>,
    backup: <><path d="M12 3v12M8 11l4 4 4-4"/><path d="M5 19h14"/></>,
    sync: <><path d="M20 7h-5V2M4 17h5v5"/><path d="M18.5 9A7 7 0 0 0 6.2 5.2L4 7M5.5 15A7 7 0 0 0 17.8 18.8L20 17"/></>,
    report: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    paid: <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></>,
    pending: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    overdue: <><path d="M12 3 2.5 20h19z"/><path d="M12 9v4M12 17h.01"/></>,
    profit: <><path d="m4 16 5-5 4 4 7-8"/><path d="M15 7h5v5"/></>,
    mic: <><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    close: <path d="M6 6l12 12M18 6 6 18"/>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{paths[name]}</svg>;
}

export function AdminQuickActions() {
  const actions: Array<[string, string, AdminIconName]> = [
    ["#vendas", "Nova venda", "sale"], ["#assistente-administrativo", "Assistente", "assistant"],
    ["#estoque-e-custos", "Estoque", "stock"], ["#agenda-recebimentos", "Recebimentos", "calendar"],
    ["#google-agenda", "Google Agenda", "google"], ["#backup", "Backup", "backup"],
    ["#sync", "Sincronização", "sync"], ["#relatorios", "Relatórios", "report"],
  ];
  return <nav aria-label="Ações rápidas" className="flex snap-x gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible xl:grid-cols-8">
    {actions.map(([href, label, icon]) => <a key={href} href={href}
      className="group flex min-h-24 min-w-32 snap-start flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-left transition hover:-translate-y-0.5 hover:border-gold/45 hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-gold sm:min-w-0">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/10 text-gold-light transition group-hover:bg-gold group-hover:text-black"><AdminIcon name={icon}/></span>
      <span className="mt-3 text-xs font-semibold text-stone-200">{label}</span>
    </a>)}
  </nav>;
}

export type SummaryCard = { label: string; value: string; icon: AdminIconName; tone: "emerald" | "gold" | "red" | "blue" };

export function AdminSummaryCards({ cards }: { cards: SummaryCard[] }) {
  const tones = { emerald: "border-emerald-400/20 text-emerald-300", gold: "border-gold/25 text-gold-light", red: "border-red-400/20 text-red-300", blue: "border-blue-400/20 text-blue-300" };
  return <div className="flex snap-x gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4 xl:grid-cols-7">
    {cards.map((card) => <article key={card.label} className={`min-w-40 snap-start rounded-2xl border bg-gradient-to-br from-white/[0.06] to-transparent p-4 sm:min-w-0 ${tones[card.tone]}`}>
      <div className="flex items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">{card.label}</p><AdminIcon name={card.icon} className="h-4 w-4"/></div>
      <p className="mt-4 break-words text-xl font-semibold leading-none sm:text-2xl">{card.value}</p>
    </article>)}
  </div>;
}
