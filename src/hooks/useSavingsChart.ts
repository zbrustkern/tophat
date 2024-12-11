import { useCallback, useState } from 'react';
import { SavingsChartData, SavingsPlan } from '@/types/chart';

export function useSavingsChart() {
  const [chartData, setChartData] = useState<SavingsChartData[]>([]);
  const [requiredSavings, setRequiredSavings] = useState(0);

  const calculateChartData = useCallback((plan: SavingsPlan) => {
    const {
      desiredIncome,
      currentAge,
      retirementAge,
      currentBalance,
      taxRate,
      returnRate
    } = plan.details;

    const years = retirementAge - currentAge;
    const data: SavingsChartData[] = [];
    let balance = currentBalance;
    let currentSavings = 0;

    // Calculate required savings
    const totalRequired = desiredIncome / (returnRate * (1 - taxRate));
    const yearlySavings = (totalRequired - currentBalance * Math.pow(1 + returnRate, years)) / 
                          ((Math.pow(1 + returnRate, years) - 1) / returnRate);

    setRequiredSavings(yearlySavings);

    for (let year = currentAge; year <= retirementAge; year++) {
      balance = balance * (1 + returnRate) + yearlySavings;
      currentSavings += yearlySavings;

      data.push({
        year,
        balance: Math.round(balance),
        savingsRate: Math.round(yearlySavings),
        totalSaved: Math.round(currentSavings),
        projectedIncome: Math.round(balance * returnRate * (1 - taxRate))
      });
    }

    setChartData(data);
    return { chartData: data, requiredSavings: yearlySavings };
  }, []);

  return { chartData, requiredSavings, calculateChartData };
}