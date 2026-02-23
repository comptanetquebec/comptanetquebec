// app/formulaire-fiscal/sections/MedsSection.tsx
"use client";

import React, { useMemo } from "react";
import { Field, SelectField } from "../ui";
import type { AssuranceMeds, Periode } from "../types";
import type { CopyPack } from "../copy";
import { formatDateInput } from "../formatters";
import { updatePeriode } from "../helpers";

/* ---------- mini validation locale ---------- */
function isValidDateJJMMAAAA(v: string) {
  const s = (v || "").trim();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return false;
  const [ddStr, mmStr, yyyyStr] = s.split("/");
  const dd = Number(ddStr);
  const mm = Number(mmStr);
  const yyyy = Number(yyyyStr);
  if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy)) return false;
  if (yyyy < 1900 || yyyy > 2100) return false;
  if (mm < 1 || mm > 12) return false;
  const daysInMonth = new Date(yyyy, mm, 0).getDate();
  return dd >= 1 && dd <= daysInMonth;
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

function markCoverage(v: AssuranceMeds): Mark {
  return v ? "ok" : "bad";
}
function markDate(v: string): Mark {
  const t = (v || "").trim();
  if (!t) return "todo";
  return isValidDateJJMMAAAA(t) ? "ok" : "bad";
}

