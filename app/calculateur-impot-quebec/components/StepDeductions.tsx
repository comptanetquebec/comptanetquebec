import styles from "../page.module.css";

type StepDeductionsProps = {
  rrsp: string;
  setRrsp: (value: string) => void;
  medical: string;
  setMedical: (value: string) => void;
  donations: string;
  setDonations: (value: string) => void;
};

export default function StepDeductions({
  rrsp,
  setRrsp,
  medical,
  setMedical,
  donations,
  setDonations,
}: StepDeductionsProps) {
  return (
    <div className={styles.step}>
      <h2>Déductions et crédits simples</h2>

      <p className={styles.stepText}>
        Ajoutez seulement les montants principaux. Le calcul demeure une estimation.
      </p>

      <div className={styles.grid}>
        <label>
          Cotisations REER
          <input
            type="number"
            value={rrsp}
            onChange={(e) => setRrsp(e.target.value)}
            placeholder="Ex. 3000"
          />
        </label>

        <label>
          Frais médicaux
          <input
            type="number"
            value={medical}
            onChange={(e) => setMedical(e.target.value)}
            placeholder="Ex. 1200"
          />
        </label>

        <label>
          Dons
          <input
            type="number"
            value={donations}
            onChange={(e) => setDonations(e.target.value)}
            placeholder="Ex. 250"
          />
        </label>
      </div>
    </div>
  );
}
