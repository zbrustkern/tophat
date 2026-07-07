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
      disasterConfig
    } = plan.details;

    // Use dynamic tax rate if using global settings
    let effectiveTaxRate = taxRate;
    if (useGlobalSettings !== false && globalSettings) {
      const result = calculateTaxes(
        initialIncome, 
        globalSettings.filingStatus || 'Single', 
        globalSettings.stateOfResidence || 'TX', 
        globalSettings.dependents || 0
      );
      effectiveTaxRate = result.effectiveTaxRate;
    }

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

      // Calculate Employer Match
      // Match applies to the % of base income contributed, up to the limit
      const eligibleContributionRate = Math.min(effectiveSavingsRate, employerMatchLimit);
      const employerMatchAmount = eligibleContributionRate * currentIncome * employerMatchRate;
      
      const takeHome = (currentIncome - netContribution) * (1 - effectiveTaxRate);
      
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
      desiredIncome,
      currentAge,
      retirementAge,
      currentBalance,
      taxRate,
      returnRate,
      withdrawalRate,
      useGlobalSettings
    } = plan.details;

    // Use dynamic tax rate if using global settings
    let effectiveTaxRate = taxRate;
    if (useGlobalSettings !== false && globalSettings) {
      // In savings, desired income is used as a proxy for gross need
      const result = calculateTaxes(
        desiredIncome, 
        globalSettings.filingStatus || 'Single', 
        globalSettings.stateOfResidence || 'TX', 
        globalSettings.dependents || 0
      );
      effectiveTaxRate = result.effectiveTaxRate;
    }

    const years = retirementAge - currentAge;
    const data = [];
    let currentSavings = 0;
    let balance = currentBalance;

    // Use withdrawal rate if specified, otherwise fall back to returnRate for backward compatibility
    const swr = withdrawalRate ?? returnRate;

    // Calculate required savings
    const totalRequired = desiredIncome / (swr * (1 - effectiveTaxRate));
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
        projectedIncome: Math.round(balance * swr * (1 - effectiveTaxRate)),
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