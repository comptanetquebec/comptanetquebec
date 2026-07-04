import styles from "../page.module.css";

type StepIncomeProps = {
  income: string;
  setIncome: (value: string) => void;
  federalPaid: string;
  setFederalPaid: (value: string) => void;
  quebecPaid: string;
  setQuebecPaid: (value: string) => void;
};

export default function StepIncome({
  income,
  setIncome,
  federalPaid,
  setFederalPaid,
  quebecPaid,
  setQuebecPaid,
}: StepIncomeProps) {
  return (
    <div className={styles.step}>
      <h2>Revenus d'emploi</h2>

      <p className={styles.stepText}>
        Entrez les montants provenant de votre T4 et de votre Relevé 1.
      </p>

      <div className={styles.grid}>
        <label>
          Revenu d'emploi
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="Ex. 65000"
          />
        </label>

        <label>
          Impôt fédéral retenu (T4)
          <input
            type="number"
            value={federalPaid}
            onChange={(e) => setFederalPaid(e.target.value)}
            placeholder="Ex. 5200"
          />
        </label>

        <label>
          Impôt Québec retenu (RL-1)
          <input
            type="number"
            value={quebecPaid}
            onChange={(e) => setQuebecPaid(e.target.value)}
            placeholder="Ex. 6100"
          />
        </label>
      </div>
    </div>
  );
}
