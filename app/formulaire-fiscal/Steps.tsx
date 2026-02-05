"use client";

import React from "react";

type Lang = "fr" | "en" | "es";
type Props = { step: 1 | 2 | 3; lang: Lang };

export default function Steps({ step, lang }: Props) {
  const t = {
    fr: ["Remplir le formulaire", "Déposer les documents", "Envoyer le dossier"],
    en: ["Fill the form", "Upload documents", "Submit file"],
    es: ["Completar el formulario", "Subir documentos", "Enviar el expediente"],
  }[lang];

  return (
    <div className="ff-steps" aria-label="Étapes du dossier">
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
