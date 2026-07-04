const FED_BRACKETS_2026 = [
  { upTo: 58523, rate: 0.14 },
  { upTo: 117045, rate: 0.205 },
  { upTo: 181440, rate: 0.26 },
  { upTo: 258482, rate: 0.29 },
  { upTo: Infinity, rate: 0.33 },
];

const FED_BASIC_PERSONAL_AMOUNT_2026 = 16452;
const QUEBEC_ABATEMENT = 0.165;

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

export function calculateFederalTax2026(taxableIncome: number) {
  const grossTax = taxByBrackets(taxableIncome, FED_BRACKETS_2026);
  const basicCredit = FED_BASIC_PERSONAL_AMOUNT_2026 * 0.14;
  const taxAfterCredits = Math.max(0, grossTax - basicCredit);

  return taxAfterCredits * (1 - QUEBEC_ABATEMENT);
}
