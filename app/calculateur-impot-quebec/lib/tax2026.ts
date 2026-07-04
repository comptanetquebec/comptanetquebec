import { calculateFederalTax2026 } from "./federal";
import { calculateQuebecTax2026 } from "./quebec";
import type { TaxInput, TaxResult } from "./types";

export function calculateTax2026(input: TaxInput): TaxResult {
  const taxableIncome = Math.max(0, input.income - input.rrsp);

  const federalTax = calculateFederalTax2026(taxableIncome);
  const quebecTax = calculateQuebecTax2026(taxableIncome);

  const totalTax = federalTax + quebecTax;
  const totalPaid = input.federalTaxPaid + input.quebecTaxPaid;

  return {
    taxableIncome,
    federalTax,
    quebecTax,
    totalTax,
    totalPaid,
    balance: totalTax - totalPaid,
  };
}
