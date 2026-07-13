import Link from "next/link";
import Image from "next/image";
import {
  createGeneralContactMessage,
  createWhatsAppLink,
} from "@/lib/whatsapp";

const whatsappHref = createWhatsAppLink(createGeneralContactMessage());

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#030303] px-6 py-12 text-stone-500 sm:px-10 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <Image
            src="/logo-amaro-parfum.png"
            alt="AMAROdosREIS Parfum"
            width={160}
            height={160}
            className="h-16 w-auto object-contain sm:h-20"
          />
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
          <Link href="/instalar" className="transition hover:text-gold-light">
            Instalar app
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
          olfativa. AMAROdosREIS Parfum e uma marca independente.
        </p>
      </div>
    </footer>
  );
}
