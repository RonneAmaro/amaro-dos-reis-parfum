const WHATSAPP_LINK = "#";

const contactCards = [
  "Atendimento local",
  "Perfumes de 50ml",
  "Linha Tradicional R$ 80",
  "Linha Árabe Premium R$ 120",
];

export default function ContatoPage() {
  return (
    <main className="bg-[#050505] text-stone-100">
      <section className="border-b border-[#d8b76a]/20 bg-[radial-gradient(circle_at_top,rgba(216,183,106,0.18),transparent_34%),linear-gradient(135deg,#050505_0%,#11100d_56%,#050505_100%)] px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d8b76a]">
            Atendimento
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
            Fale com a Amaro dos Reis Parfum
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
            Para pedidos, dúvidas ou escolha da fragrância ideal, fale
            diretamente pelo WhatsApp.
          </p>
          <a
            id="whatsapp"
            href={WHATSAPP_LINK}
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#d8b76a] px-8 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#f2d78b]"
          >
            WhatsApp
          </a>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contactCards.map((card) => (
            <article
              key={card}
              className="rounded-lg border border-[#d8b76a]/20 bg-gradient-to-b from-white/[0.055] to-white/[0.02] p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#d8b76a]">
                Amaro dos Reis
              </p>
              <h2 className="mt-4 text-xl font-semibold text-white">{card}</h2>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
