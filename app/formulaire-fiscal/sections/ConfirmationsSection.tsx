// app/formulaire-fiscal/sections/ConfirmationsSection.tsx
"use client";

import React, { useMemo } from "react";
import { CheckboxField } from "../ui";
import type { CopyPack } from "../copy";

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

export default function ConfirmationsSection(props: {
  L: CopyPack;
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
    vExactitude,
    setVExactitude,
    vDossierComplet,
    setVDossierComplet,
    vFraisVariables,
    setVFraisVariables,
    vDelais,
    setVDelais,
  } = props;

  const marks = useMemo(() => {
    const m1: Mark = vExactitude ? "ok" : "bad";
    const m2: Mark = vDossierComplet ? "ok" : "bad";
    const m3: Mark = vFraisVariables ? "ok" : "bad";
    const m4: Mark = vDelais ? "ok" : "bad";
    const blockOk = m1 === "ok" && m2 === "ok" && m3 === "ok" && m4 === "ok";
    return { m1, m2, m3, m4, block: blockOk ? ("ok" as Mark) : ("bad" as Mark) };
  }, [vExactitude, vDossierComplet, vFraisVariables, vDelais]);

  const wrapLabel = (text: string, mark: Mark) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {text} <MarkIcon mark={mark} />
    </span>
  );

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <h2 style={{ margin: 0 }}>{L.sections.confirmsTitle}</h2>
          <MarkIcon mark={marks.block} />
        </div>
        <p style={{ marginTop: 8 }}>{L.sections.confirmsDesc}</p>
      </div>

      <div className="ff-stack">
        <CheckboxField
          label={wrapLabel(L.confirms.exact, marks.m1)}
          checked={vExactitude}
          onChange={setVExactitude}
        />
        <CheckboxField
          label={wrapLabel(L.confirms.complete, marks.m2)}
          checked={vDossierComplet}
          onChange={setVDossierComplet}
        />
        <CheckboxField
          label={wrapLabel(L.confirms.fees, marks.m3)}
          checked={vFraisVariables}
          onChange={setVFraisVariables}
        />
        <CheckboxField
          label={wrapLabel(L.confirms.delays, marks.m4)}
          checked={vDelais}
          onChange={setVDelais}
        />
      </div>
    </section>
  );
}
