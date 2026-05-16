// types/chart.ts

// Plan Types
export type PlanType = 'income' | 'savings' | 'house' | 'car' | 'college' | 'debt' | 'rebalance';

export interface BasePlan {
  id: string;
  planName: string;
  planType: PlanType;
  lastUpdated: Date;  // Explicitly typed as Date
}

// Income Plan Types
export interface IncomeDetails {
  income: number;
  raiseRate: number;
  saveRate: number;
  balance: number;
  taxRate: number;
  returnRate: number;
}

export interface IncomePlan extends BasePlan {
  planType: 'income';
  details: IncomeDetails;
}

export type IncomeChartData = {
  year: number;
  income: number;
  takeHome: number;
  raiseRate: number;
  saveRate: number;
  taxRate: number;
  netContribution: number;
  portfolioReturn: number;
  balance: number;
  capitalIncome: number;
  conservativeIncome: number;
};

// Savings Plan Types
export interface SavingsDetails {
  desiredIncome: number;
  currentAge: number;
  retirementAge: number;
  currentBalance: number;
  taxRate: number;
  returnRate: number;
}

export interface SavingsPlan extends BasePlan {
  planType: 'savings';
  details: SavingsDetails;
}

export type SavingsChartData = {
  year: number;
  balance: number;
  savingsRate: number;
  totalSaved: number;
  projectedIncome: number;
};

// College Plan Types
export interface CollegeDetails {
  calculationMode: 'goal' | 'contribution';
  childAge: number;
  collegeAge: number;
  currentBalance: number;
  returnRate: number;
  targetAmount: number;
  monthlyContribution: number;
}

export interface CollegePlan extends BasePlan {
  planType: 'college';
  details: CollegeDetails;
}

export type CollegeChartData = {
  age: number;
  balance: number;
  totalContributions: number;
  projectedCost: number;
};

export interface Asset {
  id: string;
  symbol: string;
  type: 'cash' | 'equity';
  price: number;
  shares: number;
}

// Rebalance Plan Types
export interface RebalanceDetails {
  currentCash: number;
  currentEquity: number;
  targetAnnualReturn: number;
  initialPrincipal: number;
  monthlyContribution: number;
  mockVix: number;
  monthsElapsed: number; // Keep for backward compatibility/fallback
  startDate?: string;    // YYYY-MM-DD
  assets?: Asset[];
}

export interface RebalancePlan extends BasePlan {
  planType: 'rebalance';
  details: RebalanceDetails;
}

// Union type for all plans
export type Plan = IncomePlan | SavingsPlan | CollegePlan | RebalancePlan;

// Optional: You might want to add these helper types for future use
export type PlanDetails = IncomeDetails | SavingsDetails | CollegeDetails | RebalanceDetails;
export type ChartData = IncomeChartData | SavingsChartData | CollegeChartData;