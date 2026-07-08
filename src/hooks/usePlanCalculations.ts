import { useCallback } from 'react';
import { IncomePlan, SavingsPlan, CollegePlan, CollegeChartData, GlobalSettings } from '@/types/chart';
import { calculateTaxes } from '@/lib/taxes/engine';
import { DISASTERS, DisasterType } from '@/lib/simulators/disasters';

export function useIncomeCalculations() {
  const calculateIncomeData = useCallback((plan: IncomePlan, globalSettings?: GlobalSettings | null) => {
    const {
      income: initialIncome,
      raiseRate: initialRaise,
      saveRate: initialSavingsRate,
      taxRate,
      returnRate: portfolioReturn,
      balance: initialBalance,
      autoEscalateSavings = true,
      escalationRate = 0.01,
      saveMode = 'rate',
      saveAmount = 0,
      withdrawalRate = 0.04,
      useGlobalSettings,
      employerMatchLimit = 0,
      employerMatchRate = 0,
      disasterConfig,
      taxType = 'preTax'
    } = plan.details;

    const years = 25;
    const data = [];
    let currentIncome = initialIncome;
    let currentRaise = initialRaise;
    let currentSavingsRate = initialSavingsRate;
    let currentBalance = initialBalance;

    const isFixed = saveMode === 'fixed';
    
    // Resolve random start year if needed
    let resolvedStartYear: number | null = null;
    if (disasterConfig?.active && disasterConfig.type) {
      if (disasterConfig.startYear === 'random') {
        // Pick a random year between 1 and 20 (so it happens during the plan)
        resolvedStartYear = Math.floor(Math.random() * 20) + 1;
      } else {
        resolvedStartYear = Number(disasterConfig.startYear);
      }
    }

    for (let year = 2024; year < 2024 + years; year++) {
      const yearOffset = year - 2024;
      
      let currentYearReturnRate = portfolioReturn;
      // Check for disaster shock
      if (disasterConfig?.active && resolvedStartYear !== null) {
        const disaster = DISASTERS[disasterConfig.type as DisasterType];
        if (disaster) {
          const shockIndex = yearOffset - resolvedStartYear;
          if (shockIndex >= 0 && shockIndex < disaster.duration) {
            const shock = disaster.shocks.find(s => s.yearOffset === shockIndex);
            if (shock) {
              currentYearReturnRate = shock.returnModifier;
              // we don't have inflation in income planner currently, but we could add it
            }
          }
        }
      }

      const netContribution = isFixed 
        ? Math.min(saveAmount, currentIncome) 
        : currentSavingsRate * currentIncome;
      
      const effectiveSavingsRate = isFixed ? (netContribution / currentIncome) : currentSavingsRate;

      // Handle tax type for deductions
      const isPreTax = taxType === 'preTax';
      const taxableIncome = isPreTax ? Math.max(0, currentIncome - netContribution) : currentIncome;

      let effectiveTaxRate = taxRate;
      if (useGlobalSettings !== false && globalSettings) {
        const result = calculateTaxes(
          taxableIncome, 
          globalSettings.filingStatus || 'Single', 
          globalSettings.stateOfResidence || 'TX', 
          globalSettings.dependents || 0
        );
        effectiveTaxRate = result.effectiveTaxRate;
      }

      // Calculate Employer Match
      const eligibleContributionRate = Math.min(effectiveSavingsRate, employerMatchLimit);
      const employerMatchAmount = eligibleContributionRate * currentIncome * employerMatchRate;
      
      const totalTaxes = taxableIncome * effectiveTaxRate;
      const takeHome = currentIncome - netContribution - totalTaxes;
      
      // Both employee netContribution and employerMatchAmount go into the portfolio
      currentBalance = currentBalance * (1 + currentYearReturnRate) + netContribution + employerMatchAmount;
      const capitalIncome = currentBalance * currentYearReturnRate;
      const conservativeIncome = currentBalance * withdrawalRate;

      data.push({
        year,
        income: Math.round(currentIncome),
        takeHome: Math.round(takeHome),
        raiseRate: currentRaise,
        saveRate: effectiveSavingsRate,
        taxRate: effectiveTaxRate,
        netContribution: Math.round(netContribution),
        portfolioReturn: currentYearReturnRate,
        balance: Math.round(currentBalance),
        capitalIncome: Math.round(capitalIncome),
        conservativeIncome: Math.round(conservativeIncome),
        employerMatchAmount: Math.round(employerMatchAmount)
      });

      currentIncome *= (1 + currentRaise);
      if (autoEscalateSavings) {
        currentSavingsRate = Math.min(currentSavingsRate + escalationRate, 1);
      }
    }

    return data;
  }, []);

  return { calculateIncomeData };
}

