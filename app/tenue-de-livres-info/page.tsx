"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Lang = "fr" | "en" | "es";

function getLang(value: string | null): Lang {
  return value === "en" || value === "es" ? value : "fr";
}

const TEXT = {
  fr: {
    badge: "💼 Tenue de livres en ligne",
    title: "Une tenue de livres simple, claire et accessible",
    intro:
      "Suivez vos revenus, vos dépenses et vos transactions au même endroit. ComptaNet Québec vous aide à garder vos informations organisées et à préparer vos remises de TPS/TVQ.",
    forTitle: "À qui s’adresse le service ?",
    forItems: [
      "Travailleurs autonomes",
      "Petites entreprises",
      "Entrepreneurs qui veulent mieux suivre leurs revenus et dépenses",
      "Entreprises inscrites à la TPS/TVQ",
    ],
    includedTitle: "Ce que le service comprend",
    included: [
      ["Revenus et dépenses", "Suivi clair des entrées et sorties d’argent de votre entreprise."],
      ["Classement des transactions", "Organisation des transactions pour faciliter votre suivi comptable."],
      ["TPS/TVQ", "Préparation des informations nécessaires à vos remises de TPS/TVQ."],
      ["Périodes flexibles", "Suivi mensuel, trimestriel ou annuel selon votre situation."],
      ["Portail sécurisé", "Vos informations et votre suivi sont regroupés dans votre espace client."],
      ["Vue d’ensemble", "Consultez plus facilement la situation de votre entreprise et vos transactions."],
    ],
    taxTitle: "TPS/TVQ",
    taxText:
      "Si votre entreprise est inscrite à la TPS/TVQ, la tenue de livres facilite la préparation de vos remises. La fréquence peut être mensuelle, trimestrielle ou annuelle selon votre période de déclaration.",
    howTitle: "Comment ça fonctionne ?",
    steps: [
      ["1", "Ouvrez votre espace client", "Accédez à l’espace sécurisé consacré à votre tenue de livres."],
      ["2", "Ajoutez vos informations", "Regroupez vos revenus, dépenses et transactions."],
      ["3", "Gardez votre dossier organisé", "Suivez vos données au même endroit tout au long de l’année."],
      ["4", "Préparez vos TPS/TVQ", "Les informations organisées facilitent la préparation de vos remises lorsque nécessaire."],
    ],
    faqTitle: "Questions fréquentes",
    faq: [
      ["Est-ce seulement pour les travailleurs autonomes ?", "Non. Le service peut aussi convenir aux petites entreprises qui souhaitent organiser et suivre leur tenue de livres."],
      ["Puis-je utiliser le service pour mes TPS/TVQ ?", "Oui. Le suivi des transactions permet de préparer les informations nécessaires aux remises de TPS/TVQ lorsque votre entreprise est inscrite."],
      ["Est-ce que je peux avoir une période mensuelle, trimestrielle ou annuelle ?", "Oui. Le service peut s’adapter à votre période de déclaration de TPS/TVQ."],
      ["Est-ce que je dois payer avant de lire cette page ?", "Non. Cette page vous permet de comprendre le service avant d’ouvrir votre espace client."],
      ["J’ai une question avant de commencer.", "Vous pouvez communiquer avec ComptaNet Québec avant d’ouvrir votre espace client. Un assistant en ligne pourra également être ajouté pour répondre aux questions courantes."],
    ],
    readyTitle: "Prêt à commencer ?",
    readyText:
      "Lorsque vous êtes prêt, ouvrez votre espace client Tenue de livres pour continuer.",
    clientBtn: "Ouvrir mon espace client — Tenue de livres",
    contactBtn: "J’ai une question",
    homeBtn: "Retour à l’accueil",
    note:
      "Les services sont offerts au Québec. La portée du service dépend de votre situation et des informations fournies.",
  },
  en: {
    badge: "💼 Online bookkeeping",
    title: "Simple, clear and accessible bookkeeping",
    intro:
      "Track your income, expenses and transactions in one place. ComptaNet Québec helps you keep your information organized and prepare your GST/QST returns.",
    forTitle: "Who is this service for?",
    forItems: [
      "Self-employed workers",
      "Small businesses",
      "Entrepreneurs who want a clearer view of income and expenses",
      "Businesses registered for GST/QST",
    ],
    includedTitle: "What the service includes",
    included: [
      ["Income and expenses", "Clear tracking of money coming into and going out of your business."],
      ["Transaction categorization", "Organized transactions to make bookkeeping easier to follow."],
      ["GST/QST", "Preparation of the information needed for your GST/QST returns."],
      ["Flexible periods", "Monthly, quarterly or annual tracking depending on your situation."],
      ["Secure portal", "Your information and tracking are grouped in your client portal."],
      ["Business overview", "See your business situation and transactions more clearly."],
    ],
    taxTitle: "GST/QST",
    taxText:
      "If your business is registered for GST/QST, organized bookkeeping makes preparing your returns easier. Your filing period may be monthly, quarterly or annual.",
    howTitle: "How does it work?",
    steps: [
      ["1", "Open your client portal", "Access the secure area dedicated to your bookkeeping."],
      ["2", "Add your information", "Bring together your income, expenses and transactions."],
      ["3", "Keep your records organized", "Follow your information in one place throughout the year."],
      ["4", "Prepare your GST/QST", "Organized information makes preparing your returns easier when required."],
    ],
    faqTitle: "Frequently asked questions",
    faq: [
      ["Is it only for self-employed workers?", "No. The service may also suit small businesses that want to organize and track their bookkeeping."],
      ["Can I use it for GST/QST?", "Yes. Transaction tracking helps prepare the information needed for GST/QST returns when your business is registered."],
      ["Can I have a monthly, quarterly or annual period?", "Yes. The service can adapt to your GST/QST filing period."],
      ["Do I have to pay before reading this page?", "No. This page lets you understand the service before opening your client portal."],
      ["I have a question before I start.", "You can contact ComptaNet Québec before opening your client portal. An online assistant can also be added for common questions."],
    ],
    readyTitle: "Ready to get started?",
    readyText: "When you're ready, open your Bookkeeping client portal to continue.",
    clientBtn: "Open my client portal — Bookkeeping",
    contactBtn: "I have a question",
    homeBtn: "Back to home",
    note:
      "Services are offered in Québec. The scope of service depends on your situation and the information provided.",
  },
  es: {
    badge: "💼 Contabilidad en línea",
    title: "Una contabilidad simple, clara y accesible",
    intro:
      "Controle sus ingresos, gastos y transacciones en un solo lugar. ComptaNet Québec le ayuda a mantener su información organizada y a preparar sus declaraciones de GST/QST (TPS/TVQ).",
    forTitle: "¿Para quién es este servicio?",
    forItems: [
      "Trabajadores autónomos",
      "Pequeñas empresas",
      "Emprendedores que desean controlar mejor sus ingresos y gastos",
      "Empresas registradas para GST/QST (TPS/TVQ)",
    ],
    includedTitle: "Qué incluye el servicio",
    included: [
      ["Ingresos y gastos", "Seguimiento claro del dinero que entra y sale de su empresa."],
      ["Clasificación de transacciones", "Organización de las transacciones para facilitar el seguimiento contable."],
      ["GST/QST (TPS/TVQ)", "Preparación de la información necesaria para sus declaraciones de GST/QST."],
      ["Períodos flexibles", "Seguimiento mensual, trimestral o anual según su situación."],
      ["Portal seguro", "Su información y seguimiento se agrupan en su portal del cliente."],
      ["Visión general", "Consulte más fácilmente la situación de su empresa y sus transacciones."],
    ],
    taxTitle: "GST/QST (TPS/TVQ)",
    taxText:
      "Si su empresa está registrada para GST/QST, una contabilidad organizada facilita la preparación de sus declaraciones. El período puede ser mensual, trimestral o anual.",
    howTitle: "¿Cómo funciona?",
    steps: [
      ["1", "Abra su portal del cliente", "Acceda al espacio seguro dedicado a su contabilidad."],
      ["2", "Añada su información", "Agrupe sus ingresos, gastos y transacciones."],
      ["3", "Mantenga su expediente organizado", "Siga su información en un solo lugar durante todo el año."],
      ["4", "Prepare sus GST/QST", "La información organizada facilita la preparación de sus declaraciones cuando sea necesario."],
    ],
    faqTitle: "Preguntas frecuentes",
    faq: [
      ["¿Es solo para trabajadores autónomos?", "No. El servicio también puede ser adecuado para pequeñas empresas que desean organizar y controlar su contabilidad."],
      ["¿Puedo usarlo para GST/QST?", "Sí. El seguimiento de las transacciones ayuda a preparar la información necesaria para las declaraciones de GST/QST cuando la empresa está registrada."],
      ["¿Puede ser mensual, trimestral o anual?", "Sí. El servicio puede adaptarse a su período de declaración de GST/QST."],
      ["¿Tengo que pagar antes de leer esta página?", "No. Esta página le permite entender el servicio antes de abrir su portal del cliente."],
      ["Tengo una pregunta antes de empezar.", "Puede comunicarse con ComptaNet Québec antes de abrir su portal. También se podrá añadir un asistente en línea para responder preguntas frecuentes."],
    ],
    readyTitle: "¿Listo para empezar?",
    readyText:
      "Cuando esté listo, abra su portal del cliente de Contabilidad para continuar.",
    clientBtn: "Abrir mi portal del cliente — Contabilidad",
    contactBtn: "Tengo una pregunta",
    homeBtn: "Volver al inicio",
    note:
      "Los servicios se ofrecen en Québec. El alcance del servicio depende de su situación y de la información proporcionada.",
  },
} satisfies Record<Lang, Record<string, any>>;

