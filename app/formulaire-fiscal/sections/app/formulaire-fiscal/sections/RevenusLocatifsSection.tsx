"use client";

type Props = {
  actif: boolean;
  setActif: (v: boolean) => void;
  revenus: string;
  setRevenus: (v: string) => void;
  depenses: string;
  setDepenses: (v: string) => void;
};

export default function RevenusLocatifsSection({
  actif,
  setActif,
  revenus,
  setRevenus,
  depenses,
  setDepenses,
}: Props) {
  return (
    <section className="form-section">
      <h3>Revenus de location (immeuble / bloc)</h3>

      <p style={{ marginBottom: 10 }}>
        Si vous avez un immeuble locatif (duplex, triplex, condo loué, etc.),
        cochez cette section.
      </p>

      <label style={{ display: "block", marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={actif}
          onChange={(e) => setActif(e.target.checked)}
        />{" "}
        ✔ J’ai des revenus de location
      </label>

      {actif && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="text"
            placeholder="Revenus locatifs approximatifs (ex: 24000)"
            value={revenus}
            onChange={(e) => setRevenus(e.target.value)}
          />

          <input
            type="text"
            placeholder="Dépenses approximatives (ex: 12000)"
            value={depenses}
            onChange={(e) => setDepenses(e.target.value)}
          />

          <small style={{ opacity: 0.7 }}>
            Montants approximatifs acceptés
          </small>
        </div>
      )}
    </section>
  );
}
