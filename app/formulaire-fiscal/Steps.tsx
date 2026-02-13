"use client";

import React from "react";
import Link from "next/link";

type Lang = "fr" | "en" | "es";

type Props = {
  step: 1 | 2 | 3;
  lang: Lang;
  fid?: string | null;
  type?: string | null;
};

function buildHref(path: string, lang: Lang, fid?: string | null, type?: string | null) {
  const u = new URL(path, typeof window !== "undefined" ? window.location.origin : "http://localhost");
  u.searchParams.set("lang", lang);
  if (fid) u.searchParams.set("fid", fid);
  if (type) u.searchParams.set("type", type);
  return u.pathname + u.search;
}

export default function Steps({ step, lang, fid, type }: Props) {
  const t = {
    fr: ["Remplir le formulaire", "Déposer les documents", "Envoyer le dossier"],
    en: ["Fill the form", "Upload documents", "Submit file"],
    es: ["Completar el formulario", "Subir documentos", "Enviar el expediente"],
  }[lang];

  const href1 = buildHref("/formulaire-fiscal", lang, fid, type);
  const href2 = buildHref("/formulaire-fiscal/depot-documents", lang, fid, type);
  const href3 = buildHref("/formulaire-fiscal/envoyer-dossier", lang, fid, type);

  return (
    <div className="ff-steps" aria-label="Étapes du dossier">
      <Link href={href1} className={`ff-step ${step === 1 ? "ff-step-active" : ""}`}>
        <div className="ff-step-num">1</div>
        <div>{t[0]}</div>
      </Link>

      <Link href={href2} className={`ff-step ${step === 2 ? "ff-step-active" : ""}`}>
        <div className="ff-step-num">2</div>
        <div>{t[1]}</div>
      </Link>

      <Link href={href3} className={`ff-step ${step === 3 ? "ff-step-active" : ""}`}>
        <div className="ff-step-num">3</div>
        <div>{t[2]}</div>
      </Link>
    </div>
  );
}
