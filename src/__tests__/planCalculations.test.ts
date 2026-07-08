import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIncomeCalculations, useSavingsCalculations } from '@/hooks/usePlanCalculations';
import { IncomePlan, SavingsPlan } from '@/types/chart';

describe('useIncomeCalculations', () => {
  it('should calculate income plan data using percentage saveRate', () => {
    const { result } = renderHook(() => useIncomeCalculations());
    
    const plan: IncomePlan = {
      id: 'test-percentage',
      planName: 'Test Percentage',
      planType: 'income',
      lastUpdated: new Date(),
      details: {
        income: 100000,
        raiseRate: 0.03,
        saveRate: 0.20,
        balance: 100000,
        taxRate: 0.40,
        returnRate: 0.08,
        saveMode: 'rate'
      }
    };

    const data = result.current.calculateIncomeData(plan);
    
    expect(data).toHaveLength(25);
    
    // First year: 2024
    const firstYear = data[0];
    expect(firstYear.year).toBe(2024);
    expect(firstYear.income).toBe(100000);
    // netContribution = 0.20 * 100000 = 20000
    expect(firstYear.netContribution).toBe(20000);
    // takeHome = (100000 - 20000) * (1 - 0.40) = 80000 * 0.60 = 48000
    expect(firstYear.takeHome).toBe(48000);
    // saveRate should be 0.20
    expect(firstYear.saveRate).toBe(0.20);
  });

  it('should calculate income plan data using fixed dollar saveAmount', () => {
    const { result } = renderHook(() => useIncomeCalculations());
    
    const plan: IncomePlan = {
      id: 'test-fixed',
      planName: 'Test Fixed',
      planType: 'income',
      lastUpdated: new Date(),
      details: {
        income: 120000,
        raiseRate: 0.05,
        saveRate: 0.20, // should be ignored
        balance: 50000,
        taxRate: 0.30,
        returnRate: 0.06,
        saveMode: 'fixed',
        saveAmount: 30000
      }
    };

    const data = result.current.calculateIncomeData(plan);
    
    expect(data).toHaveLength(25);
    
    // First year: 2024
    const firstYear = data[0];
    expect(firstYear.year).toBe(2024);
    expect(firstYear.income).toBe(120000);
    // netContribution = fixed saveAmount = 30000
    expect(firstYear.netContribution).toBe(30000);
    // takeHome = (120000 - 30000) * (1 - 0.30) = 90000 * 0.70 = 63000
    expect(firstYear.takeHome).toBe(63000);
    // effective saveRate = 30000 / 120000 = 0.25
    expect(firstYear.saveRate).toBe(0.25);
  });
});

describe('useSavingsCalculations', () => {
  it('should calculate savings data using fallback returnRate (backward compatibility)', () => {
    const { result } = renderHook(() => useSavingsCalculations());

    const plan: SavingsPlan = {
      id: 'test-swr-fallback',
      planName: 'Test SWR Fallback',
      planType: 'savings',
      lastUpdated: new Date(),
      details: {
        goalType: 'income_stream',
        desiredIncome: 80000,
        currentAge: 30,
        retirementAge: 65,
        currentBalance: 10000, // Reduced to ensure positive savings
        taxRate: 0.25,
        returnRate: 0.08
      }
    };

    const { chartData, requiredSavings } = result.current.calculateSavingsData(plan);
    
    expect(chartData).toHaveLength(66); // age 30 to 95 inclusive
    
    expect(requiredSavings).toBeGreaterThan(0);
    // At age 64 (index 34, 35 compounding periods), the projected income should be very close to 80000
    expect(chartData[34].projectedIncome).toBeCloseTo(80000, -2);
  });

  it('should calculate savings data using custom withdrawalRate (SWR)', () => {
    const { result } = renderHook(() => useSavingsCalculations());

    const plan: SavingsPlan = {
      id: 'test-swr-custom',
      planName: 'Test SWR Custom',
      planType: 'savings',
      lastUpdated: new Date(),
      details: {
        goalType: 'income_stream',
        desiredIncome: 80000,
        currentAge: 30,
        retirementAge: 65,
        currentBalance: 10000, // Reduced to ensure positive savings
        taxRate: 0.25,
        returnRate: 0.08,
        withdrawalRate: 0.04 // Custom SWR (4% rule)
      }
    };

    const { chartData, requiredSavings } = result.current.calculateSavingsData(plan);
    
    expect(chartData).toHaveLength(66);
    
    expect(requiredSavings).toBeGreaterThan(0);
    // At age 64 (index 34, 35 compounding periods), the projected income should be very close to 80000
    expect(chartData[34].projectedIncome).toBeCloseTo(80000, -2);
  });
});
