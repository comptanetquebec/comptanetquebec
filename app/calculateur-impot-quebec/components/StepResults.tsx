import styles from "../page.module.css";
import SummaryCard from "./SummaryCard";

type StepResultsProps = {
  federalTax: number;
  quebecTax: number;
  totalPaid: number;
  balance: number;
};

function money(value: number) {
  return value.toLocaleString("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
}

export default function StepResults({
  federalTax,
  quebecTax,
  totalPaid,
  balance,
}: StepResultsProps) {
  return (
    <div className={styles.step}>
      <h2>Résultat de votre estimation</h2>

      <p className={styles.stepText}>
        Cette estimation est fournie à titre indicatif seulement.
      </p>

      <div className={styles.results}>
        <SummaryCard
          title="Impôt fédéral estimé"
          value={money(federalTax)}
        />

        <SummaryCard
          title="Impôt Québec estimé"
          value={money(quebecTax)}
        />

        <SummaryCard
          title="Impôt retenu"
          value={money(totalPaid)}
        />

        <SummaryCard
          title={balance > 0 ? "Solde estimé à payer" : "Remboursement estimé"}
          value={money(Math.abs(balance))}
          highlight
        />
      </div>

      <p className={styles.note}>
  Le résultat est basé uniquement sur les renseignements saisis. Une
  déclaration complète peut modifier le montant final.
  <br />
  <br />
  <strong>Besoin d'un calcul précis?</strong>
  <br />
  L'équipe de ComptaNet Québec peut préparer votre déclaration de revenus et
  s'assurer que vous bénéficiez de tous les crédits et déductions auxquels vous
  avez droit.
</p>

      <a href="/" className={styles.cta}>
        Faire préparer ma déclaration avec ComptaNet Québec
      </a>
    </div>
  );
}
