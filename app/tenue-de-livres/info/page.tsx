"use client";

import React, { Suspense, useMemo } from "react";
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

  forWhoTitle: string;
  forWhoIntro: string;
  forWho: string[];

  includedTitle: string;
  includedIntro: string;
  cards: {
    title: string;
    text: string;
  }[];

  taxTitle: string;
  taxText: string;
  taxPoints: string[];

  periodsTitle: string;
  periodsText: string;

  stepsTitle: string;
  steps: {
    title: string;
    text: string;
  }[];

  pricingTitle: string;
  pricingIntro: string;
  pricingMonthly: string;
  pricingCad: string;
  pricingChoose: string;
  pricingPopular: string;
  pricingPlans: {
    name: string;
    price: string;
    description: string;
    features: string[];
  }[];
  creditsTitle: string;
  creditsIntro: string;
  creditsOneTime: string;
  creditPacks: {
    credits: string;
    price: string;
  }[];

  aiTitle: string;
  aiText: string;

  faqTitle: string;
  faq: {
    q: string;
    a: string;
  }[];

  finalTitle: string;
  finalText: string;
  finalCta: string;
};

const COPY: Record<Lang, Copy> = {
  fr: {
    badge: "Tenue de livres en ligne",

    title: "Une tenue de livres simple, claire et accessible",

    intro:
      "Gardez une vue claire de votre entreprise grâce au suivi de vos revenus, dépenses et transactions, avec la préparation des informations nécessaires à vos remises de TPS/TVQ.",

    primaryCta: "Ouvrir l’espace client — Tenue de livres",
    secondaryCta: "J’ai une question",
    backHome: "Retour à l’accueil",

    forWhoTitle: "Pour qui ?",

    forWhoIntro:
      "Un service pensé pour les petites entreprises et les entrepreneurs qui veulent une tenue de livres plus simple.",

    forWho: [
      "Travailleurs autonomes",
      "Petites entreprises",
      "Entrepreneurs",
      "Entreprises inscrites à la TPS/TVQ",
    ],

    includedTitle: "Une vue claire de votre entreprise",

    includedIntro:
      "Regroupez l’information importante de votre entreprise dans un environnement simple et sécurisé.",

    cards: [
      {
        title: "Revenus et dépenses",
        text:
          "Suivez les entrées et les sorties d’argent de votre entreprise plus facilement.",
      },
      {
        title: "Transactions",
        text:
          "Organisez et classez vos transactions afin d’obtenir une vue claire de vos activités.",
      },
      {
        title: "Documents",
        text:
          "Centralisez les documents utiles à votre tenue de livres dans votre espace sécurisé.",
      },
      {
        title: "TPS/TVQ",
        text:
          "Préparez les informations nécessaires au suivi de la TPS et de la TVQ de votre entreprise.",
      },
      {
        title: "Périodes flexibles",
        text:
          "Organisez votre tenue de livres selon vos périodes mensuelles, trimestrielles ou annuelles.",
      },
      {
        title: "Tableau de bord",
        text:
          "Voyez rapidement vos revenus, vos dépenses et la situation générale de votre entreprise.",
      },
    ],

    taxTitle: "TPS/TVQ et tenue de livres",

    taxText:
      "Une tenue de livres à jour facilite la préparation de vos informations de TPS/TVQ. La fréquence et les obligations applicables dépendent de votre dossier.",

    taxPoints: [
      "Suivi de la TPS et de la TVQ indiquées dans vos documents",
      "Organisation des transactions",
      "Préparation des informations nécessaires aux remises",
      "Périodes mensuelles, trimestrielles ou annuelles",
    ],

    periodsTitle: "Mensuel, trimestriel ou annuel",

    periodsText:
      "Toutes les entreprises n’ont pas la même fréquence de déclaration. Votre espace de tenue de livres peut être organisé selon la période applicable à votre dossier.",

    stepsTitle: "Comment ça fonctionne ?",

    steps: [
      {
        title: "1. Ouvrez votre espace",
        text:
          "Connectez-vous à votre portail sécurisé ComptaNet Québec.",
      },
      {
        title: "2. Ajoutez vos documents",
        text:
          "Regroupez les documents et les informations utiles à votre tenue de livres.",
      },
      {
        title: "3. Suivez votre entreprise",
        text:
          "Consultez vos revenus, dépenses et transactions dans une vue simple.",
      },
      {
        title: "4. Préparez vos périodes",
        text:
          "Vos informations organisées facilitent le suivi comptable et la préparation de vos périodes de TPS/TVQ.",
      },
    ],

    pricingTitle: "Tarifs de tenue de livres",
    pricingIntro:
      "Choisissez le forfait qui correspond aux besoins de votre entreprise. Les prix sont en dollars canadiens.",
    pricingMonthly: "/ mois",
    pricingCad: "CAD",
    pricingChoose: "Choisir ce forfait",
    pricingPopular: "Avec TPS/TVQ",
    pricingPlans: [
      {
        name: "Essentiel",
        price: "19,99 $",
        description:
          "Pour garder une vue claire de vos revenus, dépenses et documents.",
        features: [
          "Suivi des revenus",
          "Suivi des dépenses",
          "Gestion des documents",
          "Accès à votre espace sécurisé",
        ],
      },
      {
        name: "TPS/TVQ",
        price: "29,99 $",
        description:
          "Pour la tenue de livres avec le suivi de la TPS et de la TVQ.",
        features: [
          "Tout ce qui est inclus dans Essentiel",
          "Suivi de la TPS",
          "Suivi de la TVQ",
          "Organisation des informations pour vos périodes de TPS/TVQ",
        ],
      },
    ],
    creditsTitle: "Crédits supplémentaires",
    creditsIntro:
      "Besoin de crédits supplémentaires ? Vous pouvez en acheter séparément, sans modifier votre abonnement.",
    creditsOneTime: "achat unique",
    creditPacks: [
      { credits: "25 crédits", price: "4,99 $" },
      { credits: "50 crédits", price: "7,99 $" },
      { credits: "100 crédits", price: "14,99 $" },
    ],

    aiTitle: "Vous avez une question ?",

    aiText:
      "Demandez à l’assistant ComptaNet Québec de vous expliquer la tenue de livres, la TPS/TVQ, les documents nécessaires ou le fonctionnement du portail.",

    faqTitle: "Questions fréquentes",

    faq: [
      {
        q:
          "Est-ce que je dois être inscrit à la TPS/TVQ pour utiliser la tenue de livres ?",
        a:
          "Non. La tenue de livres peut servir à organiser les revenus, dépenses et transactions de votre entreprise. Les obligations de TPS/TVQ dépendent de votre situation.",
      },
      {
        q:
          "Puis-je utiliser le service si je suis travailleur autonome ?",
        a:
          "Oui. Le service est notamment conçu pour les travailleurs autonomes et les petites entreprises.",
      },
      {
        q:
          "Est-ce que l’assistant public analyse mes reçus et mes transactions ?",
        a:
          "Non. Le chat public fournit de l’information générale. L’analyse de vos documents et transactions se fait dans votre espace sécurisé de tenue de livres.",
      },
      {
        q:
          "Puis-je faire un suivi mensuel, trimestriel ou annuel ?",
        a:
          "Oui. Votre tenue de livres peut être organisée selon la période applicable à votre dossier.",
      },
    ],

    finalTitle: "Prêt à simplifier votre tenue de livres ?",

    finalText:
      "Accédez à votre espace sécurisé ComptaNet Québec pour commencer.",

    finalCta: "Ouvrir l’espace client — Tenue de livres",
  },

  en: {
    badge: "Online bookkeeping",

    title: "Simple, clear and accessible bookkeeping",

    intro:
      "Keep a clear view of your business by tracking income, expenses and transactions while preparing the information needed for your GST/QST returns.",

    primaryCta: "Client portal — Bookkeeping",
    secondaryCta: "I have a question",
    backHome: "Back to home",

    forWhoTitle: "Who is it for?",

    forWhoIntro:
      "A service designed for small businesses and entrepreneurs who want simpler bookkeeping.",

    forWho: [
      "Self-employed workers",
      "Small businesses",
      "Entrepreneurs",
      "Businesses registered for GST/QST",
    ],

    includedTitle: "A clear view of your business",

    includedIntro:
      "Bring your important business information together in a simple and secure environment.",

    cards: [
      {
        title: "Income and expenses",
        text:
          "Track money coming into and going out of your business more easily.",
      },
      {
        title: "Transactions",
        text:
          "Organize and categorize transactions for a clearer view of your business activity.",
      },
      {
        title: "Documents",
        text:
          "Centralize useful bookkeeping documents in your secure space.",
      },
      {
        title: "GST/QST",
        text:
          "Prepare the information needed to track GST and QST for your business.",
      },
      {
        title: "Flexible periods",
        text:
          "Organize your bookkeeping around monthly, quarterly or annual periods.",
      },
      {
        title: "Dashboard",
        text:
          "Quickly see your income, expenses and the overall financial activity of your business.",
      },
    ],

    taxTitle: "GST/QST and bookkeeping",

    taxText:
      "Up-to-date bookkeeping makes it easier to prepare your GST/QST information. Filing frequency and applicable obligations depend on your file.",

    taxPoints: [
      "Track GST and QST shown on your documents",
      "Organize business transactions",
      "Prepare information needed for returns",
      "Monthly, quarterly or annual periods",
    ],

    periodsTitle: "Monthly, quarterly or annual",

    periodsText:
      "Not every business has the same filing frequency. Your bookkeeping space can be organized according to the period that applies to your file.",

    stepsTitle: "How does it work?",

    steps: [
      {
        title: "1. Open your space",
        text:
          "Sign in to your secure ComptaNet Québec portal.",
      },
      {
        title: "2. Add your documents",
        text:
          "Bring together the documents and information useful for your bookkeeping.",
      },
      {
        title: "3. Track your business",
        text:
          "Review your income, expenses and transactions in a simple view.",
      },
      {
        title: "4. Prepare your periods",
        text:
          "Organized information makes accounting and GST/QST periods easier to prepare.",
      },
    ],

    pricingTitle: "Bookkeeping pricing",
    pricingIntro:
      "Choose the plan that fits your business needs. Prices are in Canadian dollars.",
    pricingMonthly: "/ month",
    pricingCad: "CAD",
    pricingChoose: "Choose this plan",
    pricingPopular: "With GST/QST",
    pricingPlans: [
      {
        name: "Essential",
        price: "$19.99",
        description:
          "For a clear view of your income, expenses and documents.",
        features: [
          "Income tracking",
          "Expense tracking",
          "Document management",
          "Access to your secure space",
        ],
      },
      {
        name: "GST/QST",
        price: "$29.99",
        description:
          "For bookkeeping with GST and QST tracking.",
        features: [
          "Everything included in Essential",
          "GST tracking",
          "QST tracking",
          "Organization of information for your GST/QST periods",
        ],
      },
    ],
    creditsTitle: "Additional credits",
    creditsIntro:
      "Need more credits? You can purchase additional credits separately without changing your subscription.",
    creditsOneTime: "one-time purchase",
    creditPacks: [
      { credits: "25 credits", price: "$4.99" },
      { credits: "50 credits", price: "$7.99" },
      { credits: "100 credits", price: "$14.99" },
    ],

    aiTitle: "Have a question?",

    aiText:
      "Ask the ComptaNet Québec assistant about bookkeeping, GST/QST, required documents or how the portal works.",

    faqTitle: "Frequently asked questions",

    faq: [
      {
        q:
          "Do I need to be registered for GST/QST to use bookkeeping?",
        a:
          "No. Bookkeeping can be used to organize your business income, expenses and transactions. GST/QST obligations depend on your situation.",
      },
      {
        q:
          "Can I use the service if I am self-employed?",
        a:
          "Yes. The service is designed in particular for self-employed workers and small businesses.",
      },
      {
        q:
          "Does the public assistant analyze my receipts and transactions?",
        a:
          "No. The public chat provides general information. Analysis of your documents and transactions takes place in your secure bookkeeping space.",
      },
      {
        q:
          "Can I track monthly, quarterly or annually?",
        a:
          "Yes. Your bookkeeping can be organized according to the period that applies to your file.",
      },
    ],

    finalTitle: "Ready to simplify your bookkeeping?",

    finalText:
      "Access your secure ComptaNet Québec space to get started.",

    finalCta: "Client portal — Bookkeeping",
  },

  es: {
    badge: "Contabilidad en línea",

    title: "Una contabilidad simple, clara y accesible",

    intro:
      "Mantenga una visión clara de su empresa siguiendo ingresos, gastos y transacciones y preparando la información necesaria para GST/QST (TPS/TVQ).",

    primaryCta: "Portal del cliente — Contabilidad",
    secondaryCta: "Tengo una pregunta",
    backHome: "Volver al inicio",

    forWhoTitle: "¿Para quién?",

    forWhoIntro:
      "Un servicio pensado para pequeñas empresas y emprendedores que quieren una contabilidad más sencilla.",

    forWho: [
      "Trabajadores autónomos",
      "Pequeñas empresas",
      "Emprendedores",
      "Empresas registradas para GST/QST",
    ],

    includedTitle: "Una visión clara de su empresa",

    includedIntro:
      "Reúna la información importante de su empresa en un entorno simple y seguro.",

    cards: [
      {
        title: "Ingresos y gastos",
        text:
          "Siga más fácilmente el dinero que entra y sale de su empresa.",
      },
      {
        title: "Transacciones",
        text:
          "Organice y clasifique las transacciones para obtener una visión más clara de su actividad.",
      },
      {
        title: "Documentos",
        text:
          "Centralice los documentos útiles para la contabilidad en su espacio seguro.",
      },
      {
        title: "GST/QST",
        text:
          "Prepare la información necesaria para el seguimiento de GST y QST de su empresa.",
      },
      {
        title: "Períodos flexibles",
        text:
          "Organice su contabilidad según períodos mensuales, trimestrales o anuales.",
      },
      {
        title: "Panel de control",
        text:
          "Vea rápidamente sus ingresos, gastos y la actividad general de su empresa.",
      },
    ],

    taxTitle: "GST/QST y contabilidad",

    taxText:
      "Una contabilidad al día facilita la preparación de la información GST/QST. La frecuencia y las obligaciones aplicables dependen de su expediente.",

    taxPoints: [
      "Seguimiento de GST y QST indicados en sus documentos",
      "Organización de las transacciones",
      "Preparación de la información necesaria para las declaraciones",
      "Períodos mensuales, trimestrales o anuales",
    ],

    periodsTitle: "Mensual, trimestral o anual",

    periodsText:
      "No todas las empresas tienen la misma frecuencia de presentación. Su espacio de contabilidad puede organizarse según el período aplicable a su expediente.",

    stepsTitle: "¿Cómo funciona?",

    steps: [
      {
        title: "1. Abra su espacio",
        text:
          "Inicie sesión en su portal seguro de ComptaNet Québec.",
      },
      {
        title: "2. Añada sus documentos",
        text:
          "Reúna los documentos y la información útil para su contabilidad.",
      },
      {
        title: "3. Siga su empresa",
        text:
          "Consulte sus ingresos, gastos y transacciones en una vista sencilla.",
      },
      {
        title: "4. Prepare sus períodos",
        text:
          "La información organizada facilita la preparación de los períodos contables y GST/QST.",
      },
    ],

    pricingTitle: "Precios de contabilidad",
    pricingIntro:
      "Elija el plan que corresponda a las necesidades de su empresa. Los precios están en dólares canadienses.",
    pricingMonthly: "/ mes",
    pricingCad: "CAD",
    pricingChoose: "Elegir este plan",
    pricingPopular: "Con GST/QST",
    pricingPlans: [
      {
        name: "Esencial",
        price: "19,99 $",
        description:
          "Para mantener una visión clara de sus ingresos, gastos y documentos.",
        features: [
          "Seguimiento de ingresos",
          "Seguimiento de gastos",
          "Gestión de documentos",
          "Acceso a su espacio seguro",
        ],
      },
      {
        name: "GST/QST",
        price: "29,99 $",
        description:
          "Para la contabilidad con seguimiento de GST y QST.",
        features: [
          "Todo lo incluido en Esencial",
          "Seguimiento de GST",
          "Seguimiento de QST",
          "Organización de la información para sus períodos GST/QST",
        ],
      },
    ],
    creditsTitle: "Créditos adicionales",
    creditsIntro:
      "¿Necesita más créditos? Puede comprarlos por separado sin cambiar su suscripción.",
    creditsOneTime: "compra única",
    creditPacks: [
      { credits: "25 créditos", price: "4,99 $" },
      { credits: "50 créditos", price: "7,99 $" },
      { credits: "100 créditos", price: "14,99 $" },
    ],

    aiTitle: "¿Tiene una pregunta?",

    aiText:
      "Pregunte al asistente de ComptaNet Québec sobre contabilidad, GST/QST, documentos necesarios o el funcionamiento del portal.",

    faqTitle: "Preguntas frecuentes",

    faq: [
      {
        q:
          "¿Debo estar registrado para GST/QST para usar la contabilidad?",
        a:
          "No. La contabilidad puede servir para organizar los ingresos, gastos y transacciones de su empresa. Las obligaciones GST/QST dependen de su situación.",
      },
      {
        q:
          "¿Puedo usar el servicio si soy autónomo?",
        a:
          "Sí. El servicio está diseñado especialmente para trabajadores autónomos y pequeñas empresas.",
      },
      {
        q:
          "¿El asistente público analiza mis recibos y transacciones?",
        a:
          "No. El chat público proporciona información general. El análisis de documentos y transacciones se realiza en su espacio seguro de contabilidad.",
      },
      {
        q:
          "¿Puedo hacer un seguimiento mensual, trimestral o anual?",
        a:
          "Sí. Su contabilidad puede organizarse según el período aplicable a su expediente.",
      },
    ],

    finalTitle: "¿Listo para simplificar su contabilidad?",

    finalText:
      "Acceda a su espacio seguro de ComptaNet Québec para comenzar.",

    finalCta: "Portal del cliente — Contabilidad",
  },
};