export default function MedsSection(props: {
  L: CopyPack;
  show: boolean;
  aUnConjoint: boolean;

  assuranceMedsClient: AssuranceMeds;
  setAssuranceMedsClient: (v: AssuranceMeds) => void;
  assuranceMedsClientPeriodes: Periode[];
  setAssuranceMedsClientPeriodes: (v: Periode[] | ((p: Periode[]) => Periode[])) => void;

  assuranceMedsConjoint: AssuranceMeds;
  setAssuranceMedsConjoint: (v: AssuranceMeds) => void;
  assuranceMedsConjointPeriodes: Periode[];
  setAssuranceMedsConjointPeriodes: (v: Periode[] | ((p: Periode[]) => Periode[])) => void;
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

  if (!show) return null;

  const marks = useMemo(() => {
    const mClientCoverage = markCoverage(assuranceMedsClient);

    const mClientRows = assuranceMedsClientPeriodes.map((p) => {
      const debut = markDate(p.debut);
      const fin = markDate(p.fin);
      const rowOk = debut === "ok" && fin === "ok";
      const row: Mark = rowOk ? "ok" : (debut === "todo" && fin === "todo" ? "todo" : "bad");
      return { debut, fin, row };
    });

    const mSpouseCoverage = markCoverage(assuranceMedsConjoint);

    const mSpouseRows = assuranceMedsConjointPeriodes.map((p) => {
      const debut = markDate(p.debut);
      const fin = markDate(p.fin);
      const rowOk = debut === "ok" && fin === "ok";
      const row: Mark = rowOk ? "ok" : (debut === "todo" && fin === "todo" ? "todo" : "bad");
      return { debut, fin, row };
    });

    const clientOk =
      mClientCoverage === "ok" &&
      mClientRows.length > 0 &&
      mClientRows.every((r) => r.debut === "ok" && r.fin === "ok");

    const spouseOk =
      !aUnConjoint ||
      (mSpouseCoverage === "ok" &&
        mSpouseRows.length > 0 &&
        mSpouseRows.every((r) => r.debut === "ok" && r.fin === "ok"));

    const block: Mark = clientOk && spouseOk ? "ok" : "bad";

    return { mClientCoverage, mClientRows, mSpouseCoverage, mSpouseRows, block };
  }, [
    assuranceMedsClient,
    assuranceMedsClientPeriodes,
    assuranceMedsConjoint,
    assuranceMedsConjointPeriodes,
    aUnConjoint,
  ]);

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <h2 style={{ margin: 0 }}>{L.sections.medsTitle}</h2>
          <MarkIcon mark={marks.block} />
        </div>
        <p style={{ marginTop: 8 }}>{L.sections.medsDesc}</p>
      </div>

      {/* ================= CLIENT ================= */}
      <div className="ff-subtitle">{L.meds.clientCoverage}</div>

      <SelectField<AssuranceMeds>
        label={<LabelWithMark text={L.meds.yourCoverage} mark={marks.mClientCoverage} />}
        value={assuranceMedsClient}
        onChange={setAssuranceMedsClient}
        required
        options={[
          { value: "ramq", label: L.meds.opts.ramq },
          { value: "prive", label: L.meds.opts.prive },
          { value: "conjoint", label: L.meds.opts.conjoint },
        ]}
      />

      <div className="ff-mt-sm ff-stack">
        {assuranceMedsClientPeriodes.map((p, idx) => {
          const st = marks.mClientRows[idx] || { debut: "bad" as Mark, fin: "bad" as Mark, row: "bad" as Mark };

          return (
            <div key={`cli-${idx}`} className="ff-rowbox" style={{ alignItems: "start" }}>
              <Field
                label={<LabelWithMark text={L.meds.from} mark={st.debut} />}
                value={p.debut}
                onChange={(val) =>
                  setAssuranceMedsClientPeriodes((prev) =>
                    updatePeriode(prev, idx, { debut: formatDateInput(val) })
                  )
                }
                placeholder={L.meds.fromPh}
                inputMode="numeric"
                maxLength={10}
                required
              />

              <Field
                label={<LabelWithMark text={L.meds.to} mark={st.fin} />}
                value={p.fin}
                onChange={(val) =>
                  setAssuranceMedsClientPeriodes((prev) =>
                    updatePeriode(prev, idx, { fin: formatDateInput(val) })
                  )
                }
                placeholder={L.meds.toPh}
                inputMode="numeric"
                maxLength={10}
                required
              />

              {/* indicateur ligne (optionnel) */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <MarkIcon mark={st.row} />
              </div>
            </div>
          );
        })}

        <button
          type="button"
          className="ff-btn ff-btn-soft"
          onClick={() => setAssuranceMedsClientPeriodes((prev) => [...prev, { debut: "", fin: "" }])}
        >
          {L.meds.addPeriod}
        </button>
      </div>

      {/* ================= CONJOINT ================= */}
      {aUnConjoint && (
        <>
          <div className="ff-subtitle ff-mt">{L.meds.spouseCoverage}</div>

          <SelectField<AssuranceMeds>
            label={<LabelWithMark text={L.meds.spouseCoverageLabel} mark={marks.mSpouseCoverage} />}
            value={assuranceMedsConjoint}
            onChange={setAssuranceMedsConjoint}
            required
            options={[
              { value: "ramq", label: L.meds.opts.ramq },
              { value: "prive", label: L.meds.opts.prive },
              { value: "conjoint", label: L.meds.opts.conjoint },
            ]}
          />

          <div className="ff-mt-sm ff-stack">
            {assuranceMedsConjointPeriodes.map((p, idx) => {
              const st = marks.mSpouseRows[idx] || { debut: "bad" as Mark, fin: "bad" as Mark, row: "bad" as Mark };

              return (
                <div key={`cj-${idx}`} className="ff-rowbox" style={{ alignItems: "start" }}>
                  <Field
                    label={<LabelWithMark text={L.meds.from} mark={st.debut} />}
                    value={p.debut}
                    onChange={(val) =>
                      setAssuranceMedsConjointPeriodes((prev) =>
                        updatePeriode(prev, idx, { debut: formatDateInput(val) })
                      )
                    }
                    placeholder={L.meds.fromPh}
                    inputMode="numeric"
                    maxLength={10}
                    required
                  />

                  <Field
                    label={<LabelWithMark text={L.meds.to} mark={st.fin} />}
                    value={p.fin}
                    onChange={(val) =>
                      setAssuranceMedsConjointPeriodes((prev) =>
                        updatePeriode(prev, idx, { fin: formatDateInput(val) })
                      )
                    }
                    placeholder={L.meds.toPh}
                    inputMode="numeric"
                    maxLength={10}
                    required
                  />

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <MarkIcon mark={st.row} />
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              className="ff-btn ff-btn-soft"
              onClick={() => setAssuranceMedsConjointPeriodes((prev) => [...prev, { debut: "", fin: "" }])}
            >
              {L.meds.addPeriod}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
