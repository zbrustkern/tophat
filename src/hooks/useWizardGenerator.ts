import { useWizard } from '@/components/onboarding/WizardProvider';
import { usePlanManagement } from '@/hooks/usePlanManagement';
import { useSettings } from '@/contexts/SettingsContext';
import { Plan, IncomePlan, BudgetPlan, RebalancePlan, SavingsPlan, CollegePlan, HousePlan, GlobalSettings } from '@/types/chart';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';

export function useWizardGenerator() {
  const { state } = useWizard();
  const { savePlan } = usePlanManagement<Plan>();
  const { settings, updateSettings } = useSettings();

  const generateAndSave = async () => {
    const timestamp = new Date();
    const newPlans: Plan[] = [];

    // 1. Generate Income Plan
    const incomePlanId = uuidv4();
    const totalIncome = state.incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const avgGrowth = state.incomes.length > 0 
      ? state.incomes.reduce((sum, inc) => sum + inc.expectedGrowth, 0) / state.incomes.length 
      : 0.03;

    const incomePlan: IncomePlan = {
      id: incomePlanId,
      planName: 'Primary Income',
      planType: 'income',
      lastUpdated: timestamp,
      details: {
        income: totalIncome,
        raiseRate: avgGrowth,
        saveRate: 0.15,
        balance: 0,
        taxRate: 0.24,
        returnRate: 0.07,
        useGlobalSettings: true,
        taxType: 'preTax'
      }
    };
    newPlans.push(incomePlan);

    // 2. Generate Budget Plan
    const budgetPlanId = uuidv4();
    const budgetPlan: BudgetPlan = {
      id: budgetPlanId,
      planName: 'Core Budget',
      planType: 'budget',
      lastUpdated: timestamp,
      details: {
        lineItems: [
          { id: uuidv4(), bill: 'Housing & Utilities', company: 'Various', monthlyAmount: state.budget.housing, category: 'Housing', payorId: 'Joint' },
          { id: uuidv4(), bill: 'Living Expenses', company: 'Various', monthlyAmount: state.budget.living, category: 'Living', payorId: 'Joint' },
          { id: uuidv4(), bill: 'Discretionary', company: 'Various', monthlyAmount: state.budget.discretionary, category: 'Discretionary', payorId: 'Joint' }
        ]
      }
    };
    newPlans.push(budgetPlan);

    // 3. Generate Portfolios (Assets)
    const portfolioIds: string[] = [];
    state.assets.forEach(asset => {
      const portfolioId = uuidv4();
      portfolioIds.push(portfolioId);
      const portfolio: RebalancePlan = {
        id: portfolioId,
        planName: asset.name,
        planType: 'rebalance',
        lastUpdated: timestamp,
        details: {
          assets: [
            { id: uuidv4(), symbol: 'CASH', type: 'cash', price: asset.balance, shares: 1, riskTier: asset.type === 'Cash' ? 'core' : 'growth' }
          ],
          portfolioPurpose: asset.purpose === 'Core' ? 'Core Wealth' : asset.purpose,
          targetAnnualReturn: 0.07,
          initialPrincipal: asset.balance,
          currentCash: asset.type === 'Cash' ? asset.balance : 0,
          currentEquity: asset.type !== 'Cash' ? asset.balance : 0,
          monthlyContribution: 0,
          monthsElapsed: 0,
          mockVix: 15
        }
      };
      newPlans.push(portfolio);
    });

    // 4. Generate Goals (Savings, College, House)
    const savingsIds: string[] = [];
    const collegeIds: string[] = [];
    const houseIds: string[] = [];

    state.goals.forEach(goal => {
      const goalId = uuidv4();
      if (goal.type === 'college') {
        collegeIds.push(goalId);
        const cp: CollegePlan = {
          id: goalId,
          planName: goal.name,
          planType: 'college',
          lastUpdated: timestamp,
          details: {
            calculationMode: 'goal',
            childAge: 0,
            collegeAge: goal.timelineYears || 18,
            currentBalance: 0,
            returnRate: 0.07,
            targetAmount: goal.targetAmount || 40000,
            monthlyContribution: 0,
            linkedPortfolioIds: []
          }
        };
        newPlans.push(cp);
      } else if (goal.type === 'house') {
        houseIds.push(goalId);
        const hp: HousePlan = {
          id: goalId,
          planName: goal.name,
          planType: 'house',
          lastUpdated: timestamp,
          details: {
            status: 'owned',
            currentValue: goal.targetAmount || 500000,
            originalLoanAmount: (goal.targetAmount || 500000) * 0.8,
            currentLoanBalance: (goal.targetAmount || 500000) * 0.8,
            interestRate: 0.07,
            remainingTermMonths: 360,
            linkedPortfolioIds: []
          }
        };
        newPlans.push(hp);
      } else {
        savingsIds.push(goalId);
        const sp: SavingsPlan = {
          id: goalId,
          planName: goal.name,
          planType: 'savings',
          lastUpdated: timestamp,
          details: {
            goalType: goal.type === 'income_stream' ? 'income_stream' : 'target_amount',
            targetAmount: goal.targetAmount || 100000,
            timelineYears: goal.timelineYears || 10,
            currentBalance: 0,
            taxRate: 0.15,
            returnRate: 0.07,
            linkedPortfolioIds: []
          }
        };
        newPlans.push(sp);
      }
    });

    // Save all to Firestore
    for (const plan of newPlans) {
      await savePlan(plan);
    }

    // 5. Update Global Settings
    const newSettings: GlobalSettings = {
      taxRate: 0.24,
      returnRate: 0.07,
      withdrawalRate: 0.04,
      inflationRate: 0.03,
      payors: ['Joint'],
      ...settings,
      currentAge: state.age,
      retirementAge: state.retirementAge,
      incomes: state.incomes.map(i => ({ payorId: 'Joint', amount: i.amount })),
      activePlans: {
        incomePlanIds: [incomePlanId],
        budgetPlanId: budgetPlanId,
        savingsPlanIds: savingsIds,
        collegePlanIds: collegeIds,
        housePlanId: houseIds[0] // Settings currently only supports one house plan in activePlans, though we should probably support an array eventually
      }
    };
    await updateSettings(newSettings);
    
    return true;
  };

  return { generateAndSave };
}