function BookkeepingInfo() {
  const searchParams = useSearchParams();
  const lang = getLang(searchParams.get("lang"));
  const t = TEXT[lang];

  const clientHref = `/espace-client?lang=${encodeURIComponent(
    lang
  )}&next=${encodeURIComponent("/tenue-de-livres")}`;

  const homeHref = `/?lang=${encodeURIComponent(lang)}`;
  const contactHref = `/?lang=${encodeURIComponent(lang)}#contact`;

  return (
    <main lang={lang} className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <div className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-700">
            {t.badge}
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            {t.title}
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            {t.intro}
          </p>

          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
            <Link
              href={clientHref}
              className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800"
            >
              {t.clientBtn}
            </Link>
            <Link
              href={contactHref}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-800 transition hover:bg-slate-100"
            >
              {t.contactBtn}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-black">{t.forTitle}</h2>
            <ul className="mt-5 space-y-3">
              {t.forItems.map((item) => (
                <li key={item} className="flex gap-3 text-slate-700">
                  <span className="font-black text-blue-700">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-7">
            <h2 className="text-2xl font-black">{t.taxTitle}</h2>
            <p className="mt-4 leading-7 text-slate-700">{t.taxText}</p>
          </div>
        </div>
      </section>

      <section className="border-y bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-center text-3xl font-black">{t.includedTitle}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {t.included.map(([title, desc]) => (
              <article key={title} className="rounded-2xl border bg-slate-50 p-6">
                <h3 className="text-lg font-extrabold">{title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-center text-3xl font-black">{t.howTitle}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {t.steps.map(([number, title, desc]) => (
            <article key={number} className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 font-black text-white">
                {number}
              </div>
              <h3 className="mt-4 text-lg font-extrabold">{title}</h3>
              <p className="mt-2 leading-7 text-slate-600">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y bg-white">
        <div className="mx-auto max-w-4xl px-5 py-14">
          <h2 className="text-center text-3xl font-black">{t.faqTitle}</h2>
          <div className="mt-8 space-y-4">
            {t.faq.map(([question, answer]) => (
              <details key={question} className="rounded-2xl border bg-slate-50 p-5">
                <summary className="cursor-pointer font-extrabold">{question}</summary>
                <p className="mt-3 leading-7 text-slate-600">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 text-center">
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-8 sm:p-12">
          <h2 className="text-3xl font-black">{t.readyTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-700">{t.readyText}</p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href={clientHref}
              className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800"
            >
              {t.clientBtn}
            </Link>
            <Link
              href={contactHref}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-800 transition hover:bg-slate-100"
            >
              {t.contactBtn}
            </Link>
          </div>

          <p className="mx-auto mt-6 max-w-3xl text-sm leading-6 text-slate-500">{t.note}</p>
        </div>

        <div className="mt-8">
          <Link href={homeHref} className="font-bold text-blue-700 hover:underline">
            ← {t.homeBtn}
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BookkeepingInfo />
    </Suspense>
  );
}
