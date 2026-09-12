// app/formulaire-fiscal/sections/DependantsSection.tsx
"use client";

import React, { useMemo } from "react";
import { Field, SelectField, YesNoField } from "../ui";
import type { Child, Sexe } from "../types";
import type { CopyPack } from "../copy";
import { formatDateInput, formatNASInput } from "../formatters";
import { normalizeNAS } from "../helpers";

/* ============================================================
   TYPES
============================================================ */

type Mark = "ok" | "bad" | "warn";
type UiLang = "fr" | "en" | "es";
type YesNo = "oui" | "non" | "";

/* ============================================================
   LANGUE
============================================================ */

function getUiLang(L: CopyPack): UiLang {
  if (L.fields.firstName === "First name") return "en";
  if (L.fields.firstName === "Nombre") return "es";
  return "fr";
}

const LOCAL_TEXT = {
  fr: {
    ok: "Valide",
    bad: "À corriger",
    warn: "À compléter",

    choose: "Choisir…",

    noDependants:
      "Aucune personne à charge sélectionnée.",

    worked:
      "Cette personne à charge a-t-elle travaillé durant l’année d’imposition ?",

    yes: "Oui",
    no: "Non",

    estimatedIncome:
      "Revenu de travail estimé pour l’année",

    estimatedIncomePlaceholder: "Ex. : 8 500",

    estimatedIncomeHint:
      "Indiquez le revenu de travail approximatif avant impôt.",

    sinHint:
      "Laissez le NAS vide si vous ne l’avez pas.",
  },

  en: {
    ok: "Valid",
    bad: "Needs correction",
    warn: "To complete",

    choose: "Select…",

    noDependants:
      "No dependants selected.",

    worked:
      "Did this dependant work during the tax year?",

    yes: "Yes",
    no: "No",

    estimatedIncome:
      "Estimated employment income for the year",

    estimatedIncomePlaceholder: "Ex.: 8,500",

    estimatedIncomeHint:
      "Enter the approximate employment income before tax.",

    sinHint:
      "Leave the SIN blank if you do not have it.",
  },

  es: {
    ok: "Válido",
    bad: "Debe corregirse",
    warn: "Por completar",

    choose: "Seleccionar…",

    noDependants:
      "No se seleccionó ninguna persona a cargo.",

    worked:
      "¿Esta persona a cargo trabajó durante el año fiscal?",

    yes: "Sí",
    no: "No",

    estimatedIncome:
      "Ingreso laboral estimado del año",

    estimatedIncomePlaceholder: "Ej.: 8 500",

    estimatedIncomeHint:
      "Indique el ingreso laboral aproximado antes de impuestos.",

    sinHint:
      "Deje el NAS en blanco si no lo tiene.",
  },
} as const;

/* ============================================================
   MARQUES
============================================================ */

function MarkIcon({
  mark,
  lang,
}: {
  mark: Mark;
  lang: UiLang;
}) {
  const T = LOCAL_TEXT[lang];

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
        aria-hidden="true"
        title={T.ok}
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

  if (mark === "warn") {
    return (
      <span
        aria-hidden="true"
        title={T.warn}
        style={{
          ...base,
          color: "#1f2937",
          background: "#f3f4f6",
          borderColor: "rgba(0,0,0,.18)",
        }}
      >
        →
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      title={T.bad}
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
  lang,
}: {
  text: React.ReactNode;
  mark: Mark;
  lang: UiLang;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minWidth: 0,
      }}
    >
      <span style={{ minWidth: 0 }}>
        {text}
      </span>

      <MarkIcon
        mark={mark}
        lang={lang}
      />
    </span>
  );
}

/* ============================================================
   VALIDATIONS
============================================================ */

function isFilled(v: string) {
  return !!(v || "").trim();
}

