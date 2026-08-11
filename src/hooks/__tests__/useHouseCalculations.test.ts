import { renderHook } from '@testing-library/react';
import { useHouseCalculations } from '../useHouseCalculations';
import { HousePlan, GlobalSettings } from '@/types/chart';

describe('useHouseCalculations', () => {
  const mockSettings: GlobalSettings = {
    taxRate: 0.24,
    returnRate: 0.05,
    withdrawalRate: 0.04,
    inflationRate: 0.03,
    currentAge: 30,
    retirementAge: 65,
    payors: ['Joint'],
    incomes: []
  };

  it('should calculate amortization for owned mode', () => {
    const { result } = renderHook(() => useHouseCalculations());
    
    const mockPlan: HousePlan = {
      id: 'house1',
      planName: 'Test House',
      planType: 'house',
      lastUpdated: new Date(),
      details: {
        status: 'owned',
        currentValue: 500000,
        currentLoanBalance: 400000,
        interestRate: 0.05,
        remainingTermMonths: 360,
      }
    };

    const data = result.current.calculateHouseData(mockPlan, mockSettings);
    expect(data.length).toBeGreaterThan(0);
    
    const firstMonth = data[0];
    expect(firstMonth.principalBalance).toBe(400000);
    
    const lastMonth = data[data.length - 1];
    expect(lastMonth.principalBalance).toBeLessThanOrEqual(0.01);
  });
});
