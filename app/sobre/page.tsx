import Link from "next/link";
import { createWhatsAppLink } from "@/lib/whatsapp";

const storyWhatsAppHref = createWhatsAppLink(
  "Ola! Quero conhecer as fragrancias da Amaro dos Reis Parfum."
);

const timeline = [
  {
    title: "O inicio",
    text: "Ronne sempre gostou muito de perfumes, mas foi quando sua tia apresentou o universo dos importados que tudo mudou. Foi amor a primeira vista. A partir dali, perfume deixou de ser apenas um produto e passou a ser presenca, memoria, identidade e emocao.",
  },
  {
    title: "Do estudo a criacao",
    text: "Com o tempo, ele decidiu estudar de verdade esse universo. Fez curso online sobre materia-prima, familias olfativas, piramide olfativa, processo de fabricacao e maceracao. Entendeu que cada fragrancia tem construcao, intencao e historia.",
  },
  {
    title: "Quando a paixao virou marca",
    text: "No comeco, os primeiros componentes foram comprados para fabricar perfumes de uso pessoal. Entao as pessoas sentiram, elogiaram, perguntaram qual era a fragrancia e comecaram a pedir para que ele fizesse para elas tambem.",
  },
  {
    title: "Amaro dos Reis Parfum",
    text: "O que nasceu como curiosidade ganhou forma, nome e proposito. Desde 2019, a marca vem sendo construida passo a passo para oferecer fragrancias marcantes, elegantes e acessiveis, com identidade propria e pequenos lotes.",
  },
];

const values = [
  "Producao em pequenos lotes",
  "Nomes autorais",
  "Referencias olfativas premium",
  "Atendimento proximo",
];

export default function SobrePage() {
  return (
    <main className="bg-[#050505] text-stone-100">
      <section className="premium-bg relative overflow-hidden border-b border-gold/15 px-6 py-18 sm:px-10 lg:px-12">
        <div className="absolute right-[10%] top-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="inline-flex border border-gold/30 bg-black/35 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-gold-light">
              Desde 2019
            </p>
            <h1 className="mt-6 text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
              Nossa historia
            </h1>
            <p className="mt-4 text-2xl font-semibold text-gold-light">
              De sonho a realidade
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-9 text-stone-300">
              A Amaro dos Reis Parfum nasceu de uma paixao verdadeira por
              perfumes e do desejo de transformar fragrancias marcantes em
              experiencias acessiveis, elegantes e memoraveis.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/catalogo"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light"
              >
                Ver catalogo
              </Link>
              <a
                href={storyWhatsAppHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/55 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-gold-light transition hover:border-gold-light hover:bg-gold/10"
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>

          <div className="premium-surface p-6 gold-glow">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
              Presenca que marca
            </p>
            <p className="mt-5 text-3xl font-semibold leading-tight text-white">
              Que marcas voce tem deixado na vida das pessoas e nos lugares por
              onde passa?
            </p>
            <p className="mt-5 leading-8 text-stone-400">
              O olfato tem uma ligacao poderosa com emocao e memoria. Um aroma
              pode trazer de volta um encontro, uma fase da vida, uma pessoa ou
              uma lembranca que parecia adormecida.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-4">
            {timeline.map((item, index) => (
              <article key={item.title} className="premium-surface p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                  0{index + 1}
                </p>
                <h2 className="mt-4 text-2xl font-semibold text-white">
                  {item.title}
                </h2>
                <p className="mt-4 leading-8 text-stone-400">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0b0906] px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
              Nossa filosofia
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-5xl">
              Perfume e presenca.
            </h2>
          </div>
          <div className="space-y-5 text-lg leading-9 text-stone-300">
            <p>
              Querendo ou nao, todos deixamos marcas nos lugares por onde
              passamos e nas pessoas que encontramos. Algumas marcas ficam nas
              palavras, outras nas atitudes, e algumas permanecem pelo cheiro.
            </p>
            <p>
              A Amaro dos Reis Parfum acredita que cada pessoa carrega uma
              assinatura propria: uma forma de chegar, permanecer e ser lembrada.
              Nossas fragrancias valorizam essa presenca elegante, envolvente e
              inesquecivel.
            </p>
            <p className="text-2xl font-semibold text-gold-light">
              Conquiste ou seja conquistado.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
              Nossa essencia
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Fragrancias autorais inspiradas em grandes referencias
              internacionais e orientais.
            </h2>
            <p className="mt-5 leading-8 text-stone-400">
              Cada perfume recebe nome proprio, identidade propria e uma
              proposta sensorial pensada para estilos, momentos e
              personalidades diferentes.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <article key={value} className="premium-surface p-6">
                <p className="text-lg font-semibold text-gold-light">
                  {value}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
