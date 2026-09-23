"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Lang = "fr" | "en" | "es";

const COPY = {
  fr: {
    title: "Services à l’heure",
    price: "94,99 $ / heure + taxes",
    intro:
      "Certains services qui ne sont pas couverts par un tarif fixe sont facturés selon le temps consacré au dossier.",

    servicesTitle: "Services facturés à l’heure",

    services: [
      {
        title: "Rendez-vous et consultation",
        text: "Rencontre pour discuter de votre situation, répondre à vos questions et examiner votre dossier.",
      },
      {
        title: "Accompagnement",
        text: "Accompagnement personnalisé pour vos démarches et vos documents.",
      },
      {
        title: "Recherche et vérification",
        text: "Recherche, analyse ou vérification supplémentaire nécessaire au traitement de votre dossier.",
      },
      {
        title: "Corrections et travaux supplémentaires",
        text: "Corrections ou travaux additionnels demandés qui ne sont pas compris dans un tarif fixe.",
      },
      {
        title: "Organisation de documents",
        text: "Classement, organisation ou traitement de documents nécessitant du temps supplémentaire.",
      },
      {
        title: "Autres services hors forfait",
        text: "Tout autre travail qui n’est pas déjà couvert par un tarif fixe affiché sur le site.",
      },
    ],

    noticeTitle: "À savoir",
    notice:
      "Le tarif horaire ne s’ajoute pas automatiquement aux services ayant déjà un prix fixe. Si du travail supplémentaire est nécessaire, vous en serez informé.",

    taxNotice:
      "Tous les montants sont en dollars canadiens (CAD). TPS et TVQ en sus.",

    back: "Retour aux tarifs",
  },

  en: {
    title: "Hourly Services",
    price: "$94.99 / hour + taxes",
    intro:
      "Some services that are not covered by a fixed rate are billed according to the time spent on the file.",

    servicesTitle: "Services billed hourly",

    services: [
      {
        title: "Appointments and consultation",
        text: "Meetings to discuss your situation, answer your questions and review your file.",
      },
      {
        title: "Assistance",
        text: "Personalized assistance with your procedures and documents.",
      },
      {
        title: "Research and review",
        text: "Additional research, analysis or verification required to process your file.",
      },
      {
        title: "Corrections and additional work",
        text: "Corrections or additional work requested that is not included in a fixed rate.",
      },
      {
        title: "Document organization",
        text: "Sorting, organization or processing of documents requiring additional time.",
      },
      {
        title: "Other services outside fixed rates",
        text: "Any other work that is not already covered by a fixed rate displayed on the website.",
      },
    ],

    noticeTitle: "Good to know",
    notice:
      "The hourly rate is not automatically added to services that already have a fixed price. If additional work is required, you will be informed.",

    taxNotice:
      "All amounts are in Canadian dollars (CAD). GST and QST extra.",

    back: "Back to pricing",
  },

  es: {
    title: "Servicios por hora",
    price: "94,99 $ / hora + impuestos",
    intro:
      "Algunos servicios que no están cubiertos por una tarifa fija se facturan según el tiempo dedicado al expediente.",

    servicesTitle: "Servicios facturados por hora",

    services: [
      {
        title: "Citas y consultas",
        text: "Reuniones para hablar de su situación, responder a sus preguntas y revisar su expediente.",
      },
      {
        title: "Acompañamiento",
        text: "Acompañamiento personalizado para sus trámites y documentos.",
      },
      {
        title: "Investigación y verificación",
        text: "Investigación, análisis o verificación adicional necesaria para el tratamiento de su expediente.",
      },
      {
        title: "Correcciones y trabajos adicionales",
        text: "Correcciones o trabajos adicionales solicitados que no estén incluidos en una tarifa fija.",
      },
      {
        title: "Organización de documentos",
        text: "Clasificación, organización o tratamiento de documentos que requieran tiempo adicional.",
      },
      {
        title: "Otros servicios fuera de tarifa fija",
        text: "Cualquier otro trabajo que no esté cubierto por una tarifa fija publicada en el sitio.",
      },
    ],

    noticeTitle: "Importante",
    notice:
      "La tarifa por hora no se añade automáticamente a los servicios que ya tienen un precio fijo. Si se requiere trabajo adicional, se le informará.",

    taxNotice:
      "Todos los montos están en dólares canadienses (CAD). Impuestos aplicables no incluidos.",

    back: "Volver a las tarifas",
  },
};

export default function HourlyPricingPage() {
  const searchParams = useSearchParams();

  const rawLang = searchParams.get("lang");

  const lang: Lang =
    rawLang === "en" || rawLang === "es" ? rawLang : "fr";

  const t = COPY[lang];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">

        <div className="mb-6">
          <span className="text-sm font-semibold text-slate-900">
            ComptaNet Québec
          </span>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            {t.title}
          </h1>

          <div className="mt-4 text-2xl font-bold text-[#004aad]">
            {t.price}
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            {t.intro}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            {t.servicesTitle}
          </h2>

          <div className="mt-4 divide-y divide-slate-100">
            {t.services.map((service) => (
              <div key={service.title} className="py-4">
                <div className="font-semibold text-slate-900">
                  {service.title}
                </div>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {service.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="font-bold text-slate-900">
            {t.noticeTitle}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-700">
            {t.notice}
          </p>
        </section>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          {t.taxNotice}
        </div>

        <div className="mt-8">
          <Link
            href={`/?lang=${lang}#tarifs`}
            className="inline-flex items-center justify-center rounded-lg bg-[#004aad] px-5 py-3 text-sm font-bold text-white hover:opacity-95"
          >
            {t.back}
          </Link>
        </div>

      </div>
    </main>
  );
}
