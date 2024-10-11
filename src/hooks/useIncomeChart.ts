import { useCallback, useState } from 'react';
import { ChartData, IncomePlan } from '@/types/chart';

export function useIncomeChart() {
  const [chartData, setChartData] = useState<ChartData>([]);

  const generateFinancialData = useCallback((plan: IncomePlan): ChartData => {
    const { income, raiseRate, saveRate, balance, taxRate, returnRate } = plan.details;
    const data: ChartData = [];
    let currentIncome = income;
    let currentBalance = balance;

    for (let year = new Date().getFullYear(); year < new Date().getFullYear() + 25; year++) {
      const takeHome = (currentIncome * (1 - saveRate / 100)) * (1 - taxRate / 100);
      const netContribution = saveRate / 100 * currentIncome;
      currentBalance = currentBalance * (1 + returnRate / 100) + netContribution;
      const capitalIncome = currentBalance * returnRate / 100;
      const conservativeIncome = currentBalance * 0.04;

      data.push({
        year,
        income: Math.round(currentIncome),
        takeHome: Math.round(takeHome),
        raiseRate,
        saveRate,
        taxRate,
        netContribution: Math.round(netContribution),
        portfolioReturn: returnRate,
        balance: Math.round(currentBalance),
        capitalIncome: Math.round(capitalIncome),
        conservativeIncome: Math.round(conservativeIncome)
      });

      currentIncome *= (1 + raiseRate / 100);
    }

    return data;
  }, []);

  const calculateChartData = useCallback((plan: IncomePlan) => {
    const newChartData = generateFinancialData(plan);
    setChartData(newChartData);
  }, [generateFinancialData]);

  return { chartData, calculateChartData };
}