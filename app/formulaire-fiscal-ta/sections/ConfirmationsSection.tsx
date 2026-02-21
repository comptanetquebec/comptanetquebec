// app/formulaire-fiscal-ta/sections/ConfirmationsSection.tsx
"use client";

import React, { useMemo } from "react";
import { CheckboxField } from "../ui";
import type { CopyPack } from "../copy";

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

function LabelWithMark({ label, status }: { label: string; status: FieldStatus }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <span>{label}</span>
      <Mark status={status} />
    </span>
  );
}

export default function ConfirmationsSection(props: {
  L: CopyPack;

  // ✅ déclenche les ✕ (ex: après clic "Continuer")
  showErrors: boolean;

  vExactitude: boolean;
  setVExactitude: (v: boolean) => void;

  vDossierComplet: boolean;
  setVDossierComplet: (v: boolean) => void;

  vFraisVariables: boolean;
  setVFraisVariables: (v: boolean) => void;

  vDelais: boolean;
  setVDelais: (v: boolean) => void;
}) {
  const {
    L,
    showErrors,
    vExactitude,
    setVExactitude,
    vDossierComplet,
    setVDossierComplet,
    vFraisVariables,
    setVFraisVariables,
    vDelais,
    setVDelais,
  } = props;

  const status = useMemo(() => {
    const s = (checked: boolean): FieldStatus => {
      if (checked) return "ok";
      return showErrors ? "no" : "idle";
    };

    return {
      vExactitude: s(vExactitude),
      vDossierComplet: s(vDossierComplet),
      vFraisVariables: s(vFraisVariables),
      vDelais: s(vDelais),
    };
  }, [showErrors, vExactitude, vDossierComplet, vFraisVariables, vDelais]);

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        <h2>{L.sections.confirmsTitle}</h2>
        <p>{L.sections.confirmsDesc}</p>
      </div>

      <div className="ff-stack">
        <CheckboxField
          label={(<LabelWithMark label={L.confirms.exact} status={status.vExactitude} />) as any}
          checked={vExactitude}
          onChange={setVExactitude}
        />
        <CheckboxField
          label={(<LabelWithMark label={L.confirms.complete} status={status.vDossierComplet} />) as any}
          checked={vDossierComplet}
          onChange={setVDossierComplet}
        />
        <CheckboxField
          label={(<LabelWithMark label={L.confirms.fees} status={status.vFraisVariables} />) as any}
          checked={vFraisVariables}
          onChange={setVFraisVariables}
        />
        <CheckboxField
          label={(<LabelWithMark label={L.confirms.delays} status={status.vDelais} />) as any}
          checked={vDelais}
          onChange={setVDelais}
        />
      </div>
    </section>
  );
}
