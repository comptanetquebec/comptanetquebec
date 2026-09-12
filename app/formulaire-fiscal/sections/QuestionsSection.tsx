// app/formulaire-fiscal/sections/QuestionsSection.tsx
"use client";

import React, { useMemo } from "react";
import { Field, YesNoField, SelectField } from "../ui";
import type { YesNo } from "../ui";
import type { CopieImpots, AvisCotisation } from "../types";
import type { CopyPack } from "../copy";

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
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span>{text}</span>
      <MarkIcon mark={mark} />
    </span>
  );
}

function markYesNo(v: YesNo): Mark {
  return v ? "ok" : "bad";
}

function markYear(v: string): Mark {
  return isValidYear(v) ? "ok" : "bad";
}

function markPeopleCount(v: string): Mark {
  const t = (v || "").trim();
  if (!t) return "bad";
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

  avisCotisation: AvisCotisation;
  setAvisCotisation: (v: AvisCotisation) => void;
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
    avisCotisation,
    setAvisCotisation,
  } = props;

  /*
   * Les textes de l'avis de cotisation sont gardés ici pour que cette
   * section soit immédiatement FR / EN / ES sans changer le contrat
   * CopyPack ni risquer de casser les autres fichiers.
   *
   * On détecte la langue à partir des libellés déjà fournis par copy.ts.
   */
  const avisText = useMemo(() => {
    const sample = [
      L.sections.questionsTitle,
      L.sections.questionsDesc,
      L.questions.taxYear,
      L.questions.copy,
      L.questions.copyPortal,
      L.questions.copyEmail,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const looksSpanish =
      /\b(impuesto|impuestos|declaraci[oó]n|correo|cliente|año|año fiscal)\b/.test(sample);

    const looksEnglish =
      /\b(tax|taxes|return|email|client|year|assessment)\b/.test(sample);

    if (looksSpanish) {
      return {
        label: "¿Cómo desea recibir su aviso de liquidación?",
        mail: "Por correo postal",
        government: "En línea a través del sitio web del gobierno",
      };
    }

    if (looksEnglish) {
      return {
        label: "How would you like to receive your notice of assessment?",
        mail: "By mail",
        government: "Online through the government website",
      };
    }

    return {
      label: "Comment souhaitez-vous recevoir votre avis de cotisation ?",
      mail: "Par la poste",
      government: "En ligne auprès du gouvernement",
    };
  }, [L]);

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
    const mAvis = markSelect(avisCotisation);

    const blockOk =
      mYear === "ok" &&
      mLived === "ok" &&
      mPeople === "ok" &&
      mForeign === "ok" &&
      mCitizen === "ok" &&
      mNonRes === "ok" &&
      mHomeTx === "ok" &&
      mTech === "ok" &&
      mCopy === "ok" &&
      mAvis === "ok";

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
      avis: mAvis,
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
    avisCotisation,
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
        />

        <YesNoField
          name="habiteSeulTouteAnnee"
          label={<LabelWithMark text={L.questions.livedAlone} mark={marks.lived} />}
          value={habiteSeulTouteAnnee}
          onChange={setHabiteSeulTouteAnnee}
        />

        <Field
          label={<LabelWithMark text={L.questions.peopleCount} mark={marks.people} />}
          value={nbPersonnesMaison3112}
          onChange={(v) => setNbPersonnesMaison3112(v.replace(/[^\d]/g, ""))}
          placeholder={L.questions.peopleCountPh}
          inputMode="numeric"
        />

        <YesNoField
          name="biensEtranger100k"
          label={<LabelWithMark text={L.questions.foreignAssets} mark={marks.foreign} />}
          value={biensEtranger100k}
          onChange={setBiensEtranger100k}
        />

        <YesNoField
          name="citoyenCanadien"
          label={<LabelWithMark text={L.questions.citizen} mark={marks.citizen} />}
          value={citoyenCanadien}
          onChange={setCitoyenCanadien}
        />

        <YesNoField
          name="nonResident"
          label={<LabelWithMark text={L.questions.nonResident} mark={marks.nonRes} />}
          value={nonResident}
          onChange={setNonResident}
        />

        <YesNoField
          name="maisonAcheteeOuVendue"
          label={<LabelWithMark text={L.questions.homeTx} mark={marks.homeTx} />}
          value={maisonAcheteeOuVendue}
          onChange={setMaisonAcheteeOuVendue}
        />

        <YesNoField
          name="appelerTechnicien"
          label={<LabelWithMark text={L.questions.techCall} mark={marks.tech} />}
          value={appelerTechnicien}
          onChange={setAppelerTechnicien}
        />

        <SelectField<CopieImpots>
          label={<LabelWithMark text={L.questions.copy} mark={marks.copy} />}
          value={copieImpots}
          onChange={setCopieImpots}
          options={[
            { value: "espaceClient", label: L.questions.copyPortal },
            { value: "courriel", label: L.questions.copyEmail },
          ]}
        />

        <SelectField<AvisCotisation>
          label={<LabelWithMark text={avisText.label} mark={marks.avis} />}
          value={avisCotisation}
          onChange={setAvisCotisation}
          options={[
            { value: "poste", label: avisText.mail },
            { value: "gouvernement", label: avisText.government },
          ]}
        />
      </div>
    </section>
  );
}
