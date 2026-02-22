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

function FieldWithIcon(props: {
  children: React.ReactNode;
  ok: boolean;
  show: boolean;
}) {
  const { children, ok, show } = props;
  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>{children}</div>
      <StatusIcon ok={ok} show={show} />
    </div>
  );
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

  const clientCoverageOk = !!assuranceMedsClient;

  const clientPeriodsOk = useMemo(() => {
    return assuranceMedsClientPeriodes.map((p) => ({
      debutOk: isValidDateJJMMAAAA(p.debut),
      finOk: isValidDateJJMMAAAA(p.fin),
      rowOk: isValidDateJJMMAAAA(p.debut) && isValidDateJJMMAAAA(p.fin),
      showDebut: (p.debut || "").trim().length > 0,
      showFin: (p.fin || "").trim().length > 0,
    }));
  }, [assuranceMedsClientPeriodes]);

  const spouseCoverageOk = !!assuranceMedsConjoint;

  const spousePeriodsOk = useMemo(() => {
    return assuranceMedsConjointPeriodes.map((p) => ({
      debutOk: isValidDateJJMMAAAA(p.debut),
      finOk: isValidDateJJMMAAAA(p.fin),
      rowOk: isValidDateJJMMAAAA(p.debut) && isValidDateJJMMAAAA(p.fin),
      showDebut: (p.debut || "").trim().length > 0,
      showFin: (p.fin || "").trim().length > 0,
    }));
  }, [assuranceMedsConjointPeriodes]);

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        <h2>{L.sections.medsTitle}</h2>
        <p>{L.sections.medsDesc}</p>
      </div>

      <div className="ff-subtitle">{L.meds.clientCoverage}</div>

      <FieldWithIcon ok={clientCoverageOk} show={true}>
        <SelectField<AssuranceMeds>
          label={L.meds.yourCoverage}
          value={assuranceMedsClient}
          onChange={setAssuranceMedsClient}
          required
          options={[
            { value: "ramq", label: L.meds.opts.ramq },
            { value: "prive", label: L.meds.opts.prive },
            { value: "conjoint", label: L.meds.opts.conjoint },
          ]}
        />
      </FieldWithIcon>

      <div className="ff-mt-sm ff-stack">
        {assuranceMedsClientPeriodes.map((p, idx) => {
          const st = clientPeriodsOk[idx] || {
            debutOk: false,
            finOk: false,
            rowOk: false,
            showDebut: false,
            showFin: false,
          };

          return (
            <div key={`cli-${idx}`} className="ff-rowbox">
              <FieldWithIcon ok={st.debutOk} show={st.showDebut}>
                <Field
                  label={L.meds.from}
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
              </FieldWithIcon>

              <FieldWithIcon ok={st.finOk} show={st.showFin}>
                <Field
                  label={L.meds.to}
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
              </FieldWithIcon>

              {/* Optionnel: un indicateur global ligne (si tu veux) */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <StatusIcon ok={st.rowOk} show={st.showDebut || st.showFin} />
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

      {aUnConjoint && (
        <>
          <div className="ff-subtitle ff-mt">{L.meds.spouseCoverage}</div>

          <FieldWithIcon ok={spouseCoverageOk} show={true}>
            <SelectField<AssuranceMeds>
              label={L.meds.spouseCoverageLabel}
              value={assuranceMedsConjoint}
              onChange={setAssuranceMedsConjoint}
              required
              options={[
                { value: "ramq", label: L.meds.opts.ramq },
                { value: "prive", label: L.meds.opts.prive },
                { value: "conjoint", label: L.meds.opts.conjoint },
              ]}
            />
          </FieldWithIcon>

          <div className="ff-mt-sm ff-stack">
            {assuranceMedsConjointPeriodes.map((p, idx) => {
              const st = spousePeriodsOk[idx] || {
                debutOk: false,
                finOk: false,
                rowOk: false,
                showDebut: false,
                showFin: false,
              };

              return (
                <div key={`cj-${idx}`} className="ff-rowbox">
                  <FieldWithIcon ok={st.debutOk} show={st.showDebut}>
                    <Field
                      label={L.meds.from}
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
                  </FieldWithIcon>

                  <FieldWithIcon ok={st.finOk} show={st.showFin}>
                    <Field
                      label={L.meds.to}
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
                  </FieldWithIcon>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <StatusIcon ok={st.rowOk} show={st.showDebut || st.showFin} />
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
