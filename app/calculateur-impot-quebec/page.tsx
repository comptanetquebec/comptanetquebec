"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

const FED_BRACKETS = [
  { upTo: 58523, rate: 0.14 },
  { upTo: 117045, rate: 0.205 },
  { upTo: 181440, rate: 0.26 },
  { upTo: 258482, rate: 0.29 },
  { upTo: Infinity, rate: 0.33 },
];

const QC_BRACKETS = [
  { upTo: 54345, rate: 0.14 },
  { upTo: 108680, rate: 0.19 },
  { upTo: 132245, rate: 0.24 },
  { upTo: Infinity, rate: 0.2575 },
];

const FED_BPA = 16452;
const QC_BPA = 18952;
const QC_ABATEMENT = 0.165;

function taxByBrackets(income: number, brackets: { upTo: number; rate: number }[]) {
  let tax = 0;
  let previous = 0;

  for (const bracket of brackets) {
    const taxable = Math.max(0, Math.min(income, bracket.upTo) - previous);
    tax += taxable * bracket.rate;
    previous = bracket.upTo;
    if (income <= bracket.upTo) break;
  }

  return tax;
}

function money(value: number) {
  return value.toLocaleString("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
}

export default function CalculateurImpotQuebec() {
  const [income, setIncome] = useState("");
  const [federalPaid, setFederalPaid] = useState("");
  const [quebecPaid, setQuebecPaid] = useState("");

  const result = useMemo(() => {
    const revenu = Number(income) || 0;
    const fedPaid = Number(federalPaid) || 0;
    const qcPaid = Number(quebecPaid) || 0;

    const federalGross = taxByBrackets(revenu, FED_BRACKETS);
    const federalCredit = FED_BPA * 0.14;
    const federalAfterCredit = Math.max(0, federalGross - federalCredit);
    const federalTax = Math.max(0, federalAfterCredit * (1 - QC_ABATEMENT));

    const quebecGross = taxByBrackets(revenu, QC_BRACKETS);
    const quebecCredit = QC_BPA * 0.14;
    const quebecTax = Math.max(0, quebecGross - quebecCredit);

    const totalTax = federalTax + quebecTax;
    const totalPaid = fedPaid + qcPaid;
    const balance = totalTax - totalPaid;

    return {
      revenu,
      federalTax,
      quebecTax,
      totalTax,
      totalPaid,
      balance,
    };
  }, [income, federalPaid, quebecPaid]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.badge}>Estimateur 2026</p>
        <h1>Calculateur d’impôt Québec 2026</h1>
        <p>
          Entrez vos montants T4 et Relevé 1 pour obtenir une estimation rapide
          de votre solde ou remboursement.
        </p>
      </section>

      <section className={styles.card}>
        <div className={styles.grid}>
          <label>
            Revenu d’emploi total
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="Ex. 52000"
            />
          </label>

          <label>
            Impôt fédéral retenu — T4
            <input
              type="number"
              value={federalPaid}
              onChange={(e) => setFederalPaid(e.target.value)}
              placeholder="Ex. 4200"
            />
          </label>

          <label>
            Impôt Québec retenu — Relevé 1
            <input
              type="number"
              value={quebecPaid}
              onChange={(e) => setQuebecPaid(e.target.value)}
              placeholder="Ex. 5100"
            />
          </label>
        </div>

        <div className={styles.results}>
          <div>
            <span>Impôt fédéral estimé</span>
            <strong>{money(result.federalTax)}</strong>
          </div>

          <div>
            <span>Impôt Québec estimé</span>
            <strong>{money(result.quebecTax)}</strong>
          </div>

          <div>
            <span>Total retenu</span>
            <strong>{money(result.totalPaid)}</strong>
          </div>

          <div className={result.balance > 0 ? styles.due : styles.refund}>
            <span>{result.balance > 0 ? "Solde estimé à payer" : "Remboursement estimé"}</span>
            <strong>{money(Math.abs(result.balance))}</strong>
          </div>
        </div>

        <p className={styles.note}>
          Ceci est une estimation seulement. Le résultat réel peut varier selon
          les crédits, déductions, REER, frais médicaux, enfants, conjoint,
          travail autonome ou autres situations fiscales.
        </p>

        <a href="/contact" className={styles.cta}>
          Faire préparer ma déclaration par ComptaNet Québec
        </a>
      </section>
    </main>
  );
}
