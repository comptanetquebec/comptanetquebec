"use client";

import React from "react";

export type Lang = "fr" | "en" | "es";
export type Flow = "t1" | "ta" | "t2";

type Props = {
  step: 1 | 2 | 3;
  lang: Lang;
  flow: Flow;
};

const LABELS: Record<Flow, Record<Lang, [string, string, string]>> = {
  t1: {
    fr: ["Remplir le formulaire", "Déposer les documents", "Envoyer le dossier"],
    en: ["Fill the form", "Upload documents", "Submit file"],
    es: ["Completar el formulario", "Subir documentos", "Enviar el expediente"],
  },
  ta: {
    fr: [
      "Informations travailleur autonome",
      "Déposer les documents",
      "Envoyer le dossier",
    ],
    en: [
      "Self-employed information",
      "Upload documents",
      "Submit file",
    ],
    es: [
      "Información del trabajador autónomo",
      "Subir documentos",
      "Enviar el expediente",
    ],
  },
  t2: {
    fr: [
      "Informations société (T2)",
      "Documents financiers",
      "Envoyer le dossier",
    ],
    en: [
      "Corporation information (T2)",
      "Financial documents",
      "Submit file",
    ],
    es: [
      "Información de la empresa (T2)",
      "Documentos financieros",
      "Enviar el expediente",
    ],
  },
};

export default function Steps({ step, lang, flow }: Props) {
  const t = LABELS[flow][lang];

  return (
    <div className="ff-steps" aria-label="Étapes du dossier">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={`ff-step ${step === n ? "ff-step-active" : ""}`}
        >
          <div className="ff-step-num">{n}</div>
          <div>{t[n - 1]}</div>
        </div>
      ))}
    </div>
  );
}
