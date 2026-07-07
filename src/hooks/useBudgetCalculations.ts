import { BudgetPlan, BudgetLineItem, GlobalSettings, Plan, IncomePlan, SavingsPlan, CollegePlan } from '@/types/chart';
import { useIncomeCalculations, useSavingsCalculations, useCollegeCalculations } from './usePlanCalculations';

export function useBudgetCalculations() {
  const { calculateIncomeData } = useIncomeCalculations();
  const { calculateSavingsData } = useSavingsCalculations();
  const { calculateCollegeData } = useCollegeCalculations();

  const calculateBudgetData = (plan: BudgetPlan, globalSettings: GlobalSettings | null, allPlans: Plan[]) => {
    const { lineItems, useGlobalSettings } = plan.details;
    
    // 1. Calculate Core Budget Expenses (Monthly -> Annual)
    let totalMonthlyExpenses = 0;
    lineItems.forEach((item) => {
      totalMonthlyExpenses += item.monthlyAmount;
    });
    const annualCoreBudget = totalMonthlyExpenses * 12;

    const activeIncomeId = globalSettings?.activePlans?.incomePlanId;
    const activeSavingsId = globalSettings?.activePlans?.savingsPlanId;

    const resolvePlan = (planId: string | undefined, planType: string): Plan | undefined => {
      if (planId) return allPlans.find(p => p.id === planId && p.planType === planType);
      const typePlans = allPlans.filter(p => p.planType === planType);
      if (typePlans.length === 1) return typePlans[0];
      return undefined;
    };

    const incomePlan = resolvePlan(activeIncomeId, 'income') as IncomePlan | undefined;
    const savingsPlan = resolvePlan(activeSavingsId, 'savings') as SavingsPlan | undefined;
    
    let collegePlans: CollegePlan[] = [];
    const allCollegePlans = allPlans.filter(p => p.planType === 'college') as CollegePlan[];
    if (globalSettings?.activePlans?.collegePlanIds && globalSettings.activePlans.collegePlanIds.length > 0) {
      collegePlans = allCollegePlans.filter(p => globalSettings.activePlans!.collegePlanIds!.includes(p.id));
    } else if (globalSettings?.activePlans?.collegePlanId) {
      const p = allCollegePlans.find(p => p.id === globalSettings.activePlans!.collegePlanId);
      if (p) collegePlans.push(p);
    } else if (allCollegePlans.length === 1) {
      collegePlans.push(allCollegePlans[0]);
    }

    // 3. Process Income & Taxes
    let grossIncome = 0;
    let taxes = 0;
    let takeHome = 0;
    let preTaxSavings = 0;
    
    // Process Income Plan Savings
    let incomePlanSavings = 0;
    let incomePlanIsPreTax = true;

    if (incomePlan) {
      const data = calculateIncomeData(incomePlan, globalSettings)[0]; // Year 1
      grossIncome = data.income;
      takeHome = data.takeHome;
      incomePlanSavings = data.netContribution;
      incomePlanIsPreTax = incomePlan.details.taxType === 'preTax';
      
      if (incomePlanIsPreTax) {
        preTaxSavings += incomePlanSavings;
        taxes = grossIncome - preTaxSavings - takeHome;
      } else {
        taxes = grossIncome - incomePlanSavings - takeHome;
      }
    } else if (useGlobalSettings !== false && globalSettings?.incomes) {
      grossIncome = globalSettings.incomes.reduce((acc, curr) => acc + curr.amount, 0);
      const taxRate = globalSettings.taxRate || 0.24;
      taxes = grossIncome * taxRate;
      takeHome = grossIncome - taxes;
    }

    // 4. Process Other Savings Plans
    let postTaxSavings = 0;

    // We do NOT deduct SavingsPlan required savings from cash flow here, 
    // because IncomePlan already captures the reality of retirement contributions.
    // SavingsPlan is an aspirational goal-seeker.

    collegePlans.forEach(cp => {
      const { calculatedMonthlyContribution } = calculateCollegeData(cp);
      const annualCollege = calculatedMonthlyContribution * 12;
      if (cp.details.taxType === 'preTax') {
        preTaxSavings += annualCollege;
      } else {
        postTaxSavings += annualCollege;
      }
    });

    // Add Income Plan post-tax savings if applicable
    if (!incomePlanIsPreTax) {
      postTaxSavings += incomePlanSavings;
    }

    // 5. Calculate Final Net Cash Flow
    // Note: If preTaxSavings increased from savings/college plans, we should technically recalculate taxes.
    // For simplicity, we just deduct it from takeHome for now.
    const netCashFlow = takeHome - annualCoreBudget - postTaxSavings;

    return {
      waterfall: {
        grossIncome,
        preTaxSavings,
        taxes,
        takeHome,
        annualCoreBudget,
        postTaxSavings,
        netCashFlow
      },
      totalExpenses: totalMonthlyExpenses
    };
  };

  return { calculateBudgetData };
}
