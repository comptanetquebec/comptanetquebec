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

type Mark = "ok" | "bad" | "todo";

function MarkIcon({ mark }: { mark: Mark }) {
  const cls =
    mark === "ok"
      ? "mark-icon mark-icon--ok"
      : mark === "bad"
      ? "mark-icon mark-icon--bad"
      : "mark-icon mark-icon--todo";

  const title = mark === "ok" ? "OK" : mark === "bad" ? "À corriger" : "À faire";
  const symbol = mark === "ok" ? "✓" : mark === "bad" ? "✕" : "→";

  return (
    <span className={cls} aria-hidden title={title}>
      {symbol}
    </span>
  );
}

function LabelWithMark({ text, mark }: { text: React.ReactNode; mark: Mark }) {
  return (
    <>
      {text} <MarkIcon mark={mark} />
    </>
  );
}

function markYesNo(v: YesNo): Mark {
  return v ? "ok" : "bad";
}

function markRequiredText(v: string): Mark {
  const t = (v || "").trim();
  return t ? "ok" : "bad";
}

function markYear(v: string): Mark {
  const t = (v || "").trim();
  if (!t) return "todo";
  return isValidYear(t) ? "ok" : "bad";
}

function markPeopleCount(v: string): Mark {
  const t = (v || "").trim();
  if (!t) return "todo";
  const n = Number(t);
  if (!Number.isFinite(n)) return "bad";
  return n >= 0 ? "ok" : "bad";
}

function markSelect<T extends string>(v: T): Mark {
  return v ? "ok" : "bad";
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

  const marks = useMemo(() => {
    const mYear = markYear(anneeImposition);

    const mLived = markYesNo(habiteSeulTouteAnnee);

    const mPeople = markPeopleCount(nbPersonnesMaison3112);

    const mForeign = markYesNo(biensEtranger100k);
    const mCitizen = markYesNo(citoyenCanadien);
    const mNonRes = markYesNo(nonResident);
    const mHomeTx = markYesNo(maisonAcheteeOuVendue);
    const mTech = markYesNo(appelerTechnicien);

    const mCopy = markSelect(copieImpots);

    const blockOk =
      mYear === "ok" &&
      mLived === "ok" &&
      mPeople === "ok" &&
      mForeign === "ok" &&
      mCitizen === "ok" &&
      mNonRes === "ok" &&
      mHomeTx === "ok" &&
      mTech === "ok" &&
      mCopy === "ok";

    return {
      year: mYear,
      lived: mLived,
      people: mPeople,
      foreign: mForeign,
      citizen: mCitizen,
      nonRes: mNonRes,
      homeTx: mHomeTx,
      tech: mTech,
      copy: mCopy,
      block: blockOk ? ("ok" as Mark) : ("bad" as Mark),
    };
  }, [
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <h2 style={{ margin: 0 }}>{L.sections.questionsTitle}</h2>
          <MarkIcon mark={marks.block} />
        </div>
        <p style={{ marginTop: 8 }}>{L.sections.questionsDesc}</p>
      </div>

      <div className="ff-stack">
        <Field
          label={<LabelWithMark text={L.questions.taxYear} mark={marks.year} />}
          value={anneeImposition}
          onChange={(v) => setAnneeImposition(v.replace(/[^\d]/g, "").slice(0, 4))}
          placeholder={L.questions.taxYearPh}
          inputMode="numeric"
          required
        />

        <YesNoField
          name="habiteSeulTouteAnnee"
          label={<LabelWithMark text={L.questions.livedAlone} mark={marks.lived} />}
          value={habiteSeulTouteAnnee}
          onChange={setHabiteSeulTouteAnnee}
          required
        />

        <Field
          label={<LabelWithMark text={L.questions.peopleCount} mark={marks.people} />}
          value={nbPersonnesMaison3112}
          onChange={(v) => setNbPersonnesMaison3112(v.replace(/[^\d]/g, ""))}
          placeholder={L.questions.peopleCountPh}
          inputMode="numeric"
          required
        />

        <YesNoField
          name="biensEtranger100k"
          label={<LabelWithMark text={L.questions.foreignAssets} mark={marks.foreign} />}
          value={biensEtranger100k}
          onChange={setBiensEtranger100k}
          required
        />

        <YesNoField
          name="citoyenCanadien"
          label={<LabelWithMark text={L.questions.citizen} mark={marks.citizen} />}
          value={citoyenCanadien}
          onChange={setCitoyenCanadien}
          required
        />

        <YesNoField
          name="nonResident"
          label={<LabelWithMark text={L.questions.nonResident} mark={marks.nonRes} />}
          value={nonResident}
          onChange={setNonResident}
          required
        />

        <YesNoField
          name="maisonAcheteeOuVendue"
          label={<LabelWithMark text={L.questions.homeTx} mark={marks.homeTx} />}
          value={maisonAcheteeOuVendue}
          onChange={setMaisonAcheteeOuVendue}
          required
        />

        <YesNoField
          name="appelerTechnicien"
          label={<LabelWithMark text={L.questions.techCall} mark={marks.tech} />}
          value={appelerTechnicien}
          onChange={setAppelerTechnicien}
          required
        />

        <SelectField<CopieImpots>
          label={<LabelWithMark text={L.questions.copy} mark={marks.copy} />}
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
