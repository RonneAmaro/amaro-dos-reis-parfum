import Link from "next/link";
import Image from "next/image";
import { createWhatsAppLink } from "@/lib/whatsapp";

const whatsappHref = createWhatsAppLink(
  "Olá! Quero conhecer os perfumes da Amaro dos Reis Parfum."
);

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-gold/15 bg-black/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-400 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-4 lg:px-12 lg:py-5">
        <Link
          href="/"
          className="group inline-flex w-fit shrink-0 items-center text-gold transition hover:text-gold-light"
        >
          <Image
            src="/logo-amaro-parfum.png"
            alt="Amaro dos Reis Parfum"
            width={200}
            height={200}
            priority
            className="h-16 w-auto object-contain sm:h-20 lg:h-24"
          />
        </Link>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/" className="transition hover:text-gold-light">
            Inicio
          </Link>
          <Link href="/catalogo" className="transition hover:text-gold-light">
            Catalogo
          </Link>
          <Link
            href="/apresentacao"
            className="transition hover:text-gold-light"
          >
            Apresentacao
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
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-gold/45 bg-gold/10 px-5 text-gold-light shadow-[0_0_24px_rgba(216,183,106,0.10)] transition hover:border-gold-light hover:bg-gold hover:text-black"
          >
            WhatsApp
          </a>
        </div>
      </nav>
    </header>
  );
}
