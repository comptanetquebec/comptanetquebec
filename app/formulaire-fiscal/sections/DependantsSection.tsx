// app/formulaire-fiscal/sections/DependantsSection.tsx
"use client";

import React from "react";
import { Field, SelectField } from "../ui";
import type { Child, Sexe } from "../types";
import type { CopyPack } from "../copy";
import { formatDateInput, formatNASInput } from "../formatters";

export default function DependantsSection(props: {
  L: CopyPack;
  show: boolean;
  enfants: Child[];
  ajouterEnfant: () => void;
  updateEnfant: (i: number, field: keyof Child, value: string) => void;
  removeEnfant: (i: number) => void;
}) {
  const { L, show, enfants, ajouterEnfant, updateEnfant, removeEnfant } = props;
  if (!show) return null;

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        <h2>{L.sections.dependantsTitle}</h2>
        <p>{L.sections.dependantsDesc}</p>
      </div>

      {enfants.length === 0 ? (
        <div className="ff-empty">{L.dependants.none}</div>
      ) : (
        <div className="ff-stack">
          {enfants.map((enf, i) => (
            <div key={`enf-${i}`} className="ff-childbox">
              <div className="ff-childhead">
                <div className="ff-childtitle">{L.dependants.titleN(i + 1)}</div>
                <button type="button" className="ff-btn ff-btn-link" onClick={() => removeEnfant(i)}>
                  {L.dependants.remove}
                </button>
              </div>

              <div className="ff-grid2">
                <Field label={L.fields.firstName} value={enf.prenom} onChange={(v) => updateEnfant(i, "prenom", v)} required />
                <Field label={L.fields.lastName} value={enf.nom} onChange={(v) => updateEnfant(i, "nom", v)} required />
                <Field
                  label={L.fields.dob}
                  value={enf.dob}
                  onChange={(v) => updateEnfant(i, "dob", formatDateInput(v))}
                  placeholder="01/01/2020"
                  inputMode="numeric"
                  maxLength={10}
                  required
                />
                <Field
                  label={L.dependants.sinIfAny}
                  value={enf.nas}
                  onChange={(v) => updateEnfant(i, "nas", formatNASInput(v))}
                  placeholder={L.fields.sinPh}
                  inputMode="numeric"
                  maxLength={11}
                />
              </div>

              <div className="ff-mt-sm">
                <SelectField<Sexe>
                  label={L.dependants.sex}
                  value={enf.sexe}
                  onChange={(v) => updateEnfant(i, "sexe", v)}
                  options={[
                    { value: "M", label: L.dependants.sexM },
                    { value: "F", label: L.dependants.sexF },
                    { value: "X", label: L.dependants.sexX },
                  ]}
                  required
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ff-mt">
        <button type="button" className="ff-btn ff-btn-primary" onClick={ajouterEnfant}>
          {L.dependants.add}
        </button>
      </div>
    </section>
  );
}
