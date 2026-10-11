import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMasterCalculations } from '../useMasterCalculations';
import { Plan, IncomePlan, BudgetPlan, SavingsPlan, GlobalSettings } from '@/types/chart';

describe('useMasterCalculations', () => {
  const mockIncomePlan: IncomePlan = {
    id: 'income1',
    planName: 'Primary Salary',
    planType: 'income',
    lastUpdated: new Date(),
    details: {
      income: 100000,
      raiseRate: 0.03,
      saveRate: 0.15, // 15% pre-tax savings ($15,000)
      balance: 50000, // starting balance
      taxRate: 0.20,
      returnRate: 0.07,
      withdrawalRate: 0.04,
      useGlobalSettings: false,
      taxType: 'preTax',
      payorId: 'Zeke'
    }
  };

  const mockGlobalSettings: GlobalSettings = {
    taxRate: 0.20,
    returnRate: 0.07,
    withdrawalRate: 0.04,
    inflationRate: 0.025,
    currentAge: 30,
    retirementAge: 65,
    payors: ['Zeke'],
    incomes: [{ payorId: 'Zeke', amount: 100000 }],
    activePlans: {
      incomePlanId: 'income1'
    }
  };

  it('1. Full master calculations with only an Income Plan (baseline gate)', () => {
    const { result } = renderHook(() => useMasterCalculations());
    const data = result.current.calculateMasterData([mockIncomePlan], mockGlobalSettings);

    expect(data).not.toBeNull();
    if (!data) return;

    // 1. Waterfall derived directly from income plan
    // Gross: 100,000
    // Pre-tax savings: 15% * 100,000 = 15,000
    // Taxable income: 85,000 -> Tax: 85,000 * 0.20 = 17,000
    // Take-home: 100,000 - 15,000 - 17,000 = 68,000
    // Annual Core Budget: 0 (no budget plan yet)
    // Net cash flow: 68,000 - 0 = 68,000
    expect(data.waterfall.grossIncome).toBe(100000);
    expect(data.waterfall.preTaxSavings).toBe(15000);
    expect(data.waterfall.taxes).toBe(17000);
    expect(data.waterfall.takeHome).toBe(68000);
    expect(data.waterfall.annualCoreBudget).toBe(0);
    expect(data.waterfall.netCashFlow).toBe(68000);

    // 2. Allocations & Total Assets: baseline starting balance used
    expect(data.totalAssets).toBe(50000);
    expect(data.allocations).toHaveLength(1);
    expect(data.allocations[0]).toEqual({
      name: 'Invested Wealth (Baseline)',
      value: 50000
    });

    // 3. Trajectory: 40-year compound growth trajectory
    expect(data.trajectory).toHaveLength(40);
    expect(data.trajectory[0].savingsBalance).toBeGreaterThan(50000);
    expect(data.trajectory[0].totalNetWorth).toBe(data.trajectory[0].savingsBalance);

    // Verify positive compound growth trajectory across the 40-year horizon
    const year10 = data.trajectory[10];
    const year24 = data.trajectory[24];
    const year39 = data.trajectory[39];
    expect(year10.totalNetWorth).toBeGreaterThan(data.trajectory[0].totalNetWorth);
    expect(year24.totalNetWorth).toBeGreaterThan(year10.totalNetWorth);
    expect(year39.totalNetWorth).toBeGreaterThan(year24.totalNetWorth);
    expect(data.trajectory.every(pt => pt.totalNetWorth > 0)).toBe(true);

    // 4. Retirement Goal: falls back to 80% replacement of take-home income
    // Target income: 68,000 * 0.80 = 54,400
    expect(data.retirementGoal.targetAnnualIncome).toBe(54400);
    expect(data.retirementGoal.requiredPortfolio).toBe(54400 / 0.04);
    expect(data.retirementGoal.retirementAge).toBe(65);
    expect(data.retirementGoal.yearsToRetirement).toBe(35);
    expect(data.retirementGoal.projectedNetWorthAtRetirement).toBeGreaterThan(data.retirementGoal.requiredPortfolio);
    expect(data.retirementGoal.isAchieved).toBe(true);
    expect(data.retirementGoal.statusMessage).toContain('fully funded by age 65');
  });

  it('1b. Retirement goal with zero savings shows deficit and required adjustment', () => {
    const mockLowSavingsIncomePlan: IncomePlan = {
      ...mockIncomePlan,
      details: {
        ...mockIncomePlan.details,
        income: 80000,
        saveRate: 0,
        balance: 0,
        autoEscalateSavings: false
      }
    };

    const { result } = renderHook(() => useMasterCalculations());
    const data = result.current.calculateMasterData([mockLowSavingsIncomePlan], mockGlobalSettings);

    expect(data).not.toBeNull();
    if (!data) return;

    expect(data.retirementGoal.isAchieved).toBe(false);
    expect(data.retirementGoal.monthlyAdjustmentNeeded).toBeGreaterThan(0);
    expect(data.retirementGoal.statusMessage).toContain(data.retirementGoal.targetAnnualIncome.toLocaleString());
    expect(data.retirementGoal.statusMessage).toContain('additional');
  });

  it('2. Full master calculations when Budget is added (budget waterfall takes precedence)', () => {
    const mockBudgetPlan: BudgetPlan = {
      id: 'budget1',
      planName: 'Household Budget',
      planType: 'budget',
      lastUpdated: new Date(),
      details: {
        useGlobalSettings: false,
        lineItems: [
          { id: '1', bill: 'Rent', company: 'Landlord', category: 'Housing', monthlyAmount: 2500, payorId: 'Zeke' },
          { id: '2', bill: 'Groceries', company: 'Market', category: 'Food', monthlyAmount: 800, payorId: 'Zeke' }
        ]
      }
    };

    const settingsWithBudget: GlobalSettings = {
      ...mockGlobalSettings,
      activePlans: {
        ...mockGlobalSettings.activePlans,
        budgetPlanId: 'budget1'
      }
    };

    const { result } = renderHook(() => useMasterCalculations());
    const data = result.current.calculateMasterData([mockIncomePlan, mockBudgetPlan], settingsWithBudget);

    expect(data).not.toBeNull();
    if (!data) return;

    // Monthly core budget: 2500 + 800 = 3300/mo -> 39,600/yr
    expect(data.waterfall.annualCoreBudget).toBe(39600);
    expect(data.waterfall.takeHome).toBe(68000);
    expect(data.waterfall.netCashFlow).toBe(68000 - 39600); // 28,400

    // Retirement goal uses the calculated annualCoreBudget instead of 80% fallback
    expect(data.retirementGoal.targetAnnualIncome).toBe(39600);
    expect(data.retirementGoal.requiredPortfolio).toBe(39600 / 0.04);

    // Trajectory expenses match budget
    expect(data.trajectory[0].expenses).toBe(39600);
    expect(data.trajectory[0].netCashFlow).toBe(28400);
  });

  it('3. Full master calculations when Portfolios and Goals are linked', () => {
    const mockPortfolioPlan: Plan = {
      id: 'portfolio1',
      planName: 'Vanguard Brokerage',
      planType: 'rebalance',
      lastUpdated: new Date(),
      details: {
        currentCash: 25000,
        currentEquity: 125000,
        targetAnnualReturn: 0.08,
        initialPrincipal: 150000,
        monthlyContribution: 0,
        mockVix: 15,
        monthsElapsed: 0
      }
    };

    const mockSavingsPlan: SavingsPlan = {
      id: 'savings1',
      planName: 'Retirement Independence Goal',
      planType: 'savings',
      lastUpdated: new Date(),
      details: {
        goalType: 'income_stream',
        desiredIncome: 60000,
        currentAge: 30,
        retirementAge: 65,
        currentBalance: 0,
        taxRate: 0.20,
        returnRate: 0.07,
        withdrawalRate: 0.04,
        useGlobalSettings: false,
        linkedPortfolioIds: ['portfolio1']
      }
    };

    const settingsWithPortfolioAndGoal: GlobalSettings = {
      ...mockGlobalSettings,
      activePlans: {
        ...mockGlobalSettings.activePlans,
        portfolioPlanId: 'portfolio1',
        savingsPlanIds: ['savings1']
      }
    };

    const plans = [mockIncomePlan, mockPortfolioPlan, mockSavingsPlan];
    const { result } = renderHook(() => useMasterCalculations());
    const data = result.current.calculateMasterData(plans, settingsWithPortfolioAndGoal);

    expect(data).not.toBeNull();
    if (!data) return;

    // Physical portfolio overrides baseline invested wealth in allocations
    expect(data.totalAssets).toBe(150000);
    expect(data.allocations).toHaveLength(1);
    expect(data.allocations[0]).toEqual({
      name: 'Vanguard Brokerage',
      value: 150000
    });
    // Ensure "Invested Wealth (Baseline)" is NOT present since physical portfolio exists
    expect(data.allocations.some(a => a.name === 'Invested Wealth (Baseline)')).toBe(false);

    // Linked goal prevents double-counting in trajectory
    // Goal uses portfolio balance as starting point
    expect(data.trajectory[0].savingsBalance).toBeGreaterThanOrEqual(150000);
    expect(data.trajectory[0].totalNetWorth).toBeGreaterThanOrEqual(150000);
    expect(data.trajectory[39].totalNetWorth).toBeGreaterThan(data.trajectory[0].totalNetWorth);
  });

  it('4. Gracefully degrades when activePlans is not provided in settings', () => {
    const settingsWithoutActivePlans: GlobalSettings = {
      ...mockGlobalSettings,
      activePlans: undefined
    };

    const { result } = renderHook(() => useMasterCalculations());
    const data = result.current.calculateMasterData([mockIncomePlan], settingsWithoutActivePlans);

    expect(data).not.toBeNull();
    if (!data) return;

    // Single income plan is automatically resolved
    expect(data.waterfall.grossIncome).toBe(100000);
    expect(data.totalAssets).toBe(50000);
    expect(data.allocations).toHaveLength(1);
    expect(data.trajectory).toHaveLength(40);
  });
});
