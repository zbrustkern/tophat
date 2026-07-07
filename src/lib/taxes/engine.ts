import { FEDERAL_2025, STATE_TAX_PROFILES, FilingStatus, TaxConfiguration } from './brackets';

export interface TaxResult {
  grossIncome: number;
  federalTax: number;
  stateTax: number;
  totalTax: number;
  effectiveTaxRate: number;
  federalEffectiveRate: number;
  stateEffectiveRate: number;
  netIncome: number;
}

function calculateProgressiveTax(taxableIncome: number, config: TaxConfiguration): number {
  if (taxableIncome <= 0) return 0;
  
  let totalTax = 0;
  let previousLimit = 0;

  for (const bracket of config.brackets) {
    const limit = bracket.upTo === null ? Infinity : bracket.upTo;
    const taxableInThisBracket = Math.min(taxableIncome - previousLimit, limit - previousLimit);
    
    if (taxableInThisBracket > 0) {
      totalTax += taxableInThisBracket * bracket.rate;
    }
    
    if (taxableIncome <= limit) {
      break;
    }
    
    previousLimit = limit;
  }

  return totalTax;
}

function calculateTaxForConfig(grossIncome: number, dependents: number, config: TaxConfiguration): number {
  // Deductions
  const taxableIncome = Math.max(0, grossIncome - config.standardDeduction);
  
  // Calculate Base Tax
  const baseTax = calculateProgressiveTax(taxableIncome, config);
  
  // Apply Credits (Non-refundable in this simplified engine)
  const totalCredits = dependents * config.childTaxCredit;
  const finalTax = Math.max(0, baseTax - totalCredits);
  
  return finalTax;
}

export function calculateTaxes(
  grossIncome: number, 
  filingStatus: FilingStatus, 
  state: string, 
  dependents: number = 0
): TaxResult {
  
  // 1. Calculate Federal Tax
  const federalConfig = FEDERAL_2025[filingStatus];
  const federalTax = calculateTaxForConfig(grossIncome, dependents, federalConfig);

  // 2. Calculate State Tax
  let stateTax = 0;
  const stateProfile = STATE_TAX_PROFILES[state];
  if (stateProfile) {
    const stateConfig = stateProfile[filingStatus];
    stateTax = calculateTaxForConfig(grossIncome, dependents, stateConfig);
  } else {
    // If state is unknown, assume 0% for now (could add fallback or default rate later)
    stateTax = 0;
  }

  const totalTax = federalTax + stateTax;
  
  return {
    grossIncome,
    federalTax,
    stateTax,
    totalTax,
    effectiveTaxRate: grossIncome > 0 ? totalTax / grossIncome : 0,
    federalEffectiveRate: grossIncome > 0 ? federalTax / grossIncome : 0,
    stateEffectiveRate: grossIncome > 0 ? stateTax / grossIncome : 0,
    netIncome: grossIncome - totalTax
  };
}
