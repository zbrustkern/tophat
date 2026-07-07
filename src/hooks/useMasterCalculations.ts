import { useMemo } from 'react';
import { Plan, GlobalSettings } from '@/types/chart';
import { useBudgetCalculations } from './useBudgetCalculations';
import { useIncomeCalculations, useSavingsCalculations, useCollegeCalculations } from './usePlanCalculations';

export interface MasterTrajectoryPoint {
  year: number;
  age: number;
  income: number;
  takeHome: number;
  expenses: number;
  preTaxSavings: number;
  postTaxSavings: number;
  netCashFlow: number;
  savingsBalance: number;
  collegeBalance: number;
  totalNetWorth: number;
}

export interface MasterDashboardData {
  waterfall: {
    grossIncome: number;
    preTaxSavings: number;
    taxes: number;
    takeHome: number;
    annualCoreBudget: number;
    postTaxSavings: number;
    netCashFlow: number;
  };
  totalAssets: number;
  allocations: {
    name: string;
    value: number;
  }[];
  trajectory: MasterTrajectoryPoint[];
}

export function useMasterCalculations() {
  const { calculateBudgetData } = useBudgetCalculations();
  const { calculateIncomeData } = useIncomeCalculations();
  const { calculateSavingsData } = useSavingsCalculations();
  const { calculateCollegeData } = useCollegeCalculations();

  const calculateMasterData = (plans: Plan[], settings: GlobalSettings | null): MasterDashboardData | null => {
    if (!settings || !settings.activePlans) return null;

    const { incomePlanId, savingsPlanId, collegePlanId, budgetPlanId } = settings.activePlans;

    // 1. Resolve Active Plans
    const incomePlan = plans.find(p => p.id === incomePlanId && p.planType === 'income');
    const savingsPlan = plans.find(p => p.id === savingsPlanId && p.planType === 'savings');
    const collegePlan = plans.find(p => p.id === collegePlanId && p.planType === 'college');
    const budgetPlan = plans.find(p => p.id === budgetPlanId && p.planType === 'budget');

    // 2. Fetch Waterfall Data from Budget Calculations
    let waterfall = {
      grossIncome: 0,
      preTaxSavings: 0,
      taxes: 0,
      takeHome: 0,
      annualCoreBudget: 0,
      postTaxSavings: 0,
      netCashFlow: 0
    };

    if (budgetPlan) {
      const budgetData = calculateBudgetData(budgetPlan as any, settings, plans);
      waterfall = budgetData.waterfall;
    }

    // 3. Compute Current Assets & Allocations
    let savingsCurrentBalance = savingsPlan ? (savingsPlan.details as any).currentBalance || 0 : 0;
    let collegeCurrentBalance = collegePlan ? (collegePlan.details as any).currentBalance || 0 : 0;
    const totalAssets = savingsCurrentBalance + collegeCurrentBalance;

    const allocations = [];
    if (savingsCurrentBalance > 0) allocations.push({ name: 'Retirement Savings', value: savingsCurrentBalance });
    if (collegeCurrentBalance > 0) allocations.push({ name: 'College Savings', value: collegeCurrentBalance });

    // 4. Compute Net Worth Trajectory (Projecting forward)
    const trajectory: MasterTrajectoryPoint[] = [];
    
    const currentAge = settings.currentAge || 30;
    const currentYear = new Date().getFullYear();
    const projectionYears = 40;

    const incomeData = incomePlan ? calculateIncomeData(incomePlan as any, settings) : [];
    const savingsDataObj = savingsPlan ? calculateSavingsData(savingsPlan as any, settings) : { chartData: [] };
    const collegeDataObj = collegePlan ? calculateCollegeData(collegePlan as any) : { chartData: [] };

    // Create lookup maps by Year
    const incomeByYear = new Map(incomeData.map((d: any) => [d.year, d]));
    
    // Savings data is by Age, we need to map to Year
    const savingsByYear = new Map(savingsDataObj.chartData.map((d: any) => [currentYear + (d.year - currentAge), d]));
    
    // College data is by Child Age
    const collegeCurrentAge = collegePlan ? (collegePlan.details as any).childAge || 0 : 0;
    const collegeByYear = new Map(collegeDataObj.chartData.map((d: any) => [currentYear + (d.age - collegeCurrentAge), d]));

    for (let i = 0; i < projectionYears; i++) {
      const year = currentYear + i;
      const age = currentAge + i;

      const incPoint = incomeByYear.get(year);
      const savPoint = savingsByYear.get(year);
      const colPoint = collegeByYear.get(year);

      const income = incPoint ? incPoint.income : 0;
      const takeHome = incPoint ? incPoint.takeHome : 0;
      const preTaxSav = incPoint ? incPoint.netContribution : 0;
      
      const savBal = savPoint ? savPoint.balance : 0;
      const colBal = colPoint ? colPoint.balance : 0;
      
      if (!incPoint && !savPoint && !colPoint && i > 0) {
        const lastPoint = trajectory[trajectory.length - 1];
        trajectory.push({
          year,
          age,
          income: 0,
          takeHome: 0,
          expenses: waterfall.annualCoreBudget,
          preTaxSavings: 0,
          postTaxSavings: 0,
          netCashFlow: -waterfall.annualCoreBudget,
          savingsBalance: lastPoint.savingsBalance,
          collegeBalance: lastPoint.collegeBalance,
          totalNetWorth: lastPoint.savingsBalance + lastPoint.collegeBalance
        });
        continue;
      }

      trajectory.push({
        year,
        age,
        income,
        takeHome,
        expenses: waterfall.annualCoreBudget,
        preTaxSavings: preTaxSav,
        postTaxSavings: (savPoint ? savPoint.savingsRate : 0) + (colPoint ? (collegeDataObj as any).calculatedMonthlyContribution * 12 : 0),
        netCashFlow: takeHome - waterfall.annualCoreBudget - (savPoint ? savPoint.savingsRate : 0) - (colPoint ? (collegeDataObj as any).calculatedMonthlyContribution * 12 : 0),
        savingsBalance: savBal,
        collegeBalance: colBal,
        totalNetWorth: savBal + colBal
      });
    }

    return {
      waterfall,
      totalAssets,
      allocations,
      trajectory
    };
  };

  return { calculateMasterData };
}
