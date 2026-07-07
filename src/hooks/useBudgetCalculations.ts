import { BudgetPlan, BudgetLineItem, GlobalSettings } from '@/types/chart';

export function useBudgetCalculations() {
  const calculateBudgetData = (plan: BudgetPlan, globalSettings: GlobalSettings | null) => {
    const { lineItems, useGlobalSettings } = plan.details;
    let totalExpenses = 0;
    
    // Calculate total expenses
    lineItems.forEach((item) => {
      totalExpenses += item.monthlyAmount;
    });

    // We can also calculate expenses grouped by payor
    const expensesByPayor: Record<string, number> = {};
    lineItems.forEach(item => {
      if (!expensesByPayor[item.payorId]) {
        expensesByPayor[item.payorId] = 0;
      }
      expensesByPayor[item.payorId] += item.monthlyAmount;
    });

    // Pull in global incomes if using global settings
    let incomesByPayor: Record<string, number> = {};
    if (useGlobalSettings !== false && globalSettings?.incomes) {
      globalSettings.incomes.forEach(inc => {
        incomesByPayor[inc.payorId] = inc.amount;
      });
    }

    const discretionaryByPayor: Record<string, number> = {};
    Object.keys(incomesByPayor).forEach(payorId => {
      const income = incomesByPayor[payorId] || 0;
      const expense = expensesByPayor[payorId] || 0;
      discretionaryByPayor[payorId] = income - expense;
    });

    const totalIncome = Object.values(incomesByPayor).reduce((a, b) => a + b, 0);
    const totalDiscretionary = totalIncome - totalExpenses;

    return {
      totalExpenses,
      expensesByPayor,
      incomesByPayor,
      discretionaryByPayor,
      totalIncome,
      totalDiscretionary
    };
  };

  return { calculateBudgetData };
}
