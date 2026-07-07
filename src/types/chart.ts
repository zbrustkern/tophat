// types/chart.ts

export interface GlobalIncome {
  payorId: string;
  amount: number;
}

export interface GlobalSettings {
  taxRate: number;
  returnRate: number;
  withdrawalRate: number;
  inflationRate: number;
  currentAge: number;
  retirementAge: number;
  payors: string[]; // e.g., ['Zeke', 'Natalie', 'Joint']
  incomes: GlobalIncome[];
  filingStatus?: 'Single' | 'MarriedJointly';
  stateOfResidence?: string;
  dependents?: number;
}

// Plan Types
export type PlanType = 'income' | 'savings' | 'house' | 'car' | 'college' | 'debt' | 'rebalance' | 'budget';

export interface BasePlan {
  id: string;
  planName: string;
  planType: PlanType;
  lastUpdated: Date;  // Explicitly typed as Date
}

export interface DisasterConfig {
  active: boolean;
  type: string; // matches DisasterType (e.g. 'recession')
  startYear: number | 'random'; // relative year offset (e.g. 5 for year 5, or 'random')
}

// Income Plan Types
export interface IncomeDetails {
  income: number;
  raiseRate: number;
  saveRate: number;
  balance: number;
  taxRate: number;
  returnRate: number;
  autoEscalateSavings?: boolean;
  escalationRate?: number;
  saveMode?: 'rate' | 'fixed';
  saveAmount?: number;
  withdrawalRate?: number;
  useGlobalSettings?: boolean;
  employerMatchLimit?: number; // e.g., 0.05 (up to 5% of salary)
  employerMatchRate?: number; // e.g., 1.0 (100% match)
  disasterConfig?: DisasterConfig;
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
  employerMatchAmount: number;
};

// Savings Plan Types
export interface SavingsDetails {
  desiredIncome: number;
  currentAge: number;
  retirementAge: number;
  currentBalance: number;
  taxRate: number;
  returnRate: number;
  withdrawalRate?: number;
  useGlobalSettings?: boolean;
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
  useGlobalSettings?: boolean;
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
  targetAllocation?: number; // Target percentage of the total equity bucket (e.g. 0.5 for 50%)
  riskTier?: 'core' | 'growth' | 'speculative';
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

// Budget Plan Types
export interface BudgetLineItem {
  id: string;
  payorId: string; // References a string in GlobalSettings.payors
  bill: string;
  company: string;
  category: string;
  notes?: string;
  monthlyAmount: number;
}

export interface BudgetDetails {
  lineItems: BudgetLineItem[];
  useGlobalSettings?: boolean;
}

export interface BudgetPlan extends BasePlan {
  planType: 'budget';
  details: BudgetDetails;
}

// Union type for all plans
export type Plan = IncomePlan | SavingsPlan | CollegePlan | RebalancePlan | BudgetPlan;

// Optional: You might want to add these helper types for future use
export type PlanDetails = IncomeDetails | SavingsDetails | CollegeDetails | RebalanceDetails | BudgetDetails;
export type ChartData = IncomeChartData | SavingsChartData | CollegeChartData;