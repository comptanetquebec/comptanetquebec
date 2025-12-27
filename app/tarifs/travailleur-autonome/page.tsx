"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Lang = "fr" | "en" | "es";

const LANGS: Lang[] = ["fr", "en", "es"];

function getLang(params: URLSearchParams): Lang {
  const raw = (params.get("lang") || "fr").toLowerCase();
  return (LANGS as readonly string[]).includes(raw) ? (raw as Lang) : "fr";
}

function setLangQuery(params: URLSearchParams, lang: Lang) {
  const next = new URLSearchParams(params.toString());
  next.set("lang", lang);
  return next.toString();
}

type Copy = {
  pageTitle: string;
  subtitle: string;
  disclaimerTop: string;
  disclaimerBottom: string;
  langLabel: string;
  back: string;
  ctaContact: string;
  ctaEstimate: string;
  estimateHint: string;
  phoneLabel: string;
  emailLabel: string;
  websiteLabel: string;
  currencyNote: string;
  sections: Array<{
    title: string;
    lines: Array<{ label: string; price?: string; note?: string }>;
  }>;
};

const COPY: Record<Lang, Copy> = {
  fr: {
    pageTitle: "Travailleurs autonomes — Tarifs",
    subtitle:
      "Prix avant taxes. Les prix finaux sont confirmés après revue de vos pièces et de la complexité.",
    disclaimerTop: "Selon votre dossier, les prix pourront être sujets à changement.",
    disclaimerBottom:
      "Prix avant taxes. Les dossiers plus complexes (plusieurs activités, inventaire, volume élevé, etc.) peuvent nécessiter une évaluation.",
    langLabel: "Langue",
    back: "Retour à l’accueil",
    ctaContact: "Nous contacter",
    ctaEstimate: "Estimer mon dossier",
    estimateHint: "Répondez à 4 questions dans votre espace client (30 secondes).",
    phoneLabel: "Téléphone",
    emailLabel: "Courriel",
    websiteLabel: "Site web",
    currencyNote: "Tous les montants sont en CAD.",
    sections: [
      {
        title: "Tarifs",
        lines: [
          { label: "Revenus « compilés »", price: "150 $ à 300 $" },
          { label: "Plusieurs sources / planification plus complexe", price: "300 $ à 800 $" },
          { label: "Données non compilées (ajout manuel)", price: "+ 90 $" },
          { label: "Déclaration de taxes (TPS/TVQ)", price: "95 $" },
        ],
      },
      {
        title: "Inclus (selon le cas)",
        lines: [
          { label: "Optimisation des dépenses admissibles" },
          { label: "État des résultats (revenus / dépenses)" },
          { label: "Validation des pièces et cohérence des chiffres" },
        ],
      },
    ],
  },
  en: {
    pageTitle: "Self-Employed — Pricing",
    subtitle:
      "Prices before taxes. Final pricing is confirmed after reviewing your documents and complexity.",
    disclaimerTop: "Prices may change depending on your file.",
    disclaimerBottom:
      "Prices before taxes. More complex files (multiple activities, inventory, high volume, etc.) may require an assessment.",
    langLabel: "Language",
    back: "Back to Home",
    ctaContact: "Contact us",
    ctaEstimate: "Estimate my file",
    estimateHint: "Answer 4 quick questions in your client portal (30 seconds).",
    phoneLabel: "Phone",
    emailLabel: "Email",
    websiteLabel: "Website",
    currencyNote: "All amounts are in CAD.",
    sections: [
      {
        title: "Pricing",
        lines: [
          { label: "“Compiled” income/expenses", price: "$150–$300" },
          { label: "Multiple sources / more complex planning", price: "$300–$800" },
          { label: "Uncompiled data (manual entry)", price: "+ $90" },
          { label: "Sales tax return (GST/QST)", price: "$95" },
        ],
      },
      {
        title: "Included (as applicable)",
        lines: [
          { label: "Eligible expense optimization" },
          { label: "Profit & loss statement (income / expenses)" },
          { label: "Document review and consistency checks" },
        ],
      },
    ],
  },
  es: {
    pageTitle: "Autónomos — Tarifas",
    subtitle:
      "Precios antes de impuestos. El precio final se confirma tras revisar sus documentos y la complejidad.",
    disclaimerTop: "Según su expediente, los precios pueden cambiar.",
    disclaimerBottom:
      "Precios antes de impuestos. Casos más complejos (varias actividades, inventario, gran volumen, etc.) pueden requerir evaluación.",
    langLabel: "Idioma",
    back: "Volver al inicio",
    ctaContact: "Contactarnos",
    ctaEstimate: "Estimar mi caso",
    estimateHint: "Responde 4 preguntas rápidas en tu área de cliente (30 segundos).",
    phoneLabel: "Teléfono",
    emailLabel: "Correo",
    websiteLabel: "Sitio web",
    currencyNote: "Todos los montos están en CAD.",
    sections: [
      {
        title: "Tarifas",
        lines: [
          { label: "Ingresos/gastos « compilados »", price: "$150–$300" },
          { label: "Varias fuentes / planificación más compleja", price: "$300–$800" },
          { label: "Datos no compilados (carga manual)", price: "+ $90" },
          { label: "Declaración de impuestos sobre ventas (GST/QST)", price: "$95" },
        ],
      },
      {
        title: "Incluye (según el caso)",
        lines: [
          { label: "Optimización de gastos admisibles" },
          { label: "Estado de resultados (ingresos / gastos)" },
          { label: "Revisión de documentos y coherencia" },
        ],
      },
    ],
  },
};

