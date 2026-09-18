"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AssistantChat from "@/components/AssistantChat";

const LANGS = ["fr", "en", "es"] as const;
type Lang = (typeof LANGS)[number];

type Copy = {
  badge: string;
  title: string;
  intro: string;
  primaryCta: string;
  secondaryCta: string;
  backHome: string;
  trust: string[];
  forTitle: string;
  forIntro: string;
  forItems: string[];
  includedTitle: string;
  includedIntro: string;
  included: { title: string; text: string }[];
  taxTitle: string;
  taxText: string;
  taxPoints: string[];
  howTitle: string;
  howIntro: string;
  steps: { n: string; title: string; text: string }[];
  pricingTitle: string;
  pricingIntro: string;
  monthly: string;
  cad: string;
  choose: string;
  popular: string;
  plans: {
    name: string;
    price: string;
    description: string;
    features: string[];
  }[];
  assistantEyebrow: string;
  assistantTitle: string;
  assistantText: string;
  assistantButton: string;
  chatClose: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
  finalTitle: string;
  finalText: string;
  finalCta: string;
};

const COPY: Record<Lang, Copy> = {
  fr: {
    badge: "Tenue de livres en ligne",
    title: "Une tenue de livres simple, claire et accessible",
    intro:
      "Suivez vos revenus, vos dépenses et vos transactions au même endroit. Gardez une vue claire de votre entreprise et préparez plus facilement vos informations de TPS/TVQ.",
    primaryCta: "Ouvrir mon espace client",
    secondaryCta: "J’ai une question",
    backHome: "Retour à l’accueil",
    trust: ["Simple à utiliser", "Espace sécurisé", "Pensé pour les petites entreprises"],
    forTitle: "À qui s’adresse le service ?",
    forIntro:
      "Une solution pratique pour garder vos informations organisées sans vous perdre dans un logiciel compliqué.",
    forItems: [
      "Travailleurs autonomes",
      "Petites entreprises",
      "Entrepreneurs",
      "Entreprises inscrites ou non inscrites à la TPS/TVQ",
    ],
    includedTitle: "Tout ce qu’il faut pour y voir clair",
    includedIntro:
      "Vos informations essentielles sont regroupées dans un espace simple pour suivre votre entreprise au fil de l’année.",
    included: [
      {
        title: "Revenus et dépenses",
        text: "Voyez clairement les entrées et les sorties d’argent de votre entreprise.",
      },
      {
        title: "Transactions",
        text: "Organisez et classez vos transactions pour faciliter votre suivi.",
      },
      {
        title: "Documents",
        text: "Centralisez vos documents utiles dans votre espace sécurisé.",
      },
      {
        title: "TPS/TVQ",
        text: "Suivez la TPS et la TVQ indiquées dans vos documents et préparez vos périodes.",
      },
      {
        title: "Périodes flexibles",
        text: "Organisez votre suivi sur une base mensuelle, trimestrielle ou annuelle.",
      },
      {
        title: "Tableau de bord",
        text: "Consultez rapidement vos revenus, dépenses et l’activité générale de votre entreprise.",
      },
    ],
    taxTitle: "TPS/TVQ sans complication",
    taxText:
      "Si votre entreprise est inscrite à la TPS/TVQ, une tenue de livres à jour facilite la préparation des informations nécessaires à vos remises.",
    taxPoints: [
      "Suivi de la TPS et de la TVQ",
      "Transactions organisées",
      "Préparation des informations nécessaires aux remises",
      "Périodes mensuelles, trimestrielles ou annuelles",
    ],
    howTitle: "Comment ça fonctionne ?",
    howIntro: "Quatre étapes simples pour commencer et garder votre dossier organisé.",
    steps: [
      {
        n: "1",
        title: "Ouvrez votre espace",
        text: "Connectez-vous à votre portail sécurisé ComptaNet Québec.",
      },
      {
        n: "2",
        title: "Ajoutez vos documents",
        text: "Regroupez les documents utiles à votre tenue de livres.",
      },
      {
        n: "3",
        title: "Suivez votre entreprise",
        text: "Consultez vos revenus, dépenses et transactions au même endroit.",
      },
      {
        n: "4",
        title: "Préparez vos périodes",
        text: "Vos informations organisées facilitent votre suivi de TPS/TVQ.",
      },
    ],
    pricingTitle: "Des tarifs simples et transparents",
    pricingIntro: "Choisissez seulement ce dont votre entreprise a besoin.",
    monthly: "/ mois",
    cad: "CAD",
    choose: "Choisir ce forfait",
    popular: "Avec TPS/TVQ",
    plans: [
      {
        name: "Essentiel",
        price: "19,99 $",
        description: "Pour suivre simplement vos revenus, dépenses et documents.",
        features: [
          "Suivi des revenus",
          "Suivi des dépenses",
          "Gestion des documents",
          "Espace client sécurisé",
        ],
      },
      {
        name: "TPS/TVQ",
        price: "29,99 $",
        description: "Pour la tenue de livres avec le suivi de la TPS et de la TVQ.",
        features: [
          "Tout le forfait Essentiel",
          "Suivi de la TPS",
          "Suivi de la TVQ",
          "Organisation des périodes TPS/TVQ",
        ],
      },
    ],
    assistantEyebrow: "Une question avant de commencer ?",
    assistantTitle: "Demandez directement à l’assistant ComptaNet",
    assistantText:
      "Tenue de livres, TPS/TVQ, documents ou fonctionnement du portail : ouvrez le chat et posez votre question tout de suite.",
    assistantButton: "Ouvrir le chat",
    chatClose: "Fermer",
    faqTitle: "Questions fréquentes",
    faq: [
      {
        q: "Est-ce seulement pour les travailleurs autonomes ?",
        a: "Non. Le service convient aussi aux petites entreprises et aux entrepreneurs qui veulent organiser leur tenue de livres.",
      },
      {
        q: "Dois-je être inscrit à la TPS/TVQ ?",
        a: "Non. Vous pouvez utiliser la tenue de livres pour organiser vos revenus, dépenses et transactions. Les obligations de TPS/TVQ dépendent de votre situation.",
      },
      {
        q: "Puis-je faire un suivi mensuel, trimestriel ou annuel ?",
        a: "Oui. Votre tenue de livres peut être organisée selon la période applicable à votre dossier.",
      },
      {
        q: "Puis-je traiter mes reçus dans le chat public ?",
        a: "Non. Le chat public donne de l’information générale. Le traitement de vos documents et transactions se fait dans votre espace sécurisé.",
      },
    ],
    finalTitle: "Prêt à simplifier votre tenue de livres ?",
    finalText:
      "Ouvrez votre espace sécurisé et gardez enfin une vue claire de votre entreprise.",
    finalCta: "Commencer ma tenue de livres",
  },

  en: {
    badge: "Online bookkeeping",
    title: "Simple, clear and accessible bookkeeping",
    intro:
      "Track your income, expenses and transactions in one place. Keep a clear view of your business and prepare your GST/QST information more easily.",
    primaryCta: "Open my client portal",
    secondaryCta: "I have a question",
    backHome: "Back to home",
    trust: ["Easy to use", "Secure space", "Built for small businesses"],
    forTitle: "Who is this service for?",
    forIntro:
      "A practical solution to keep your information organized without getting lost in complicated software.",
    forItems: [
      "Self-employed workers",
      "Small businesses",
      "Entrepreneurs",
      "Businesses registered or not registered for GST/QST",
    ],
    includedTitle: "Everything you need for a clear view",
    includedIntro:
      "Your essential information is grouped in one simple space so you can follow your business throughout the year.",
    included: [
      { title: "Income and expenses", text: "Clearly see money coming into and going out of your business." },
      { title: "Transactions", text: "Organize and categorize transactions to make tracking easier." },
      { title: "Documents", text: "Centralize useful documents in your secure space." },
      { title: "GST/QST", text: "Track GST and QST shown on your documents and prepare your periods." },
      { title: "Flexible periods", text: "Organize your tracking monthly, quarterly or annually." },
      { title: "Dashboard", text: "Quickly review income, expenses and your overall business activity." },
    ],
    taxTitle: "GST/QST without the complication",
    taxText:
      "If your business is registered for GST/QST, up-to-date bookkeeping makes it easier to prepare the information needed for your returns.",
    taxPoints: [
      "GST and QST tracking",
      "Organized transactions",
      "Preparation of information needed for returns",
      "Monthly, quarterly or annual periods",
    ],
    howTitle: "How does it work?",
    howIntro: "Four simple steps to get started and keep your records organized.",
    steps: [
      { n: "1", title: "Open your space", text: "Sign in to your secure ComptaNet Québec portal." },
      { n: "2", title: "Add your documents", text: "Bring together the documents useful for your bookkeeping." },
      { n: "3", title: "Track your business", text: "Review income, expenses and transactions in one place." },
      { n: "4", title: "Prepare your periods", text: "Organized information makes GST/QST tracking easier." },
    ],
    pricingTitle: "Simple, transparent pricing",
    pricingIntro: "Choose only what your business needs.",
    monthly: "/ month",
    cad: "CAD",
    choose: "Choose this plan",
    popular: "With GST/QST",
    plans: [
      {
        name: "Essential",
        price: "$19.99",
        description: "For simple tracking of your income, expenses and documents.",
        features: ["Income tracking", "Expense tracking", "Document management", "Secure client space"],
      },
      {
        name: "GST/QST",
        price: "$29.99",
        description: "For bookkeeping with GST and QST tracking.",
        features: ["Everything in Essential", "GST tracking", "QST tracking", "GST/QST period organization"],
      },
    ],
    assistantEyebrow: "Have a question before you start?",
    assistantTitle: "Ask the ComptaNet assistant directly",
    assistantText:
      "Bookkeeping, GST/QST, documents or the portal: open the chat and ask your question right away.",
    assistantButton: "Open chat",
    chatClose: "Close",
    faqTitle: "Frequently asked questions",
    faq: [
      { q: "Is it only for self-employed workers?", a: "No. The service also suits small businesses and entrepreneurs who want organized bookkeeping." },
      { q: "Do I need to be registered for GST/QST?", a: "No. You can use bookkeeping to organize income, expenses and transactions. GST/QST obligations depend on your situation." },
      { q: "Can I track monthly, quarterly or annually?", a: "Yes. Your bookkeeping can be organized according to the period that applies to your file." },
      { q: "Can I process my receipts in the public chat?", a: "No. The public chat provides general information. Document and transaction analysis takes place in your secure space." },
    ],
    finalTitle: "Ready to simplify your bookkeeping?",
    finalText: "Open your secure space and keep a clear view of your business.",
    finalCta: "Start my bookkeeping",
  },

  es: {
    badge: "Contabilidad en línea",
    title: "Una contabilidad simple, clara y accesible",
    intro:
      "Controle sus ingresos, gastos y transacciones en un solo lugar. Mantenga una visión clara de su empresa y prepare más fácilmente su información GST/QST (TPS/TVQ).",
    primaryCta: "Abrir mi portal",
    secondaryCta: "Tengo una pregunta",
    backHome: "Volver al inicio",
    trust: ["Fácil de usar", "Espacio seguro", "Pensado para pequeñas empresas"],
    forTitle: "¿Para quién es este servicio?",
    forIntro:
      "Una solución práctica para mantener su información organizada sin perderse en un programa complicado.",
    forItems: [
      "Trabajadores autónomos",
      "Pequeñas empresas",
      "Emprendedores",
      "Empresas registradas o no registradas para GST/QST (TPS/TVQ)",
    ],
    includedTitle: "Todo lo necesario para verlo claro",
    includedIntro:
      "Su información esencial se reúne en un espacio sencillo para seguir su empresa durante todo el año.",
    included: [
      { title: "Ingresos y gastos", text: "Vea claramente las entradas y salidas de dinero de su empresa." },
      { title: "Transacciones", text: "Organice y clasifique sus transacciones para facilitar el seguimiento." },
      { title: "Documentos", text: "Centralice sus documentos útiles en su espacio seguro." },
      { title: "GST/QST", text: "Siga GST y QST indicados en sus documentos y prepare sus períodos." },
      { title: "Períodos flexibles", text: "Organice su seguimiento mensual, trimestral o anual." },
      { title: "Panel de control", text: "Consulte rápidamente ingresos, gastos y la actividad general de su empresa." },
    ],
    taxTitle: "GST/QST sin complicaciones",
    taxText:
      "Si su empresa está registrada para GST/QST, una contabilidad al día facilita la preparación de la información necesaria para sus declaraciones.",
    taxPoints: [
      "Seguimiento de GST y QST",
      "Transacciones organizadas",
      "Preparación de la información necesaria",
      "Períodos mensuales, trimestrales o anuales",
    ],
    howTitle: "¿Cómo funciona?",
    howIntro: "Cuatro pasos sencillos para empezar y mantener su expediente organizado.",
    steps: [
      { n: "1", title: "Abra su espacio", text: "Inicie sesión en su portal seguro de ComptaNet Québec." },
      { n: "2", title: "Añada sus documentos", text: "Reúna los documentos útiles para su contabilidad." },
      { n: "3", title: "Siga su empresa", text: "Consulte ingresos, gastos y transacciones en un solo lugar." },
      { n: "4", title: "Prepare sus períodos", text: "La información organizada facilita el seguimiento GST/QST." },
    ],
    pricingTitle: "Precios simples y transparentes",
    pricingIntro: "Elija solamente lo que necesita su empresa.",
    monthly: "/ mes",
    cad: "CAD",
    choose: "Elegir este plan",
    popular: "Con GST/QST",
    plans: [
      {
        name: "Esencial",
        price: "19,99 $",
        description: "Para seguir fácilmente sus ingresos, gastos y documentos.",
        features: ["Seguimiento de ingresos", "Seguimiento de gastos", "Gestión de documentos", "Espacio seguro"],
      },
      {
        name: "GST/QST",
        price: "29,99 $",
        description: "Para la contabilidad con seguimiento de GST y QST.",
        features: ["Todo el plan Esencial", "Seguimiento GST", "Seguimiento QST", "Organización de períodos GST/QST"],
      },
    ],
    assistantEyebrow: "¿Tiene una pregunta antes de empezar?",
    assistantTitle: "Pregunte directamente al asistente ComptaNet",
    assistantText:
      "Contabilidad, GST/QST, documentos o el portal: abra el chat y haga su pregunta de inmediato.",
    assistantButton: "Abrir el chat",
    chatClose: "Cerrar",
    faqTitle: "Preguntas frecuentes",
    faq: [
      { q: "¿Es solo para trabajadores autónomos?", a: "No. El servicio también conviene a pequeñas empresas y emprendedores que desean organizar su contabilidad." },
      { q: "¿Debo estar registrado para GST/QST?", a: "No. Puede usar la contabilidad para organizar ingresos, gastos y transacciones. Las obligaciones GST/QST dependen de su situación." },
      { q: "¿Puedo hacer seguimiento mensual, trimestral o anual?", a: "Sí. Su contabilidad puede organizarse según el período aplicable a su expediente." },
      { q: "¿Puedo procesar mis recibos en el chat público?", a: "No. El chat público ofrece información general. El análisis de documentos y transacciones se realiza en su espacio seguro." },
    ],
    finalTitle: "¿Listo para simplificar su contabilidad?",
    finalText: "Abra su espacio seguro y mantenga una visión clara de su empresa.",
    finalCta: "Empezar mi contabilidad",
  },
};

