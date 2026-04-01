import Link from "next/link";
import AssistantChat from "@/components/AssistantChat";

type Lang = "fr" | "en" | "es";

function normalizeLang(lang?: string): Lang {
  if (lang === "en") return "en";
  if (lang === "es") return "es";
  return "fr";
}

const COPY = {
  fr: {
    title: "Assistant ComptaNet",
    intro:
      "Réponse rapide à vos questions sur l’impôt et les documents requis.",
    open: "Ouvrir un dossier",
    portal: "Portail sécurisé",
    before: "Avant de commencer",
    bullets: [
      "Information générale seulement",
      "Aucun avis personnalisé",
      "Ne partagez pas d’informations sensibles",
      "Utilisez le portail pour vos documents",
    ],
    fastTitle: "Le plus rapide",
    fastText:
      "Ouvrez votre dossier en ligne et déposez vos documents immédiatement.",
    start: "Commencer",
    aria: "Assistant fiscal",
  },

  en: {
    title: "ComptaNet Assistant",
    intro:
      "Quick answers to your tax questions and required documents.",
    open: "Open a file",
    portal: "Secure portal",
    before: "Before you begin",
    bullets: [
      "General information only",
      "No personalized advice",
      "Do not share sensitive data",
      "Use the portal for documents",
    ],
    fastTitle: "Fastest option",
    fastText:
      "Open your file online and upload your documents right away.",
    start: "Start now",
    aria: "Tax assistant",
  },

  es: {
    title: "Asistente ComptaNet",
    intro:
      "Respuestas rápidas a sus preguntas sobre impuestos y documentos.",
    open: "Abrir expediente",
    portal: "Portal seguro",
    before: "Antes de comenzar",
    bullets: [
      "Información general solamente",
      "Sin asesoría personalizada",
      "No comparta datos sensibles",
      "Use el portal para documentos",
    ],
    fastTitle: "Más rápido",
    fastText:
      "Abra su expediente en línea y suba sus documentos inmediatamente.",
    start: "Comenzar",
    aria: "Asistente fiscal",
  },
} as const;

export default function AidePage({
  searchParams,
}: {
  searchParams?: { lang?: string };
}) {
  const lang = normalizeLang(searchParams?.lang);
  const c = COPY[lang];

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      
      {/* HEADER */}
      <header className="mb-6 space-y-4">
        
        {/* TITRE + BOUTONS */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold">
              {c.title}
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              {c.intro}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Link
              href="/espace-client"
              className="rounded-xl bg-[#004aad] px-4 py-2 text-sm font-medium text-white"
            >
              {c.open}
            </Link>

            <Link
              href="/espace-client"
              className="rounded-xl border px-4 py-2 text-sm"
            >
              {c.portal}
            </Link>
          </div>
        </div>

        {/* INFO */}
        <div className="rounded-xl bg-blue-50 border p-3 text-xs sm:text-sm">
          <p className="font-medium mb-1">{c.before}</p>
          <ul className="list-disc pl-4 space-y-1">
            {c.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>

        {/* CTA RAPIDE */}
        <div className="rounded-xl border p-3 text-sm">
          <p className="font-medium">{c.fastTitle}</p>
          <p className="text-neutral-600 mt-1">
            {c.fastText}
          </p>

          <Link
            href="/espace-client"
            className="inline-block mt-2 rounded-xl bg-[#004aad] px-4 py-2 text-white text-sm"
          >
            {c.start}
          </Link>
        </div>

      </header>

      {/* CHAT */}
      <section
        aria-label={c.aria}
        className="rounded-xl border p-2 sm:p-3"
      >
        <AssistantChat lang={lang} />
      </section>

    </main>
  );
}
