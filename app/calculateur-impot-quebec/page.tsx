"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

import ProgressBar from "./components/ProgressBar";
import StepPersonal from "./components/StepPersonal";
import StepIncome from "./components/StepIncome";
import StepDeductions from "./components/StepDeductions";
import StepResults from "./components/StepResults";

import { calculateTax2026 } from "./lib/tax2026";

const TOTAL_STEPS = 4;

export default function CalculateurImpotQuebec() {
  const [step, setStep] = useState(1);

  const [maritalStatus, setMaritalStatus] = useState("single");
  const [childrenCount, setChildrenCount] = useState("0");

  const [income, setIncome] = useState("");
  const [federalPaid, setFederalPaid] = useState("");
  const [quebecPaid, setQuebecPaid] = useState("");

  const [rrsp, setRrsp] = useState("");
  const [medical, setMedical] = useState("");
  const [donations, setDonations] = useState("");

  const result = useMemo(() => {
    return calculateTax2026({
      income: Number(income) || 0,
      federalTaxPaid: Number(federalPaid) || 0,
      quebecTaxPaid: Number(quebecPaid) || 0,
      rrsp: Number(rrsp) || 0,
      medical: Number(medical) || 0,
      donations: Number(donations) || 0,
    });
  }, [income, federalPaid, quebecPaid, rrsp, medical, donations]);

  const nextStep = () => setStep((current) => Math.min(current + 1, TOTAL_STEPS));
  const previousStep = () => setStep((current) => Math.max(current - 1, 1));

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.badge}>Estimateur 2026</p>
        <h1>Calculateur d’impôt Québec 2026</h1>
        <p>
          Obtenez une estimation rapide de votre solde ou remboursement à partir
          de vos montants T4 et Relevé 1.
        </p>
      </section>

      <section className={styles.card}>
        <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />

        {step === 1 && (
          <StepPersonal
            maritalStatus={maritalStatus}
            setMaritalStatus={setMaritalStatus}
            childrenCount={childrenCount}
            setChildrenCount={setChildrenCount}
          />
        )}

        {step === 2 && (
          <StepIncome
            income={income}
            setIncome={setIncome}
            federalPaid={federalPaid}
            setFederalPaid={setFederalPaid}
            quebecPaid={quebecPaid}
            setQuebecPaid={setQuebecPaid}
          />
        )}

        {step === 3 && (
          <StepDeductions
            rrsp={rrsp}
            setRrsp={setRrsp}
            medical={medical}
            setMedical={setMedical}
            donations={donations}
            setDonations={setDonations}
          />
        )}

        {step === 4 && (
          <StepResults
            federalTax={result.federalTax}
            quebecTax={result.quebecTax}
            totalPaid={result.totalPaid}
            balance={result.balance}
          />
        )}

        <div className={styles.navButtons}>
          {step > 1 && (
            <button type="button" onClick={previousStep} className={styles.secondaryButton}>
              Précédent
            </button>
          )}

          {step < TOTAL_STEPS && (
            <button type="button" onClick={nextStep} className={styles.primaryButton}>
              Suivant
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
