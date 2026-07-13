import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instalar app | AMARO DOS REIS PARFUM",
  description: "Como instalar o catálogo AMARO DOS REIS PARFUM no celular.",
};

export default function InstalarPage() {
  return (
    <main className="premium-bg min-h-[70vh] px-6 py-16 sm:px-10">
      <section className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Aplicativo</p>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Instale a Amaro Parfum</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-stone-300">
          Tenha o catálogo sempre à mão e abra o site em uma experiência própria, direto da tela inicial do celular.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <article className="premium-surface rounded-xl p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Android</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Instalar pelo Chrome</h2>
            <p className="mt-4 leading-7 text-stone-400">
              Abra este site no Chrome, toque nos três pontinhos e escolha “Instalar app” ou “Adicionar à tela inicial”.
            </p>
          </article>
          <article className="premium-surface rounded-xl p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">iPhone</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Adicionar pelo Safari</h2>
            <p className="mt-4 leading-7 text-stone-400">
              Abra este site no Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
