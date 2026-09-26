"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

type Lang = "fr" | "en" | "es";

const LANGS: Lang[] = ["fr", "en", "es"];

function getLang(params: URLSearchParams): Lang {
  const raw = (params.get("lang") || "fr").toLowerCase();

  return (LANGS as readonly string[]).includes(raw)
    ? (raw as Lang)
    : "fr";
}

function setLangQuery(
  params: URLSearchParams,
  lang: Lang
) {
  const next = new URLSearchParams(params.toString());
  next.set("lang", lang);
  return next.toString();
}

type Line = {
  label: string;
  price?: string;
  note?: string;
};

type Section = {
  title: string;
  lines: Line[];
};

type Copy = {
  pageTitle: string;
  subtitle: string;
  taxNotice: string;
  disclaimerTop: string;
  disclaimerBottom: string;
  back: string;
  ctaEstimate: string;
  estimateHint: string;
  currencyNote: string;
  sections: Section[];
};

const COPY: Record<Lang, Copy> = {
  fr: {
    pageTitle: "Travailleurs autonomes — Tarifs",

    subtitle:
      "Les prix affichés sont avant taxes. Les taxes applicables seront ajoutées à la facture.",

    taxNotice:
      "Prix avant taxes — TPS et TVQ en sus.",

    disclaimerTop:
      "Le prix final est confirmé après revue des documents, du volume et du travail requis.",

    disclaimerBottom:
      "Prix avant taxes. Des frais supplémentaires peuvent s’appliquer lorsque les revenus, dépenses ou documents doivent être compilés, triés ou calculés.",

    back: "Retour à l’accueil",

    ctaEstimate: "Estimer mon dossier",

    estimateHint:
      "Répondez à 4 questions dans votre espace client.",

    currencyNote:
      "Tous les montants sont en CAD.",

    sections: [
      {
        title: "Déclaration de travailleur autonome",
        lines: [
          {
            label:
              "Travailleur autonome — avec ou sans revenus d’emploi",
            price: "À partir de 175 $",
            note:
              "Inclut la déclaration personnelle et la partie travailleur autonome lorsque les revenus, dépenses et documents du travail autonome sont déjà compilés, organisés et prêts à être utilisés. Un T4 ou un Relevé 1 peut être inclus dans la même déclaration.",
          },
        ],
      },

      {
        title: "Préparation des documents",
        lines: [
          {
            label:
              "Tri, calcul, classification ou compilation des revenus et dépenses",
            price: "94,99 $ / heure",
            note:
              "S’applique lorsque les revenus, dépenses ou autres montants ne sont pas déjà compilés ou lorsque les documents nécessitent des additions, calculs, classement ou préparation supplémentaire.",
          },
        ],
      },

      {
        title: "Taxes de vente",
        lines: [
          {
            label:
              "Préparation d’une déclaration TPS / TVQ",
            price: "À partir de 95 $",
            note:
              "Service facturé séparément lorsqu’une déclaration de TPS/TVQ doit être préparée. Le tarif peut varier selon la période visée, le volume de transactions et les informations fournies.",
          },
        ],
      },

      {
        title: "Inclus selon le dossier",
        lines: [
          {
            label:
              "Vérification des revenus et dépenses fournis",
          },
          {
            label:
              "Préparation du sommaire des revenus et dépenses",
          },
          {
            label:
              "Validation des documents et cohérence des montants",
          },
          {
            label:
              "Intégration des revenus d’emploi, s’il y a lieu",
          },
        ],
      },

      {
        title: "Information importante",
        lines: [
          {
            label:
              "Revenus et dépenses déjà compilés",
            note:
              "Le tarif de départ de 175 $ s’applique lorsque les montants du travail autonome sont déjà compilés et organisés.",
          },
          {
            label:
              "Documents non compilés ou calculs à effectuer",
            note:
              "Le temps nécessaire pour compiler, trier, calculer ou reconstruire les montants est facturé à 94,99 $ de l’heure.",
          },
          {
            label:
              "Prix final",
            note:
              "Le prix final est confirmé selon les documents fournis et le travail réellement requis.",
          },
        ],
      },
    ],
  },

  en: {
    pageTitle: "Self-Employed — Pricing",

    subtitle:
      "Prices shown are before taxes. Applicable taxes will be added to the invoice.",

    taxNotice:
      "Prices before taxes — GST and QST extra.",

    disclaimerTop:
      "Final pricing is confirmed after reviewing the documents, volume and work required.",

    disclaimerBottom:
      "Prices before taxes. Additional fees may apply when income, expenses or documents must be compiled, sorted or calculated.",

    back: "Back to Home",

    ctaEstimate: "Estimate my file",

    estimateHint:
      "Answer 4 quick questions in your client portal.",

    currencyNote:
      "All amounts are in CAD.",

    sections: [
      {
        title: "Self-employed tax return",
        lines: [
          {
            label:
              "Self-employed — with or without employment income",
            price: "Starting at $175",
            note:
              "Includes the personal tax return and self-employment portion when self-employment income, expenses and documents are already compiled, organized and ready to use. A T4 or Relevé 1 may be included in the same return.",
          },
        ],
      },

      {
        title: "Document preparation",
        lines: [
          {
            label:
              "Sorting, calculations, classification or compilation of income and expenses",
            price: "$94.99 / hour",
            note:
              "Applies when income, expenses or other amounts have not already been compiled or when documents require additions, calculations, sorting or additional preparation.",
          },
        ],
      },

      {
        title: "Sales taxes",
        lines: [
          {
            label:
              "GST / QST return preparation",
            price: "Starting at $95",
            note:
              "Billed separately when a GST/QST return must be prepared. Pricing may vary depending on the filing period, transaction volume and information provided.",
          },
        ],
      },

      {
        title: "Included when applicable",
        lines: [
          {
            label:
              "Review of income and expenses provided",
          },
          {
            label:
              "Preparation of income and expense summary",
          },
          {
            label:
              "Document review and consistency checks",
          },
          {
            label:
              "Inclusion of employment income, when applicable",
          },
        ],
      },

      {
        title: "Important information",
        lines: [
          {
            label:
              "Income and expenses already compiled",
            note:
              "The starting price of $175 applies when self-employment amounts are already compiled and organized.",
          },
          {
            label:
              "Uncompiled documents or calculations required",
            note:
              "Time required to compile, sort, calculate or reconstruct amounts is billed at $94.99 per hour.",
          },
          {
            label:
              "Final price",
            note:
              "Final pricing is confirmed based on the documents provided and the work actually required.",
          },
        ],
      },
    ],
  },

  es: {
    pageTitle: "Autónomos — Tarifas",

    subtitle:
      "Los precios indicados son antes de impuestos. Los impuestos aplicables se añadirán a la factura.",

    taxNotice:
      "Precios antes de impuestos — impuestos aplicables no incluidos.",

    disclaimerTop:
      "El precio final se confirma después de revisar los documentos, el volumen y el trabajo requerido.",

    disclaimerBottom:
      "Precios antes de impuestos. Pueden aplicarse cargos adicionales cuando los ingresos, gastos o documentos deben compilarse, clasificarse o calcularse.",

    back: "Volver al inicio",

    ctaEstimate: "Estimar mi caso",

    estimateHint:
      "Responde 4 preguntas rápidas en tu área de cliente.",

    currencyNote:
      "Todos los montos están en CAD.",

    sections: [
      {
        title:
          "Declaración de trabajador autónomo",
        lines: [
          {
            label:
              "Trabajador autónomo — con o sin ingresos de empleo",
            price: "Desde $175",
            note:
              "Incluye la declaración personal y la parte de trabajo autónomo cuando los ingresos, gastos y documentos ya están compilados, organizados y listos para utilizar. Un T4 o Relevé 1 puede incluirse en la misma declaración.",
          },
        ],
      },

      {
        title: "Preparación de documentos",
        lines: [
          {
            label:
              "Clasificación, cálculos, organización o compilación de ingresos y gastos",
            price: "94,99 $ / hora",
            note:
              "Se aplica cuando los ingresos, gastos u otros montos no están ya compilados o cuando los documentos requieren sumas, cálculos, clasificación o preparación adicional.",
          },
        ],
      },

      {
        title: "Impuestos sobre ventas",
        lines: [
          {
            label:
              "Preparación de declaración GST / QST",
            price: "Desde $95",
            note:
              "Se factura por separado cuando debe prepararse una declaración GST/QST. La tarifa puede variar según el período, el volumen de transacciones y la información proporcionada.",
          },
        ],
      },

      {
        title: "Incluido según el expediente",
        lines: [
          {
            label:
              "Revisión de los ingresos y gastos proporcionados",
          },
          {
            label:
              "Preparación del resumen de ingresos y gastos",
          },
          {
            label:
              "Revisión de documentos y coherencia de los montos",
          },
          {
            label:
              "Inclusión de ingresos de empleo, cuando corresponda",
          },
        ],
      },

      {
        title: "Información importante",
        lines: [
          {
            label:
              "Ingresos y gastos ya compilados",
            note:
              "La tarifa inicial de 175 $ se aplica cuando los montos del trabajo autónomo ya están compilados y organizados.",
          },
          {
            label:
              "Documentos no compilados o cálculos necesarios",
            note:
              "El tiempo necesario para compilar, clasificar, calcular o reconstruir los montos se factura a 94,99 $ por hora.",
          },
          {
            label:
              "Precio final",
            note:
              "El precio final se confirma según los documentos proporcionados y el trabajo realmente requerido.",
          },
        ],
      },
    ],
  },
};

