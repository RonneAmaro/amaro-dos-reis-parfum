import Link from "next/link";
import Image from "next/image";
import { createWhatsAppLink } from "@/lib/whatsapp";

const whatsappHref = createWhatsAppLink(
  "Olá! Quero conhecer os perfumes da Amaro dos Reis Parfum."
);

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 overflow-visible border-b border-gold/15 bg-black/80 backdrop-blur-xl">
      <nav className="relative mx-auto flex h-[72px] max-w-7xl items-center overflow-visible px-6 text-xs font-semibold uppercase tracking-[0.22em] text-stone-400 sm:h-[84px] sm:px-10 lg:h-[88px] lg:px-12">
        <Link
          href="/"
          className="group absolute left-4 top-2 z-10 inline-flex w-fit items-start text-gold transition hover:text-gold-light sm:left-8 lg:left-10"
        >
          <Image
            src="/logo-amaro-parfum.png"
            alt="Amaro dos Reis Parfum"
            width={360}
            height={360}
            priority
            className="h-24 w-auto object-contain sm:h-36 lg:h-44"
          />
        </Link>

        <div className="ml-28 flex min-w-0 flex-1 items-center gap-x-4 overflow-x-auto whitespace-nowrap py-2 [scrollbar-width:none] sm:ml-40 sm:flex-wrap sm:justify-end sm:gap-x-6 sm:gap-y-3 sm:overflow-visible sm:whitespace-normal lg:ml-52">
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
