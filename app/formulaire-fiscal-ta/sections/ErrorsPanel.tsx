// app/formulaire-fiscal-ta/sections/ErrorsPanel.tsx
"use client";

import React from "react";
import type { CopyPack } from "../copy";

export default function ErrorsPanel(props: {
  L: CopyPack;
  errors: string[];
  showErrors: boolean;
}) {
  const { L, errors, showErrors } = props;

  // ❌ rien tant que l'utilisateur n'a pas cliqué continuer
  if (!showErrors || !errors || errors.length === 0) return null;

  return (
    <div
      id="ff-errors"
      style={{
        marginBottom: 16,
        padding: "10px 14px",
        borderRadius: 8,
        background: "rgba(239,68,68,.08)",
        border: "1px solid rgba(239,68,68,.2)",
        fontSize: 13,
        color: "#dc2626",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span style={{ fontWeight: 700 }}>✕</span>
      <span>{L.completeToContinue}</span>
    </div>
  );
}
