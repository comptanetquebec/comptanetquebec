// app/formulaire-fiscal-ta/sections/MedsSection.tsx
"use client";

import React, { useMemo } from "react";
import { Field, SelectField } from "../ui";
import type { AssuranceMeds, Periode } from "../types";
import type { CopyPack } from "../copy";
import { formatDateInput } from "../formatters";
import { updatePeriode } from "../helpers";

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

function LabelWithMark({
  label,
  status,
}: {
  label: string;
  status: FieldStatus;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <span>{label}</span>
      <Mark status={status} />
    </span>
  );
}

// ===== validations locales =====
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

function statusRequiredSelect(v: string, showErrors: boolean): FieldStatus {
  if (!v) return showErrors ? "no" : "idle";
  return "ok";
}

function statusDateField(v: string, showErrors: boolean): FieldStatus {
  if (!v.trim()) return showErrors ? "no" : "idle";
  return isValidDateJJMMAAAA(v) ? "ok" : "no";
}

export default function MedsSection(props: {
  L: CopyPack;
  show: boolean;
  showErrors: boolean;
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
    showErrors,
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

  // ✅ Titre/desc "safe"
  const title = useMemo(() => {
    // @ts-expect-error: clé optionnelle si ajoutée plus tard
    return (L.meds?.title as string | undefined) ?? "Médicaments";
  }, [L]);

  const desc = useMemo(() => {
    // @ts-expect-error: clé optionnelle si ajoutée plus tard
    return (L.meds?.desc as string | undefined) ?? "Informations sur votre couverture de médicaments (si applicable).";
  }, [L]);

  const coverageOptions = useMemo(
    () => [
      { value: "ramq" as const, label: L.meds.opts.ramq },
      { value: "prive" as const, label: L.meds.opts.prive },
      { value: "conjoint" as const, label: L.meds.opts.conjoint },
    ],
    [L]
  );

  const status = useMemo(() => {
    const clientCoverage = statusRequiredSelect(assuranceMedsClient as any, showErrors);

    // au moins 1 période complète valide (de + à)
    const clientHasAnyTyped = assuranceMedsClientPeriodes.some((p) => !!p.debut.trim() || !!p.fin.trim());
    const clientHasCompleteValid = assuranceMedsClientPeriodes.some(
      (p) => isValidDateJJMMAAAA(p.debut) && isValidDateJJMMAAAA(p.fin)
    );
    const clientPeriodsBlock: FieldStatus = (() => {
      if (!clientHasAnyTyped) return showErrors ? "no" : "idle";
      return clientHasCompleteValid ? "ok" : "no";
    })();

    const spouseCoverage = !aUnConjoint
      ? "idle"
      : statusRequiredSelect(assuranceMedsConjoint as any, showErrors);

    const spouseHasAnyTyped = assuranceMedsConjointPeriodes.some((p) => !!p.debut.trim() || !!p.fin.trim());
    const spouseHasCompleteValid = assuranceMedsConjointPeriodes.some(
      (p) => isValidDateJJMMAAAA(p.debut) && isValidDateJJMMAAAA(p.fin)
    );
    const spousePeriodsBlock: FieldStatus = !aUnConjoint
      ? "idle"
      : (() => {
          if (!spouseHasAnyTyped) return showErrors ? "no" : "idle";
          return spouseHasCompleteValid ? "ok" : "no";
        })();

    return {
      clientCoverage,
      clientPeriodsBlock,
      spouseCoverage,
      spousePeriodsBlock,
    };
  }, [
    showErrors,
    aUnConjoint,
    assuranceMedsClient,
    assuranceMedsClientPeriodes,
    assuranceMedsConjoint,
    assuranceMedsConjointPeriodes,
  ]);

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>

      <div className="ff-subtitle">{L.meds.clientCoverage}</div>

      <SelectField<AssuranceMeds>
        label={
          (<LabelWithMark label={L.meds.yourCoverage} status={status.clientCoverage} />) as any
        }
        value={assuranceMedsClient}
        onChange={(v) => {
          if (v === "") return;
          setAssuranceMedsClient(v as AssuranceMeds);
        }}
        required
        options={coverageOptions}
        placeholderText="—"
      />

      <div className="ff-mt-sm ff-stack">
        {/* label global pour les périodes */}
        <div style={{ fontSize: 13, fontWeight: 700 }}>
          <LabelWithMark label={L.meds.periodsLabel ?? "Périodes"} status={status.clientPeriodsBlock} />
        </div>

        {assuranceMedsClientPeriodes.map((p, idx) => {
          const fromStatus = statusDateField(p.debut, showErrors);
          const toStatus = statusDateField(p.fin, showErrors);

          return (
            <div key={`cli-${idx}`} className="ff-rowbox">
              <Field
                label={(<LabelWithMark label={L.meds.from} status={fromStatus} />) as any}
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
                label={(<LabelWithMark label={L.meds.to} status={toStatus} />) as any}
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

      {aUnConjoint && (
        <>
          <div className="ff-subtitle ff-mt">{L.meds.spouseCoverage}</div>

          <SelectField<AssuranceMeds>
            label={
              (<LabelWithMark label={L.meds.spouseCoverageLabel} status={status.spouseCoverage} />) as any
            }
            value={assuranceMedsConjoint}
            onChange={(v) => {
              if (v === "") return;
              setAssuranceMedsConjoint(v as AssuranceMeds);
            }}
            required
            options={coverageOptions}
            placeholderText="—"
          />

          <div className="ff-mt-sm ff-stack">
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              <LabelWithMark label={L.meds.periodsLabel ?? "Périodes"} status={status.spousePeriodsBlock} />
            </div>

            {assuranceMedsConjointPeriodes.map((p, idx) => {
              const fromStatus = statusDateField(p.debut, showErrors);
              const toStatus = statusDateField(p.fin, showErrors);

              return (
                <div key={`cj-${idx}`} className="ff-rowbox">
                  <Field
                    label={(<LabelWithMark label={L.meds.from} status={fromStatus} />) as any}
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
                    label={(<LabelWithMark label={L.meds.to} status={toStatus} />) as any}
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
