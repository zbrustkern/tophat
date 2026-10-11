import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { WizardProvider, useWizard } from '@/components/onboarding/WizardProvider';
import { useWizardGenerator } from '@/hooks/useWizardGenerator';

// Mock usePlanManagement
const mockSavePlan = vi.fn().mockResolvedValue('test-id');
vi.mock('@/hooks/usePlanManagement', () => ({
  usePlanManagement: () => ({
    savePlan: mockSavePlan,
    loading: false,
    error: null
  })
}));

// Mock useSettings
const mockUpdateSettings = vi.fn().mockResolvedValue(true);
let mockSettings: any = {};
vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
    updateSettings: mockUpdateSettings,
    loading: false
  })
}));

describe('Progressive Value-Gate Flow & Wizard Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettings = {
      activePlans: {}
    };
  });

  it('WizardProvider initializes with correct fast-start defaults', () => {
    const { result } = renderHook(() => useWizard(), {
      wrapper: WizardProvider
    });

    expect(result.current.state.startingBalance).toBe(25000);
    expect(result.current.state.primaryIncome).toBe(100000);
    expect(result.current.state.savingsRate).toBe(0.15);
    expect(result.current.state.autoEscalate).toBe(true);
    expect(result.current.state.raiseRate).toBe(0.03);
    expect(result.current.state.age).toBe(30);
    expect(result.current.state.retirementAge).toBe(65);
    expect(result.current.state.incomes).toEqual([]);
    expect(result.current.state.assets).toEqual([]);
    expect(result.current.state.debts).toEqual([]);
    expect(result.current.state.goals).toEqual([]);
  });

  it('useWizardGenerator constructs fast-track plan without creating empty budget/assets/goals', async () => {
    const savedPlans: any[] = [];
    mockSavePlan.mockImplementation(async (plan: any) => {
      savedPlans.push(plan);
      return plan.id;
    });

    let generatorHook: any;
    let wizardContext: any;

    function TestComponent() {
      wizardContext = useWizard();
      generatorHook = useWizardGenerator();
      return null;
    }

    const { render } = await import('@testing-library/react');
    const React = await import('react');

    render(
      <WizardProvider>
        <TestComponent />
      </WizardProvider>
    );

    // Modify fast-track values
    act(() => {
      wizardContext.updateState({
        primaryIncome: 150000,
        startingBalance: 80000,
        savingsRate: 0.25,
        autoEscalate: true
      });
    });

    // Generate
    await act(async () => {
      await generatorHook.generateAndSave();
    });

    // Verify plans saved
    expect(savedPlans.length).toBe(1); // Only IncomePlan, no Budget, Portfolio, or Goals
    const incomePlan = savedPlans[0];
    expect(incomePlan.planType).toBe('income');
    expect(incomePlan.details.income).toBe(150000);
    expect(incomePlan.details.balance).toBe(80000);
    expect(incomePlan.details.saveRate).toBe(0.25);
    expect(incomePlan.details.autoEscalateSavings).toBe(true);

    // Verify settings updated with activePlans.incomePlanIds
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        activePlans: expect.objectContaining({
          incomePlanIds: [incomePlan.id],
          budgetPlanId: undefined,
          portfolioPlanId: undefined
        })
      })
    );
  });

  it('useWizardGenerator handles multi-step flow when incomes, budget, and goals are added', async () => {
    const savedPlans: any[] = [];
    mockSavePlan.mockImplementation(async (plan: any) => {
      savedPlans.push(plan);
      return plan.id;
    });

    let generatorHook: any;
    let wizardContext: any;

    function TestComponent() {
      wizardContext = useWizard();
      generatorHook = useWizardGenerator();
      return null;
    }

    const { render } = await import('@testing-library/react');
    const React = await import('react');

    render(
      <WizardProvider>
        <TestComponent />
      </WizardProvider>
    );

    act(() => {
      wizardContext.addIncome({ source: 'Salary A', amount: 80000, expectedGrowth: 0.04 });
      wizardContext.addIncome({ source: 'Salary B', amount: 60000, expectedGrowth: 0.02 });
      wizardContext.updateState({
        budget: { housing: 2000, utilities: 300, auto: 400, food: 800, insurance: 200, kids: 0, discretionary: 500 }
      });
      wizardContext.addGoal({ name: 'House Downpayment', type: 'house', targetAmount: 100000, timelineYears: 5, linkedAssetIds: [] });
    });

    await act(async () => {
      await generatorHook.generateAndSave();
    });

    // Should generate Income, Budget, and Goal (House)
    expect(savedPlans.length).toBe(3);
    const incomePlan = savedPlans.find(p => p.planType === 'income');
    const budgetPlan = savedPlans.find(p => p.planType === 'budget');
    const housePlan = savedPlans.find(p => p.planType === 'house');

    expect(incomePlan).toBeDefined();
    expect(incomePlan.details.income).toBe(140000); // 80k + 60k
    expect(incomePlan.details.raiseRate).toBeCloseTo(0.03); // avg of 0.04 and 0.02

    expect(budgetPlan).toBeDefined();
    expect(housePlan).toBeDefined();

    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        activePlans: expect.objectContaining({
          incomePlanIds: [incomePlan.id],
          budgetPlanId: budgetPlan.id,
          housePlanId: housePlan.id
        })
      })
    );
  });
});
