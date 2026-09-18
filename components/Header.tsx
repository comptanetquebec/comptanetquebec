"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const LANGS = ["fr", "en", "es"] as const;
type Lang = (typeof LANGS)[number];

function getLang(value: string | null): Lang {
  if (value === "en" || value === "es") return value;
  return "fr";
}

const TEXT: Record<
  Lang,
  {
    services: string;
    tarifs: string;
    faq: string;
    espaceClient: string;
  }
> = {
  fr: {
    services: "Services",
    tarifs: "Tarifs",
    faq: "FAQ",
    espaceClient: "Espace client",
  },

  en: {
    services: "Services",
    tarifs: "Pricing",
    faq: "FAQ",
    espaceClient: "Client Portal",
  },

  es: {
    services: "Servicios",
    tarifs: "Precios",
    faq: "Preguntas frecuentes",
    espaceClient: "Área de clientes",
  },
};

export default function Header() {
  const searchParams = useSearchParams();

  const lang = getLang(searchParams.get("lang"));
  const t = TEXT[lang];

  const homeHref = `/?lang=${lang}`;
  const servicesHref = `/?lang=${lang}#services`;
  const tarifsHref = `/?lang=${lang}#tarifs`;
  const faqHref = `/?lang=${lang}#faq`;
  const espaceClientHref = `/espace-client?lang=${lang}`;

  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href={homeHref}
          className="flex items-center gap-2 text-lg font-semibold tracking-tight transition hover:opacity-80"
        >
          ComptaNet Québec
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href={servicesHref}
            className="transition hover:text-blue-700"
          >
            {t.services}
          </Link>

          <Link
            href={tarifsHref}
            className="transition hover:text-blue-700"
          >
            {t.tarifs}
          </Link>

          <Link
            href={faqHref}
            className="transition hover:text-blue-700"
          >
            {t.faq}
          </Link>

          <Link
            href={espaceClientHref}
            className="rounded-md bg-blue-700 px-4 py-2 text-white transition hover:bg-blue-800"
          >
            {t.espaceClient}
          </Link>
        </nav>
      </div>
    </header>
  );
}
