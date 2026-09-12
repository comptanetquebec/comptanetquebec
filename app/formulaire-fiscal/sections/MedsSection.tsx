// app/formulaire-fiscal/sections/MedsSection.tsx
"use client";

import React, { useMemo } from "react";
import { Field, SelectField } from "../ui";
import type { AssuranceMeds, Periode } from "../types";
import type { CopyPack } from "../copy";
import { formatDateInput } from "../formatters";
import { updatePeriode } from "../helpers";

/* ============================================================
   TYPES
============================================================ */

type Mark = "ok" | "bad" | "todo";
type UiLang = "fr" | "en" | "es";

type PeriodMark = {
  debut: Mark;
  fin: Mark;
  row: Mark;
  orderValid: boolean;
};

/* ============================================================
   LANGUE / TEXTES
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
    todo: "À compléter",
    choose: "Choisir…",
    remove: "Supprimer",
    invalidPeriod:
      "La date de fin doit être égale ou postérieure à la date de début.",
    periodHint:
      "Indiquez la période pendant laquelle cette couverture était en vigueur.",
  },

  en: {
    ok: "Valid",
    bad: "Needs correction",
    todo: "To complete",
    choose: "Select…",
    remove: "Remove",
    invalidPeriod:
      "The end date must be the same as or later than the start date.",
    periodHint:
      "Enter the period during which this coverage was in effect.",
  },

  es: {
    ok: "Válido",
    bad: "Debe corregirse",
    todo: "Por completar",
    choose: "Seleccionar…",
    remove: "Eliminar",
    invalidPeriod:
      "La fecha de finalización debe ser igual o posterior a la fecha de inicio.",
    periodHint:
      "Indique el período durante el cual esta cobertura estuvo vigente.",
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

  const cls =
    mark === "ok"
      ? "mark-icon mark-icon--ok"
      : mark === "bad"
      ? "mark-icon mark-icon--bad"
      : "mark-icon mark-icon--todo";

  const title =
    mark === "ok"
      ? T.ok
      : mark === "bad"
      ? T.bad
      : T.todo;

  const symbol =
    mark === "ok" ? "✓" : mark === "bad" ? "✕" : "→";

  return (
    <span
      className={cls}
      aria-hidden="true"
      title={title}
    >
      {symbol}
    </span>
  );
}

function LabelWithMark({
  text,
  mark,
  lang,
  required = false,
}: {
  text: React.ReactNode;
  mark: Mark;
  lang: UiLang;
  required?: boolean;
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
      <span style={{ minWidth: 0 }}>{text}</span>

      {required && mark !== "ok" ? (
        <span
          aria-hidden="true"
          style={{
            color: "#dc2626",
            fontWeight: 800,
          }}
        >
          *
        </span>
      ) : null}

      <MarkIcon mark={mark} lang={lang} />
    </span>
  );
}

/* ============================================================
   VALIDATION DES DATES
============================================================ */

function isValidDateJJMMAAAA(v: string) {
  const value = (v || "").trim();

  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return false;
  }

  const [ddText, mmText, yyyyText] = value.split("/");

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

  const daysInMonth = new Date(yyyy, mm, 0).getDate();

  return dd >= 1 && dd <= daysInMonth;
}

function dateToNumber(v: string) {
  if (!isValidDateJJMMAAAA(v)) {
    return null;
  }

  const [dd, mm, yyyy] = v
    .split("/")
    .map(Number);

  return yyyy * 10000 + mm * 100 + dd;
}

function isValidPeriod(debut: string, fin: string) {
  const start = dateToNumber(debut);
  const end = dateToNumber(fin);

  if (start === null || end === null) {
    return false;
  }

  return end >= start;
}

function markCoverage(v: AssuranceMeds): Mark {
  return v ? "ok" : "bad";
}

function markDate(v: string): Mark {
  const value = (v || "").trim();

  if (!value) {
    return "todo";
  }

  return isValidDateJJMMAAAA(value)
    ? "ok"
    : "bad";
}

