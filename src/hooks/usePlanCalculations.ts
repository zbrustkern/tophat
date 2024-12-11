import { useCallback } from 'react';
import { IncomePlan, SavingsPlan } from '@/types/chart';

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