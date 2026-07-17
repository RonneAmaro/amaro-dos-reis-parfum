"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getPerfumeGuideRecommendations, type PerfumeGuideAnswers } from "@/lib/perfumeGuide";
import { formatPerfumePrice, lineLabels } from "@/lib/perfumes";
import { createWhatsAppLink } from "@/lib/whatsapp";
import { PublicAvailabilityBadge } from "@/app/components/PublicAvailabilityBadge";
import { getSafePublicAvailability } from "@/lib/publicAvailability";

type Question = {
  key: keyof PerfumeGuideAnswers;
  eyebrow: string;
  title: string;
  optional?: boolean;
  options: { value: string; label: string; hint?: string }[];
};

const questions: Question[] = [
  { key: "recipient", eyebrow: "Primeiro, o contexto", title: "É para quem?", options: [
    { value: "self", label: "Para mim", hint: "Quero descobrir minha próxima assinatura." },
    { value: "gift", label: "Para presente", hint: "Quero surpreender alguém especial." },
    { value: "unsure", label: "Ainda não sei", hint: "Quero explorar boas opções." },
  ] },
  { key: "profile", eyebrow: "Perfil da fragrância", title: "Qual perfil você procura?", options: [
    { value: "male", label: "Masculino" }, { value: "female", label: "Feminino" },
    { value: "unisex", label: "Unissex" }, { value: "any", label: "Tanto faz" },
  ] },
  { key: "style", eyebrow: "Sua personalidade", title: "Qual estilo combina mais?", options: [
    { value: "sweet", label: "Doce" }, { value: "fresh", label: "Fresco" },
    { value: "woody", label: "Amadeirado" }, { value: "striking", label: "Marcante" },
    { value: "elegant", label: "Elegante" }, { value: "oriental", label: "Oriental / árabe" },
    { value: "seductive", label: "Sedutor" }, { value: "daily", label: "Dia a dia" },
  ] },
  { key: "occasion", eyebrow: "O momento ideal", title: "Para qual ocasião?", options: [
    { value: "work", label: "Trabalho / dia a dia" }, { value: "date", label: "Encontro" },
    { value: "night", label: "Noite / festa" }, { value: "gift", label: "Presente especial" },
    { value: "versatile", label: "Uso versátil" }, { value: "presence", label: "Algo de presença" },
  ] },
  { key: "line", eyebrow: "Sua preferência", title: "Qual linha você prefere?", options: [
    { value: "traditional", label: "Tradicional — R$ 80", hint: "Fragrâncias de 50 ml." },
    { value: "arabic_premium", label: "Árabe Premium — R$ 120", hint: "Intensidade e personalidade oriental." },
    { value: "both", label: "Quero ver as duas", hint: "Compare livremente as coleções." },
  ] },
  { key: "reference", eyebrow: "Etapa opcional", title: "Prefere algo parecido com algum perfume famoso?", optional: true, options: [
    ..."Good Girl,Fantasy,La Nuit Tresor,Aventus,Fahrenheit,Invictus,Allure Homme,Allure Homme Sport,Scandal,Yara,Asad".split(",").map((label) => ({ value: label, label })),
    { value: "none", label: "Não tenho referência" },
  ] },
];

const generalWhatsApp = createWhatsAppLink("Olá! Quero ajuda para escolher um perfume da AMARO DOS REIS PARFUM.");

