export type Lang = "fr" | "en" | "es";

export type TaxInput = {
  income: number;
  federalTaxPaid: number;
  quebecTaxPaid: number;
  rrsp: number;
  medical: number;
  donations: number;
};

export type TaxResult = {
  taxableIncome: number;
  federalTax: number;
  quebecTax: number;
  totalTax: number;
  totalPaid: number;
  balance: number;
};