function isValidDateJJMMAAAA(v: string) {
  const value = (v || "").trim();

  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return false;
  }

  const [ddText, mmText, yyyyText] =
    value.split("/");

  const dd = Number(ddText);
  const mm = Number(mmText);
  const yyyy = Number(yyyyText);

  if (
    !Number.isFinite(dd) ||
    !Number.isFinite(mm) ||
    !Number.isFinite(yyyy)
  ) {
    return false;
  }

  if (yyyy < 1900 || yyyy > 2100) {
    return false;
  }

  if (mm < 1 || mm > 12) {
    return false;
  }

  const daysInMonth =
    new Date(yyyy, mm, 0).getDate();

  return dd >= 1 && dd <= daysInMonth;
}

/*
  NAS facultatif :
  - vide = accepté
  - rempli = doit être un NAS valide
*/
function isValidSINIfAny(v: string) {
  const sin = normalizeNAS(v);

  if (!sin) {
    return true;
  }

  if (sin.length !== 9) {
    return false;
  }

  let sum = 0;

  for (let i = 0; i < sin.length; i++) {
    let digit = Number(sin[i]);

    if (i % 2 === 1) {
      digit *= 2;

      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
  }

  return sum % 10 === 0;
}

function isValidIncome(v: string) {
  const value = (v || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(",", ".");

  if (!value) {
    return false;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    return false;
  }

  return Number(value) >= 0;
}

function incomeFormatter(v: string) {
  let value = (v || "")
    .replace(/[^\d.,]/g, "")
    .replace(",", ".");

  const firstDot = value.indexOf(".");

  if (firstDot >= 0) {
    value =
      value.slice(0, firstDot + 1) +
      value
        .slice(firstDot + 1)
        .replace(/\./g, "")
        .slice(0, 2);
  }

  return value;
}

/* ============================================================
   COMPOSANT
============================================================ */

export default function DependantsSection(props: {
  L: CopyPack;

  show: boolean;

  enfants: Child[];

  aucunePersonneACharge: boolean;

  ajouterEnfant: () => void;

  updateEnfant: (
    i: number,
    field: keyof Child,
    value: string | boolean
  ) => void;

  removeEnfant: (i: number) => void;
}) {
  const {
    L,
    show,
    enfants,
    aucunePersonneACharge,
    ajouterEnfant,
    updateEnfant,
    removeEnfant,
  } = props;

  const lang = getUiLang(L);
  const T = LOCAL_TEXT[lang];

  /* ==========================================================
     VALIDATION DU BLOC
  ========================================================== */

  const blockMark: Mark = useMemo(() => {
    if (aucunePersonneACharge) {
      return "ok";
    }

    if (enfants.length === 0) {
      return "warn";
    }

    const allOk = enfants.every((e) => {
      const okPrenom =
        isFilled(e.prenom);

      const okNom =
        isFilled(e.nom);

      const okDob =
        isValidDateJJMMAAAA(e.dob);

      const okSexe =
        isFilled(e.sexe);

      const okNas =
        isValidSINIfAny(e.nas);

      /*
        Pour les anciens dossiers où aTravaille
        n'existe pas encore, on considère que
        la question n'a pas été répondue.
      */
      const travailRepondu =
        typeof e.aTravaille === "boolean";

      const revenuOk =
        e.aTravaille === true
          ? isValidIncome(
              e.revenuTravailEstime || ""
            )
          : e.aTravaille === false;

      return (
        okPrenom &&
        okNom &&
        okDob &&
        okSexe &&
        okNas &&
        travailRepondu &&
        revenuOk
      );
    });

    return allOk ? "ok" : "bad";
  }, [
    enfants,
    aucunePersonneACharge,
  ]);

  /*
    Les hooks sont appelés avant ce return,
    pour respecter les règles React.
  */
  if (!show) {
    return null;
  }

  /* ==========================================================
     AFFICHAGE
  ========================================================== */

  return (
    <section className="ff-card">
      {/* EN-TÊTE */}

      <div className="ff-card-head">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <h2 style={{ margin: 0 }}>
            {L.sections.dependantsTitle}
          </h2>

          <MarkIcon
            mark={blockMark}
            lang={lang}
          />
        </div>

        <p style={{ marginTop: 8 }}>
          {L.sections.dependantsDesc}
        </p>
      </div>

      {/* AUCUNE PERSONNE À CHARGE */}

      {aucunePersonneACharge ? (
        <div
          className="ff-empty"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            color: "#14532d",
          }}
        >
          <span>
            {T.noDependants}
          </span>

          <MarkIcon
            mark="ok"
            lang={lang}
          />
        </div>
      ) : enfants.length === 0 ? (
        /* AUCUN ENFANT ENCORE AJOUTÉ */

        <div
          className="ff-empty"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>
            {L.dependants.none}
          </span>

          <MarkIcon
            mark="warn"
            lang={lang}
          />
        </div>
      ) : (
        /* PERSONNES À CHARGE */

        <div className="ff-stack">
          {enfants.map((enf, i) => {
            const okPrenom =
              isFilled(enf.prenom);

            const okNom =
              isFilled(enf.nom);

            const okDob =
              isValidDateJJMMAAAA(
                enf.dob
              );

            const okSexe =
              isFilled(enf.sexe);

            const okNas =
              isValidSINIfAny(enf.nas);

            const travailRepondu =
              typeof enf.aTravaille ===
              "boolean";

            const revenuOk =
              enf.aTravaille === true
                ? isValidIncome(
                    enf.revenuTravailEstime ||
                      ""
                  )
                : enf.aTravaille === false;

            const childOk =
              okPrenom &&
              okNom &&
              okDob &&
              okSexe &&
              okNas &&
              travailRepondu &&
              revenuOk;

            const childMark: Mark =
              childOk ? "ok" : "bad";

            const travailValue: YesNo =
              enf.aTravaille === true
                ? "oui"
                : enf.aTravaille === false
                ? "non"
                : "";

            return (
              <div
                key={`enf-${i}`}
                className="ff-childbox"
              >
                {/* EN-TÊTE PERSONNE À CHARGE */}

                <div
                  className="ff-childhead"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "space-between",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div className="ff-childtitle">
                      {L.dependants.titleN(
                        i + 1
                      )}
                    </div>

                    <MarkIcon
                      mark={childMark}
                      lang={lang}
                    />
                  </div>

                  <button
                    type="button"
                    className="ff-btn ff-btn-link"
                    onClick={() =>
                      removeEnfant(i)
                    }
                    aria-label={
                      L.dependants.remove
                    }
                    title={
                      L.dependants.remove
                    }
                  >
                    ✕
                  </button>
                </div>

                {/* IDENTITÉ */}

                <div className="ff-grid2">
                  <Field
                    label={
                      <LabelWithMark
                        text={
                          L.fields.firstName
                        }
                        mark={
                          okPrenom
                            ? "ok"
                            : "bad"
                        }
                        lang={lang}
                      />
                    }
                    value={enf.prenom}
                    onChange={(value) =>
                      updateEnfant(
                        i,
                        "prenom",
                        value
                      )
                    }
                    required
                    status={
                      okPrenom
                        ? "valid"
                        : "invalid"
                    }
                    autoComplete="off"
                  />

                  <Field
                    label={
                      <LabelWithMark
                        text={
                          L.fields.lastName
                        }
                        mark={
                          okNom
                            ? "ok"
                            : "bad"
                        }
                        lang={lang}
                      />
                    }
                    value={enf.nom}
                    onChange={(value) =>
                      updateEnfant(
                        i,
                        "nom",
                        value
                      )
                    }
                    required
                    status={
                      okNom
                        ? "valid"
                        : "invalid"
                    }
                    autoComplete="off"
                  />

                  {/* DATE DE NAISSANCE */}

                  <Field
                    label={
                      <LabelWithMark
                        text={L.fields.dob}
                        mark={
                          okDob
                            ? "ok"
                            : "bad"
                        }
                        lang={lang}
                      />
                    }
                    value={enf.dob}
                    onChange={(value) =>
                      updateEnfant(
                        i,
                        "dob",
                        formatDateInput(
                          value
                        )
                      )
                    }
                    placeholder={
                      L.fields.dobPh
                    }
                    inputMode="numeric"
                    maxLength={10}
                    required
                    status={
                      okDob
                        ? "valid"
                        : "invalid"
                    }
                    autoComplete="off"
                  />

                  {/* NAS FACULTATIF */}

                  <Field
                    label={
                      <LabelWithMark
                        text={
                          L.dependants
                            .sinIfAny
                        }
                        mark={
                          okNas
                            ? "ok"
                            : "bad"
                        }
                        lang={lang}
                      />
                    }
                    value={enf.nas}
                    onChange={(value) =>
                      updateEnfant(
                        i,
                        "nas",
                        formatNASInput(
                          value
                        )
                      )
                    }
                    placeholder={
                      L.fields.sinPh
                    }
                    inputMode="numeric"
                    maxLength={11}
                    status={
                      enf.nas
                        ? okNas
                          ? "valid"
                          : "invalid"
                        : null
                    }
                    hint={T.sinHint}
                    autoComplete="off"
                  />
                </div>

                {/* SEXE */}

                <div className="ff-mt-sm">
                  <SelectField<Sexe>
                    label={
                      <LabelWithMark
                        text={
                          L.dependants.sex
                        }
                        mark={
                          okSexe
                            ? "ok"
                            : "bad"
                        }
                        lang={lang}
                      />
                    }
                    value={enf.sexe}
                    onChange={(value) =>
                      updateEnfant(
                        i,
                        "sexe",
                        value
                      )
                    }
                    options={[
                      {
                        value: "M",
                        label:
                          L.dependants.sexM,
                      },
                      {
                        value: "F",
                        label:
                          L.dependants.sexF,
                      },
                      {
                        value: "X",
                        label:
                          L.dependants.sexX,
                      },
                    ]}
                    required
                    placeholderText={
                      T.choose
                    }
                    status={
                      okSexe
                        ? "valid"
                        : "invalid"
                    }
                  />
                </div>

                {/* ==================================================
                    TRAVAIL / REVENU
                ================================================== */}

                <div
                  className="ff-mt"
                  style={{
                    paddingTop: 14,
                    borderTop:
                      "1px solid rgba(0,0,0,.08)",
                  }}
                >
                  <YesNoField
                    label={
                      <LabelWithMark
                        text={T.worked}
                        mark={
                          travailRepondu
                            ? "ok"
                            : "bad"
                        }
                        lang={lang}
                      />
                    }
                    value={travailValue}
                    onChange={(value) => {
                      if (value === "oui") {
                        updateEnfant(
                          i,
                          "aTravaille",
                          true
                        );
                      }

                      if (value === "non") {
                        updateEnfant(
                          i,
                          "aTravaille",
                          false
                        );

                        /*
                          Si Non, on vide l'ancien
                          revenu éventuellement entré.
                        */
                        updateEnfant(
                          i,
                          "revenuTravailEstime",
                          ""
                        );
                      }
                    }}
                    required
                    labels={{
                      yes: T.yes,
                      no: T.no,
                    }}
                    status={
                      travailRepondu
                        ? "valid"
                        : "invalid"
                    }
                  />

                  {/* REVENU SI OUI */}

                  {enf.aTravaille === true ? (
                    <div className="ff-mt-sm">
                      <Field
                        label={
                          <LabelWithMark
                            text={
                              T.estimatedIncome
                            }
                            mark={
                              revenuOk
                                ? "ok"
                                : "bad"
                            }
                            lang={lang}
                          />
                        }
                        value={
                          enf.revenuTravailEstime ||
                          ""
                        }
                        onChange={(value) =>
                          updateEnfant(
                            i,
                            "revenuTravailEstime",
                            incomeFormatter(
                              value
                            )
                          )
                        }
                        placeholder={
                          T.estimatedIncomePlaceholder
                        }
                        inputMode="decimal"
                        required
                        status={
                          revenuOk
                            ? "valid"
                            : "invalid"
                        }
                        hint={
                          T.estimatedIncomeHint
                        }
                        autoComplete="off"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AJOUTER UNE PERSONNE À CHARGE */}

      <div className="ff-mt">
        <button
          type="button"
          className="ff-btn ff-btn-primary"
          onClick={ajouterEnfant}
        >
          {L.dependants.add}
        </button>
      </div>
    </section>
  );
}
