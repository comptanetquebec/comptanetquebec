// app/formulaire-fiscal/sections/ConfirmationsSection.tsx
"use client";

import React from "react";
import { CheckboxField } from "../ui";
import type { CopyPack } from "../copy";

export default function ConfirmationsSection(props: {
  L: CopyPack;
  vExactitude: boolean; setVExactitude: (v: boolean) => void;
  vDossierComplet: boolean; setVDossierComplet: (v: boolean) => void;
  vFraisVariables: boolean; setVFraisVariables: (v: boolean) => void;
  vDelais: boolean; setVDelais: (v: boolean) => void;
}) {
  const { L, vExactitude, setVExactitude, vDossierComplet, setVDossierComplet, vFraisVariables, setVFraisVariables, vDelais, setVDelais } = props;

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        <h2>{L.sections.confirmsTitle}</h2>
        <p>{L.sections.confirmsDesc}</p>
      </div>

      <div className="ff-stack">
        <CheckboxField label={L.confirms.exact} checked={vExactitude} onChange={setVExactitude} />
        <CheckboxField label={L.confirms.complete} checked={vDossierComplet} onChange={setVDossierComplet} />
        <CheckboxField label={L.confirms.fees} checked={vFraisVariables} onChange={setVFraisVariables} />
        <CheckboxField label={L.confirms.delays} checked={vDelais} onChange={setVDelais} />
      </div>
    </section>
  );
}
