// app/formulaire-fiscal-ta/sections/QuestionsSection.tsx
"use client";

import React from "react";
import { Field, YesNoField, SelectField } from "../ui";
import type { YesNo } from "../ui";
import type { CopieImpots } from "../types";
import type { CopyPack } from "../copy";

/**
 * TA = 4 steps.
 * Cette section correspond aux "Questions générales" du flow TA.
 * (Même UI que T1, tu peux ensuite enlever/ajouter des questions spécifiques TA si besoin.)
 */
export default function QuestionsSection(props: {
  L: CopyPack;

  anneeImposition: string;
  setAnneeImposition: (v: string) => void;

  habiteSeulTouteAnnee: YesNo;
  setHabiteSeulTouteAnnee: (v: YesNo) => void;

  nbPersonnesMaison3112: string;
  setNbPersonnesMaison3112: (v: string) => void;

  biensEtranger100k: YesNo;
  setBiensEtranger100k: (v: YesNo) => void;

  citoyenCanadien: YesNo;
  setCitoyenCanadien: (v: YesNo) => void;

  nonResident: YesNo;
  setNonResident: (v: YesNo) => void;

  maisonAcheteeOuVendue: YesNo;
  setMaisonAcheteeOuVendue: (v: YesNo) => void;

  appelerTechnicien: YesNo;
  setAppelerTechnicien: (v: YesNo) => void;

  copieImpots: CopieImpots;
  setCopieImpots: (v: CopieImpots) => void;
}) {
  const {
    L,
    anneeImposition,
    setAnneeImposition,
    habiteSeulTouteAnnee,
    setHabiteSeulTouteAnnee,
    nbPersonnesMaison3112,
    setNbPersonnesMaison3112,
    biensEtranger100k,
    setBiensEtranger100k,
    citoyenCanadien,
    setCitoyenCanadien,
    nonResident,
    setNonResident,
    maisonAcheteeOuVendue,
    setMaisonAcheteeOuVendue,
    appelerTechnicien,
    setAppelerTechnicien,
    copieImpots,
    setCopieImpots,
  } = props;

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        <h2>{L.sections.questionsTitle}</h2>
        <p>{L.sections.questionsDesc}</p>
      </div>

      <div className="ff-stack">
        <Field
          label={L.questions.taxYear}
          value={anneeImposition}
          onChange={setAnneeImposition}
          placeholder={L.questions.taxYearPh}
          inputMode="numeric"
          required
        />

        <YesNoField
          name="habiteSeulTouteAnnee"
          label={L.questions.livedAlone}
          value={habiteSeulTouteAnnee}
          onChange={setHabiteSeulTouteAnnee}
        />

        <Field
          label={L.questions.peopleCount}
          value={nbPersonnesMaison3112}
          onChange={(v) => setNbPersonnesMaison3112(v.replace(/[^\d]/g, ""))}
          placeholder={L.questions.peopleCountPh}
          inputMode="numeric"
          required
        />

        <YesNoField
          name="biensEtranger100k"
          label={L.questions.foreignAssets}
          value={biensEtranger100k}
          onChange={setBiensEtranger100k}
        />

        <YesNoField
          name="citoyenCanadien"
          label={L.questions.citizen}
          value={citoyenCanadien}
          onChange={setCitoyenCanadien}
        />

        <YesNoField
          name="nonResident"
          label={L.questions.nonResident}
          value={nonResident}
          onChange={setNonResident}
        />

        <YesNoField
          name="maisonAcheteeOuVendue"
          label={L.questions.homeTx}
          value={maisonAcheteeOuVendue}
          onChange={setMaisonAcheteeOuVendue}
        />

        <YesNoField
          name="appelerTechnicien"
          label={L.questions.techCall}
          value={appelerTechnicien}
          onChange={setAppelerTechnicien}
        />

        <SelectField<CopieImpots>
          label={L.questions.copy}
          value={copieImpots}
          onChange={setCopieImpots}
          required
          options={[
            { value: "espaceClient", label: L.questions.copyPortal },
            { value: "courriel", label: L.questions.copyEmail },
          ]}
        />
      </div>
    </section>
  );
}
