import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIncomeCalculations, useSavingsCalculations, useCollegeCalculations } from '../hooks/usePlanCalculations';
import { IncomePlan, SavingsPlan, CollegePlan } from '../types/chart';

describe('usePlanCalculations', () => {
  describe('useIncomeCalculations', () => {
    it('should correctly calculate income data over 25 years', () => {
      const { result } = renderHook(() => useIncomeCalculations());
      const { calculateIncomeData } = result.current;
      
      const mockPlan: IncomePlan = {
        id: '1',
        planName: 'Test Income',
        planType: 'income',
        lastUpdated: new Date(),
        details: {
          income: 100000,
          raiseRate: 0.03,
          saveRate: 0.20,
          balance: 100000,
          taxRate: 0.40,
          returnRate: 0.08,
          autoEscalateSavings: true,
          escalationRate: 0.01,
        }
      };

      const data = calculateIncomeData(mockPlan);

      expect(data.length).toBe(25);
      
      // Year 1 expectations
      expect(data[0].year).toBe(2024);
      expect(data[0].income).toBe(100000);
      expect(data[0].takeHome).toBe(48000); // 100000 * 0.8 * 0.6
      expect(data[0].netContribution).toBe(20000);
      expect(data[0].balance).toBe(128000); // 100000 * 1.08 + 20000
      
      // Year 2 expectations
      expect(data[1].income).toBe(103000);
      expect(data[1].saveRate).toBeCloseTo(0.21); // auto-escalated
    });
  });

  describe('useSavingsCalculations', () => {
    it('should calculate required savings to hit target income', () => {
      const { result } = renderHook(() => useSavingsCalculations());
      const { calculateSavingsData } = result.current;
      
      const mockPlan: SavingsPlan = {
        id: '2',
        planName: 'Test Savings',
        planType: 'savings',
        lastUpdated: new Date(),
        details: {
          goalType: 'income_stream',
          desiredIncome: 120000,
          currentAge: 30,
          retirementAge: 65,
          currentBalance: 50000,
          taxRate: 0.30,
          returnRate: 0.07
        }
      };

      const { chartData, requiredSavings } = calculateSavingsData(mockPlan);
      
      expect(chartData.length).toBe(36); // 30 to 65 inclusive
      expect(requiredSavings).toBeGreaterThan(0);
      
      const finalYear = chartData[chartData.length - 1];
      expect(finalYear.projectedIncome).toBeGreaterThanOrEqual(120000);
    });
  });
});
