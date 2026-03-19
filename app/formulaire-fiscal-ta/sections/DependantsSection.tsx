// app/formulaire-fiscal-ta/sections/DependantsSection.tsx
"use client";

import React, { useMemo } from "react";
import { Field, SelectField } from "../ui";
import type { Child, Sexe } from "../types";
import type { CopyPack } from "../copy";
import { formatDateInput, formatNASInput } from "../formatters";

type FieldStatus = "ok" | "no" | "idle";
type SectionMark = "ok" | "warn" | "bad";

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

function SectionBadge({ mark }: { mark: SectionMark }) {
  const styles =
    mark === "ok"
      ? {
          background: "#dcfce7",
          color: "#14532d",
          borderColor: "#16a34a",
          text: "✓",
          title: "OK",
        }
      : mark === "warn"
      ? {
          background: "#f3f4f6",
          color: "#1f2937",
          borderColor: "rgba(0,0,0,.18)",
          text: "→",
          title: "À faire",
        }
      : {
          background: "#fee2e2",
          color: "#7f1d1d",
          borderColor: "#dc2626",
          text: "✕",
          title: "À corriger",
        };

  return (
    <span
      aria-hidden
      title={styles.title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        border: "1px solid",
        background: styles.background,
        color: styles.color,
        borderColor: styles.borderColor,
      }}
    >
      {styles.text}
    </span>
  );
}

function LabelWithMark({ label, status }: { label: string; status: FieldStatus }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <span>{label}</span>
      <Mark status={status} />
    </span>
  );
}

function digitsOnly(v: string) {
  return (v || "").replace(/\D+/g, "");
}

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

function isValidNASOptional(v: string) {
  const d = digitsOnly(v).slice(0, 9);
  if (!d.length) return true;
  return d.length === 9;
}

export default function DependantsSection(props: {
  L: CopyPack;
  show: boolean;
  showErrors: boolean;
  enfants: Child[];
  aucunePersonneACharge: boolean;
  ajouterEnfant: () => void;
  updateEnfant: (i: number, field: keyof Child, value: string) => void;
  removeEnfant: (i: number) => void;
}) {
  const {
    L,
    show,
    showErrors,
    enfants,
    aucunePersonneACharge,
    ajouterEnfant,
    updateEnfant,
    removeEnfant,
  } = props;

  if (!show) return null;

  const statuses = useMemo(() => {
    const requiredText = (v: string): FieldStatus => {
      const has = !!(v || "").trim();
      if (!has) return showErrors ? "no" : "idle";
      return "ok";
    };

    const sexStatus = (v: string): FieldStatus => {
      if (!v) return showErrors ? "no" : "idle";
      return v === "M" || v === "F" || v === "X" ? "ok" : "no";
    };

    return enfants.map((enf) => {
      const dobStatus: FieldStatus = (() => {
        if (!enf.dob?.trim()) return showErrors ? "no" : "idle";
        return isValidDateJJMMAAAA(enf.dob) ? "ok" : "no";
      })();

      const nasStatus: FieldStatus = (() => {
        if (!enf.nas?.trim()) return "idle";
        return isValidNASOptional(enf.nas) ? "ok" : "no";
      })();

      return {
        prenom: requiredText(enf.prenom),
        nom: requiredText(enf.nom),
        dob: dobStatus,
        nas: nasStatus,
        sexe: sexStatus(enf.sexe),
      };
    });
  }, [enfants, showErrors]);

  const blockMark: SectionMark = useMemo(() => {
    if (aucunePersonneACharge) return "ok";
    if (enfants.length === 0) return "warn";

    const allOk = enfants.every((enf) => {
      const okPrenom = !!enf.prenom?.trim();
      const okNom = !!enf.nom?.trim();
      const okDob = isValidDateJJMMAAAA(enf.dob);
      const okSexe = enf.sexe === "M" || enf.sexe === "F" || enf.sexe === "X";
      const okNas = isValidNASOptional(enf.nas);
      return okPrenom && okNom && okDob && okSexe && okNas;
    });

    return allOk ? "ok" : "bad";
  }, [aucunePersonneACharge, enfants]);

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0 }}>{L.sections.dependantsTitle}</h2>
          <SectionBadge mark={blockMark} />
        </div>
        <p style={{ marginTop: 8 }}>{L.sections.dependantsDesc}</p>
      </div>

      {aucunePersonneACharge ? (
        <div
          className="ff-empty"
          style={{
            color: "#14532d",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>Aucune personne à charge sélectionnée.</span>
          <SectionBadge mark="ok" />
        </div>
      ) : enfants.length === 0 ? (
        <div
          className="ff-empty"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>{L.dependants.none}</span>
          <SectionBadge mark="warn" />
        </div>
      ) : (
        <div className="ff-stack">
          {enfants.map((enf, i) => {
            const st = statuses[i] || {
              prenom: "idle" as FieldStatus,
              nom: "idle" as FieldStatus,
              dob: "idle" as FieldStatus,
              nas: "idle" as FieldStatus,
              sexe: "idle" as FieldStatus,
            };

            return (
              <div key={`enf-${i}`} className="ff-childbox">
                <div className="ff-childhead">
                  <div className="ff-childtitle">{L.dependants.titleN(i + 1)}</div>

                  <button
                    type="button"
                    className="ff-btn ff-btn-link"
                    onClick={() => removeEnfant(i)}
                  >
                    {L.dependants.remove}
                  </button>
                </div>

                <div className="ff-grid2">
                  <Field
                    label={<LabelWithMark label={L.fields.firstName} status={st.prenom} /> as any}
                    value={enf.prenom}
                    onChange={(v) => updateEnfant(i, "prenom", v)}
                    required
                  />

                  <Field
                    label={<LabelWithMark label={L.fields.lastName} status={st.nom} /> as any}
                    value={enf.nom}
                    onChange={(v) => updateEnfant(i, "nom", v)}
                    required
                  />

                  <Field
                    label={<LabelWithMark label={L.fields.dob} status={st.dob} /> as any}
                    value={enf.dob}
                    onChange={(v) => updateEnfant(i, "dob", formatDateInput(v))}
                    placeholder={L.fields.dobPh}
                    inputMode="numeric"
                    maxLength={10}
                    required
                  />

                  <Field
                    label={<LabelWithMark label={L.dependants.sinIfAny} status={st.nas} /> as any}
                    value={enf.nas}
                    onChange={(v) => updateEnfant(i, "nas", formatNASInput(v))}
                    placeholder={L.fields.sinPh}
                    inputMode="numeric"
                    maxLength={11}
                  />
                </div>

                <div className="ff-mt-sm">
                  <SelectField<Sexe>
                    label={<LabelWithMark label={L.dependants.sex} status={st.sexe} /> as any}
                    value={enf.sexe}
                    onChange={(v) => updateEnfant(i, "sexe", v)}
                    options={[
                      { value: "M", label: L.dependants.sexM },
                      { value: "F", label: L.dependants.sexF },
                      { value: "X", label: L.dependants.sexX },
                    ]}
                    required
                    placeholderText={"—"}
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
