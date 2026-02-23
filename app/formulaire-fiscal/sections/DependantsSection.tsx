// app/formulaire-fiscal/sections/DependantsSection.tsx
"use client";

import React, { useMemo } from "react";
import { Field, SelectField } from "../ui";
import type { Child, Sexe } from "../types";
import type { CopyPack } from "../copy";
import { formatDateInput, formatNASInput } from "../formatters";

type Mark = "ok" | "bad";

function MarkIcon({ mark }: { mark: Mark }) {
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
        aria-label="ok"
        title="OK"
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

  return (
    <span
      aria-label="à corriger"
      title="À corriger"
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

/** Label + ✓ collé au texte (comme ton image #1) */
function LabelWithMark({ text, mark }: { text: React.ReactNode; mark: Mark }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ minWidth: 0 }}>{text}</span>
      <MarkIcon mark={mark} />
    </span>
  );
}

// Validation légère: on ne fait pas de date “parfaite”, juste non vide + longueur attendue.
// (Ton page.tsx fait déjà la validation bloquante globale.)
function isFilled(v: string) {
  return !!(v || "").trim();
}
function looksLikeDob(v: string) {
  const s = (v || "").trim();
  return /^\d{2}\/\d{2}\/\d{4}$/.test(s);
}
function looksLikeSinIfAny(v: string) {
  const d = (v || "").replace(/\D+/g, "");
  return d.length === 0 || d.length === 9;
}

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

  const blockMark: Mark = useMemo(() => {
    if (enfants.length === 0) return "bad";
    const allOk = enfants.every((e) => {
      const okPrenom = isFilled(e.prenom);
      const okNom = isFilled(e.nom);
      const okDob = looksLikeDob(e.dob);
      const okSexe = isFilled(e.sexe);
      const okNas = looksLikeSinIfAny(e.nas);
      return okPrenom && okNom && okDob && okSexe && okNas;
    });
    return allOk ? "ok" : "bad";
  }, [enfants]);

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        {/* ✅ icône collée au titre (pas à droite) */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0 }}>{L.sections.dependantsTitle}</h2>
          <MarkIcon mark={blockMark} />
        </div>
        <p style={{ marginTop: 8 }}>{L.sections.dependantsDesc}</p>
      </div>

      {enfants.length === 0 ? (
        /* ✅ icône collée au texte (pas à droite) */
        <div className="ff-empty" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <span>{L.dependants.none}</span>
          <MarkIcon mark="bad" />
        </div>
      ) : (
        <div className="ff-stack">
          {enfants.map((enf, i) => {
            const okPrenom = isFilled(enf.prenom);
            const okNom = isFilled(enf.nom);
            const okDob = looksLikeDob(enf.dob);
            const okSexe = isFilled(enf.sexe);
            const okNas = looksLikeSinIfAny(enf.nas);

            const childOk = okPrenom && okNom && okDob && okSexe && okNas;
            const childMark: Mark = childOk ? "ok" : "bad";

            return (
              <div key={`enf-${i}`} className="ff-childbox">
                <div
                  className="ff-childhead"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  {/* ✅ à gauche: titre + icône collée */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <div className="ff-childtitle">{L.dependants.titleN(i + 1)}</div>
                    <MarkIcon mark={childMark} />
                  </div>

                  <button
                    type="button"
                    className="ff-btn ff-btn-link"
                    onClick={() => removeEnfant(i)}
                    aria-label={L.dependants.remove}
                    title={L.dependants.remove}
                  >
                    ✕
                  </button>
                </div>

                <div className="ff-grid2">
                  <Field
                    label={<LabelWithMark text={L.fields.firstName} mark={okPrenom ? "ok" : "bad"} />}
                    value={enf.prenom}
                    onChange={(v) => updateEnfant(i, "prenom", v)}
                    required
                  />
                  <Field
                    label={<LabelWithMark text={L.fields.lastName} mark={okNom ? "ok" : "bad"} />}
                    value={enf.nom}
                    onChange={(v) => updateEnfant(i, "nom", v)}
                    required
                  />
                  <Field
                    label={<LabelWithMark text={L.fields.dob} mark={okDob ? "ok" : "bad"} />}
                    value={enf.dob}
                    onChange={(v) => updateEnfant(i, "dob", formatDateInput(v))}
                    placeholder="01/01/2020"
                    inputMode="numeric"
                    maxLength={10}
                    required
                  />
                  <Field
                    label={<LabelWithMark text={L.dependants.sinIfAny} mark={okNas ? "ok" : "bad"} />}
                    value={enf.nas}
                    onChange={(v) => updateEnfant(i, "nas", formatNASInput(v))}
                    placeholder={L.fields.sinPh}
                    inputMode="numeric"
                    maxLength={11}
                  />
                </div>

                <div className="ff-mt-sm">
                  <SelectField<Sexe>
                    label={<LabelWithMark text={L.dependants.sex} mark={okSexe ? "ok" : "bad"} />}
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
            );
          })}
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
