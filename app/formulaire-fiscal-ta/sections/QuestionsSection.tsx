// app/formulaire-fiscal-ta/sections/QuestionsSection.tsx
"use client";

import React, { useMemo } from "react";
import { Field, YesNoField, SelectField } from "../ui";
import type { YesNo } from "../ui";
import type { CopieImpots } from "../types";
import type { CopyPack } from "../copy";

type FieldStatus = "ok" | "no" | "idle";

function Mark({ status }: { status: FieldStatus }) {
  if (status === "idle") return null;
  const ok = status === "ok";
  return (
    <span
      aria-hidden
      style={{
        marginLeft: 8,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        border: "1px solid rgba(0,0,0,.12)",
        background: ok ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.10)",
        color: ok ? "#16a34a" : "#dc2626",
      }}
      title={ok ? "OK" : "À compléter"}
    >
      {ok ? "✓" : "✕"}
    </span>
  );
}

function LabelWithMark({ label, status }: { label: string; status: FieldStatus }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <span>{label}</span>
      <Mark status={status} />
    </span>
  );
}

// ===== validations locales =====
function isValidYear(v: string) {
  const y = (v || "").trim();
  if (!/^\d{4}$/.test(y)) return false;
  const n = Number(y);
  return n >= 2000 && n <= 2100;
}

function statusRequiredText(v: string, showErrors: boolean): FieldStatus {
  if (!v.trim()) return showErrors ? "no" : "idle";
  return "ok";
}

function statusYesNo(v: YesNo, showErrors: boolean): FieldStatus {
  if (!v) return showErrors ? "no" : "idle";
  return "ok";
}

function statusYear(v: string, showErrors: boolean): FieldStatus {
  if (!v.trim()) return showErrors ? "no" : "idle";
  return isValidYear(v) ? "ok" : "no";
}

function statusRequiredSelect(v: string, showErrors: boolean): FieldStatus {
  if (!v) return showErrors ? "no" : "idle";
  return "ok";
}

/**
 * TA = Questions générales
 * -> version avec showErrors + ✓/✕ dans les labels
 */
export default function QuestionsSection(props: {
  L: CopyPack;
  showErrors: boolean;

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
    showErrors,
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

  const status = useMemo(() => {
    const peopleCountStatus: FieldStatus = (() => {
      if (!nbPersonnesMaison3112.trim()) return showErrors ? "no" : "idle";
      // ici tu acceptes 0, mais il faut que ce soit rempli
      return "ok";
    })();

    return {
      anneeImposition: statusYear(anneeImposition, showErrors),
      habiteSeulTouteAnnee: statusYesNo(habiteSeulTouteAnnee, showErrors),
      nbPersonnesMaison3112: peopleCountStatus,
      biensEtranger100k: statusYesNo(biensEtranger100k, showErrors),
      citoyenCanadien: statusYesNo(citoyenCanadien, showErrors),
      nonResident: statusYesNo(nonResident, showErrors),
      maisonAcheteeOuVendue: statusYesNo(maisonAcheteeOuVendue, showErrors),
      appelerTechnicien: statusYesNo(appelerTechnicien, showErrors),
      copieImpots: statusRequiredSelect(copieImpots as any, showErrors),
    };
  }, [
    showErrors,
    anneeImposition,
    habiteSeulTouteAnnee,
    nbPersonnesMaison3112,
    biensEtranger100k,
    citoyenCanadien,
    nonResident,
    maisonAcheteeOuVendue,
    appelerTechnicien,
    copieImpots,
  ]);

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        <h2>{L.sections.questionsTitle}</h2>
        <p>{L.sections.questionsDesc}</p>
      </div>

      <div className="ff-stack">
        <Field
          label={(<LabelWithMark label={L.questions.taxYear} status={status.anneeImposition} />) as any}
          value={anneeImposition}
          onChange={setAnneeImposition}
          placeholder={L.questions.taxYearPh}
          inputMode="numeric"
          required
        />

        <YesNoField
          name="habiteSeulTouteAnnee"
          label={(<LabelWithMark label={L.questions.livedAlone} status={status.habiteSeulTouteAnnee} />) as any}
          value={habiteSeulTouteAnnee}
          onChange={setHabiteSeulTouteAnnee}
        />

        <Field
          label={(<LabelWithMark label={L.questions.peopleCount} status={status.nbPersonnesMaison3112} />) as any}
          value={nbPersonnesMaison3112}
          onChange={(v) => setNbPersonnesMaison3112(v.replace(/[^\d]/g, ""))}
          placeholder={L.questions.peopleCountPh}
          inputMode="numeric"
          required
        />

        <YesNoField
          name="biensEtranger100k"
          label={(<LabelWithMark label={L.questions.foreignAssets} status={status.biensEtranger100k} />) as any}
          value={biensEtranger100k}
          onChange={setBiensEtranger100k}
        />

        <YesNoField
          name="citoyenCanadien"
          label={(<LabelWithMark label={L.questions.citizen} status={status.citoyenCanadien} />) as any}
          value={citoyenCanadien}
          onChange={setCitoyenCanadien}
        />

        <YesNoField
          name="nonResident"
          label={(<LabelWithMark label={L.questions.nonResident} status={status.nonResident} />) as any}
          value={nonResident}
          onChange={setNonResident}
        />

        <YesNoField
          name="maisonAcheteeOuVendue"
          label={(<LabelWithMark label={L.questions.homeTx} status={status.maisonAcheteeOuVendue} />) as any}
          value={maisonAcheteeOuVendue}
          onChange={setMaisonAcheteeOuVendue}
        />

        <YesNoField
          name="appelerTechnicien"
          label={(<LabelWithMark label={L.questions.techCall} status={status.appelerTechnicien} />) as any}
          value={appelerTechnicien}
          onChange={setAppelerTechnicien}
        />

        <SelectField<CopieImpots>
          label={(<LabelWithMark label={L.questions.copy} status={status.copieImpots} />) as any}
          value={copieImpots}
          onChange={(v) => {
            // protège si placeholder = ""
            if ((v as any) === "") return;
            setCopieImpots(v);
          }}
          required
          options={[
            { value: "espaceClient", label: L.questions.copyPortal },
            { value: "courriel", label: L.questions.copyEmail },
          ]}
          placeholderText="—"
        />
      </div>
    </section>
  );
}
