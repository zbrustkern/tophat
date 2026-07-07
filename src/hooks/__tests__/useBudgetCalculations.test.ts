import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBudgetCalculations } from '../useBudgetCalculations';
import { BudgetPlan, GlobalSettings, Plan, IncomePlan } from '@/types/chart';

describe('useBudgetCalculations', () => {
  const mockGlobalSettings: GlobalSettings = {
    taxRate: 0.24,
    returnRate: 0.08,
    withdrawalRate: 0.04,
    inflationRate: 0.03,
    currentAge: 30,
    retirementAge: 65,
    payors: ['N', 'Z'],
    incomes: [
      { payorId: 'N', amount: 100000 },
      { payorId: 'Z', amount: 0 }
    ],
    activePlans: {
      incomePlanId: 'income1'
    }
  };

  const mockBudgetPlan: BudgetPlan = {
    id: 'budget1',
    planName: 'Household Budget',
    planType: 'budget',
    lastUpdated: new Date(),
    details: {
      useGlobalSettings: true,
      lineItems: [
        { id: '1', payorId: 'N', bill: 'Mortgage', company: 'Bank', category: 'House', monthlyAmount: 2000 },
        { id: '2', payorId: 'N', bill: 'Groceries', company: 'Store', category: 'Food', monthlyAmount: 500 }
      ]
    }
  };

  const mockIncomePlan: IncomePlan = {
    id: 'income1',
    planName: 'My Income',
    planType: 'income',
    lastUpdated: new Date(),
    details: {
      income: 100000,
      raiseRate: 0,
      saveRate: 0.1, // 10%
      balance: 0,
      taxRate: 0.24,
      returnRate: 0.07,
      useGlobalSettings: false,
      taxType: 'preTax'
    }
  };

  const allPlans: Plan[] = [mockBudgetPlan, mockIncomePlan];

  it('should correctly calculate the waterfall data flow with active income plan', () => {
    const { result } = renderHook(() => useBudgetCalculations());
    const data = result.current.calculateBudgetData(mockBudgetPlan, mockGlobalSettings, allPlans);
    
    // Core Expenses: 2500/mo * 12 = 30000
    expect(data.totalExpenses).toBe(2500);
    expect(data.waterfall.annualCoreBudget).toBe(30000);
    
    // Gross Income = 100000
    expect(data.waterfall.grossIncome).toBe(100000);
    
    // Pre-Tax Savings = 10000 (10% of 100000)
    expect(data.waterfall.preTaxSavings).toBe(10000);
    
    // Taxes = 90000 * 0.24 = 21600
    expect(data.waterfall.taxes).toBe(21600);
    
    // Take Home = 100000 - 10000 - 21600 = 68400
    expect(data.waterfall.takeHome).toBe(68400);
    
    // Net Cash Flow = 68400 - 30000 = 38400
    expect(data.waterfall.netCashFlow).toBe(38400);
  });

  it('should fall back to global settings income if no active income plan', () => {
    const { result } = renderHook(() => useBudgetCalculations());
    const noActivePlansSettings = { ...mockGlobalSettings, activePlans: {} };
    // Pass only the budget plan so the auto-resolve doesn't pick up the income plan
    const data = result.current.calculateBudgetData(mockBudgetPlan, noActivePlansSettings, [mockBudgetPlan]);
    
    // Global incomes total: 100000
    expect(data.waterfall.grossIncome).toBe(100000);
    expect(data.waterfall.preTaxSavings).toBe(0);
    
    // Taxes = 100000 * 0.24 = 24000
    expect(data.waterfall.taxes).toBe(24000);
    
    // Take Home = 76000
    expect(data.waterfall.takeHome).toBe(76000);
    
    // Net Cash Flow = 76000 - 30000 = 46000
    expect(data.waterfall.netCashFlow).toBe(46000);
  });
});
