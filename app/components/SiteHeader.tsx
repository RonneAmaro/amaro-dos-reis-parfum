"use client";

import Link from "next/link";
import { useState } from "react";

const WHATSAPP_LINK = "#";

const navigation = [
  { href: "/", label: "Início" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/colecoes", label: "Coleções" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#d8b76a]/20 bg-[#050505]/88 px-6 py-4 text-stone-100 shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:px-10 lg:px-12">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.26em] text-[#f2d78b] transition hover:text-white"
          onClick={() => setIsOpen(false)}
        >
          AMARO DOS REIS PARFUM
        </Link>

        <nav className="hidden items-center gap-7 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-[#f2d78b]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href={WHATSAPP_LINK}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d8b76a]/60 bg-[#d8b76a] px-5 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#f2d78b]"
          >
            WhatsApp
          </Link>
        </div>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="site-mobile-menu"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d8b76a]/40 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#f2d78b] transition hover:border-[#f2d78b] hover:bg-[#d8b76a]/10 lg:hidden"
        >
          Menu
        </button>
      </div>

      {isOpen ? (
        <div
          id="site-mobile-menu"
          className="mx-auto mt-4 max-w-7xl rounded-lg border border-[#d8b76a]/25 bg-[#0b0906]/96 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.5)] lg:hidden"
        >
          <nav className="grid gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-stone-300">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-3 transition hover:border-[#d8b76a]/45 hover:bg-white/[0.04] hover:text-[#f2d78b]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={WHATSAPP_LINK}
              onClick={() => setIsOpen(false)}
              className="mt-2 inline-flex min-h-12 items-center justify-center rounded-full bg-[#d8b76a] px-5 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#f2d78b]"
            >
              WhatsApp
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
