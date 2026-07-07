import { describe, it, expect } from 'vitest';
import { useBudgetCalculations } from '../useBudgetCalculations';
import { BudgetPlan, GlobalSettings } from '@/types/chart';

describe('useBudgetCalculations', () => {
  const { calculateBudgetData } = useBudgetCalculations();

  const mockGlobalSettings: GlobalSettings = {
    taxRate: 0.4,
    returnRate: 0.08,
    withdrawalRate: 0.04,
    inflationRate: 0.03,
    currentAge: 30,
    retirementAge: 65,
    payors: ['N', 'Z'],
    incomes: [
      { payorId: 'N', amount: 12000 },
      { payorId: 'Z', amount: 7200 }
    ]
  };

  const mockPlan: BudgetPlan = {
    id: 'budget1',
    planName: 'Household Budget',
    planType: 'budget',
    lastUpdated: new Date(),
    details: {
      useGlobalSettings: true,
      lineItems: [
        { id: '1', payorId: 'N', bill: 'Mortgage', company: 'Bank', category: 'House', monthlyAmount: 6800 },
        { id: '2', payorId: 'Z', bill: 'Daycare #1', company: 'Bright Horizons', category: 'Childcare', monthlyAmount: 2055 },
        { id: '3', payorId: 'Z', bill: 'Daycare #2', company: 'Bright Horizons', category: 'Childcare', monthlyAmount: 2800 },
        { id: '4', payorId: 'N', bill: 'Landscaping', company: 'TBD', category: 'Maintenance', monthlyAmount: 500 }
      ]
    }
  };

  it('should correctly calculate total expenses', () => {
    const result = calculateBudgetData(mockPlan, mockGlobalSettings);
    expect(result.totalExpenses).toBe(6800 + 2055 + 2800 + 500); // 12155
  });

  it('should correctly group expenses by payor', () => {
    const result = calculateBudgetData(mockPlan, mockGlobalSettings);
    expect(result.expensesByPayor['N']).toBe(6800 + 500); // 7300
    expect(result.expensesByPayor['Z']).toBe(2055 + 2800); // 4855
  });

  it('should correctly inherit incomes from global settings', () => {
    const result = calculateBudgetData(mockPlan, mockGlobalSettings);
    expect(result.incomesByPayor['N']).toBe(12000);
    expect(result.incomesByPayor['Z']).toBe(7200);
    expect(result.totalIncome).toBe(19200);
  });

  it('should correctly calculate discretionary cash flow by payor', () => {
    const result = calculateBudgetData(mockPlan, mockGlobalSettings);
    expect(result.discretionaryByPayor['N']).toBe(12000 - 7300); // 4700
    expect(result.discretionaryByPayor['Z']).toBe(7200 - 4855); // 2345
    expect(result.totalDiscretionary).toBe(19200 - 12155); // 7045
  });

  it('should ignore global incomes if useGlobalSettings is false', () => {
    const noGlobalPlan: BudgetPlan = {
      ...mockPlan,
      details: { ...mockPlan.details, useGlobalSettings: false }
    };
    const result = calculateBudgetData(noGlobalPlan, mockGlobalSettings);
    expect(result.incomesByPayor).toEqual({});
    expect(result.totalIncome).toBe(0);
    expect(result.totalDiscretionary).toBe(-12155); // Since income is 0
  });
});
