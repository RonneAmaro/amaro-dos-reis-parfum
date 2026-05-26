import Link from "next/link";
import { createWhatsAppLink } from "@/lib/whatsapp";

const whatsappHref = createWhatsAppLink(
  "Olá! Quero conhecer os perfumes da Amaro dos Reis Parfum."
);

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#030303] px-6 py-12 text-stone-500 sm:px-10 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold">
            Amaro dos Reis Parfum
          </p>
          <p className="mt-4 max-w-xl leading-7">
            Perfumaria autoral com referencias olfativas premium, nomes
            proprios e curadoria proxima.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold uppercase tracking-[0.22em]">
          <Link href="/" className="transition hover:text-gold-light">
            Inicio
          </Link>
          <Link href="/catalogo" className="transition hover:text-gold-light">
            Catalogo
          </Link>
          <Link
            href="/disponibilidade"
            className="transition hover:text-gold-light"
          >
            Disponibilidade
          </Link>
          <Link href="/contato" className="transition hover:text-gold-light">
            Contato
          </Link>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-gold-light"
          >
            WhatsApp
          </a>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-xs leading-6">
        <p>
          As referencias olfativas indicam inspiracoes de estilo e familia
          olfativa. Amaro dos Reis Parfum e uma marca independente.
        </p>
      </div>
    </footer>
  );
}
