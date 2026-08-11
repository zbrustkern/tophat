import { useMemo } from 'react';
import { Plan, PlanType, GlobalSettings } from '@/types/chart';
import { useBudgetCalculations } from './useBudgetCalculations';
import { useIncomeCalculations, useSavingsCalculations, useCollegeCalculations } from './usePlanCalculations';
import { useHouseCalculations } from './useHouseCalculations';

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
  homeEquity: number;
  totalNetWorth: number;
}

export interface RetirementGoalAnalysis {
  targetAnnualIncome: number;
  requiredPortfolio: number;
  projectedNetWorthAtRetirement: number;
  yearsToRetirement: number;
  retirementAge: number;
  isAchieved: boolean;
  monthlyAdjustmentNeeded: number;
  statusMessage: string;
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
  retirementGoal: RetirementGoalAnalysis;
}

export function useMasterCalculations() {
  const { calculateBudgetData } = useBudgetCalculations();
  const { calculateIncomeData } = useIncomeCalculations();
  const { calculateSavingsData } = useSavingsCalculations();
  const { calculateCollegeData } = useCollegeCalculations();
  const { calculateHouseData } = useHouseCalculations();

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
    let incomePlans: Plan[] = [];
    const allIncomePlans = plans.filter(p => p.planType === 'income');
    if (activePlans.incomePlanIds && activePlans.incomePlanIds.length > 0) {
      incomePlans = allIncomePlans.filter(p => activePlans.incomePlanIds!.includes(p.id));
    } else if (activePlans.incomePlanId) {
      const p = allIncomePlans.find(p => p.id === activePlans.incomePlanId);
      if (p) incomePlans.push(p);
    } else if (allIncomePlans.length === 1) {
      incomePlans.push(allIncomePlans[0]);
    }

    let savingsPlans: Plan[] = [];
    const allSavingsPlans = plans.filter(p => p.planType === 'savings');
    if (activePlans.savingsPlanIds && activePlans.savingsPlanIds.length > 0) {
      savingsPlans = allSavingsPlans.filter(p => activePlans.savingsPlanIds!.includes(p.id));
    } else if (activePlans.savingsPlanId) {
      const p = allSavingsPlans.find(p => p.id === activePlans.savingsPlanId);
      if (p) savingsPlans.push(p);
    } else if (allSavingsPlans.length === 1) {
      savingsPlans.push(allSavingsPlans[0]);
    }

    const budgetPlan = resolvePlan(activePlans.budgetPlanId, 'budget');
    const portfolioPlans = plans.filter(p => p.planType === 'rebalance');
    const portfolioPlan = resolvePlan(activePlans.portfolioPlanId, 'rebalance'); // Legacy, keeping just in case
    const housePlan = resolvePlan(activePlans.housePlanId, 'house');

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
    let totalAssets = 0;
    const allocations: { name: string; value: number }[] = [];

    // All Portfolios are physical money, add them
    portfolioPlans.forEach(p => {
      const details = p.details as any;
      const bal = (details.currentCash || 0) + (details.currentEquity || 0);
      if (bal > 0) {
        allocations.push({ name: p.planName, value: bal });
        totalAssets += bal;
      }
    });

    // Goals that are NOT linked to a portfolio are assumed to be manual cash piles
    savingsPlans.forEach(sp => {
      const details = sp.details as any;
      const hasLinks = details.linkedPortfolioIds && details.linkedPortfolioIds.length > 0;
      if (!hasLinks) {
        const bal = details.currentBalance || 0;
        if (bal > 0) {
          allocations.push({ name: sp.planName, value: bal });
          totalAssets += bal;
        }
      }
    });

    collegePlans.forEach(cp => {
      const details = cp.details as any;
      const hasLinks = details.linkedPortfolioIds && details.linkedPortfolioIds.length > 0;
      if (!hasLinks) {
        const bal = details.currentBalance || 0;
        if (bal > 0) {
          allocations.push({ name: cp.planName, value: bal });
          totalAssets += bal;
        }
      }
    });

    // Home Equity
    let homeEquityCurrent = 0;
    if (housePlan) {
      const details = housePlan.details as any;
      if (details.status === 'owned') {
        const val = details.currentValue || 0;
        const loan = details.currentLoanBalance || 0;
        homeEquityCurrent = val - loan;
      } else {
        homeEquityCurrent = details.currentSavings || 0;
      }
    }
    
    if (homeEquityCurrent > 0) {
      if (housePlan && (housePlan.details as any).status === 'planning') {
        allocations.push({ name: 'Home Down Payment Savings', value: homeEquityCurrent });
      } else {
        allocations.push({ name: 'Home Equity', value: homeEquityCurrent });
      }
      totalAssets += homeEquityCurrent;
    }

    let unlinkedPortfoliosBalance = 0;
    portfolioPlans.forEach(p => {
      // Check if it's linked to ANY active savings or college plan or house plan
      const isLinkedToSavings = savingsPlans.some(sp => ((sp.details as any).linkedPortfolioIds || []).includes(p.id));
      const isLinkedToCollege = collegePlans.some(cp => ((cp.details as any).linkedPortfolioIds || []).includes(p.id));
      const isLinkedToHouse = housePlan && ((housePlan.details as any).linkedPortfolioIds || []).includes(p.id);
      
      if (!isLinkedToSavings && !isLinkedToCollege && !isLinkedToHouse) {
        unlinkedPortfoliosBalance += ((p.details as any).currentCash || 0) + ((p.details as any).currentEquity || 0);
      }
    });

    // 4. Compute Net Worth Trajectory (Projecting forward)
    const trajectory: MasterTrajectoryPoint[] = [];
    
    const currentAge = settings.currentAge || 30;
    const currentYear = new Date().getFullYear();
    const projectionYears = 40;

    const incomeDataObjs = incomePlans.map(ip => calculateIncomeData(ip as any, settings));
    const savingsDataObjs = savingsPlans.map(sp => ({
      plan: sp,
      data: calculateSavingsData(sp as any, settings, plans)
    }));
    const houseData = housePlan ? calculateHouseData(housePlan as any, settings) : [];
    
    // College data for all active college plans
    const collegeDataObjs = collegePlans.map(cp => ({
      plan: cp,
      data: calculateCollegeData(cp as any, settings, plans)
    }));

    // Create lookup maps by Year
    // Multiple income plans -> map by Year -> Array of points
    const incomeByYear = new Map<number, any[]>();
    incomeDataObjs.forEach(dataArr => {
      dataArr.forEach((d: any) => {
        if (!incomeByYear.has(d.year)) incomeByYear.set(d.year, []);
        incomeByYear.get(d.year)!.push(d);
      });
    });
    
    // House data is by month, we need to map to year (take the last month of the year or average, let's take month % 12 === 11 or max month)
    const houseByYear = new Map<number, any>();
    if (houseData.length > 0) {
      houseData.forEach((d: any) => {
        // Just take the year-end value (month 11, 23, etc. or just overwrite so we get the latest month in that year)
        houseByYear.set(d.year, d);
      });
    }
    
    // Savings data is already by Year
    const savingsMaps = savingsDataObjs.map(obj => ({
      data: obj.data,
      byYear: new Map(obj.data.chartData.map((d: any) => [d.year, d]))
    }));
    
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
      
      let savBal = 0;
      let savPointFound = false;
      savingsMaps.forEach(sm => {
        const pt = sm.byYear.get(year);
        if (pt) {
          savBal += pt.balance;
          savPointFound = true;
        }
      });
      
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

      let incPointFound = false;
      let totalIncome = 0;
      let totalTakeHome = 0;
      let totalPreTaxSav = 0;
      let totalPostTaxSav = colContrib;

      const incPoints = incomeByYear.get(year);
      if (incPoints) {
        incPointFound = true;
        incPoints.forEach((pt: any) => {
           // We'll need the original plan to know if it's preTax or postTax.
           // For simplicity, we can assume preTax unless explicitly specified.
           // Actually, we lost the plan reference here, but we can just use pt.netContribution.
           // If we really need exact tax mapping we should pass it from the data object.
           totalIncome += pt.income;
           totalTakeHome += pt.takeHome;
           // If we assume all income plans are preTax for simplicity, or we map it:
           // In calculateIncomeData we didn't expose 'isPreTax' in the point. Let's assume preTax.
           totalPreTaxSav += pt.netContribution; 
        });
      }
      
      const hData = houseByYear.get(year);
      const hEquity = hData ? (hData.equity > 0 ? hData.equity : hData.savingsBalance) : 0;
      
      if (!incPointFound && !savPointFound && !colPointFound && !hData && i > 0) {
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
          homeEquity: lastPoint.homeEquity,
          totalNetWorth: lastPoint.savingsBalance + lastPoint.collegeBalance + unlinkedPortfoliosBalance + lastPoint.homeEquity
        });
        continue;
      }

      trajectory.push({
        year,
        age,
        income: totalIncome,
        takeHome: totalTakeHome,
        expenses: waterfall.annualCoreBudget,
        preTaxSavings: totalPreTaxSav,
        postTaxSavings: totalPostTaxSav,
        netCashFlow: totalTakeHome - waterfall.annualCoreBudget - totalPostTaxSav,
        savingsBalance: savBal,
        collegeBalance: colBal,
        homeEquity: hEquity,
        totalNetWorth: savBal + colBal + unlinkedPortfoliosBalance + hEquity
      });
    }

    // 5. Compute Retirement Goal Analysis
    const retirementAge = settings.retirementAge || 65;
    const currentAgeVal = settings.currentAge || 30;
    const yearsToRetirement = Math.max(1, retirementAge - currentAgeVal);
    const swr = settings.withdrawalRate || 0.04;

    const targetAnnualIncome = waterfall.annualCoreBudget > 0 ? waterfall.annualCoreBudget : 100000;
    const requiredPortfolio = targetAnnualIncome / swr;

    const retirementPoint = trajectory.find(p => p.age === retirementAge) || trajectory[trajectory.length - 1];
    const projectedNetWorthAtRetirement = retirementPoint ? retirementPoint.totalNetWorth : 0;
    
    const isAchieved = projectedNetWorthAtRetirement >= requiredPortfolio;
    const deficit = Math.max(0, requiredPortfolio - projectedNetWorthAtRetirement);
    
    // Estimate additional monthly savings needed over remaining years to bridge deficit at expected return
    const returnRate = settings.returnRate || 0.07;
    const monthlyReturn = returnRate / 12;
    const totalMonths = yearsToRetirement * 12;
    const fvFactor = ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn) || totalMonths;
    const monthlyAdjustmentNeeded = deficit > 0 ? Math.round(deficit / fvFactor) : 0;

    let statusMessage = '';
    if (isAchieved) {
      statusMessage = `At current savings and return expectations, your retirement income goal is fully funded by age ${retirementAge}! Surplus cash flow can be allocated to 529 College or Tactical Growth.`;
    } else {
      statusMessage = `To reach your target retirement income of $${targetAnnualIncome.toLocaleString()}/yr by age ${retirementAge}, you need to save an additional $${monthlyAdjustmentNeeded.toLocaleString()}/mo.`;
    }

    const retirementGoal: RetirementGoalAnalysis = {
      targetAnnualIncome,
      requiredPortfolio,
      projectedNetWorthAtRetirement,
      yearsToRetirement,
      retirementAge,
      isAchieved,
      monthlyAdjustmentNeeded,
      statusMessage
    };

    return {
      waterfall,
      totalAssets,
      allocations,
      trajectory,
      retirementGoal
    };
  };

  return { calculateMasterData };
}
