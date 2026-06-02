import Image from "next/image";
import Link from "next/link";
import {
  createGeneralContactMessage,
  createWhatsAppLink,
} from "@/lib/whatsapp";

const whatsappHref = createWhatsAppLink(createGeneralContactMessage());
const isWhatsAppConfigured = whatsappHref !== "#";

export default function NotFound() {
  return (
    <main className="premium-bg min-h-[calc(100vh-8rem)] bg-[#050505] px-6 py-16 text-stone-100 sm:px-10 lg:px-12">
      <section className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <Image
          src="/logo-amaro-parfum.png"
          alt="AMAROdosREIS Parfum"
          width={160}
          height={160}
          priority
          className="h-28 w-28 object-contain sm:h-36 sm:w-36"
        />
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.32em] text-gold">
          AMAROdosREIS Parfum
        </p>
        <h1 className="mt-5 text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
          Página não encontrada
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300">
          A fragrância que você procura pode ter mudado de caminho.
        </p>

        <div className="mt-10 flex w-full max-w-3xl flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light"
          >
            Voltar ao início
          </Link>
          <Link
            href="/catalogo"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/55 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
          >
            Ver catálogo
          </Link>
          <a
            href={whatsappHref}
            target={isWhatsAppConfigured ? "_blank" : undefined}
            rel={isWhatsAppConfigured ? "noreferrer" : undefined}
            aria-disabled={!isWhatsAppConfigured}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/55 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
          >
            Falar no WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
