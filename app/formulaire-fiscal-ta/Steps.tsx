"use client";

import React from "react";

export type Lang = "fr" | "en" | "es";
export type Flow = "t1" | "ta" | "t2";

type Props = {
  step: 1 | 2 | 3 | 4; // ✅ permet 4 (utile seulement pour TA)
  lang: Lang;
  flow: Flow;
};

const LABELS: Record<Flow, Record<Lang, string[]>> = {
  t1: {
    fr: ["Remplir le formulaire", "Déposer les documents", "Envoyer le dossier"],
    en: ["Fill the form", "Upload documents", "Submit file"],
    es: ["Completar el formulario", "Subir documentos", "Enviar el expediente"],
  },
  ta: {
    fr: [
      "Informations travailleur autonome",
      "Profil & activité",
      "Revenus & dépenses",
      "Documents",
    ],
    en: [
      "Self-employed information",
      "Profile & activity",
      "Income & expenses",
      "Documents",
    ],
    es: [
      "Información del trabajador autónomo",
      "Perfil y actividad",
      "Ingresos y gastos",
      "Documentos",
    ],
  },
  t2: {
    fr: ["Informations société (T2)", "Documents financiers", "Envoyer le dossier"],
    en: ["Corporation information (T2)", "Financial documents", "Submit file"],
    es: ["Información de la empresa (T2)", "Documentos financieros", "Enviar el expediente"],
  },
};

export default function Steps({ step, lang, flow }: Props) {
  const labels = LABELS[flow][lang];
  const total = labels.length; // ✅ 3 pour t1/t2, 4 pour ta

  return (
    <div className="ff-steps" aria-label="Étapes du dossier">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div key={n} className={`ff-step ${step === n ? "ff-step-active" : ""}`}>
          <div className="ff-step-num">{n}</div>
          <div>{labels[n - 1] ?? ""}</div>
        </div>
      ))}
    </div>
  );
}
