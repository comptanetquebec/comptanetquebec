// app/formulaire-fiscal/sections/ErrorsPanel.tsx
"use client";

import React from "react";
import type { CopyPack } from "../copy";

function ErrorIcon() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 20,
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 900,
        background: "#fee2e2",
        color: "#7f1d1d",
        border: "1px solid #dc2626",
      }}
    >
      ✕
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
      {/* Header avec icône rouge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ErrorIcon />
        <strong style={{ color: "#7f1d1d" }}>{L.fixBeforeContinue}</strong>
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
