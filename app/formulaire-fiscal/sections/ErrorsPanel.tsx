// app/formulaire-fiscal/sections/ErrorsPanel.tsx
"use client";

import React from "react";
import type { CopyPack } from "../copy";

type Mark = "bad";

/** ✅ Même look que tes MarkIcon rouges (18px) */
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

  // ici c'est toujours "bad"
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

/** ✅ Texte + icône collée (comme image #1) */
function LabelWithMark({ text, mark }: { text: React.ReactNode; mark: Mark }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ minWidth: 0 }}>{text}</span>
      <MarkIcon mark={mark} />
    </span>
  );
}

export default function ErrorsPanel(props: { L: CopyPack; errors: string[] }) {
  const { L, errors } = props;
  if (!errors || errors.length === 0) return null;

  return (
    <section
      id="ff-errors"
      className="ff-card"
      style={{
        padding: 14,
        border: "1px solid #dc2626",
        background: "#fff5f5",
      }}
    >
      {/* ✅ Header: texte + icône collée */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        <LabelWithMark text={<strong style={{ color: "#7f1d1d" }}>{L.fixBeforeContinue}</strong>} mark="bad" />
      </div>

      {/* Liste erreurs */}
      <ul style={{ marginTop: 10, paddingLeft: 18, color: "#7f1d1d" }}>
        {errors.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
    </section>
  );
}