export function PerfumeGuideClient() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<PerfumeGuideAnswers>>({});
  const [finished, setFinished] = useState(false);
  const recommendations = useMemo(() => finished ? getPerfumeGuideRecommendations(answers, 5) : [], [answers, finished]);
  const question = questions[step];

  function begin() {
    setStarted(true);
    setTimeout(() => document.getElementById("guia")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }
  function choose(value: string) {
    setAnswers((current) => ({ ...current, [question.key]: value }));
    if (step === questions.length - 1) setFinished(true);
    else setStep((current) => current + 1);
  }
  function restart() {
    setAnswers({});
    setStep(0);
    setFinished(false);
    setStarted(true);
    document.getElementById("guia")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-stone-100">
      <section className="premium-bg relative border-b border-gold/15 px-6 py-20 sm:px-10 lg:px-12 lg:py-28">
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[.34em] text-gold">Curadoria personalizada</p>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold uppercase leading-tight text-white sm:text-6xl lg:text-7xl">Guia <span className="text-gold-light">Escolha seu Perfume</span></h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-stone-300 sm:text-lg">Responda algumas perguntas rápidas e descubra fragrâncias que combinam com seu estilo, ocasião e personalidade.</p>
          <div className="mx-auto mt-9 flex max-w-3xl flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={begin} className="min-h-13 rounded-full bg-gold px-8 text-xs font-semibold uppercase tracking-[.16em] text-black hover:bg-gold-light">Começar agora</button>
            <Link href="/catalogo-olfativo" className="inline-flex min-h-13 items-center justify-center rounded-full border border-gold/45 px-8 text-xs font-semibold uppercase tracking-[.16em] text-gold-light hover:bg-gold/10">Ver catálogo olfativo</Link>
            <a href={generalWhatsApp} target="_blank" rel="noreferrer" className="inline-flex min-h-13 items-center justify-center rounded-full border border-white/20 px-8 text-xs font-semibold uppercase tracking-[.16em] text-white hover:border-gold/60">Chamar no WhatsApp</a>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[.3em] text-gold">Como funciona?</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Você responde algumas perguntas", "O guia seleciona fragrâncias compatíveis", "Você escolhe a que mais gostou", "Chama no WhatsApp para confirmar disponibilidade"].map((text, index) => (
              <div key={text} className="premium-surface p-5"><span className="text-sm font-semibold text-gold">0{index + 1}</span><p className="mt-3 text-sm leading-6 text-stone-300">{text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section id="guia" className="scroll-mt-44 px-5 py-16 sm:px-10 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-4xl">
          {!started ? (
            <div className="premium-surface gold-glow p-8 text-center sm:p-14">
              <p className="text-xs uppercase tracking-[.3em] text-gold">Leva menos de dois minutos</p>
              <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Pronto para encontrar sua fragrância?</h2>
              <button type="button" onClick={begin} className="mt-8 min-h-13 rounded-full bg-gold px-9 text-xs font-semibold uppercase tracking-[.16em] text-black">Iniciar guia</button>
            </div>
          ) : finished ? (
            <div aria-live="polite">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[.3em] text-gold">Sua seleção personalizada</p>
                <h2 className="mt-4 text-3xl font-semibold text-white sm:text-5xl">Perfumes recomendados para você</h2>
                <p className="mt-4 text-sm text-stone-400">Recomendação baseada no estilo olfativo informado.</p>
              </div>
              <div className="mt-10 grid gap-5 md:grid-cols-2">
                {recommendations.map(({ perfume, reason, matchedTags }, index) => {
                  const availability = getSafePublicAvailability(perfume);
                  const message = `Olá! Fiz o Guia Escolha seu Perfume e gostei da recomendação ${perfume.name} (${lineLabels[perfume.line]}, ${formatPerfumePrice(perfume)}, referência olfativa: ${perfume.inspiration}). No site ele aparece como “${availability.label}”. Pode me falar mais sobre ele?`;
                  return (
                    <article key={perfume.slug} className={`premium-surface flex flex-col p-6 sm:p-7 ${index === 0 ? "border-gold/60 md:col-span-2" : ""}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div><p className="text-[10px] uppercase tracking-[.22em] text-gold">{index === 0 ? "Melhor combinação" : perfume.collection}</p><h3 className="mt-3 text-2xl font-semibold tracking-[.06em] text-white">{perfume.name}</h3></div>
                        <p className="shrink-0 text-xl font-semibold text-gold-light">{formatPerfumePrice(perfume)}</p>
                      </div>
                      <p className="mt-2 text-xs text-stone-500">Referência olfativa: {perfume.inspiration}</p>
                      <PublicAvailabilityBadge availability={availability} showDescription className="mt-4" />
                      {availability.status === "sold_out" ? <p className="mt-3 text-xs leading-5 text-rose-200">Pode estar indisponível no momento. Consulte reposição.</p> : null}
                      <p className="mt-5 text-sm leading-7 text-stone-300">{reason}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="rounded-full border border-gold/25 px-3 py-1.5 text-[10px] uppercase tracking-[.12em] text-gold-light">{perfume.collection}</span>
                        <span className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] uppercase tracking-[.12em] text-stone-300">{lineLabels[perfume.line]}</span>
                        {(matchedTags.length ? matchedTags : perfume.tags.slice(0, 2)).slice(0, 3).map((tag) => <span key={tag} className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] uppercase tracking-[.12em] text-stone-300">{tag}</span>)}
                      </div>
                      <div className="mt-auto grid gap-3 pt-7 sm:grid-cols-2">
                        <a href={createWhatsAppLink(message)} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-5 text-xs font-semibold uppercase tracking-[.14em] text-black hover:bg-gold-light">Quero este</a>
                        <Link href={`/perfumes/${perfume.slug}`} className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/40 px-5 text-xs font-semibold uppercase tracking-[.14em] text-gold-light hover:bg-gold/10">Ver detalhes</Link>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <button type="button" onClick={restart} className="min-h-12 rounded-full border border-gold/45 px-7 text-xs font-semibold uppercase tracking-[.14em] text-gold-light">Reiniciar guia</button>
                <Link href="/catalogo-olfativo" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-7 text-xs font-semibold uppercase tracking-[.14em] text-white">Ver catálogo olfativo</Link>
              </div>
            </div>
          ) : (
            <div className="premium-surface gold-glow p-6 sm:p-10">
              <div className="flex items-center justify-between gap-4 text-[10px] font-semibold uppercase tracking-[.2em] text-stone-500"><span>Etapa {step + 1} de {questions.length}</span><span>{Math.round((step / questions.length) * 100)}%</span></div>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gold transition-all duration-300" style={{ width: `${(step / questions.length) * 100}%` }} /></div>
              <p className="mt-9 text-xs font-semibold uppercase tracking-[.28em] text-gold">{question.eyebrow}</p>
              <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">{question.title}</h2>
              {question.optional ? <p className="mt-3 text-sm text-stone-500">Opcional — escolha uma referência ou avance sem ela.</p> : null}
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {question.options.map((option) => (
                  <button key={option.value} type="button" onClick={() => choose(option.value)} className="min-h-16 border border-gold/20 bg-gold/[.04] p-4 text-left transition hover:border-gold/70 hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                    <span className="block text-sm font-semibold text-white">{option.label}</span>
                    {option.hint ? <span className="mt-1 block text-xs leading-5 text-stone-500">{option.hint}</span> : null}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex items-center justify-between gap-3">
                <button type="button" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} className="min-h-11 px-2 text-xs font-semibold uppercase tracking-[.14em] text-stone-400 disabled:invisible">← Voltar</button>
                <button type="button" onClick={restart} className="min-h-11 px-2 text-xs font-semibold uppercase tracking-[.14em] text-stone-500 hover:text-gold-light">Reiniciar guia</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
