// app/formulaire-fiscal-ta/sections/MedsSection.tsx
"use client";

import React from "react";
import { Field, SelectField } from "../ui";
import type { AssuranceMeds, Periode } from "../types";
import type { CopyPack } from "../copy";
import { formatDateInput } from "../formatters";
import { updatePeriode } from "../helpers";

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

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        <h2>{L.sections.medsTitle}</h2>
        <p>{L.sections.medsDesc}</p>
      </div>

      <div className="ff-subtitle">{L.meds.clientCoverage}</div>

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

      <div className="ff-mt-sm ff-stack">
        {assuranceMedsClientPeriodes.map((p, idx) => (
          <div key={`cli-${idx}`} className="ff-rowbox">
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
          </div>
        ))}

        <button
          type="button"
          className="ff-btn ff-btn-soft"
          onClick={() =>
            setAssuranceMedsClientPeriodes((prev) => [...prev, { debut: "", fin: "" }])
          }
        >
          {L.meds.addPeriod}
        </button>
      </div>

      {aUnConjoint && (
        <>
          <div className="ff-subtitle ff-mt">{L.meds.spouseCoverage}</div>

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

          <div className="ff-mt-sm ff-stack">
            {assuranceMedsConjointPeriodes.map((p, idx) => (
              <div key={`cj-${idx}`} className="ff-rowbox">
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
              </div>
            ))}

            <button
              type="button"
              className="ff-btn ff-btn-soft"
              onClick={() =>
                setAssuranceMedsConjointPeriodes((prev) => [...prev, { debut: "", fin: "" }])
              }
            >
              {L.meds.addPeriod}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