function getPeriodMark(p: Periode): PeriodMark {
  const debut = markDate(p.debut);
  const fin = markDate(p.fin);

  if (debut === "todo" && fin === "todo") {
    return {
      debut,
      fin,
      row: "todo",
      orderValid: true,
    };
  }

  if (debut !== "ok" || fin !== "ok") {
    return {
      debut,
      fin,
      row: "bad",
      orderValid: true,
    };
  }

  const orderValid = isValidPeriod(
    p.debut,
    p.fin
  );

  return {
    debut: orderValid ? "ok" : "bad",
    fin: orderValid ? "ok" : "bad",
    row: orderValid ? "ok" : "bad",
    orderValid,
  };
}

/* ============================================================
   COMPOSANT
============================================================ */

export default function MedsSection(props: {
  L: CopyPack;

  show: boolean;
  aUnConjoint: boolean;

  assuranceMedsClient: AssuranceMeds;
  setAssuranceMedsClient: (v: AssuranceMeds) => void;

  assuranceMedsClientPeriodes: Periode[];
  setAssuranceMedsClientPeriodes: (
    v: Periode[] | ((p: Periode[]) => Periode[])
  ) => void;

  assuranceMedsConjoint: AssuranceMeds;
  setAssuranceMedsConjoint: (v: AssuranceMeds) => void;

  assuranceMedsConjointPeriodes: Periode[];
  setAssuranceMedsConjointPeriodes: (
    v: Periode[] | ((p: Periode[]) => Periode[])
  ) => void;
}) {
  const {
    L,

    show,
    aUnConjoint,

    assuranceMedsClient,
    setAssuranceMedsClient,

    assuranceMedsClientPeriodes,
    setAssuranceMedsClientPeriodes,

    assuranceMedsConjoint,
    setAssuranceMedsConjoint,

    assuranceMedsConjointPeriodes,
    setAssuranceMedsConjointPeriodes,
  } = props;

  const lang = getUiLang(L);
  const T = LOCAL_TEXT[lang];

  /* ==========================================================
     VALIDATION
  ========================================================== */

  const marks = useMemo(() => {
    const mClientCoverage =
      markCoverage(assuranceMedsClient);

    const mClientRows =
      assuranceMedsClientPeriodes.map(
        getPeriodMark
      );

    const mSpouseCoverage =
      markCoverage(assuranceMedsConjoint);

    const mSpouseRows =
      assuranceMedsConjointPeriodes.map(
        getPeriodMark
      );

    const clientOk =
      mClientCoverage === "ok" &&
      mClientRows.length > 0 &&
      mClientRows.every(
        (row) => row.row === "ok"
      );

    const spouseOk =
      !aUnConjoint ||
      (
        mSpouseCoverage === "ok" &&
        mSpouseRows.length > 0 &&
        mSpouseRows.every(
          (row) => row.row === "ok"
        )
      );

    const block: Mark =
      clientOk && spouseOk
        ? "ok"
        : "bad";

    return {
      mClientCoverage,
      mClientRows,

      mSpouseCoverage,
      mSpouseRows,

      block,
    };
  }, [
    assuranceMedsClient,
    assuranceMedsClientPeriodes,

    assuranceMedsConjoint,
    assuranceMedsConjointPeriodes,

    aUnConjoint,
  ]);

  /* ==========================================================
     IMPORTANT :
     Les hooks doivent être appelés avant ce return.
  ========================================================== */

  if (!show) {
    return null;
  }

  /* ==========================================================
     SUPPRESSION D'UNE PÉRIODE
  ========================================================== */

  function removeClientPeriod(index: number) {
    setAssuranceMedsClientPeriodes(
      (prev) =>
        prev.filter(
          (_, idx) => idx !== index
        )
    );
  }

  function removeSpousePeriod(index: number) {
    setAssuranceMedsConjointPeriodes(
      (prev) =>
        prev.filter(
          (_, idx) => idx !== index
        )
    );
  }

  /* ==========================================================
     AFFICHAGE
  ========================================================== */

  return (
    <section className="ff-card">
      {/* ======================================================
          EN-TÊTE
      ====================================================== */}

      <div className="ff-card-head">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <h2 style={{ margin: 0 }}>
            {L.sections.medsTitle}
          </h2>

          <MarkIcon
            mark={marks.block}
            lang={lang}
          />
        </div>

        <p style={{ marginTop: 8 }}>
          {L.sections.medsDesc}
        </p>
      </div>

      {/* ======================================================
          CLIENT
      ====================================================== */}

      <div className="ff-subtitle">
        {L.meds.clientCoverage}
      </div>

      <SelectField<AssuranceMeds>
        label={
          <LabelWithMark
            text={L.meds.yourCoverage}
            mark={marks.mClientCoverage}
            lang={lang}
            required
          />
        }
        value={assuranceMedsClient}
        onChange={setAssuranceMedsClient}
        required
        placeholderText={T.choose}
        status={
          marks.mClientCoverage === "ok"
            ? "valid"
            : "invalid"
        }
        options={[
          {
            value: "ramq",
            label: L.meds.opts.ramq,
          },
          {
            value: "prive",
            label: L.meds.opts.prive,
          },
          {
            value: "conjoint",
            label: L.meds.opts.conjoint,
          },
        ]}
      />

      <p
        style={{
          marginTop: 8,
          marginBottom: 0,
          fontSize: 13,
          opacity: 0.75,
        }}
      >
        {T.periodHint}
      </p>

      <div className="ff-mt-sm ff-stack">
        {assuranceMedsClientPeriodes.map(
          (p, idx) => {
            const st =
              marks.mClientRows[idx] || {
                debut: "bad" as Mark,
                fin: "bad" as Mark,
                row: "bad" as Mark,
                orderValid: true,
              };

            return (
              <div
                key={`client-${idx}`}
                className="ff-rowbox"
                style={{
                  alignItems: "start",
                }}
              >
                <Field
                  label={
                    <LabelWithMark
                      text={L.meds.from}
                      mark={st.debut}
                      lang={lang}
                      required
                    />
                  }
                  value={p.debut}
                  onChange={(value) =>
                    setAssuranceMedsClientPeriodes(
                      (prev) =>
                        updatePeriode(
                          prev,
                          idx,
                          {
                            debut:
                              formatDateInput(
                                value
                              ),
                          }
                        )
                    )
                  }
                  placeholder={L.meds.fromPh}
                  inputMode="numeric"
                  maxLength={10}
                  required
                  status={
                    st.debut === "ok"
                      ? "valid"
                      : st.debut === "bad"
                      ? "invalid"
                      : null
                  }
                />

                <Field
                  label={
                    <LabelWithMark
                      text={L.meds.to}
                      mark={st.fin}
                      lang={lang}
                      required
                    />
                  }
                  value={p.fin}
                  onChange={(value) =>
                    setAssuranceMedsClientPeriodes(
                      (prev) =>
                        updatePeriode(
                          prev,
                          idx,
                          {
                            fin:
                              formatDateInput(
                                value
                              ),
                          }
                        )
                    )
                  }
                  placeholder={L.meds.toPh}
                  inputMode="numeric"
                  maxLength={10}
                  required
                  status={
                    st.fin === "ok"
                      ? "valid"
                      : st.fin === "bad"
                      ? "invalid"
                      : null
                  }
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 10,
                    minHeight: 44,
                  }}
                >
                  <MarkIcon
                    mark={st.row}
                    lang={lang}
                  />

                  {assuranceMedsClientPeriodes.length >
                  1 ? (
                    <button
                      type="button"
                      className="ff-btn ff-btn-soft"
                      onClick={() =>
                        removeClientPeriod(idx)
                      }
                    >
                      {T.remove}
                    </button>
                  ) : null}
                </div>

                {!st.orderValid ? (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      fontSize: 13,
                      color: "#b91c1c",
                    }}
                  >
                    {T.invalidPeriod}
                  </div>
                ) : null}
              </div>
            );
          }
        )}

        <button
          type="button"
          className="ff-btn ff-btn-soft"
          onClick={() =>
            setAssuranceMedsClientPeriodes(
              (prev) => [
                ...prev,
                {
                  debut: "",
                  fin: "",
                },
              ]
            )
          }
        >
          {L.meds.addPeriod}
        </button>
      </div>

      {/* ======================================================
          CONJOINT
      ====================================================== */}

      {aUnConjoint ? (
        <>
          <div className="ff-subtitle ff-mt">
            {L.meds.spouseCoverage}
          </div>

          <SelectField<AssuranceMeds>
            label={
              <LabelWithMark
                text={
                  L.meds.spouseCoverageLabel
                }
                mark={
                  marks.mSpouseCoverage
                }
                lang={lang}
                required
              />
            }
            value={assuranceMedsConjoint}
            onChange={
              setAssuranceMedsConjoint
            }
            required
            placeholderText={T.choose}
            status={
              marks.mSpouseCoverage === "ok"
                ? "valid"
                : "invalid"
            }
            options={[
              {
                value: "ramq",
                label: L.meds.opts.ramq,
              },
              {
                value: "prive",
                label: L.meds.opts.prive,
              },
              {
                value: "conjoint",
                label:
                  L.meds.opts.conjoint,
              },
            ]}
          />

          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              fontSize: 13,
              opacity: 0.75,
            }}
          >
            {T.periodHint}
          </p>

          <div className="ff-mt-sm ff-stack">
            {assuranceMedsConjointPeriodes.map(
              (p, idx) => {
                const st =
                  marks.mSpouseRows[idx] || {
                    debut: "bad" as Mark,
                    fin: "bad" as Mark,
                    row: "bad" as Mark,
                    orderValid: true,
                  };

                return (
                  <div
                    key={`spouse-${idx}`}
                    className="ff-rowbox"
                    style={{
                      alignItems: "start",
                    }}
                  >
                    <Field
                      label={
                        <LabelWithMark
                          text={L.meds.from}
                          mark={st.debut}
                          lang={lang}
                          required
                        />
                      }
                      value={p.debut}
                      onChange={(value) =>
                        setAssuranceMedsConjointPeriodes(
                          (prev) =>
                            updatePeriode(
                              prev,
                              idx,
                              {
                                debut:
                                  formatDateInput(
                                    value
                                  ),
                              }
                            )
                        )
                      }
                      placeholder={
                        L.meds.fromPh
                      }
                      inputMode="numeric"
                      maxLength={10}
                      required
                      status={
                        st.debut === "ok"
                          ? "valid"
                          : st.debut === "bad"
                          ? "invalid"
                          : null
                      }
                    />

                    <Field
                      label={
                        <LabelWithMark
                          text={L.meds.to}
                          mark={st.fin}
                          lang={lang}
                          required
                        />
                      }
                      value={p.fin}
                      onChange={(value) =>
                        setAssuranceMedsConjointPeriodes(
                          (prev) =>
                            updatePeriode(
                              prev,
                              idx,
                              {
                                fin:
                                  formatDateInput(
                                    value
                                  ),
                              }
                            )
                        )
                      }
                      placeholder={L.meds.toPh}
                      inputMode="numeric"
                      maxLength={10}
                      required
                      status={
                        st.fin === "ok"
                          ? "valid"
                          : st.fin === "bad"
                          ? "invalid"
                          : null
                      }
                    />

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "flex-end",
                        gap: 10,
                        minHeight: 44,
                      }}
                    >
                      <MarkIcon
                        mark={st.row}
                        lang={lang}
                      />

                      {assuranceMedsConjointPeriodes.length >
                      1 ? (
                        <button
                          type="button"
                          className="ff-btn ff-btn-soft"
                          onClick={() =>
                            removeSpousePeriod(
                              idx
                            )
                          }
                        >
                          {T.remove}
                        </button>
                      ) : null}
                    </div>

                    {!st.orderValid ? (
                      <div
                        style={{
                          gridColumn: "1 / -1",
                          fontSize: 13,
                          color: "#b91c1c",
                        }}
                      >
                        {T.invalidPeriod}
                      </div>
                    ) : null}
                  </div>
                );
              }
            )}

            <button
              type="button"
              className="ff-btn ff-btn-soft"
              onClick={() =>
                setAssuranceMedsConjointPeriodes(
                  (prev) => [
                    ...prev,
                    {
                      debut: "",
                      fin: "",
                    },
                  ]
                )
              }
            >
              {L.meds.addPeriod}
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
