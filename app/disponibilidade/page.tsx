import {
  availabilityLabels,
  type AvailabilityStatus,
} from "@/lib/perfumes";
import { getPublicPerfumes } from "@/lib/public-perfumes";
import { createWhatsAppLink } from "@/lib/whatsapp";

const statusGroups: { status: AvailabilityStatus; title: string }[] = [
  { status: "available", title: "Disponiveis" },
  { status: "limited", title: "Poucas unidades" },
  { status: "on_order", title: "Sob encomenda" },
];

const whatsappHref = createWhatsAppLink(
  "Ola! Quero consultar a disponibilidade dos perfumes da Amaro dos Reis Parfum."
);

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function DisponibilidadePage() {
  const publicPerfumes = await getPublicPerfumes();

  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="premium-bg relative overflow-hidden border-b border-gold/15 px-6 py-16 sm:px-10 lg:px-12">
        <div className="absolute right-[14%] top-12 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-gold">
            Encomendas
          </p>
          <h1 className="mt-5 text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
            Disponibilidade e encomendas
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-9 text-stone-300">
            A Amaro dos Reis Parfum trabalha com producao em pequenos lotes.
            Algumas fragrancias podem estar disponiveis, em poucas unidades ou
            sob encomenda. Antes de finalizar o pedido, consulte
            disponibilidade pelo WhatsApp.
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="mt-9 inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light"
          >
            Consultar no WhatsApp
          </a>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
          {statusGroups.map((group) => {
            const perfumes = publicPerfumes.filter(
              (perfume) => perfume.availabilityStatus === group.status
            );

            return (
              <section key={group.status}>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <h2 className="text-2xl font-semibold text-white">
                    {group.title}
                  </h2>
                  <p className="text-xs uppercase tracking-[0.22em] text-gold">
                    {perfumes.length}
                  </p>
                </div>

                <div className="grid gap-3">
                  {perfumes.length === 0 ? (
                    <article className="premium-surface p-5">
                      <p className="text-sm text-stone-500">
                        Nenhuma fragrancia nesta categoria agora.
                      </p>
                    </article>
                  ) : (
                    perfumes.map((perfume) => (
                      <article key={perfume.slug} className="premium-surface p-5">
                        <div className="flex gap-4">
                          {perfume.imageUrl || perfume.conceptImageUrl ? (
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded border border-gold/20 bg-black/40">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={perfume.imageUrl || perfume.conceptImageUrl}
                                alt={perfume.name}
                                className="h-full w-full object-contain p-1.5"
                              />
                            </div>
                          ) : null}
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.22em] text-gold/80">
                              {perfume.collection}
                            </p>
                            <h3 className="mt-3 text-xl font-semibold uppercase tracking-[0.08em] text-white">
                              {perfume.name}
                            </h3>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-300">
                          <span className="border border-white/10 px-3 py-1">
                            {formatPrice(perfume.price)}
                          </span>
                          <span className="border border-white/10 px-3 py-1 text-gold-light">
                            {availabilityLabels[perfume.availabilityStatus]}
                          </span>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
