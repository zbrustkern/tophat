// types/chart.ts

// Plan Types
export type PlanType = 'income' | 'savings' | 'house' | 'car' | 'college' | 'debt';

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

// Union type for all plans
export type Plan = IncomePlan | SavingsPlan;

// Optional: You might want to add these helper types for future use
export type PlanDetails = IncomeDetails | SavingsDetails;
export type ChartData = IncomeChartData | SavingsChartData;