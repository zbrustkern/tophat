// Average effective property tax rates by state (as of ~2023)
// Represented as a decimal (e.g., 0.0208 for 2.08%)
export const STATE_PROPERTY_TAX_RATES: Record<string, number> = {
  AL: 0.0040, // Alabama (Lowest)
  AK: 0.0118,
  AZ: 0.0063,
  AR: 0.0064,
  CA: 0.0075,
  CO: 0.0055,
  CT: 0.0215,
  DE: 0.0061,
  FL: 0.0091,
  GA: 0.0090,
  HI: 0.0032, // Hawaii (Lowest nominally)
  ID: 0.0067,
  IL: 0.0208, // Illinois (One of the highest)
  IN: 0.0084,
  IA: 0.0152,
  KS: 0.0134,
  KY: 0.0083,
  LA: 0.0056,
  ME: 0.0124,
  MD: 0.0107,
  MA: 0.0114,
  MI: 0.0138,
  MN: 0.0111,
  MS: 0.0079,
  MO: 0.0098,
  MT: 0.0083,
  NE: 0.0167,
  NV: 0.0059,
  NH: 0.0193,
  NJ: 0.0223, // New Jersey (Highest)
  NM: 0.0076,
  NY: 0.0140,
  NC: 0.0082,
  ND: 0.0099,
  OH: 0.0159,
  OK: 0.0089,
  OR: 0.0093,
  PA: 0.0149,
  RI: 0.0140,
  SC: 0.0057,
  SD: 0.0117,
  TN: 0.0066,
  TX: 0.0168,
  UT: 0.0057,
  VT: 0.0183,
  VA: 0.0082,
  WA: 0.0094,
  WV: 0.0057,
  WI: 0.0161,
  WY: 0.0056,
  DC: 0.0057
};

/**
 * Get the average property tax rate for a given state code.
 * Falls back to national average (~1.1%) if state not found.
 */
export function getPropertyTaxRateForState(stateCode: string): number {
  const code = stateCode.toUpperCase().trim();
  return STATE_PROPERTY_TAX_RATES[code] || 0.0110;
}
