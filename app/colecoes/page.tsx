import Link from "next/link";
import { perfumes, type Perfume } from "@/lib/perfumes";

const collections: Array<{
  name: Perfume["collection"];
  concept: string;
}> = [
  {
    name: "Executive Collection",
    concept:
      "Fragrâncias de presença sofisticada para rotina profissional, encontros importantes e momentos em que elegância discreta faz diferença.",
  },
  {
    name: "Oriental Collection",
    concept:
      "Perfumes intensos, ambarados e envolventes, com assinatura inspirada na perfumaria oriental e acabamento premium.",
  },
  {
    name: "Feminine Collection",
    concept:
      "Criações femininas luminosas, florais e gourmand, pensadas para expressar personalidade, delicadeza e presença memorável.",
  },
];

export default function ColecoesPage() {
  return (
    <main className="bg-[#050505] text-stone-100">
      <section className="border-b border-[#d8b76a]/20 bg-[radial-gradient(circle_at_top,rgba(216,183,106,0.18),transparent_34%),linear-gradient(135deg,#050505_0%,#11100d_56%,#050505_100%)] px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d8b76a]">
            Linhas autorais
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
            Coleções Amaro dos Reis Parfum
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
            Cada coleção organiza uma intenção olfativa: presença executiva,
            intensidade oriental e feminilidade elegante em fragrâncias de 50ml.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-6">
          {collections.map((collection) => {
            const collectionPerfumes = perfumes.filter(
              (perfume) => perfume.collection === collection.name
            );

            return (
              <article
                key={collection.name}
                className="rounded-lg border border-[#d8b76a]/20 bg-gradient-to-b from-white/[0.055] to-white/[0.02] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.32)]"
              >
                <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#f2d78b]">
                      {collection.name}
                    </h2>
                    <p className="mt-4 leading-7 text-stone-300">
                      {collection.concept}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {collectionPerfumes.map((perfume) => (
                      <Link
                        key={perfume.slug}
                        href={`/perfumes/${perfume.slug}`}
                        className="rounded-lg border border-white/10 bg-black/25 p-4 transition hover:border-[#d8b76a]/50 hover:bg-white/[0.04]"
                      >
                        <p className="text-lg font-semibold uppercase tracking-[0.08em] text-white">
                          {perfume.name}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-stone-400">
                          {perfume.olfactiveFamily}
                        </p>
                        <p className="mt-3 text-sm font-semibold text-[#f2d78b]">
                          R$ {perfume.price.toFixed(2).replace(".", ",")}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
