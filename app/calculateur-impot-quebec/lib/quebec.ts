const QC_BRACKETS_2026 = [
  { upTo: 54345, rate: 0.14 },
  { upTo: 108680, rate: 0.19 },
  { upTo: 132245, rate: 0.24 },
  { upTo: Infinity, rate: 0.2575 },
];

const QC_BASIC_PERSONAL_AMOUNT_2026 = 18952;

function taxByBrackets(income: number, brackets: { upTo: number; rate: number }[]) {
  let tax = 0;
  let previous = 0;

  for (const bracket of brackets) {
    const amount = Math.max(0, Math.min(income, bracket.upTo) - previous);
    tax += amount * bracket.rate;
    previous = bracket.upTo;

    if (income <= bracket.upTo) break;
  }

  return tax;
}

export function calculateQuebecTax2026(taxableIncome: number) {
  const grossTax = taxByBrackets(taxableIncome, QC_BRACKETS_2026);
  const basicCredit = QC_BASIC_PERSONAL_AMOUNT_2026 * 0.14;

  return Math.max(0, grossTax - basicCredit);
}
