export interface BasePlan {
    id: string;
    planName: string;
    planType: 'income' | 'savings';
    lastUpdated: Date;
  }
  
  export interface IncomeDetails {
    income: number;
    raiseRate: number;
    saveRate: number;
    balance: number;
    taxRate: number;
    returnRate: number;
  }
  
  export interface SavingsDetails {
    desiredIncome: number;
    currentAge: number;
    retirementAge: number;
    currentBalance: number;
    taxRate: number;
    returnRate: number;
  }
  
  export interface IncomePlan extends BasePlan {
    planType: 'income';
    details: IncomeDetails;
  }
  
  export interface SavingsPlan extends BasePlan {
    planType: 'savings';
    details: SavingsDetails;
  }
  
  export type Plan = IncomePlan | SavingsPlan;