import Link from "next/link";

const footerLinks = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/colecoes", label: "Coleções" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[#d8b76a]/20 bg-[#050505] px-6 py-12 text-stone-300 sm:px-10 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#f2d78b]">
            AMARO DOS REIS PARFUM
          </p>
          <p className="mt-4 max-w-xl leading-7 text-stone-400">
            Perfumes autorais inspirados em grandes fragrâncias internacionais e
            orientais.
          </p>
          <p className="mt-6 max-w-2xl text-sm leading-6 text-stone-500">
            As referências olfativas são usadas apenas para orientar o perfil
            aromático das fragrâncias.
          </p>
        </div>

        <div className="lg:text-right">
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-400 lg:justify-end">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-[#f2d78b]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="mt-8 text-sm text-stone-500">
            © 2026 Amaro dos Reis Parfum. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
