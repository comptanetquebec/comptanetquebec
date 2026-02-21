// app/formulaire-fiscal-ta/sections/DocsSummary.tsx
"use client";

import React from "react";
import type { CopyPack } from "../copy";
import type { DocRow } from "../types";

type FieldStatus = "ok" | "no" | "idle";

function Mark({ status }: { status: FieldStatus }) {
  if (status === "idle") return null;

  const ok = status === "ok";

  return (
    <span
      aria-hidden
      style={{
        marginLeft: 10,
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

export default function DocsSummary(props: {
  L: CopyPack;

  docsLoading: boolean;
  docsCount: number;
  canContinue: boolean;
  docs: DocRow[];
  openDoc: (d: DocRow) => void;

  // déclenche l'affichage du ✕ et du message rouge après clic
  showErrors: boolean;

  submitting: boolean;
  goToDepotDocuments: () => void;
}) {
  const {
    L,
    docsLoading,
    docsCount,
    canContinue,
    docs,
    openDoc,
    showErrors,
    submitting,
    goToDepotDocuments,
  } = props;

  const status: FieldStatus = canContinue ? "ok" : showErrors ? "no" : "idle";
  const showRed = showErrors && !canContinue;

  return (
    <div className="ff-submit">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          className="ff-btn ff-btn-primary ff-btn-big"
          disabled={submitting} // ✅ important: PAS de !canContinue ici
          onClick={goToDepotDocuments}
          title={!canContinue ? L.completeToContinue : ""}
        >
          {L.continue}
        </button>

        <Mark status={status} />
      </div>

      <div
        className="ff-muted"
        style={{
          marginTop: 10,
          color: showRed ? "#dc2626" : undefined,
          fontWeight: showRed ? 700 : undefined,
        }}
      >
        {docsLoading
          ? L.docs.loading
          : docsCount > 0
          ? L.docs.already(docsCount)
          : canContinue
          ? L.nextStepDocs
          : L.completeToContinue}
      </div>

      {docsCount > 0 && (
        <div className="ff-mt">
          <div className="ff-subtitle">{L.docs.title}</div>

          <div className="ff-stack">
            {docs.map((d) => (
              <button
                key={d.id}
                type="button"
                className="ff-btn ff-btn-outline"
                onClick={() => openDoc(d)}
                title={d.original_name}
              >
                {L.docs.open(d.original_name)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
            }
