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

type Line = { label: string; price?: string; note?: string };
type Section = { title: string; lines: Line[] };

type Copy = {
  pageTitle: string;
  subtitle: string;
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
      "Prix avant taxes. Le prix final est confirmé après une courte revue de votre dossier.",
    disclaimerTop: "Selon votre situation, les prix peuvent varier.",
    disclaimerBottom:
      "Prix avant taxes. Les dossiers comportant des particularités peuvent nécessiter une évaluation.",
    back: "Retour à l’accueil",
    currencyNote: "Tous les montants sont en CAD.",
    sections: [
      {
        title: "Forfait de base",
        lines: [
          {
            label: "Déclaration de revenus des sociétés (T2)",
            price: "à partir de 850 $",
            note: "Pour une petite société avec informations financières disponibles.",
          },
        ],
      },
      {
        title: "Documents financiers",
        lines: [
          {
            label: "États financiers (incluant le bilan)",
            price: "+ 250 $ à + 600 $",
            note: "Selon la complexité et les ajustements requis.",
          },
        ],
      },
      {
        title: "Taxes de vente",
        lines: [
          {
            label: "Remise TPS / TVQ",
            price: "+ 95 $ à + 250 $",
            note: "Selon la fréquence et le nombre de périodes à produire.",
          },
        ],
      },
    ],
  },

  en: {
    pageTitle: "Corporate Tax (T2) — Pricing",
    subtitle:
      "Prices before taxes. Final pricing is confirmed after a brief review of your file.",
    disclaimerTop: "Prices may vary depending on your situation.",
    disclaimerBottom:
      "Prices before taxes. Files with specific circumstances may require an assessment.",
    back: "Back to Home",
    currencyNote: "All amounts are in CAD.",
    sections: [
      {
        title: "Base package",
        lines: [
          {
            label: "Corporate income tax return (T2)",
            price: "starting at $850",
            note: "For a small corporation with available financial data.",
          },
        ],
      },
      {
        title: "Financial statements",
        lines: [
          {
            label: "Financial statements (including balance sheet)",
            price: "+ $250 to + $600",
            note: "Depending on complexity and required adjustments.",
          },
        ],
      },
      {
        title: "Sales taxes",
        lines: [
          {
            label: "GST / QST filing",
            price: "+ $95 to + $250",
            note: "Based on frequency and number of periods.",
          },
        ],
      },
    ],
  },

  es: {
    pageTitle: "Impuesto corporativo (T2) — Tarifas",
    subtitle:
      "Precios antes de impuestos. El precio final se confirma tras una revisión breve del expediente.",
    disclaimerTop: "Los precios pueden variar según su situación.",
    disclaimerBottom: "Precios antes de impuestos. Algunos casos pueden requerir evaluación.",
    back: "Volver al inicio",
    currencyNote: "Todos los montos están en CAD.",
    sections: [
      {
        title: "Paquete base",
        lines: [
          {
            label: "Declaración de impuesto corporativo (T2)",
            price: "desde $850",
            note: "Para pequeñas sociedades con datos financieros disponibles.",
          },
        ],
      },
      {
        title: "Estados financieros",
        lines: [
          {
            label: "Estados financieros (incluye balance)",
            price: "+ $250 a + $600",
            note: "Según complejidad y ajustes necesarios.",
          },
        ],
      },
      {
        title: "Impuestos sobre ventas",
        lines: [
          {
            label: "Declaración GST / QST",
            price: "+ $95 a + $250",
            note: "Según frecuencia y períodos.",
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
  }, [pathname, router, sp]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Top bar */}
        <div className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">ComptaNet Québec</span>{" "}
          <span className="ml-2">{t.currencyNote}</span>
        </div>

        {/* Header */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{t.pageTitle}</h1>
          <p className="mt-2 text-sm text-slate-600">{t.subtitle}</p>
          <p className="mt-3 text-xs text-slate-500">{t.disclaimerTop}</p>
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
                      {line.note && (
                        <div className="mt-1 text-xs text-slate-500">{line.note}</div>
                      )}
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

        {/* Footer */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
          <p className="text-xs text-slate-500">{t.disclaimerBottom}</p>

          <Link
            href={`/?lang=${lang}`}
            className="rounded-lg bg-[#004aad] px-4 py-2 text-sm font-bold text-white hover:opacity-95"
          >
            {t.back}
          </Link>
        </div>
      </div>
    </main>
  );
}
