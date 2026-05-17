"use client";

import React from "react";

type Props = {
  actif: boolean;
  setActif: (v: boolean) => void;
  nomEntreprise: string;
  setNomEntreprise: (v: string) => void;
  revenus: string;
  setRevenus: (v: string) => void;
  depenses: string;
  setDepenses: (v: string) => void;
};

export default function TravailleurAutonomeSection({
  actif,
  setActif,
  nomEntreprise,
  setNomEntreprise,
  revenus,
  setRevenus,
  depenses,
  setDepenses,
}: Props) {
  return (
    <section className="ff-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Travailleur autonome</h2>
          <p style={{ margin: 0, color: "#6b7280" }}>
            Cochez cette section seulement si vous avez gagné des revenus comme travailleur autonome.
          </p>
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
        <input
          type="checkbox"
          checked={actif}
          onChange={(e) => setActif(e.target.checked)}
        />
        Je suis travailleur autonome
      </label>

      {actif ? (
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <div className="ff-field">
            <label>Nom de l’entreprise ou activité</label>
            <input
              type="text"
              value={nomEntreprise}
              onChange={(e) => setNomEntreprise(e.target.value)}
              placeholder="Ex. : services de ménage, consultation, livraison…"
            />
          </div>

          <div className="ff-field">
            <label>Revenus bruts approximatifs</label>
            <input
              type="text"
              inputMode="decimal"
              value={revenus}
              onChange={(e) => setRevenus(e.target.value)}
              placeholder="Ex. : 12500"
            />
          </div>

          <div className="ff-field">
            <label>Dépenses approximatives</label>
            <input
              type="text"
              inputMode="decimal"
              value={depenses}
              onChange={(e) => setDepenses(e.target.value)}
              placeholder="Ex. : 3200"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
