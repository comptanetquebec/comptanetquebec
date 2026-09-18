"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Lang = "fr" | "en" | "es";

function getLang(value: string | null): Lang {
  if (value === "en" || value === "es") return value;
  return "fr";
}

const TEXT: Record<
  Lang,
  {
    description: string;
    legal: string;
    conditions: string;
    privacy: string;
    rights: string;
  }
> = {
  fr: {
    description:
      "Services d’impôt et de tenue de livres en ligne au Québec.",
    legal: "Avis légal",
    conditions: "Conditions de service",
    privacy: "Politique de confidentialité",
    rights: "Tous droits réservés.",
  },

  en: {
    description:
      "Online tax and bookkeeping services in Québec.",
    legal: "Legal Notice",
    conditions: "Terms of Service",
    privacy: "Privacy Policy",
    rights: "All rights reserved.",
  },

  es: {
    description:
      "Servicios de impuestos y contabilidad en línea en Québec.",
    legal: "Aviso legal",
    conditions: "Condiciones de servicio",
    privacy: "Política de privacidad",
    rights: "Todos los derechos reservados.",
  },
};

export default function Footer() {
  const searchParams = useSearchParams();

  const lang = getLang(searchParams.get("lang"));
  const t = TEXT[lang];

  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* ENTREPRISE */}
          <div className="text-center md:text-left">
            <Link
              href={`/?lang=${lang}`}
              className="text-base font-semibold text-slate-900 transition hover:text-blue-700"
            >
              ComptaNet Québec
            </Link>

            <p className="mt-1 text-sm text-slate-500">
              {t.description}
            </p>
          </div>

          {/* LIENS LÉGAUX */}
          <nav
            aria-label="Legal"
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm"
          >
            <Link
              href={`/legal/avis-legal?lang=${lang}`}
              className="text-slate-600 transition hover:text-blue-700"
            >
              {t.legal}
            </Link>

            <Link
              href={`/legal/conditions?lang=${lang}`}
              className="text-slate-600 transition hover:text-blue-700"
            >
              {t.conditions}
            </Link>

            <Link
              href={`/legal/confidentialite?lang=${lang}`}
              className="text-slate-600 transition hover:text-blue-700"
            >
              {t.privacy}
            </Link>
          </nav>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
          © {year} Les Entreprises Kema Inc. — ComptaNet Québec
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> — </span>
          NEQ 1175912972 — {t.rights}
        </div>
      </div>
    </footer>
  );
}
