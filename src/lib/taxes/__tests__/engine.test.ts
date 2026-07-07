import { describe, it, expect } from 'vitest';
import { calculateTaxes } from '../engine';

describe('Tax Engine Calculations', () => {
  it('should correctly calculate taxes for Single in TX (0% state tax) with no dependents', () => {
    // Single, $100,000 gross.
    // Federal Std Deduction: $15,000. Taxable: $85,000.
    // Bracket 1 (10% up to $50,000): $50,000 * 0.10 = $5,000
    // Bracket 2 (20% up to $100,000): $35,000 * 0.20 = $7,000
    // Total Federal: $12,000
    // State (TX): $0
    
    const result = calculateTaxes(100000, 'Single', 'TX', 0);
    expect(result.federalTax).toBe(12000);
    expect(result.stateTax).toBe(0);
    expect(result.totalTax).toBe(12000);
    expect(result.effectiveTaxRate).toBe(0.12); // 12000 / 100000
  });

  it('should correctly apply Child Tax Credits', () => {
    // Single, $100,000 gross. 2 dependents.
    // Base Federal: $12,000. 
    // Credits: 2 * $2500 = $5,000.
    // Final Federal: $7,000.
    
    const result = calculateTaxes(100000, 'Single', 'TX', 2);
    expect(result.federalTax).toBe(7000);
  });

  it('should not allow tax to go below 0 (non-refundable credits)', () => {
    // Single, $20,000 gross. 2 dependents.
    // Base Taxable: $20,000 - $15,000 = $5,000.
    // Base Federal: $5,000 * 0.10 = $500.
    // Credits: $5,000.
    // Final Federal: $0.
    const result = calculateTaxes(20000, 'Single', 'TX', 2);
    expect(result.federalTax).toBe(0);
  });

  it('should correctly calculate for MarriedJointly in a progressive state like CA', () => {
    // MarriedJointly, $250,000 gross, 0 dependents, CA.
    // Federal Std Deduction: $30,000. Taxable: $220,000.
    // Bracket 1 (10% up to $100k): $10,000.
    // Bracket 2 (20% up to $200k): $100,000 * 0.20 = $20,000.
    // Bracket 3 (30% above 200k): $20,000 * 0.30 = $6,000.
    // Total Federal: $36,000.
    
    // CA Std Deduction: $10,726. Taxable: $239,274.
    // Bracket 1 (1% up to 20824): 20824 * 0.01 = 208.24
    // Bracket 2 (4% up to 123460): 102636 * 0.04 = 4105.44
    // Bracket 3 (8% up to 698274): 115814 * 0.08 = 9265.12
    // Total State: 208.24 + 4105.44 + 9265.12 = 13578.80
    
    const result = calculateTaxes(250000, 'MarriedJointly', 'CA', 0);
    expect(result.federalTax).toBe(36000);
    expect(result.stateTax).toBeCloseTo(13578.80, 2);
    expect(result.totalTax).toBeCloseTo(49578.80, 2);
    expect(result.effectiveTaxRate).toBeCloseTo(49578.80 / 250000, 4);
  });
});
