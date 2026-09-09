"use client";

import {
  genererFacturePdf,
  type FacturePdf,
} from "@/lib/genererFacturePdf";

type Lang = "fr" | "en" | "es";

const LABEL = {
  fr: "Télécharger le PDF",
  en: "Download PDF",
  es: "Descargar PDF",
};

export default function BoutonPdf({
  facture,
  lang,
}: {
  facture: FacturePdf;
  lang: Lang;
}) {
  return (
    <button
      type="button"
      onClick={() => genererFacturePdf(facture, lang)}
      className="rounded-xl bg-blue-800 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-blue-900"
    >
      📄 {LABEL[lang]}
    </button>
  );
}
