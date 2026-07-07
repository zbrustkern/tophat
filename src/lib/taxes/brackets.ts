export type FilingStatus = 'Single' | 'MarriedJointly';

export interface TaxBracket {
  rate: number;
  upTo: number | null; // null means infinity (top bracket)
}

export interface TaxConfiguration {
  standardDeduction: number;
  childTaxCredit: number; // per dependent
  brackets: TaxBracket[];
}

// "July 4, 2025 One Big Beautiful Bill" Anchor
export const FEDERAL_2025: Record<FilingStatus, TaxConfiguration> = {
  Single: {
    standardDeduction: 15000,
    childTaxCredit: 2500,
    brackets: [
      { rate: 0.10, upTo: 50000 },
      { rate: 0.20, upTo: 100000 },
      { rate: 0.30, upTo: null }
    ]
  },
  MarriedJointly: {
    standardDeduction: 30000,
    childTaxCredit: 2500,
    brackets: [
      { rate: 0.10, upTo: 100000 },
      { rate: 0.20, upTo: 200000 },
      { rate: 0.30, upTo: null }
    ]
  }
};

// Simplified State Tax Profiles
export const STATE_TAX_PROFILES: Record<string, Record<FilingStatus, TaxConfiguration>> = {
  'TX': {
    Single: { standardDeduction: 0, childTaxCredit: 0, brackets: [{ rate: 0, upTo: null }] },
    MarriedJointly: { standardDeduction: 0, childTaxCredit: 0, brackets: [{ rate: 0, upTo: null }] }
  },
  'FL': {
    Single: { standardDeduction: 0, childTaxCredit: 0, brackets: [{ rate: 0, upTo: null }] },
    MarriedJointly: { standardDeduction: 0, childTaxCredit: 0, brackets: [{ rate: 0, upTo: null }] }
  },
  'CA': { // Simplified California progressive
    Single: {
      standardDeduction: 5363,
      childTaxCredit: 433,
      brackets: [
        { rate: 0.01, upTo: 10412 },
        { rate: 0.04, upTo: 61730 },
        { rate: 0.08, upTo: 349137 },
        { rate: 0.133, upTo: null }
      ]
    },
    MarriedJointly: {
      standardDeduction: 10726,
      childTaxCredit: 433,
      brackets: [
        { rate: 0.01, upTo: 20824 },
        { rate: 0.04, upTo: 123460 },
        { rate: 0.08, upTo: 698274 },
        { rate: 0.133, upTo: null }
      ]
    }
  },
  'NY': { // Simplified New York
    Single: {
      standardDeduction: 8000,
      childTaxCredit: 330,
      brackets: [
        { rate: 0.04, upTo: 8500 },
        { rate: 0.055, upTo: 80650 },
        { rate: 0.0685, upTo: 215400 },
        { rate: 0.109, upTo: null }
      ]
    },
    MarriedJointly: {
      standardDeduction: 16050,
      childTaxCredit: 330,
      brackets: [
        { rate: 0.04, upTo: 17000 },
        { rate: 0.055, upTo: 161550 },
        { rate: 0.0685, upTo: 323200 },
        { rate: 0.109, upTo: null }
      ]
    }
  },
  'IL': { // Illinois Flat Tax (4.95%)
    Single: {
      standardDeduction: 2425,
      childTaxCredit: 0,
      brackets: [
        { rate: 0.0495, upTo: null }
      ]
    },
    MarriedJointly: {
      standardDeduction: 4850,
      childTaxCredit: 0,
      brackets: [
        { rate: 0.0495, upTo: null }
      ]
    }
  },
  'WA': { // Washington (No income tax)
    Single: { standardDeduction: 0, childTaxCredit: 0, brackets: [{ rate: 0, upTo: null }] },
    MarriedJointly: { standardDeduction: 0, childTaxCredit: 0, brackets: [{ rate: 0, upTo: null }] }
  }
};

export const SUPPORTED_STATES = Object.keys(STATE_TAX_PROFILES);
