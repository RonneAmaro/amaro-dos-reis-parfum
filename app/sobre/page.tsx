export default function SobrePage() {
  return (
    <main className="bg-[#050505] text-stone-100">
      <section className="border-b border-[#d8b76a]/20 bg-[radial-gradient(circle_at_top_left,rgba(216,183,106,0.18),transparent_34%),linear-gradient(135deg,#050505_0%,#11100d_56%,#050505_100%)] px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d8b76a]">
            Identidade autoral
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl">
            Sobre a Amaro dos Reis Parfum
          </h1>
          <div className="mt-8 max-w-4xl space-y-5 text-lg leading-9 text-stone-300">
            <p>
              A marca nasceu do desejo de transformar fragrâncias marcantes em
              experiências acessíveis, elegantes e memoráveis.
            </p>
            <p>
              Cada perfume recebe nome próprio, identidade própria e proposta
              olfativa pensada para valorizar presença, estilo e personalidade.
            </p>
            <p>
              A marca está em processo de profissionalização, com foco em
              catálogo autoral, frascos premium e atendimento próximo ao
              cliente.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <article className="rounded-lg border border-[#d8b76a]/20 bg-white/[0.04] p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d8b76a]">
              Nossa nova fase
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white">
              Uma marca com assinatura própria.
            </h2>
            <p className="mt-5 leading-8 text-stone-300">
              A Amaro dos Reis Parfum está deixando de depender dos nomes
              originais e criando uma identidade própria para cada fragrância.
              As inspirações continuam orientando o perfil aromático, mas o
              protagonismo passa a ser da experiência autoral da marca.
            </p>
          </article>

          <article className="rounded-lg border border-[#d8b76a]/20 bg-white/[0.04] p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d8b76a]">
              Como trabalhamos
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white">
              Pequenos lotes, atenção ao detalhe.
            </h2>
            <p className="mt-5 leading-8 text-stone-300">
              Os perfumes são produzidos em pequenos lotes, com atenção ao
              acabamento, apresentação e experiência do cliente. A proposta é
              oferecer uma perfumaria próxima, elegante e cuidada do primeiro
              contato até a escolha da fragrância.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
