"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Lang = "fr" | "en" | "es";

const LANGS: Lang[] = ["fr", "en", "es"];

function getLang(params: URLSearchParams): Lang {
  const raw = (params.get("lang") || "fr").toLowerCase();

  return (LANGS as readonly string[]).includes(raw)
    ? (raw as Lang)
    : "fr";
}

function setLangQuery(params: URLSearchParams, lang: Lang) {
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
  currencyNote: string;
  sections: Section[];
};

const COPY: Record<Lang, Copy> = {
  fr: {
    pageTitle: "Impôt des sociétés (T2) — Tarifs",

    subtitle:
      "Les prix affichés sont avant taxes. Les taxes applicables seront ajoutées à la facture.",

    taxNotice:
      "Prix avant taxes — TPS et TVQ en sus.",

    disclaimerTop:
      "Le prix final est confirmé après une revue du dossier, des documents disponibles et du travail requis.",

    disclaimerBottom:
      "Prix avant taxes. Les tarifs peuvent varier selon la complexité du dossier, la qualité des documents fournis et les travaux supplémentaires nécessaires.",

    back: "Retour à l’accueil",

    currencyNote: "Tous les montants sont en CAD.",

    sections: [
      {
        title: "Déclaration de revenus des sociétés",
        lines: [
          {
            label:
              "Déclaration T2 fédérale et CO-17 Québec, lorsque applicable",
            price: "À partir de 899 $",
            note:
              "Pour une petite société dont les informations financières sont disponibles et suffisamment organisées pour préparer la déclaration.",
          },
        ],
      },

      {
        title: "Préparation des données financières",
        lines: [
          {
            label:
              "Préparation et organisation des données financières nécessaires à la déclaration",
            price: "+ 250 $ à + 600 $",
            note:
              "Peut inclure la préparation des données de revenus, dépenses, actifs, passifs et autres informations nécessaires au dossier. Le tarif dépend de la quantité de travail et des ajustements requis.",
          },
          {
            label:
              "Tri, calcul, classification ou reconstruction de documents",
            price: "94,99 $ / heure",
            note:
              "S’applique lorsque les documents nécessitent des calculs, des additions, du classement, de la recherche ou une préparation supplémentaire avant que la déclaration puisse être produite.",
          },
        ],
      },

      {
        title: "Taxes de vente",
        lines: [
          {
            label: "Préparation d’une remise TPS / TVQ",
            price: "+ 95 $ à + 250 $",
            note:
              "Selon la fréquence de déclaration, le nombre de périodes à produire et les informations fournies.",
          },
        ],
      },

      {
        title: "Information importante",
        lines: [
          {
            label:
              "Documents incomplets, comptabilité non à jour ou informations à reconstruire",
            note:
              "Du temps supplémentaire peut être facturé au tarif horaire lorsque les données nécessaires à la préparation de la déclaration ne sont pas disponibles sous une forme exploitable.",
          },
          {
            label:
              "Dossiers comportant plusieurs activités, immeubles, actionnaires ou opérations particulières",
            note:
              "Le prix est déterminé selon le travail requis après l’examen du dossier.",
          },
        ],
      },
    ],
  },

  en: {
    pageTitle: "Corporate Tax (T2) — Pricing",

    subtitle:
      "Prices shown are before taxes. Applicable taxes will be added to the invoice.",

    taxNotice:
      "Prices before taxes — GST and QST extra.",

    disclaimerTop:
      "Final pricing is confirmed after reviewing the file, available documents and work required.",

    disclaimerBottom:
      "Prices before taxes. Fees may vary depending on file complexity, the quality of documents provided and any additional work required.",

    back: "Back to Home",

    currencyNote: "All amounts are in CAD.",

    sections: [
      {
        title: "Corporate income tax return",
        lines: [
          {
            label:
              "Federal T2 and Quebec CO-17 return, when applicable",
            price: "Starting at $899",
            note:
              "For a small corporation whose financial information is available and sufficiently organized to prepare the return.",
          },
        ],
      },

      {
        title: "Financial data preparation",
        lines: [
          {
            label:
              "Preparation and organization of financial data required for the tax return",
            price: "+ $250 to + $600",
            note:
              "May include preparation of revenue, expense, asset, liability and other financial information required for the file. Pricing depends on the amount of work and adjustments required.",
          },
          {
            label:
              "Document sorting, calculations, classification or reconstruction",
            price: "$94.99 / hour",
            note:
              "Applies when documents require calculations, additions, sorting, research or additional preparation before the corporate tax return can be completed.",
          },
        ],
      },

      {
        title: "Sales taxes",
        lines: [
          {
            label: "GST / QST return preparation",
            price: "+ $95 to + $250",
            note:
              "Pricing depends on filing frequency, the number of periods to be prepared and the information provided.",
          },
        ],
      },

      {
        title: "Important information",
        lines: [
          {
            label:
              "Incomplete documents, records not up to date or information requiring reconstruction",
            note:
              "Additional time may be billed at the hourly rate when the information required to prepare the return is not provided in a usable format.",
          },
          {
            label:
              "Files involving multiple activities, properties, shareholders or special transactions",
            note:
              "Pricing is determined according to the work required after reviewing the file.",
          },
        ],
      },
    ],
  },

  es: {
    pageTitle: "Impuesto corporativo (T2) — Tarifas",

    subtitle:
      "Los precios indicados son antes de impuestos. Los impuestos aplicables se añadirán a la factura.",

    taxNotice:
      "Precios antes de impuestos — impuestos aplicables no incluidos.",

    disclaimerTop:
      "El precio final se confirma después de revisar el expediente, los documentos disponibles y el trabajo requerido.",

    disclaimerBottom:
      "Precios antes de impuestos. Las tarifas pueden variar según la complejidad del expediente, la calidad de los documentos proporcionados y el trabajo adicional requerido.",

    back: "Volver al inicio",

    currencyNote: "Todos los montos están en CAD.",

    sections: [
      {
        title: "Declaración de impuestos de sociedades",
        lines: [
          {
            label:
              "Declaración federal T2 y CO-17 de Quebec, cuando corresponda",
            price: "Desde $899",
            note:
              "Para una pequeña sociedad cuya información financiera esté disponible y suficientemente organizada para preparar la declaración.",
          },
        ],
      },

      {
        title: "Preparación de datos financieros",
        lines: [
          {
            label:
              "Preparación y organización de los datos financieros necesarios para la declaración",
            price: "+ $250 a + $600",
            note:
              "Puede incluir la preparación de ingresos, gastos, activos, pasivos y otra información necesaria para el expediente. La tarifa depende del trabajo y los ajustes requeridos.",
          },
          {
            label:
              "Clasificación, cálculos, organización o reconstrucción de documentos",
            price: "94,99 $ / hora",
            note:
              "Se aplica cuando los documentos requieren cálculos, sumas, clasificación, investigación o preparación adicional antes de completar la declaración corporativa.",
          },
        ],
      },

      {
        title: "Impuestos sobre ventas",
        lines: [
          {
            label: "Preparación de declaración GST / QST",
            price: "+ $95 a + $250",
            note:
              "Según la frecuencia de presentación, el número de períodos y la información proporcionada.",
          },
        ],
      },

      {
        title: "Información importante",
        lines: [
          {
            label:
              "Documentos incompletos, registros no actualizados o información que debe reconstruirse",
            note:
              "El tiempo adicional puede facturarse a la tarifa por hora cuando los datos necesarios para preparar la declaración no se proporcionan en un formato utilizable.",
          },
          {
            label:
              "Expedientes con varias actividades, propiedades, accionistas u operaciones particulares",
            note:
              "El precio se determina según el trabajo requerido después de revisar el expediente.",
          },
        ],
      },
    ],
  },
};

export default function T2PricingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const lang = useMemo(
    () => getLang(new URLSearchParams(sp.toString())),
    [sp]
  );

  const t = COPY[lang];

  useEffect(() => {
    const raw = (sp.get("lang") || "fr").toLowerCase();

    const normalized = getLang(
      new URLSearchParams(sp.toString())
    );

    if (raw !== normalized) {
      const nextQuery = setLangQuery(
        new URLSearchParams(sp.toString()),
        normalized
      );

      router.replace(`${pathname}?${nextQuery}`);
    }
  }, [pathname, router, sp]);

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
