// app/formulaire-fiscal/sections/DocsSummary.tsx
"use client";

import React, { useMemo } from "react";
import type { CopyPack } from "../copy";
import type { DocRow } from "../types";

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

/** ✅ Texte + icône collée (comme image #1) */
function LabelWithMark({ text, mark }: { text: React.ReactNode; mark: Mark }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ minWidth: 0 }}>{text}</span>
      <MarkIcon mark={mark} />
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
    submitting,
    goToDepotDocuments,
  } = props;

  // ✅ vert/rouge basé sur "peut continuer"
  const markContinue: Mark = useMemo(() => (canContinue ? "ok" : "bad"), [canContinue]);

  // ✅ indicateur docs (optionnel) : vert si docs > 0
  const markDocs: Mark = useMemo(() => (docsCount > 0 ? "ok" : "bad"), [docsCount]);

  return (
    <div className="ff-submit">
      {/* ✅ bouton + icône collée, pas “à droite loin” */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          className="ff-btn ff-btn-primary ff-btn-big"
          disabled={submitting || !canContinue}
          onClick={goToDepotDocuments}
          title={!canContinue ? L.completeToContinue : ""}
        >
          {L.continue}
        </button>

        <MarkIcon mark={markContinue} />
      </div>

      {/* ✅ phrase + icône collée */}
      <div
        className="ff-muted"
        style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 12 }}
      >
        <LabelWithMark
          text={
            docsLoading
              ? L.docsLoading
              : docsCount > 0
              ? L.docsAlready(docsCount)
              : canContinue
              ? L.docsNext
              : L.completeToContinue
          }
          mark={markDocs}
        />
      </div>

      {docsCount > 0 && (
        <div className="ff-mt">
          {/* ✅ titre + icône collée */}
          <div className="ff-subtitle" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span>{L.docsTitle}</span>
            <MarkIcon mark="ok" />
          </div>

          <div className="ff-stack">
            {docs.map((d) => (
              <button
                key={d.id}
                type="button"
                className="ff-btn ff-btn-outline"
                onClick={() => openDoc(d)}
                title={d.original_name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <span style={{ minWidth: 0 }}>{L.openDoc(d.original_name)}</span>

                {/* (flèche ↗ à droite) */}
                <span
                  aria-hidden="true"
                  style={{
                    fontWeight: 900,
                    opacity: 0.6,
                    border: "1px solid rgba(0,0,0,.18)",
                    borderRadius: 999,
                    width: 18,
                    height: 18,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "0 0 auto",
                  }}
                >
                  ↗
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
