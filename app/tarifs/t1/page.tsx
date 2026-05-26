"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Lang = "fr" | "en" | "es";

type PriceLine = {
  label: string;
  price: string;
  note?: string;
};

type Section = {
  title: string;
  lines: PriceLine[];
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

const LANGS: Lang[] = ["fr", "en", "es"];

function safeLang(raw: string | null): Lang {
  const v = (raw || "fr").toLowerCase();
  return (LANGS as readonly string[]).includes(v as Lang) ? (v as Lang) : "fr";
}

function setLangQuery(params: URLSearchParams, lang: Lang) {
  const next = new URLSearchParams(params.toString());
  next.set("lang", lang);
  return next.toString();
}

/* ✅ T1 seulement — prix avant taxes */
const COPY: Record<Lang, Copy> = {
  fr: {
    pageTitle: "Impôt des particuliers (T1) — Tarifs",
    subtitle:
      "Les prix affichés sont avant taxes. Les taxes applicables seront ajoutées à la facture.",
    taxNotice: "Prix avant taxes — TPS et TVQ en sus.",
    disclaimerTop:
      "Les tarifs peuvent varier selon la complexité du dossier et les documents fournis.",
    disclaimerBottom:
      "Prix avant taxes. Certains dossiers complexes peuvent nécessiter une évaluation supplémentaire.",
    back: "Retour à l’accueil",
    currencyNote: "Tous les montants sont en CAD.",
    sections: [
      {
        title: "Déclarations de base",
        lines: [
          { label: "Personne seule (avec ou sans revenus / enfants)", price: "100 $" },
          { label: "Étudiant (avec ou sans revenus)", price: "90 $" },
          {
            label: "Personne mineure avec revenus (dans la déclaration des parents ou non)",
            price: "60 $",
          },
          { label: "Couple sans enfants", price: "180 $" },
          { label: "Couple avec enfants", price: "200 $" },
        ],
      },
      {
        title: "Immobilier",
        lines: [
          { label: "Vente d’une maison (prix par propriétaire)", price: "60 $" },
          { label: "Vente d’une maison à revenus (prix par propriétaire)", price: "110 $" },
          {
            label: "Crédit achat 1ère habitation (si plus d’un propriétaire)",
            price: "45 $",
            note: "Le crédit est applicable à une seule personne : calculs et simulations pour optimiser.",
          },
          { label: "Revenus locatifs (prix par propriétaire)", price: "150 $" },
          { label: "Immeuble additionnel (ajout par immeuble, par propriétaire)", price: "+ 90 $" },
          { label: "Vente d’un immeuble locatif (prix par propriétaire)", price: "110 $" },
        ],
      },
      {
        title: "Formulaires & extras",
        lines: [
          { label: "T5008 — État des opérations sur titres (prix par formulaire)", price: "20 $" },
          { label: "Conversion USD → CAD (prix par formulaire)", price: "30 $" },
          {
            label:
              "Dépenses d’emploi (salarié : camionneur, télétravail salarié, représentant, etc.)",
            price: "70 $",
            note: "Ne pas confondre avec un travailleur autonome.",
          },
          { label: "Frais de déménagement (formulaire rempli ou chiffres cumulés)", price: "90 $" },
          { label: "Déclaration de cryptomonnaie", price: "70 $" },
          {
            label: "Division des frais médicaux",
            price: "45 $",
            note: "Les frais médicaux sont réclamés par une seule personne.",
          },
          { label: "Surplus de documents (évalué par le comptable)", price: "10 $" },
          { label: "T1135 — Biens étrangers", price: "60 $" },
          { label: "Crédit pour traitement de l’infertilité", price: "50 $" },
          { label: "Simulation d’impôts (ex.: optimisation REER avant date limite)", price: "80 $" },
          { label: "Imprimer et poster les documents", price: "20 $" },
        ],
      },
      {
        title: "Années précédentes",
        lines: [
          { label: "Personne seule (avec ou sans enfants)", price: "110 $" },
          { label: "Couple (avec ou sans enfants)", price: "210 $" },
          { label: "Redressement d’une déclaration", price: "120 $" },
          {
            label: "Déclaration d’une personne décédée sans succession — à partir de",
            price: "150 $",
            note: "Inclut la déclaration finale seulement. La succession et/ou les revenus après décès sont facturés séparément.",
          },
        ],
      },
    ],
  },

  en: {
    pageTitle: "Personal Income Tax (T1) — Pricing",
    subtitle:
      "Prices shown are before taxes. Applicable taxes will be added to the invoice.",
    taxNotice: "Prices before taxes — GST and QST extra.",
    disclaimerTop:
      "Pricing may vary depending on the complexity of your file and the documents provided.",
    disclaimerBottom:
      "Prices before taxes. Complex cases may require an additional assessment.",
    back: "Back to Home",
    currencyNote: "All amounts are in CAD.",
    sections: [
      {
        title: "Basic returns",
        lines: [
          { label: "Single person with or without income / children", price: "$100" },
          { label: "Student with or without income", price: "$90" },
          { label: "Minor with income, included in parents’ return or separate", price: "$60" },
          { label: "Couple without children", price: "$180" },
          { label: "Couple with children", price: "$200" },
        ],
      },
      {
        title: "Real estate",
        lines: [
          { label: "Sale of a home, per owner", price: "$60" },
          { label: "Sale of an income property, per owner", price: "$110" },
          {
            label: "First-time home buyer credit, when more than one owner",
            price: "$45",
            note: "Credit applies to one person: calculations and simulations to optimize.",
          },
          { label: "Rental income, per owner", price: "$150" },
          { label: "Additional building, per building and per owner", price: "+ $90" },
          { label: "Sale of a rental building, per owner", price: "$110" },
        ],
      },
      {
        title: "Forms & add-ons",
        lines: [
          { label: "T5008 — Securities transactions, per form", price: "$20" },
          { label: "USD → CAD conversion, per form", price: "$30" },
          {
            label:
              "Employment expenses, employee: driver, salaried home office, sales representative, etc.",
            price: "$70",
            note: "Not the same as self-employed.",
          },
          { label: "Moving expenses, form or totals provided", price: "$90" },
          { label: "Cryptocurrency filing", price: "$70" },
          { label: "Medical expense split", price: "$45", note: "Claimed by one person." },
          { label: "Extra documents, assessed by accountant", price: "$10" },
          { label: "T1135 — Foreign property", price: "$60" },
          { label: "Infertility treatment credit", price: "$50" },
          { label: "Tax simulation, ex.: RRSP optimization before deadline", price: "$80" },
          { label: "Print and mail your documents", price: "$20" },
        ],
      },
      {
        title: "Prior years",
        lines: [
          { label: "Single person with or without children", price: "$110" },
          { label: "Couple with or without children", price: "$210" },
          { label: "Return adjustment", price: "$120" },
          {
            label: "Deceased person return without estate — starting at",
            price: "$150",
            note: "Final return only. Estate filings and/or post-death income are billed separately.",
          },
        ],
      },
    ],
  },

  es: {
    pageTitle: "Impuesto personal (T1) — Tarifas",
    subtitle:
      "Los precios indicados son antes de impuestos. Los impuestos aplicables se añadirán a la factura.",
    taxNotice: "Precios antes de impuestos — impuestos aplicables no incluidos.",
    disclaimerTop:
      "Las tarifas pueden variar según la complejidad del expediente y los documentos proporcionados.",
    disclaimerBottom:
      "Precios antes de impuestos. Algunos casos complejos pueden requerir una evaluación adicional.",
    back: "Volver al inicio",
    currencyNote: "Todos los montos están en CAD.",
    sections: [
      {
        title: "Declaraciones básicas",
        lines: [
          { label: "Persona sola con o sin ingresos / hijos", price: "$100" },
          { label: "Estudiante con o sin ingresos", price: "$90" },
          { label: "Menor con ingresos, en la declaración de los padres o separada", price: "$60" },
          { label: "Pareja sin hijos", price: "$180" },
          { label: "Pareja con hijos", price: "$200" },
        ],
      },
      {
        title: "Inmuebles",
        lines: [
          { label: "Venta de una casa, por propietario", price: "$60" },
          { label: "Venta de casa con ingresos, por propietario", price: "$110" },
          {
            label: "Crédito primera vivienda, si hay más de un propietario",
            price: "$45",
            note: "El crédito aplica a una sola persona: cálculos y simulaciones para optimizar.",
          },
          { label: "Ingresos por alquiler, por propietario", price: "$150" },
          { label: "Inmueble adicional, por inmueble y por propietario", price: "+ $90" },
          { label: "Venta de un inmueble de alquiler, por propietario", price: "$110" },
        ],
      },
      {
        title: "Formularios y extras",
        lines: [
          { label: "T5008 — Operaciones en valores, por formulario", price: "$20" },
          { label: "Conversión USD → CAD, por formulario", price: "$30" },
          {
            label:
              "Gastos de empleo, asalariado: conductor, oficina en casa, representante, etc.",
            price: "$70",
            note: "No confundir con autónomo.",
          },
          { label: "Gastos de mudanza, formulario o totales listos", price: "$90" },
          { label: "Criptomonedas", price: "$70" },
          {
            label: "División de gastos médicos",
            price: "$45",
            note: "Se reclaman por una sola persona.",
          },
          { label: "Documentos extra, evaluado por el contador", price: "$10" },
          { label: "T1135 — Bienes en el extranjero", price: "$60" },
          { label: "Crédito por infertilidad", price: "$50" },
          { label: "Simulación de impuestos, ej.: optimización RRSP", price: "$80" },
          { label: "Imprimir y enviar por correo", price: "$20" },
        ],
      },
      {
        title: "Años anteriores",
        lines: [
          { label: "Persona sola con o sin hijos", price: "$110" },
          { label: "Pareja con o sin hijos", price: "$210" },
          { label: "Rectificación de declaración", price: "$120" },
          {
            label: "Declaración de persona fallecida sin sucesión — desde",
            price: "$150",
            note: "Solo la declaración final. La sucesión y/o ingresos después del fallecimiento se cobran aparte.",
          },
        ],
      },
    ],
  },
};

export default function T1PricingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const lang = useMemo(() => safeLang(sp.get("lang")), [sp]);
  const t = COPY[lang];

  useEffect(() => {
    const raw = (sp.get("lang") || "fr").toLowerCase();
    const normalized = safeLang(raw);

    if (raw !== normalized) {
      const nextQuery = setLangQuery(new URLSearchParams(sp.toString()), normalized);
      router.replace(`${pathname}?${nextQuery}`);
    }
  }, [pathname, router, sp]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">ComptaNet Québec</span>{" "}
          <span className="ml-2">{t.currencyNote}</span>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{t.pageTitle}</h1>
          <p className="mt-2 text-sm text-slate-600">{t.subtitle}</p>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            {t.taxNotice}
          </div>

          <p className="mt-3 text-xs text-slate-500">{t.disclaimerTop}</p>
        </div>

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
                      <div className="text-sm font-medium text-slate-900">
                        {line.label}
                      </div>

                      {line.note && (
                        <div className="mt-1 text-xs text-slate-500">
                          {line.note}
                        </div>
                      )}
                    </div>

                    <div className="text-sm font-bold text-slate-900 sm:text-right">
                      {line.price}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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
