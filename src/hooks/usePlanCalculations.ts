import { useCallback } from 'react';
import { IncomePlan, SavingsPlan, CollegePlan, CollegeChartData } from '@/types/chart';

export function useIncomeCalculations() {
  const calculateIncomeData = useCallback((plan: IncomePlan) => {
    const {
      income: initialIncome,
      raiseRate: initialRaise,
      saveRate: initialSavingsRate,
      taxRate,
      returnRate: portfolioReturn,
      balance: initialBalance
    } = plan.details;

    const years = 25;
    const data = [];
    let currentIncome = initialIncome;
    let currentRaise = initialRaise;
    let currentSavingsRate = initialSavingsRate;
    let currentBalance = initialBalance;

    for (let year = 2024; year < 2024 + years; year++) {
      const takeHome = (currentIncome * (1 - currentSavingsRate)) * (1 - taxRate);
      const netContribution = currentSavingsRate * currentIncome;
      currentBalance = currentBalance * (1 + portfolioReturn) + netContribution;
      const capitalIncome = currentBalance * portfolioReturn;
      const conservativeIncome = currentBalance * .04;

      data.push({
        year,
        income: Math.round(currentIncome),
        takeHome: Math.round(takeHome),
        raiseRate: currentRaise,
        saveRate: currentSavingsRate,
        taxRate,
        netContribution: Math.round(netContribution),
        portfolioReturn,
        balance: Math.round(currentBalance),
        capitalIncome: Math.round(capitalIncome),
        conservativeIncome: Math.round(conservativeIncome)
      });

      currentIncome *= (1 + currentRaise);
      currentSavingsRate = Math.min(currentSavingsRate + 0.01, 1);
    }

    return data;
  }, []);

  return { calculateIncomeData };
}

export function useSavingsCalculations() {
  const calculateSavingsData = useCallback((plan: SavingsPlan) => {
    const {
      desiredIncome,
      currentAge,
      retirementAge,
      currentBalance,
      taxRate,
      returnRate
    } = plan.details;

    const years = retirementAge - currentAge;
    const data = [];
    let currentSavings = 0;
    let balance = currentBalance;

    // Calculate required savings
    const totalRequired = desiredIncome / (returnRate * (1 - taxRate));
    const yearlySavings = (totalRequired - currentBalance * Math.pow(1 + returnRate, years)) / 
                          ((Math.pow(1 + returnRate, years) - 1) / returnRate);

    for (let year = currentAge; year <= retirementAge; year++) {
      balance = balance * (1 + returnRate) + yearlySavings;
      currentSavings += yearlySavings;

      data.push({
        year,
        balance: Math.round(balance),
        savingsRate: Math.round(yearlySavings),
        totalSaved: Math.round(currentSavings),
        projectedIncome: Math.round(balance * returnRate * (1 - taxRate)),
      });
    }

    return { chartData: data, requiredSavings: yearlySavings };
  }, []);

  return { calculateSavingsData };
}

export function useCollegeCalculations() {
  const calculateCollegeData = useCallback((plan: CollegePlan) => {
    const {
      calculationMode,
      childAge,
      collegeAge,
      currentBalance,
      returnRate,
      targetAmount,
      monthlyContribution
    } = plan.details;

    const years = collegeAge - childAge;
    const data: CollegeChartData[] = [];
    let balance = currentBalance;
    let totalSaved = currentBalance;
    
    // We do yearly loop, but contributions are monthly
    const annualReturnRate = returnRate;
    const monthlyReturnRate = Math.pow(1 + annualReturnRate, 1/12) - 1;

    let calculatedMonthlyContribution = monthlyContribution;
    let finalTargetAmount = targetAmount;

    if (years <= 0) {
      return { chartData: [], calculatedMonthlyContribution: 0, finalTargetAmount: balance };
    }

    if (calculationMode === 'contribution') {
      // Solve for monthly contribution required to hit targetAmount
      // FV = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
      const totalMonths = years * 12;
      const fvPv = currentBalance * Math.pow(1 + monthlyReturnRate, totalMonths);
      
      if (monthlyReturnRate > 0) {
        calculatedMonthlyContribution = (targetAmount - fvPv) * monthlyReturnRate / (Math.pow(1 + monthlyReturnRate, totalMonths) - 1);
      } else {
        calculatedMonthlyContribution = (targetAmount - fvPv) / totalMonths;
      }
      calculatedMonthlyContribution = Math.max(0, calculatedMonthlyContribution);
    }

    // Now generate chart data year by year
    for (let age = childAge; age <= collegeAge; age++) {
      if (age > childAge) {
        // Apply 12 months of growth and contributions
        for (let m = 0; m < 12; m++) {
          balance = balance * (1 + monthlyReturnRate) + calculatedMonthlyContribution;
          totalSaved += calculatedMonthlyContribution;
        }
      }

      data.push({
        age,
        balance: Math.round(balance),
        totalContributions: Math.round(totalSaved),
        projectedCost: calculationMode === 'contribution' ? targetAmount : Math.round(balance)
      });
    }

    if (calculationMode === 'goal') {
      finalTargetAmount = Math.round(balance);
    }

    return { 
      chartData: data, 
      calculatedMonthlyContribution: Math.round(calculatedMonthlyContribution),
      finalTargetAmount: Math.round(finalTargetAmount)
    };
  }, []);

  return { calculateCollegeData };
}