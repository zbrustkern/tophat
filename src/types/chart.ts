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
  holisticModeEnabled?: boolean;
  activePlans?: {
    incomePlanId?: string;
    incomePlanIds?: string[];
    savingsPlanId?: string; // Legacy
    savingsPlanIds?: string[]; // New
    collegePlanId?: string;
    collegePlanIds?: string[];
    budgetPlanId?: string;
    portfolioPlanId?: string;
    housePlanId?: string;
  };
}

// Plan Types
export type PlanType = 'income' | 'savings' | 'house' | 'car' | 'college' | 'debt' | 'rebalance' | 'budget' | 'inheritance';

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
  payorId?: string;
  employerMatchLimit?: number; // e.g., 0.05 (up to 5% of salary)
  employerMatchRate?: number; // e.g., 1.0 (100% match)
  disasterConfig?: DisasterConfig;
  taxType?: 'preTax' | 'postTax';
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

// Savings Goal Plan Types
export interface SavingsDetails {
  goalType: 'income_stream' | 'target_amount';
  
  // For 'income_stream'
  desiredIncome?: number;
  currentAge?: number;
  retirementAge?: number;
  withdrawalRate?: number;
  futureTaxRateScenario?: 'current' | 'higher' | 'lower'; // for projection
  
  // For 'target_amount'
  targetAmount?: number;
  timelineYears?: number;
  
  // Common funding
  currentBalance: number;
  linkedPortfolioIds?: string[]; // Multiple portfolios can fund a single goal
  
  taxRate: number;
  returnRate: number;
  useGlobalSettings?: boolean;
  taxType?: 'preTax' | 'postTax';
}

export interface SavingsPlan extends BasePlan {
  planType: 'savings';
  details: SavingsDetails;
}

export type SavingsChartData = {
  year: number;
  age?: number;
  balance: number;
  targetBalance?: number;
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
  taxType?: 'preTax' | 'postTax';
  linkedPortfolioIds?: string[]; // Multiple portfolios can fund a single goal
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
  institution?: string;
  taxType?: 'preTax' | 'postTax' | 'taxable' | 'crypto';
  portfolioPurpose?: 'Core Wealth' | 'Play Money' | 'Cash Reserve';
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

// House Plan Types
export interface HouseDetails {
  status: 'owned'; 
  
  // For 'owned'
  currentValue?: number;
  originalLoanAmount?: number;
  currentLoanBalance?: number;
  interestRate?: number;
  remainingTermMonths?: number;
  
  // Common
  annualPropertyTaxRate?: number; 
  state?: string; 
  annualHomeInsurance?: number;
  annualMaintenance?: number;
  appreciationRate?: number; 
  
  // Scenarios
  extraMonthlyPayment?: number;
  refinanceRate?: number;
  refinanceTermMonths?: number;

  // Advanced Property Tax
  useAdvancedPropertyTax?: boolean;
  assessmentRatio?: number; 
  homesteadExemption?: number; 
  localTaxRate?: number; 

  linkedPortfolioIds?: string[]; // Multiple portfolios can fund a single goal
}

export interface HousePlan extends BasePlan {
  planType: 'house';
  details: HouseDetails;
}

// Inheritance Plan Types (Placeholder)
export interface InheritanceDetails {
  placeholder?: boolean;
}

export interface InheritancePlan extends BasePlan {
  planType: 'inheritance';
  details: InheritanceDetails;
}

// Union type for all plans
export type Plan = IncomePlan | SavingsPlan | CollegePlan | RebalancePlan | BudgetPlan | HousePlan | InheritancePlan;

// Optional: You might want to add these helper types for future use
export type PlanDetails = IncomeDetails | SavingsDetails | CollegeDetails | RebalanceDetails | BudgetDetails | HouseDetails | InheritanceDetails;
export type ChartData = IncomeChartData | SavingsChartData | CollegeChartData;