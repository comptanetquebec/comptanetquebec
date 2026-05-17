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
    <div className="ff-card">
      <h2>Travailleur autonome</h2>

      {/* Checkbox */}
      <div style={{ marginBottom: 10 }}>
        <label>
          <input
            type="checkbox"
            checked={actif}
            onChange={(e) => setActif(e.target.checked)}
          />{" "}
          Je suis travailleur autonome
        </label>
      </div>

      {/* Champs si actif */}
      {actif && (
        <>
          <div className="ff-field">
            <label>Nom de l’entreprise</label>
            <input
              type="text"
              value={nomEntreprise}
              onChange={(e) => setNomEntreprise(e.target.value)}
            />
          </div>

          <div className="ff-field">
            <label>Revenus</label>
            <input
              type="number"
              value={revenus}
              onChange={(e) => setRevenus(e.target.value)}
            />
          </div>

          <div className="ff-field">
            <label>Dépenses</label>
            <input
              type="number"
              value={depenses}
              onChange={(e) => setDepenses(e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
}
