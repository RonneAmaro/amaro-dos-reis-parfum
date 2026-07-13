import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Painel Administrativo | AMARO DOS REIS PARFUM",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="premium-bg flex min-h-[75vh] items-center justify-center px-5 py-16">
      <section className="gold-glow w-full max-w-md rounded-xl border border-gold/25 bg-black/75 p-7 backdrop-blur sm:p-10">
        <Image
          src="/logo-amaro-parfum.png"
          alt="AMARO DOS REIS PARFUM"
          width={200}
          height={200}
          priority
          className="mx-auto h-24 w-auto object-contain"
        />
        <div className="mt-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            Acesso exclusivo
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Painel Administrativo
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-400">
            Entre com a senha administrativa para acessar vendas e estoque.
          </p>
        </div>
        <Suspense fallback={<p className="mt-8 text-center text-sm text-stone-400">Carregando...</p>}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
