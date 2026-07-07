import { BudgetPlan, BudgetLineItem, GlobalSettings, Plan, IncomePlan, SavingsPlan, CollegePlan, HousePlan } from '@/types/chart';
import { useIncomeCalculations, useSavingsCalculations, useCollegeCalculations } from './usePlanCalculations';

export function useBudgetCalculations() {
  const { calculateIncomeData } = useIncomeCalculations();
  const { calculateSavingsData } = useSavingsCalculations();
  const { calculateCollegeData } = useCollegeCalculations();

  const calculateBudgetData = (plan: BudgetPlan, globalSettings: GlobalSettings | null, allPlans: Plan[], activePayorId?: string) => {
    const { lineItems, useGlobalSettings } = plan.details;
    
    // 1. Calculate Core Budget Expenses (Monthly -> Annual)
    const filteredLineItems = (activePayorId && activePayorId !== 'All')
      ? lineItems.filter(item => item.payorId === activePayorId)
      : lineItems;

    let totalHouseholdMonthlyExpenses = 0;
    lineItems.forEach((item) => {
      totalHouseholdMonthlyExpenses += item.monthlyAmount;
    });

    let filteredMonthlyExpenses = 0;
    filteredLineItems.forEach((item) => {
      filteredMonthlyExpenses += item.monthlyAmount;
    });
    const annualCoreBudget = filteredMonthlyExpenses * 12;

    const resolvePlan = (planId: string | undefined, planType: string): Plan | undefined => {
      if (planId) return allPlans.find(p => p.id === planId && p.planType === planType);
      const typePlans = allPlans.filter(p => p.planType === planType);
      if (typePlans.length === 1) return typePlans[0];
      return undefined;
    };

    let incomePlans: IncomePlan[] = [];
    const allIncomePlans = allPlans.filter(p => p.planType === 'income') as IncomePlan[];
    if (globalSettings?.activePlans?.incomePlanIds && globalSettings.activePlans.incomePlanIds.length > 0) {
      incomePlans = allIncomePlans.filter(p => globalSettings.activePlans!.incomePlanIds!.includes(p.id));
    } else if (globalSettings?.activePlans?.incomePlanId) {
      const p = allIncomePlans.find(p => p.id === globalSettings.activePlans!.incomePlanId);
      if (p) incomePlans.push(p);
    } else if (allIncomePlans.length === 1) {
      incomePlans.push(allIncomePlans[0]);
    }

    let savingsPlans: SavingsPlan[] = [];
    const allSavingsPlans = allPlans.filter(p => p.planType === 'savings') as SavingsPlan[];
    if (globalSettings?.activePlans?.savingsPlanIds && globalSettings.activePlans.savingsPlanIds.length > 0) {
      savingsPlans = allSavingsPlans.filter(p => globalSettings.activePlans!.savingsPlanIds!.includes(p.id));
    } else if (globalSettings?.activePlans?.savingsPlanId) {
      const p = allSavingsPlans.find(p => p.id === globalSettings.activePlans!.savingsPlanId);
      if (p) savingsPlans.push(p);
    } else if (allSavingsPlans.length === 1) {
      savingsPlans.push(allSavingsPlans[0]);
    }
    
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

    const housePlanId = globalSettings?.activePlans?.housePlanId;
    const housePlan = resolvePlan(housePlanId, 'house') as HousePlan | undefined;

    let houseMonthlyExpense = 0;

    if (housePlan) {
      if (housePlan.details.status === 'owned') {
        const p = housePlan.details.currentLoanBalance || 0;
        const r = (housePlan.details.interestRate || 0.05) / 12;
        const n = housePlan.details.remainingTermMonths || 360;
        let basePayment = 0;
        if (r > 0 && n > 0) {
          basePayment = p * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        } else if (n > 0) {
          basePayment = p / n;
        }
        
        const extraPay = housePlan.details.extraMonthlyPayment || 0;
        
        const refiRate = housePlan.details.refinanceRate;
        const refiTerm = housePlan.details.refinanceTermMonths;
        if (refiRate !== undefined && refiTerm !== undefined) {
           const refiR = refiRate / 12;
           if (refiR > 0 && refiTerm > 0) {
             basePayment = p * (refiR * Math.pow(1 + refiR, refiTerm)) / (Math.pow(1 + refiR, refiTerm) - 1);
           } else if (refiTerm > 0) {
             basePayment = p / refiTerm;
           }
        }
        
        const mortgagePayment = basePayment + extraPay;
        const annualPropertyTax = (housePlan.details.currentValue || p) * (housePlan.details.annualPropertyTaxRate || 0.011);
        const homeInsurance = housePlan.details.annualHomeInsurance || 0;
        const maintenance = housePlan.details.annualMaintenance || 0;
        
        houseMonthlyExpense = mortgagePayment + (annualPropertyTax + homeInsurance + maintenance) / 12;
      }
    }
    
    const totalAnnualCoreBudget = annualCoreBudget + (houseMonthlyExpense * 12);

    // 3. Process Income & Taxes
    let grossIncome = 0;
    let taxes = 0;
    let takeHome = 0;
    let preTaxSavings = 0;
    let postTaxSavings = 0;

    const filteredIncomePlans = (activePayorId && activePayorId !== 'All')
      ? incomePlans.filter(ip => ip.details.payorId === activePayorId)
      : incomePlans;

    if (filteredIncomePlans.length > 0) {
      filteredIncomePlans.forEach(ip => {
        const data = calculateIncomeData(ip, globalSettings)[0]; // Year 1
        grossIncome += data.income;
        takeHome += data.takeHome;
        
        const isPreTax = ip.details.taxType === 'preTax';
        if (isPreTax) {
          preTaxSavings += data.netContribution;
          taxes += (data.income - data.netContribution - data.takeHome);
        } else {
          postTaxSavings += data.netContribution;
          taxes += (data.income - data.netContribution - data.takeHome);
        }
      });
    } else if (useGlobalSettings !== false && globalSettings?.incomes) {
      const filteredGlobalIncomes = (activePayorId && activePayorId !== 'All')
        ? globalSettings.incomes.filter(inc => inc.payorId === activePayorId)
        : globalSettings.incomes;
        
      grossIncome = filteredGlobalIncomes.reduce((acc, curr) => acc + curr.amount, 0);
      const taxRate = globalSettings.taxRate || 0.24;
      taxes = grossIncome * taxRate;
      takeHome = grossIncome - taxes;
    }

    // 4. Process Other Savings Plans

    // Process Savings Plans (target_amount goals are deducted from cash flow)
    savingsPlans.forEach(sp => {
      if (sp.details.goalType === 'target_amount') {
        const { requiredSavings } = calculateSavingsData(sp, globalSettings);
        if (sp.details.taxType === 'preTax') {
          preTaxSavings += requiredSavings;
        } else {
          postTaxSavings += requiredSavings;
        }
      }
    });

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
    // Already handled in the filteredIncomePlans loop!

    // 5. Calculate Final Net Cash Flow
    // Note: If preTaxSavings increased from savings/college plans, we should technically recalculate taxes.
    // For simplicity, we just deduct it from takeHome for now.
    const netCashFlow = takeHome - totalAnnualCoreBudget - postTaxSavings;

    return {
      waterfall: {
        grossIncome,
        preTaxSavings,
        taxes,
        takeHome,
        annualCoreBudget: totalAnnualCoreBudget,
        postTaxSavings,
        netCashFlow
      },
      totalExpenses: totalHouseholdMonthlyExpenses
    };
  };

  return { calculateBudgetData };
}