export function useSavingsCalculations() {
  const calculateSavingsData = useCallback((plan: SavingsPlan, globalSettings?: GlobalSettings | null) => {
    const {
      goalType,
      desiredIncome,
      currentAge,
      retirementAge,
      targetAmount,
      timelineYears,
      currentBalance,
      taxRate,
      returnRate,
      withdrawalRate,
      futureTaxRateScenario,
      useGlobalSettings
    } = plan.details;

    const currentYear = new Date().getFullYear();

    // Base tax rate calculation
    let effectiveTaxRate = taxRate;
    if (useGlobalSettings !== false && globalSettings) {
      const incomeToTest = desiredIncome || 50000;
      const result = calculateTaxes(
        incomeToTest, 
        globalSettings.filingStatus || 'Single', 
        globalSettings.stateOfResidence || 'TX', 
        globalSettings.dependents || 0
      );
      effectiveTaxRate = result.effectiveTaxRate;
    }

    let futureTaxRate = effectiveTaxRate;
    if (futureTaxRateScenario === 'higher') futureTaxRate = Math.min(1, futureTaxRate + 0.10);
    if (futureTaxRateScenario === 'lower') futureTaxRate = Math.max(0, futureTaxRate - 0.10);

    const data = [];
    let currentSavings = 0;
    let balance = currentBalance;
    let yearlySavings = 0;

    if (goalType === 'income_stream') {
      const startAge = currentAge || 30;
      const endAge = retirementAge || 65;
      const yearsToRetirement = Math.max(0, endAge - startAge);
      const lifeExpectancy = 95;
      const totalYearsToSimulate = Math.max(yearsToRetirement, lifeExpectancy - startAge);
      
      const swr = withdrawalRate ?? 0.04;

      const totalRequired = (desiredIncome || 0) / (swr * (1 - futureTaxRate));
      
      if (yearsToRetirement > 0) {
        yearlySavings = (totalRequired - currentBalance * Math.pow(1 + returnRate, yearsToRetirement)) / 
                        ((Math.pow(1 + returnRate, yearsToRetirement) - 1) / returnRate);
      } else {
        yearlySavings = totalRequired - currentBalance;
      }
      
      yearlySavings = Math.max(0, yearlySavings); // Graceful handling if already enough

      for (let i = 0; i <= totalYearsToSimulate; i++) {
        const isRetired = (startAge + i) >= endAge;
        
        if (isRetired) {
          // Draw down the balance
          const withdrawalAmount = balance * swr;
          balance = balance * (1 + returnRate) - withdrawalAmount;
          // Prevent negative balance
          balance = Math.max(0, balance);
        } else {
          // Accumulate
          balance = balance * (1 + returnRate) + yearlySavings;
          currentSavings += yearlySavings;
        }

        data.push({
          year: currentYear + i,
          age: startAge + i,
          balance: Math.round(balance),
          targetBalance: Math.round(totalRequired),
          savingsRate: Math.round(isRetired ? 0 : yearlySavings),
          totalSaved: Math.round(currentSavings),
          projectedIncome: Math.round(balance * swr * (1 - futureTaxRate)),
        });
      }
    } else {
      // target_amount
      const years = timelineYears || 5;
      const target = targetAmount || 0;

      if (years > 0) {
        yearlySavings = (target - currentBalance * Math.pow(1 + returnRate, years)) / 
                        ((Math.pow(1 + returnRate, years) - 1) / returnRate);
      } else {
        yearlySavings = target - currentBalance;
      }

      yearlySavings = Math.max(0, yearlySavings);

      for (let i = 0; i <= 40; i++) {
        if (i <= years) {
          balance = balance * (1 + returnRate) + yearlySavings;
          currentSavings += yearlySavings;
        } else {
          // After the goal timeline is reached, the balance continues to grow without new contributions
          balance = balance * (1 + returnRate);
        }

        data.push({
          year: currentYear + i,
          balance: Math.round(balance),
          targetBalance: Math.round(target),
          savingsRate: Math.round(i <= years ? yearlySavings : 0),
          totalSaved: Math.round(currentSavings),
          projectedIncome: 0,
        });
      }
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

    // Now generate chart data year by year, up to age + 4 for college drawdown, and carry forward to max projection
    for (let age = childAge; age <= childAge + 40; age++) {
      if (age > childAge && age <= collegeAge) {
        // Apply 12 months of growth and contributions
        for (let m = 0; m < 12; m++) {
          balance = balance * (1 + monthlyReturnRate) + calculatedMonthlyContribution;
          totalSaved += calculatedMonthlyContribution;
        }
      } else if (age > collegeAge && age <= collegeAge + 4) {
        // Draw down over 4 years of college
        const drawDownAmount = finalTargetAmount / 4;
        balance = balance * (1 + annualReturnRate) - drawDownAmount;
        balance = Math.max(0, balance);
      } else if (age > collegeAge + 4) {
        // Carry forward
        balance = balance * (1 + annualReturnRate);
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