function normalizeLang(value: string | null): Lang {
  if (value === "en" || value === "es") {
    return value;
  }

  return "fr";
}

function InfoTenueDeLivresContent() {
  const searchParams = useSearchParams();

  const lang = normalizeLang(searchParams.get("lang"));
  const T = COPY[lang];

  const clientHref = useMemo(() => {
    return `/espace-client?lang=${encodeURIComponent(
      lang
    )}&next=${encodeURIComponent("/tenue-de-livres")}`;
  }, [lang]);

  const homeHref = `/?lang=${encodeURIComponent(lang)}`;

  function scrollToChat() {
    document
      .getElementById("assistant-tenue-livres")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  return (
    <main
      lang={lang}
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      {/* HERO */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <Link
            href={homeHref}
            className="mb-8 inline-flex text-sm font-semibold text-[#004aad] hover:underline"
          >
            ← {T.backHome}
          </Link>

          <div className="max-w-4xl">
            <div className="mb-5 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-[#004aad]">
              {T.badge}
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {T.title}
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              {T.intro}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={clientHref}
                className="rounded-xl bg-[#004aad] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                {T.primaryCta}
              </Link>

              <button
                type="button"
                onClick={scrollToChat}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {T.secondaryCta}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* POUR QUI */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h2 className="text-2xl font-bold">
            {T.forWhoTitle}
          </h2>

          <p className="mt-3 max-w-3xl text-slate-600">
            {T.forWhoIntro}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {T.forWho.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-semibold"
              >
                <span className="mr-2 text-[#004aad]">
                  ✓
                </span>

                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold">
            {T.includedTitle}
          </h2>

          <p className="mt-3 text-slate-600">
            {T.includedIntro}
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {T.cards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-bold">
                {card.title}
              </h3>

              <p className="mt-2 leading-7 text-slate-600">
                {card.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* TPS TVQ */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-3xl bg-blue-50 p-7">
            <h2 className="text-2xl font-bold">
              {T.taxTitle}
            </h2>

            <p className="mt-4 leading-7 text-slate-700">
              {T.taxText}
            </p>

            <ul className="mt-6 space-y-3">
              {T.taxPoints.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-slate-700"
                >
                  <span className="font-bold text-[#004aad]">
                    ✓
                  </span>

                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 p-7">
            <h2 className="text-2xl font-bold">
              {T.periodsTitle}
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              {T.periodsText}
            </p>
          </div>
        </div>
      </section>

      {/* FONCTIONNEMENT */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold">
          {T.stepsTitle}
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {T.steps.map((step) => (
            <article
              key={step.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="font-bold text-[#004aad]">
                {step.title}
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                {step.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* TARIFS */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">
              {T.pricingTitle}
            </h2>

            <p className="mt-3 text-slate-600">
              {T.pricingIntro}
            </p>
          </div>

          <div className="mx-auto mt-9 grid max-w-4xl gap-6 md:grid-cols-2">
            {T.pricingPlans.map((plan, index) => (
              <article
                key={plan.name}
                className={`relative rounded-3xl border bg-white p-7 shadow-sm ${
                  index === 1
                    ? "border-[#004aad] ring-2 ring-blue-100"
                    : "border-slate-200"
                }`}
              >
                {index === 1 && (
                  <div className="absolute -top-3 left-6 rounded-full bg-[#004aad] px-3 py-1 text-xs font-bold text-white">
                    {T.pricingPopular}
                  </div>
                )}

                <h3 className="text-xl font-bold">
                  {plan.name}
                </h3>

                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-bold text-[#004aad]">
                    {plan.price}
                  </span>

                  <span className="pb-1 text-sm text-slate-500">
                    {T.pricingCad} {T.pricingMonthly}
                  </span>
                </div>

                <p className="mt-4 leading-7 text-slate-600">
                  {plan.description}
                </p>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-3 text-slate-700"
                    >
                      <span className="font-bold text-[#004aad]">
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={clientHref}
                  className={`mt-7 inline-flex w-full justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
                    index === 1
                      ? "bg-[#004aad] text-white hover:opacity-90"
                      : "border border-[#004aad] bg-white text-[#004aad] hover:bg-blue-50"
                  }`}
                >
                  {T.pricingChoose}
                </Link>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-4xl rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold">
                {T.creditsTitle}
              </h3>

              <p className="mx-auto mt-3 max-w-2xl text-slate-600">
                {T.creditsIntro}
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {T.creditPacks.map((pack) => (
                <div
                  key={pack.credits}
                  className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm"
                >
                  <div className="font-bold text-slate-900">
                    {pack.credits}
                  </div>

                  <div className="mt-2 text-2xl font-bold text-[#004aad]">
                    {pack.price}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {T.pricingCad} · {T.creditsOneTime}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ASSISTANT IA */}
      <section
        id="assistant-tenue-livres"
        className="scroll-mt-8 border-y border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-7 text-center">
            <h2 className="text-3xl font-bold">
              {T.aiTitle}
            </h2>

            <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600">
              {T.aiText}
            </p>
          </div>

          <AssistantChat lang={lang} />
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold">
          {T.faqTitle}
        </h2>

        <div className="mt-7 space-y-4">
          {T.faq.map((item) => (
            <details
              key={item.q}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <summary className="cursor-pointer font-semibold">
                {item.q}
              </summary>

              <p className="mt-3 leading-7 text-slate-600">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl bg-[#004aad] px-6 py-12 text-center text-white sm:px-10">
          <h2 className="text-3xl font-bold">
            {T.finalTitle}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-blue-50">
            {T.finalText}
          </p>

          <Link
            href={clientHref}
            className="mt-7 inline-flex rounded-xl bg-white px-6 py-3 font-semibold text-[#004aad] shadow-sm transition hover:bg-blue-50"
          >
            {T.finalCta}
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function TenueDeLivresInfoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50" />
      }
    >
      <InfoTenueDeLivresContent />
    </Suspense>
  );
}
