// app/formulaire-fiscal/sections/QuestionsSection.tsx
"use client";

import React, { useMemo } from "react";
import { Field, YesNoField, SelectField } from "../ui";
import type { YesNo } from "../ui";
import type { CopieImpots } from "../types";
import type { CopyPack } from "../copy";

/* ---------- mini validation locale ---------- */
function isValidYear(v: string) {
  const y = (v || "").trim();
  if (!/^\d{4}$/.test(y)) return false;
  const n = Number(y);
  return n >= 2000 && n <= 2100;
}

function StatusIcon({ ok, show }: { ok: boolean; show: boolean }) {
  if (!show) return null;
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 20,
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 900,
        marginLeft: 8,
        background: ok ? "#dcfce7" : "#fee2e2",
        color: ok ? "#065f46" : "#7f1d1d",
        border: `1px solid ${ok ? "#16a34a" : "#dc2626"}`,
        flex: "0 0 auto",
      }}
      title={ok ? "OK" : "À corriger"}
    >
      {ok ? "✓" : "✕"}
    </span>
  );
}

function RowWithIcon(props: { children: React.ReactNode; ok: boolean; show: boolean }) {
  const { children, ok, show } = props;
  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>{children}</div>
      <StatusIcon ok={ok} show={show} />
    </div>
  );
}

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

  // ---- états "ok / show" pour vert/rouge ----
  const yearShow = (anneeImposition || "").trim().length > 0;
  const yearOk = isValidYear(anneeImposition);

  const peopleShow = (nbPersonnesMaison3112 || "").trim().length > 0;
  const peopleOk = (() => {
    if (!peopleShow) return false;
    const n = Number((nbPersonnesMaison3112 || "").trim());
    return Number.isFinite(n) && n >= 0;
  })();

  const livedShow = habiteSeulTouteAnnee !== "";
  const livedOk = livedShow; // yes/no choisi

  const foreignShow = biensEtranger100k !== "";
  const foreignOk = foreignShow;

  const citizenShow = citoyenCanadien !== "";
  const citizenOk = citizenShow;

  const nonResShow = nonResident !== "";
  const nonResOk = nonResShow;

  const homeTxShow = maisonAcheteeOuVendue !== "";
  const homeTxOk = homeTxShow;

  const techShow = appelerTechnicien !== "";
  const techOk = techShow;

  const copyShow = copieImpots !== "";
  const copyOk = copyShow;

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        <h2>{L.sections.questionsTitle}</h2>
        <p>{L.sections.questionsDesc}</p>
      </div>

      <div className="ff-stack">
        <RowWithIcon ok={yearOk} show={yearShow}>
          <Field
            label={L.questions.taxYear}
            value={anneeImposition}
            onChange={setAnneeImposition}
            placeholder={L.questions.taxYearPh}
            inputMode="numeric"
            required
          />
        </RowWithIcon>

        <RowWithIcon ok={livedOk} show={livedShow}>
          <YesNoField
            name="habiteSeulTouteAnnee"
            label={L.questions.livedAlone}
            value={habiteSeulTouteAnnee}
            onChange={setHabiteSeulTouteAnnee}
          />
        </RowWithIcon>

        <RowWithIcon ok={peopleOk} show={peopleShow}>
          <Field
            label={L.questions.peopleCount}
            value={nbPersonnesMaison3112}
            onChange={(v) => setNbPersonnesMaison3112(v.replace(/[^\d]/g, ""))}
            placeholder={L.questions.peopleCountPh}
            inputMode="numeric"
            required
          />
        </RowWithIcon>

        <RowWithIcon ok={foreignOk} show={foreignShow}>
          <YesNoField
            name="biensEtranger100k"
            label={L.questions.foreignAssets}
            value={biensEtranger100k}
            onChange={setBiensEtranger100k}
          />
        </RowWithIcon>

        <RowWithIcon ok={citizenOk} show={citizenShow}>
          <YesNoField
            name="citoyenCanadien"
            label={L.questions.citizen}
            value={citoyenCanadien}
            onChange={setCitoyenCanadien}
          />
        </RowWithIcon>

        <RowWithIcon ok={nonResOk} show={nonResShow}>
          <YesNoField
            name="nonResident"
            label={L.questions.nonResident}
            value={nonResident}
            onChange={setNonResident}
          />
        </RowWithIcon>

        <RowWithIcon ok={homeTxOk} show={homeTxShow}>
          <YesNoField
            name="maisonAcheteeOuVendue"
            label={L.questions.homeTx}
            value={maisonAcheteeOuVendue}
            onChange={setMaisonAcheteeOuVendue}
          />
        </RowWithIcon>

        <RowWithIcon ok={techOk} show={techShow}>
          <YesNoField
            name="appelerTechnicien"
            label={L.questions.techCall}
            value={appelerTechnicien}
            onChange={setAppelerTechnicien}
          />
        </RowWithIcon>

        <RowWithIcon ok={copyOk} show={copyShow}>
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
        </RowWithIcon>
      </div>
    </section>
  );
}
