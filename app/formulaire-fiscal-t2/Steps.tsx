"use client";

import React from "react";

type Lang = "fr" | "en" | "es";
type Flow = "t1" | "t2" | "ta";

type Props = {
  step: 1 | 2 | 3;
  lang: Lang;
  flow?: Flow; // ✅ pour adapter le libellé selon T1/T2/TA (défaut: t1)
};

const LABELS: Record<Flow, Record<Lang, [string, string, string]>> = {
  t1: {
    fr: ["Remplir le formulaire", "Déposer les documents", "Envoyer le dossier"],
    en: ["Fill the form", "Upload documents", "Submit file"],
    es: ["Completar el formulario", "Subir documentos", "Enviar el expediente"],
  },
  t2: {
    fr: ["Infos de la société", "Déposer les documents", "Envoyer le dossier"],
    en: ["Company info", "Upload documents", "Submit file"],
    es: ["Información de la empresa", "Subir documentos", "Enviar el expediente"],
  },
  ta: {
    fr: ["Infos travailleur autonome", "Déposer les documents", "Envoyer le dossier"],
    en: ["Self-employed info", "Upload documents", "Submit file"],
    es: ["Info trabajador autónomo", "Subir documentos", "Enviar el expediente"],
  },
};

export default function Steps({ step, lang, flow = "t1" }: Props) {
  const t = LABELS[flow][lang];

  return (
    <div className="ff-steps" aria-label={lang === "fr" ? "Étapes du dossier" : lang === "en" ? "File steps" : "Pasos del expediente"}>
      <div className={`ff-step ${step === 1 ? "ff-step-active" : ""}`}>
        <div className="ff-step-num">1</div>
        <div>{t[0]}</div>
      </div>

      <div className={`ff-step ${step === 2 ? "ff-step-active" : ""}`}>
        <div className="ff-step-num">2</div>
        <div>{t[1]}</div>
      </div>

      <div className={`ff-step ${step === 3 ? "ff-step-active" : ""}`}>
        <div className="ff-step-num">3</div>
        <div>{t[2]}</div>
      </div>
    </div>
  );
}