function normalizeLang(value: string | null): Lang {
  return value === "en" || value === "es" ? value : "fr";
}

function PageContent() {
  const searchParams = useSearchParams();
  const lang = normalizeLang(searchParams.get("lang"));
  const T = COPY[lang];
  const [chatOpen, setChatOpen] = useState(false);

  const clientHref = useMemo(
    () =>
      `/espace-client?lang=${encodeURIComponent(lang)}&next=${encodeURIComponent(
        "/tenue-de-livres"
      )}`,
    [lang]
  );

  const homeHref = `/?lang=${encodeURIComponent(lang)}`;

  useEffect(() => {
    if (!chatOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setChatOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = oldOverflow;
    };
  }, [chatOpen]);

  return (
    <main lang={lang} className="min-h-screen bg-slate-50 text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#004aad]" />
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20 lg:px-8">
          <Link
            href={homeHref}
            className="inline-flex text-sm font-semibold text-[#004aad] hover:underline"
          >
            ← {T.backHome}
          </Link>

          <div className="mx-auto mt-8 max-w-4xl text-center">
            <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-[#004aad]">
              💼 {T.badge}
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              {T.title}
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
              {T.intro}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={clientHref}
                className="rounded-xl bg-[#004aad] px-6 py-3.5 font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {T.primaryCta}
              </Link>
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-bold text-slate-800 shadow-sm transition hover:border-[#004aad] hover:text-[#004aad]"
              >
                💬 {T.secondaryCta}
              </button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-600">
              {T.trust.map((item) => (
                <span key={item}>✓ {item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* POUR QUI */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.05fr_.95fr]">
          <div className="p-7 sm:p-10">
            <h2 className="text-3xl font-black">{T.forTitle}</h2>
            <p className="mt-4 max-w-xl leading-7 text-slate-600">{T.forIntro}</p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {T.forItems.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 font-semibold"
                >
                  <span className="font-black text-[#004aad]">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-7 sm:p-10">
            <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-[#004aad]">
              TPS / TVQ
            </div>
            <h2 className="mt-4 text-3xl font-black">{T.taxTitle}</h2>
            <p className="mt-4 leading-7 text-slate-700">{T.taxText}</p>
            <ul className="mt-6 space-y-3">
              {T.taxPoints.map((item) => (
                <li key={item} className="flex gap-3 text-slate-700">
                  <span className="font-black text-[#004aad]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-black sm:text-4xl">{T.includedTitle}</h2>
            <p className="mt-4 leading-7 text-slate-600">{T.includedIntro}</p>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {T.included.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 font-black text-[#004aad]">
                  ✓
                </div>
                <h3 className="text-lg font-black">{item.title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FONCTIONNEMENT */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-black sm:text-4xl">{T.howTitle}</h2>
          <p className="mt-3 text-slate-600">{T.howIntro}</p>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {T.steps.map((step) => (
            <article
              key={step.n}
              className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#004aad] text-lg font-black text-white">
                {step.n}
              </div>
              <h3 className="mt-5 text-lg font-black">{step.title}</h3>
              <p className="mt-2 leading-7 text-slate-600">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* TARIFS */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-black sm:text-4xl">{T.pricingTitle}</h2>
            <p className="mt-4 text-slate-600">{T.pricingIntro}</p>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            {T.plans.map((plan, index) => (
              <article
                key={plan.name}
                className={`relative rounded-3xl bg-white p-7 shadow-sm ${
                  index === 1
                    ? "border-2 border-[#004aad] shadow-md"
                    : "border border-slate-200"
                }`}
              >
                {index === 1 && (
                  <div className="absolute -top-3 left-6 rounded-full bg-[#004aad] px-4 py-1.5 text-xs font-black text-white">
                    {T.popular}
                  </div>
                )}

                <h3 className="text-xl font-black">{plan.name}</h3>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-black text-[#004aad]">
                    {plan.price}
                  </span>
                  <span className="pb-1 text-sm text-slate-500">
                    {T.cad} {T.monthly}
                  </span>
                </div>
                <p className="mt-4 leading-7 text-slate-600">{plan.description}</p>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-slate-700">
                      <span className="font-black text-[#004aad]">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={clientHref}
                  className={`mt-7 inline-flex w-full justify-center rounded-xl px-5 py-3.5 font-bold transition ${
                    index === 1
                      ? "bg-[#004aad] text-white hover:opacity-90"
                      : "border border-[#004aad] text-[#004aad] hover:bg-blue-50"
                  }`}
                >
                  {T.choose}
                </Link>
              </article>
            ))}
          </div>

        </div>
      </section>

      {/* ASSISTANT */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-[#004aad] px-6 py-10 text-center text-white shadow-lg sm:px-10 sm:py-12">
          <div className="text-sm font-black uppercase tracking-wide text-blue-100">
            {T.assistantEyebrow}
          </div>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black sm:text-4xl">
            {T.assistantTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-50">{T.assistantText}</p>
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="mt-7 rounded-xl bg-white px-6 py-3.5 font-black text-[#004aad] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            💬 {T.assistantButton}
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-14 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-black sm:text-4xl">{T.faqTitle}</h2>
          <div className="mt-8 space-y-4">
            {T.faq.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <summary className="cursor-pointer font-bold">{item.q}</summary>
                <p className="mt-3 leading-7 text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-blue-100 bg-blue-50 px-6 py-12 text-center sm:px-10">
          <h2 className="text-3xl font-black sm:text-4xl">{T.finalTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-700">{T.finalText}</p>
          <Link
            href={clientHref}
            className="mt-7 inline-flex rounded-xl bg-[#004aad] px-6 py-3.5 font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {T.finalCta}
          </Link>
        </div>
      </section>

      {/* CHAT MODAL : le bouton ouvre le chat directement */}
      {chatOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) setChatOpen(false);
          }}
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <div className="font-black text-slate-900">{T.assistantTitle}</div>
                <div className="text-xs text-slate-500">ComptaNet Québec</div>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                aria-label={T.chatClose}
              >
                ✕ {T.chatClose}
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <AssistantChat lang={lang} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function TenueDeLivresInfoPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" />}>
      <PageContent />
    </Suspense>
  );
}