export default function TravAutonomePricingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const lang = useMemo(() => getLang(new URLSearchParams(sp.toString())), [sp]);
  const t = COPY[lang];

  const switchLang = (l: Lang) => {
    const nextQuery = setLangQuery(new URLSearchParams(sp.toString()), l);
    router.push(`${pathname}?${nextQuery}`);
  };

  // 👉 Page protégée dans l’espace client
  const estimateHref = `/espace-client/devis-autonome?lang=${lang}`;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">ComptaNet Québec</span>{" "}
            <span className="ml-2">{t.currencyNote}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{t.langLabel}</span>
            <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white">
              {LANGS.map((l) => {
                const active = l === lang;
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => switchLang(l)}
                    className={[
                      "px-3 py-2 text-xs font-semibold",
                      active ? "bg-[#004aad] text-white" : "text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                    aria-pressed={active}
                  >
                    {l.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t.pageTitle}</h1>
              <p className="mt-2 text-sm text-slate-600">{t.subtitle}</p>
              <p className="mt-3 text-xs text-slate-500">{t.disclaimerTop}</p>
            </div>

            <div className="shrink-0">
              <Link
                href={estimateHref}
                className="inline-flex items-center justify-center rounded-lg bg-[#004aad] px-4 py-2 text-sm font-bold text-white hover:opacity-95"
              >
                {t.ctaEstimate}
              </Link>
              <div className="mt-2 text-xs text-slate-500">{t.estimateHint}</div>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="mt-6 grid gap-6">
          {t.sections.map((sec) => (
            <section
              key={sec.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-bold text-slate-900">{sec.title}</h2>

              <div className="mt-4 divide-y divide-slate-100">
                {sec.lines.map((line, idx) => (
                  <div
                    key={`${sec.title}-${idx}`}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="pr-4">
                      <div className="text-sm font-medium text-slate-900">{line.label}</div>
                      {line.note && <div className="mt-1 text-xs text-slate-500">{line.note}</div>}
                    </div>
                    {line.price ? (
                      <div className="text-sm font-bold text-slate-900 sm:text-right">{line.price}</div>
                    ) : (
                      <div className="text-sm text-slate-400 sm:text-right">—</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Contact + Back */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-bold text-slate-900">{t.ctaContact}</div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div>
                <span className="text-slate-500">{t.phoneLabel}:</span>{" "}
                <a className="font-semibold text-[#004aad] hover:underline" href="tel:5819852599">
                  581-985-2599
                </a>
              </div>
              <div>
                <span className="text-slate-500">{t.emailLabel}:</span>{" "}
                <a className="font-semibold text-[#004aad] hover:underline" href="mailto:comptanetquebec@gmail.com">
                  comptanetquebec@gmail.com
                </a>
              </div>
              <div>
                <span className="text-slate-500">{t.websiteLabel}:</span>{" "}
                <span className="font-semibold">comptanetquebec.ca</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">{t.disclaimerBottom}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
            <div className="text-sm text-slate-600">849, boulevard Pie XII, Québec (QC) G1X 3T2</div>
            <Link
              href={`/?lang=${lang}`}
              className="inline-flex items-center justify-center rounded-lg bg-[#004aad] px-4 py-2 text-sm font-bold text-white hover:opacity-95"
            >
              {t.back}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
