// app/formulaire-fiscal-ta/sections/DocsSummary.tsx
"use client";

import React from "react";
import type { CopyPack } from "../copy";
import type { DocRow } from "../types";

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

  return (
    <div className="ff-submit">
      <button
        type="button"
        className="ff-btn ff-btn-primary ff-btn-big"
        disabled={submitting || !canContinue}
        onClick={goToDepotDocuments}
        title={!canContinue ? L.completeToContinue : ""}
      >
        {L.continue}
      </button>

      <div className="ff-muted" style={{ marginTop: 10 }}>
        {docsLoading
          ? L.docsLoading
          : docsCount > 0
          ? L.docsAlready(docsCount)
          : canContinue
          ? L.docsNext
          : L.completeToContinue}
      </div>

      {docsCount > 0 && (
        <div className="ff-mt">
          <div className="ff-subtitle">{L.docsTitle}</div>
          <div className="ff-stack">
            {docs.map((d) => (
              <button
                key={d.id}
                type="button"
                className="ff-btn ff-btn-outline"
                onClick={() => openDoc(d)}
                title={d.original_name}
              >
                {L.openDoc(d.original_name)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
