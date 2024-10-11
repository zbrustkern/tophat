// chart.ts

export type ChartDataPoint = {
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

export type ChartData = ChartDataPoint[];

export type SavingsChartDataPoint = {
  year: number;
  balance: number;
  savingsRate: number;
  totalSaved: number;
  projectedIncome: number;
};

export type SavingsChartData = SavingsChartDataPoint[];

export type PlanType = 'income' | 'savings' | 'house' | 'car' | 'college' | 'debt';

export type BasePlanData = {
  id: string;
  planName: string;
  planType: PlanType;
  lastUpdated: Date; 
};

export type IncomePlanDetails = {
  income: number;
  raiseRate: number;
  saveRate: number;
  balance: number;
  taxRate: number;
  returnRate: number;
};

export type SavingsPlanDetails = {
  desiredIncome: number;
  currentAge: number;
  retirementAge: number;
  currentBalance: number;
  taxRate: number;
  returnRate: number;
};

export type Plan<T extends IncomePlanDetails | SavingsPlanDetails> = BasePlanData & {
  details: T;
};

export type IncomePlan = Plan<IncomePlanDetails>;
export type SavingsPlan = Plan<SavingsPlanDetails>;