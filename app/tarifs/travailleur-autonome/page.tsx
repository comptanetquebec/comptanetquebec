"use client";

import React, { useEffect, useMemo } from "react";
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
  back: string;
  ctaEstimate: string;
  estimateHint: string;
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
      "Prix avec taxes incluses. Les prix finaux sont confirmés après revue de vos pièces et de la complexité.",
    disclaimerTop: "Selon votre dossier, les prix pourront être sujets à changement.",
    disclaimerBottom:
      "Prix avant taxes. Les dossiers plus complexes (plusieurs activités, inventaire, volume élevé, etc.) peuvent nécessiter une évaluation.",
    back: "Retour à l’accueil",
    ctaEstimate: "Estimer mon dossier",
    estimateHint: "Répondez à 4 questions dans votre espace client (30 secondes).",
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
      "Price including taxes. Final pricing is confirmed after reviewing your documents and complexity.",
    disclaimerTop: "Prices may change depending on your file.",
    disclaimerBottom:
      "Prices before taxes. More complex files (multiple activities, inventory, high volume, etc.) may require an assessment.",
    back: "Back to Home",
    ctaEstimate: "Estimate my file",
    estimateHint: "Answer 4 quick questions in your client portal (30 seconds).",
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
      "Precio con impuestos incluidos. El precio final se confirma tras revisar sus documentos y la complejidad.",
    disclaimerTop: "Según su expediente, los precios pueden cambiar.",
    disclaimerBottom:
      "Precios antes de impuestos. Casos más complejos (varias actividades, inventario, gran volumen, etc.) pueden requerir evaluación.",
    back: "Volver al inicio",
    ctaEstimate: "Estimar mi caso",
    estimateHint: "Responde 4 preguntas rápidas en tu área de cliente (30 segundos).",
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

  // ✅ Corrige l’URL si lang invalide
  useEffect(() => {
    const raw = (sp.get("lang") || "fr").toLowerCase();
    const normalized = getLang(new URLSearchParams(sp.toString()));
    if (raw !== normalized) {
      const nextQuery = setLangQuery(new URLSearchParams(sp.toString()), normalized);
      router.replace(`${pathname}?${nextQuery}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]);

  // 👉 Page protégée dans l’espace client
  const estimateHref = `/espace-client/devis-autonome?lang=${lang}`;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Top bar (sans switch langues) */}
        <div className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">ComptaNet Québec</span>{" "}
          <span className="ml-2">{t.currencyNote}</span>
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
                      <div className="text-sm font-bold text-slate-900 sm:text-right">
                        {line.price}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400 sm:text-right">—</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Bas de page (sans infos perso) */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
          <p className="text-xs text-slate-500">{t.disclaimerBottom}</p>

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
