import Link from "next/link";
import { createWhatsAppLink } from "@/lib/whatsapp";

const whatsappHref = createWhatsAppLink(
  "Ola! Quero conhecer os perfumes da AMAROdosREIS Parfum."
);
const isWhatsAppConfigured = whatsappHref !== "#";

export default function ContatoPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="premium-bg relative overflow-hidden border-b border-gold/15 px-6 py-16 sm:px-10 lg:px-12">
        <div className="absolute right-[12%] top-16 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-gold">
            Contato
          </p>
          <h1 className="mt-5 text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
            Fale com a AMAROdosREIS Parfum.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300">
            Atendimento local e producao em pequenos lotes. Consulte
            disponibilidade das fragrancias.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappHref}
              target={isWhatsAppConfigured ? "_blank" : undefined}
              rel={isWhatsAppConfigured ? "noreferrer" : undefined}
              aria-disabled={!isWhatsAppConfigured}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light"
            >
              Chamar no WhatsApp
            </a>
            <Link
              href="/catalogo"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/45 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
            >
              Ver catalogo
            </Link>
          </div>
          {!isWhatsAppConfigured ? (
            <p className="mt-5 text-sm text-stone-500">
              WhatsApp será configurado em breve.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
