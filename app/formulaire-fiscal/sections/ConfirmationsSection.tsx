// app/formulaire-fiscal/sections/ConfirmationsSection.tsx
"use client";

import React, { useMemo } from "react";
import { CheckboxField } from "../ui";
import type { CopyPack } from "../copy";

type Mark = "ok" | "bad";
type Lang = "fr" | "en" | "es";

function MarkIcon({ mark }: { mark: Mark }) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    lineHeight: 1,
    border: "1px solid rgba(0,0,0,.18)",
    flex: "0 0 auto",
  };

  if (mark === "ok") {
    return (
      <span
        aria-label="ok"
        title="OK"
        style={{
          ...base,
          color: "#14532d",
          background: "#dcfce7",
          borderColor: "#16a34a",
        }}
      >
        ✓
      </span>
    );
  }

  return (
    <span
      aria-label="à corriger"
      title="À corriger"
      style={{
        ...base,
        color: "#7f1d1d",
        background: "#fee2e2",
        borderColor: "#dc2626",
      }}
    >
      ✕
    </span>
  );
}

function LabelWithMark({
  text,
  mark,
}: {
  text: React.ReactNode;
  mark: Mark;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ minWidth: 0 }}>{text}</span>
      <MarkIcon mark={mark} />
    </span>
  );
}

const AI_TEXT = {
  fr: {
    title: "Utilisation de l’intelligence artificielle",
    text:
      "ComptaNet Québec peut utiliser des outils d’intelligence artificielle à titre d’assistance pour analyser, classer et organiser les renseignements et documents fournis afin de faciliter la préparation de votre déclaration de revenus. L’intelligence artificielle ne prend aucune décision fiscale de façon autonome. Les informations produites sont vérifiées par une personne avant leur utilisation. Votre numéro d’assurance sociale (NAS) n’est pas transmis à l’outil d’intelligence artificielle.",
  },

  en: {
    title: "Use of artificial intelligence",
    text:
      "ComptaNet Québec may use artificial intelligence tools to assist in analyzing, classifying and organizing the information and documents provided in order to facilitate the preparation of your income tax return. Artificial intelligence does not make tax decisions autonomously. The information produced is reviewed by a person before it is used. Your Social Insurance Number (SIN) is not transmitted to the artificial intelligence tool.",
  },

  es: {
    title: "Uso de inteligencia artificial",
    text:
      "ComptaNet Québec puede utilizar herramientas de inteligencia artificial como apoyo para analizar, clasificar y organizar la información y los documentos proporcionados con el fin de facilitar la preparación de su declaración de impuestos. La inteligencia artificial no toma decisiones fiscales de forma autónoma. La información producida es revisada por una persona antes de ser utilizada. Su número de seguro social (SIN) no se transmite a la herramienta de inteligencia artificial.",
  },
} as const;

export default function ConfirmationsSection(props: {
  L: CopyPack;
  lang: Lang;

  vExactitude: boolean;
  setVExactitude: (v: boolean) => void;

  vDossierComplet: boolean;
  setVDossierComplet: (v: boolean) => void;

  vFraisVariables: boolean;
  setVFraisVariables: (v: boolean) => void;

  vDelais: boolean;
  setVDelais: (v: boolean) => void;

  vConsentement: boolean;
  setVConsentement: (v: boolean) => void;
}) {
  const {
    L,
    lang,

    vExactitude,
    setVExactitude,

    vDossierComplet,
    setVDossierComplet,

    vFraisVariables,
    setVFraisVariables,

    vDelais,
    setVDelais,

    vConsentement,
    setVConsentement,
  } = props;

  const ai = AI_TEXT[lang];

  const marks = useMemo(() => {
    const m1: Mark = vExactitude ? "ok" : "bad";
    const m2: Mark = vDossierComplet ? "ok" : "bad";
    const m3: Mark = vFraisVariables ? "ok" : "bad";
    const m4: Mark = vDelais ? "ok" : "bad";
    const m5: Mark = vConsentement ? "ok" : "bad";

    const blockOk =
      m1 === "ok" &&
      m2 === "ok" &&
      m3 === "ok" &&
      m4 === "ok" &&
      m5 === "ok";

    return {
      m1,
      m2,
      m3,
      m4,
      m5,
      block: blockOk ? ("ok" as Mark) : ("bad" as Mark),
    };
  }, [
    vExactitude,
    vDossierComplet,
    vFraisVariables,
    vDelais,
    vConsentement,
  ]);

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <h2 style={{ margin: 0 }}>
            {L.sections.confirmsTitle}
          </h2>

          <MarkIcon mark={marks.block} />
        </div>

        <p style={{ marginTop: 8 }}>
          {L.sections.confirmsDesc}
        </p>
      </div>

      <div className="ff-stack">
        <CheckboxField
          label={
            <LabelWithMark
              text={L.confirms.exact}
              mark={marks.m1}
            />
          }
          checked={vExactitude}
          onChange={setVExactitude}
        />

        <CheckboxField
          label={
            <LabelWithMark
              text={L.confirms.complete}
              mark={marks.m2}
            />
          }
          checked={vDossierComplet}
          onChange={setVDossierComplet}
        />

        <CheckboxField
          label={
            <LabelWithMark
              text={L.confirms.fees}
              mark={marks.m3}
            />
          }
          checked={vFraisVariables}
          onChange={setVFraisVariables}
        />

        <CheckboxField
          label={
            <LabelWithMark
              text={L.confirms.delays}
              mark={marks.m4}
            />
          }
          checked={vDelais}
          onChange={setVDelais}
        />

        <CheckboxField
          label={
            <LabelWithMark
              text={L.confirms.consent}
              mark={marks.m5}
            />
          }
          checked={vConsentement}
          onChange={setVConsentement}
        />

        <div
          style={{
            marginTop: 8,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #dbeafe",
            background: "#f8fbff",
            color: "#334155",
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          <div
            style={{
              fontWeight: 800,
              marginBottom: 5,
              color: "#1e3a8a",
            }}
          >
            {ai.title}
          </div>

          <div>{ai.text}</div>
        </div>
      </div>
    </section>
  );
}
