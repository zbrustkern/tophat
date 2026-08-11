import { HousePlan, GlobalSettings } from '@/types/chart';

export interface HouseChartData {
  month: number; // 0 is today, 1 is next month, etc
  year: number;
  age: number;
  
  // For planning
  savingsBalance: number;
  targetBalance: number;
  
  // For owned
  principalBalance: number;
  homeValue: number;
  totalInterestPaid: number;
  equity: number;
  
  // For scenario
  scenarioPrincipalBalance: number;
  scenarioTotalInterestPaid: number;
}

export function calculateAnnualPropertyTax(details: any): number {
  const homeValue = details.currentValue || 0;
  let annualPropertyTax = homeValue * (details.annualPropertyTaxRate || 0.011);

  if (details.useAdvancedPropertyTax && details.assessmentRatio && details.localTaxRate) {
    const assessedValue = homeValue * details.assessmentRatio;
    const taxableValue = Math.max(0, assessedValue - (details.homesteadExemption || 0));
    annualPropertyTax = taxableValue * details.localTaxRate;
  }

  return annualPropertyTax;
}

export function useHouseCalculations() {
  const calculateHouseData = (plan: HousePlan, settings: GlobalSettings | null): HouseChartData[] => {
    const data: HouseChartData[] = [];
    const details = plan.details;
    const currentYear = new Date().getFullYear();
    const currentAge = settings?.currentAge || 30;
    
    // Owned
    const initialPrincipal = details.currentLoanBalance || 0;
    const n = details.remainingTermMonths || 360;
    const annualRate = details.interestRate || 0.05;
    const r = annualRate / 12;
    const appreciationRate = details.appreciationRate ?? 0.03;
    const monthlyAppreciation = appreciationRate / 12;
      
      let basePayment = 0;
      if (r > 0 && n > 0) {
        basePayment = initialPrincipal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      } else if (n > 0) {
        basePayment = initialPrincipal / n;
      }
      
      // Scenarios
      const extraPay = details.extraMonthlyPayment || 0;
      const refiRate = details.refinanceRate || annualRate;
      const refiTerm = details.refinanceTermMonths || n;
      const refiR = refiRate / 12;
      let refiPayment = 0;
      if (refiR > 0 && refiTerm > 0) {
        refiPayment = initialPrincipal * (refiR * Math.pow(1 + refiR, refiTerm)) / (Math.pow(1 + refiR, refiTerm) - 1);
      } else if (refiTerm > 0) {
        refiPayment = initialPrincipal / refiTerm;
      }
      
      let bal = initialPrincipal;
      let scenarioBal = initialPrincipal;
      let totalInterest = 0;
      let scenarioTotalInterest = 0;
      let homeValue = details.currentValue || initialPrincipal;
      
      const maxMonths = Math.max(n, refiTerm, 360);
      
      for (let m = 0; m <= maxMonths; m++) {
        if (bal <= 0 && scenarioBal <= 0 && m > 0) {
          // Both paid off, just keep tracking home value
          data.push({
            month: m,
            year: currentYear + Math.floor(m / 12),
            age: currentAge + Math.floor(m / 12),
            savingsBalance: 0,
            targetBalance: 0,
            principalBalance: 0,
            homeValue,
            totalInterestPaid: totalInterest,
            equity: homeValue,
            scenarioPrincipalBalance: 0,
            scenarioTotalInterestPaid: scenarioTotalInterest
          });
          homeValue = homeValue * (1 + monthlyAppreciation);
          continue;
        }
        
        data.push({
          month: m,
          year: currentYear + Math.floor(m / 12),
          age: currentAge + Math.floor(m / 12),
          savingsBalance: 0,
          targetBalance: 0,
          principalBalance: bal,
          homeValue,
          totalInterestPaid: totalInterest,
          equity: homeValue - bal,
          scenarioPrincipalBalance: scenarioBal,
          scenarioTotalInterestPaid: scenarioTotalInterest
        });
        
        // Base Amortization
        if (bal > 0) {
          const interest = bal * r;
          const principal = basePayment - interest;
          totalInterest += interest;
          bal -= principal;
          if (bal < 0) bal = 0;
        }
        
        // Scenario Amortization
        if (scenarioBal > 0) {
          let payment = 0;
          let interestRateToUse = r;
          if (details.refinanceRate !== undefined && details.refinanceTermMonths !== undefined) {
            payment = refiPayment + extraPay;
            interestRateToUse = refiR;
          } else {
            payment = basePayment + extraPay;
            interestRateToUse = r;
          }
          
          const interest = scenarioBal * interestRateToUse;
          const principal = payment - interest;
          scenarioTotalInterest += interest;
          scenarioBal -= principal;
          if (scenarioBal < 0) scenarioBal = 0;
        }
        
        homeValue = homeValue * (1 + monthlyAppreciation);
      }
    
    return data;
  };
  
  return { calculateHouseData };
}
