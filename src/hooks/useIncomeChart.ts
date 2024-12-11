import { useCallback, useState } from 'react';
import { IncomeChartData, IncomePlan } from '@/types/chart';

export function useIncomeChart() {
  const [chartData, setChartData] = useState<IncomeChartData[]>([]);

  const calculateChartData = useCallback((plan: IncomePlan) => {
    const {
      income: initialIncome,
      raiseRate: initialRaise,
      saveRate: initialSavingsRate,
      taxRate,
      returnRate: portfolioReturn,
      balance: initialBalance
    } = plan.details;

    const years = 25;
    const data: IncomeChartData[] = [];
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

    setChartData(data);
  }, []);

  return { chartData, calculateChartData };
}