export default function TravAutonomePricingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const lang = useMemo(
    () =>
      getLang(
        new URLSearchParams(sp.toString())
      ),
    [sp]
  );

  const t = COPY[lang];

  useEffect(() => {
    const raw = (
      sp.get("lang") || "fr"
    ).toLowerCase();

    const normalized = getLang(
      new URLSearchParams(sp.toString())
    );

    if (raw !== normalized) {
      const nextQuery = setLangQuery(
        new URLSearchParams(sp.toString()),
        normalized
      );

      router.replace(
        `${pathname}?${nextQuery}`
      );
    }
  }, [pathname, router, sp]);

  const estimateHref =
    `/espace-client/devis-autonome?lang=${lang}`;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">

        <div className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">
            ComptaNet Québec
          </span>{" "}
          <span className="ml-2">
            {t.currencyNote}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {t.pageTitle}
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                {t.subtitle}
              </p>

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                {t.taxNotice}
              </div>

              <p className="mt-3 text-xs text-slate-500">
                {t.disclaimerTop}
              </p>
            </div>

            <div className="shrink-0">
              <Link
                href={estimateHref}
                className="inline-flex items-center justify-center rounded-lg bg-[#004aad] px-4 py-2 text-sm font-bold text-white hover:opacity-95"
              >
                {t.ctaEstimate}
              </Link>

              <div className="mt-2 text-xs text-slate-500">
                {t.estimateHint}
              </div>
            </div>

          </div>
        </div>

        <div className="mt-6 grid gap-6">
          {t.sections.map((sec) => (
            <section
              key={sec.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-bold text-slate-900">
                {sec.title}
              </h2>

              <div className="mt-4 divide-y divide-slate-100">
                {sec.lines.map((line, idx) => (
                  <div
                    key={`${sec.title}-${idx}`}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="pr-4">
                      <div className="text-sm font-medium text-slate-900">
                        {line.label}
                      </div>

                      {line.note && (
                        <div className="mt-1 text-xs text-slate-500">
                          {line.note}
                        </div>
                      )}
                    </div>

                    {line.price ? (
                      <div className="text-sm font-bold text-slate-900 sm:text-right">
                        {line.price}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400 sm:text-right">
                        —
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {t.disclaimerBottom}
          </p>

          <Link
            href={`/?lang=${lang}`}
            className="inline-flex items-center justify-center rounded-lg bg-[#004aad] px-4 py-2 text-sm font-bold text-white hover:opacity-95"
          >
            {t.back}
          </Link>
        </div>

      </div>
    </main>
  );
}
