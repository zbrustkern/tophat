import { useMemo } from 'react';
import { Plan, PlanType, GlobalSettings } from '@/types/chart';
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

    const activePlans = settings.activePlans || {};

    const resolvePlan = (planId: string | undefined, planType: PlanType): Plan | undefined => {
      if (planId) return plans.find(p => p.id === planId && p.planType === planType);
      const typePlans = plans.filter(p => p.planType === planType);
      if (typePlans.length === 1) return typePlans[0];
      return undefined;
    };

    // 1. Resolve Active Plans
    const incomePlan = resolvePlan(activePlans.incomePlanId, 'income');
    const savingsPlan = resolvePlan(activePlans.savingsPlanId, 'savings');
    const budgetPlan = resolvePlan(activePlans.budgetPlanId, 'budget');
    const portfolioPlan = resolvePlan(activePlans.portfolioPlanId, 'rebalance');

    let collegePlans: Plan[] = [];
    const allCollegePlans = plans.filter(p => p.planType === 'college');
    if (activePlans.collegePlanIds && activePlans.collegePlanIds.length > 0) {
      collegePlans = allCollegePlans.filter(p => activePlans.collegePlanIds!.includes(p.id));
    } else if (activePlans.collegePlanId) {
      const p = allCollegePlans.find(p => p.id === activePlans.collegePlanId);
      if (p) collegePlans.push(p);
    } else if (allCollegePlans.length === 1) {
      collegePlans.push(allCollegePlans[0]);
    }

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
    let collegeCurrentBalance = collegePlans.reduce((sum, cp) => sum + ((cp.details as any).currentBalance || 0), 0);
    let portfolioCurrentBalance = portfolioPlan ? ((portfolioPlan.details as any).currentCash || 0) + ((portfolioPlan.details as any).currentEquity || 0) : 0;
    const totalAssets = savingsCurrentBalance + collegeCurrentBalance + portfolioCurrentBalance;

    const allocations = [];
    if (savingsCurrentBalance > 0) allocations.push({ name: 'Retirement Savings', value: savingsCurrentBalance });
    collegePlans.forEach(cp => {
      const bal = (cp.details as any).currentBalance || 0;
      if (bal > 0) allocations.push({ name: cp.planName, value: bal });
    });
    if (portfolioCurrentBalance > 0) allocations.push({ name: 'Investment Portfolio', value: portfolioCurrentBalance });

    // 4. Compute Net Worth Trajectory (Projecting forward)
    const trajectory: MasterTrajectoryPoint[] = [];
    
    const currentAge = settings.currentAge || 30;
    const currentYear = new Date().getFullYear();
    const projectionYears = 40;

    const incomeData = incomePlan ? calculateIncomeData(incomePlan as any, settings) : [];
    const savingsDataObj = savingsPlan ? calculateSavingsData(savingsPlan as any, settings) : { chartData: [] };
    
    // College data for all active college plans
    const collegeDataObjs = collegePlans.map(cp => ({
      plan: cp,
      data: calculateCollegeData(cp as any)
    }));

    // Create lookup maps by Year
    const incomeByYear = new Map(incomeData.map((d: any) => [d.year, d]));
    
    // Savings data is by Age, we need to map to Year
    const savingsByYear = new Map(savingsDataObj.chartData.map((d: any) => [currentYear + (d.year - currentAge), d]));
    
    // College data is by Child Age
    const collegeMaps = collegeDataObjs.map(obj => {
      const childAge = (obj.plan.details as any).childAge || 0;
      return {
        data: obj.data,
        byYear: new Map(obj.data.chartData.map((d: any) => [currentYear + (d.age - childAge), d]))
      };
    });

    for (let i = 0; i < projectionYears; i++) {
      const year = currentYear + i;
      const age = currentAge + i;

      const incPoint = incomeByYear.get(year);
      const savPoint = savingsByYear.get(year);
      
      let colBal = 0;
      let colContrib = 0;
      let colPointFound = false;

      collegeMaps.forEach(cm => {
        const pt = cm.byYear.get(year);
        if (pt) {
          colBal += pt.balance;
          colContrib += (cm.data as any).calculatedMonthlyContribution * 12;
          colPointFound = true;
        }
      });

      const income = incPoint ? incPoint.income : 0;
      const takeHome = incPoint ? incPoint.takeHome : 0;
      const preTaxSav = incPoint ? incPoint.netContribution : 0;
      
      const savBal = savPoint ? savPoint.balance : 0;
      
      if (!incPoint && !savPoint && !colPointFound && i > 0) {
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
          totalNetWorth: lastPoint.savingsBalance + lastPoint.collegeBalance + portfolioCurrentBalance
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
        postTaxSavings: (savPoint ? savPoint.savingsRate : 0) + colContrib,
        netCashFlow: takeHome - waterfall.annualCoreBudget - (savPoint ? savPoint.savingsRate : 0) - colContrib,
        savingsBalance: savBal,
        collegeBalance: colBal,
        totalNetWorth: savBal + colBal + portfolioCurrentBalance
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
