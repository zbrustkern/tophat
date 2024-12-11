export type PlanType = 'income' | 'savings' | 'house' | 'car' | 'college' | 'debt';

export type BasePlan = {
  id: string;
  planName: string;
  planType: PlanType;
  lastUpdated: Date;
};

// Income Types
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

export type IncomePlanDetails = {
  income: number;
  raiseRate: number;
  saveRate: number;
  balance: number;
  taxRate: number;
  returnRate: number;
};

export interface IncomePlan extends BasePlan {
  planType: 'income';
  details: IncomePlanDetails;
}

// Savings Types
export type SavingsChartData = {
  year: number;
  balance: number;
  savingsRate: number;
  totalSaved: number;
  projectedIncome: number;
};

export type SavingsPlanDetails = {
  desiredIncome: number;
  currentAge: number;
  retirementAge: number;
  currentBalance: number;
  taxRate: number;
  returnRate: number;
};

export interface SavingsPlan extends BasePlan {
  planType: 'savings';
  details: SavingsPlanDetails;
}

// Union type for all plans
export type Plan = IncomePlan | SavingsPlan;