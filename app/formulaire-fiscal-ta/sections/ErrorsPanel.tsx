// app/formulaire-fiscal-ta/sections/ErrorsPanel.tsx
"use client";

import React from "react";
import type { CopyPack } from "../copy";

export default function ErrorsPanel(props: {
  L: CopyPack;
  errors: string[];
}) {
  const { L, errors } = props;

  if (!errors || errors.length === 0) return null;

  return (
    <section
      id="ff-errors"
      className="ff-card"
      style={{
        padding: 14,
        border: "1px solid #ffd0d0",
        background: "#fff5f5",
      }}
    >
      <strong>{L.fixBeforeContinue}</strong>

      <ul style={{ marginTop: 10, paddingLeft: 18 }}>
        {errors.map((e, i) => (
          <li key={`err-${i}`}>{e}</li>
        ))}
      </ul>
    </section>
  );
}
