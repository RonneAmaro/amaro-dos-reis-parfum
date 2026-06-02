import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Status do site — AMAROdosREIS Parfum",
  description:
    "Página de diagnóstico visual do ambiente de publicação da AMAROdosREIS Parfum.",
  robots: {
    index: false,
    follow: false,
  },
};

const hasSiteUrl = Boolean(process.env.NEXT_PUBLIC_SITE_URL);
const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const hasSupabaseAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const hasWhatsAppNumber = Boolean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
const hasSupabaseConfig = hasSupabaseUrl && hasSupabaseAnonKey;

const environmentItems = [
  {
    label: "NEXT_PUBLIC_SITE_URL configurada?",
    configured: hasSiteUrl,
  },
  {
    label: "NEXT_PUBLIC_SUPABASE_URL configurada?",
    configured: hasSupabaseUrl,
  },
  {
    label: "NEXT_PUBLIC_SUPABASE_ANON_KEY configurada?",
    configured: hasSupabaseAnonKey,
  },
  {
    label: "NEXT_PUBLIC_WHATSAPP_NUMBER configurado?",
    configured: hasWhatsAppNumber,
  },
];

const identityItems = [
  "Logo oficial disponível: /logo-amaro-parfum.png",
  "Favicon SVG disponível: /amaro-parfum-icon.svg",
  "Favicon PNG disponível: /favicon-amaro.png",
  "Favicon ICO disponível: /favicon-amaro.ico",
];

const routeItems = [
  { href: "/", label: "/" },
  { href: "/catalogo", label: "/catalogo" },
  { href: "/colecoes", label: "/colecoes" },
  { href: "/apresentacao", label: "/apresentacao" },
  { href: "/sobre", label: "/sobre" },
  { href: "/contato", label: "/contato" },
  { href: "/disponibilidade", label: "/disponibilidade" },
  { href: "/robots.txt", label: "/robots.txt" },
  { href: "/sitemap.xml", label: "/sitemap.xml" },
];

const securityItems = [
  "/admin oculto do menu público",
  "/admin exige login autorizado",
  "não usar service role no frontend",
  ".env.local não deve ser commitado",
];

const vercelSteps = [
  "configurar variáveis em Settings > Environment Variables",
  "rodar redeploy depois de alterar variáveis",
  "testar em aba anônima",
  "conferir WhatsApp",
  "conferir catálogo",
  "conferir upload de imagens",
  "conferir favicon",
];

function StatusBadge({ configured }: { configured: boolean }) {
  return (
    <span
      className={
        configured
          ? "border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200"
          : "border border-red-400/35 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-red-200"
      }
    >
      {configured ? "Configurado" : "Pendente"}
    </span>
  );
}

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="premium-bg border-b border-gold/15 px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-gold">
            Diagnóstico interno
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
            Status do site — AMAROdosREIS Parfum
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
            Esta página ajuda a conferir se o ambiente está pronto para
            publicação.
          </p>
        </div>
      </section>

      <section className="px-6 py-14 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <section className="premium-surface p-6">
            <SectionTitle eyebrow="Ambiente" title="Variáveis públicas" />
            <div className="space-y-3">
              {environmentItems.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col gap-3 border border-white/10 bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm font-medium text-stone-200">
                    {item.label}
                  </p>
                  <StatusBadge configured={item.configured} />
                </div>
              ))}
            </div>
            <div className="mt-5 border border-gold/25 bg-gold/10 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold-light">
                Supabase
              </p>
              <p className="mt-2 text-sm text-stone-300">
                {hasSupabaseConfig
                  ? "Sistema online configurado"
                  : "Sistema online pendente"}
              </p>
            </div>
          </section>

          <section className="premium-surface p-6">
            <SectionTitle eyebrow="Identidade" title="Arquivos esperados" />
            <div className="space-y-3">
              {identityItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between gap-4 border border-gold/20 bg-black/25 p-4"
                >
                  <p className="text-sm text-stone-300">{item}</p>
                  <span className="shrink-0 border border-gold/35 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-gold-light">
                    Esperado
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="premium-surface p-6">
            <SectionTitle eyebrow="Rotas" title="Links principais" />
            <div className="grid gap-3 sm:grid-cols-2">
              {routeItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border border-gold/20 bg-black/25 px-4 py-3 text-sm font-semibold text-gold-light transition hover:border-gold-light hover:bg-gold/10"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="premium-surface p-6">
            <SectionTitle eyebrow="Segurança" title="Checklist discreto" />
            <div className="space-y-3">
              {securityItems.map((item) => (
                <div
                  key={item}
                  className="border border-white/10 bg-black/25 p-4 text-sm text-stone-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="border-t border-gold/15 bg-[#0b0906] px-6 py-14 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <SectionTitle eyebrow="Vercel" title="Próximos passos" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {vercelSteps.map((step) => (
              <div
                key={step}
                className="border border-gold/20 bg-black/25 p-4 text-sm leading-6 text-stone-300"
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
