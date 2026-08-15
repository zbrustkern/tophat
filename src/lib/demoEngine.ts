import { Plan, GlobalSettings } from '@/types/chart';

export const DEMO_SETTINGS: GlobalSettings = {
  taxRate: 0.24,
  returnRate: 0.08,
  inflationRate: 0.025,
  currentAge: 38,
  retirementAge: 62,
  withdrawalRate: 0.04,
  filingStatus: 'MarriedJointly',
  stateOfResidence: 'TX',
  dependents: 2,
  payors: ['Alex', 'Sam'],
  incomes: [
    { payorId: 'Alex', amount: 180000 },
    { payorId: 'Sam', amount: 100000 }
  ],
  holisticModeEnabled: true,
  activePlans: {
    incomePlanId: 'demo-income',
    savingsPlanId: 'demo-savings',
    collegePlanIds: ['demo-college'],
    housePlanId: 'demo-house',
    portfolioPlanId: 'demo-rebalance',
    budgetPlanId: 'demo-budget'
  }
};

export const DEMO_PLANS: Plan[] = [
  {
    id: 'demo-income',
    planName: 'Household Income & Tax Strategy',
    planType: 'income',
    lastUpdated: new Date(),
    details: {
      useGlobalSettings: true,
      income: 280000,
      raiseRate: 0.03,
      saveRate: 0.20,
      balance: 150000,
      taxRate: 0.24,
      returnRate: 0.08,
      payorId: 'Joint'
    } as any
  },
  {
    id: 'demo-savings',
    planName: 'HYSA Emergency Reserve',
    planType: 'savings',
    lastUpdated: new Date(),
    details: {
      useGlobalSettings: true,
      targetAmount: 60000,
      currentBalance: 45000,
      monthlyContribution: 1500,
      interestRate: 0.05
    } as any
  },
  {
    id: 'demo-college',
    planName: '529 Fund - Maya & Leo',
    planType: 'college',
    lastUpdated: new Date(),
    details: {
      useGlobalSettings: true,
      childName: 'Maya & Leo',
      targetAmount: 240000,
      currentBalance: 85000,
      yearsUntilCollege: 10,
      annualReturn: 0.07,
      monthlyContribution: 800
    } as any
  },
  {
    id: 'demo-house',
    planName: 'Primary Residence - Austin TX',
    planType: 'house',
    lastUpdated: new Date(),
    details: {
      useGlobalSettings: true,
      homeValue: 850000,
      mortgageBalance: 450000,
      interestRate: 0.035,
      monthlyPayment: 2850,
      annualAppreciation: 0.04
    } as any
  },
  {
    id: 'demo-rebalance',
    planName: 'Tactical Multi-Asset Portfolio',
    planType: 'rebalance',
    lastUpdated: new Date(),
    details: {
      useGlobalSettings: true,
      totalPortfolioValue: 1250000,
      assets: [
        { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', targetPercent: 40, currentPercent: 42, currentPrice: 275 },
        { symbol: 'VXUS', name: 'Vanguard Total International Stock ETF', targetPercent: 20, currentPercent: 18, currentPrice: 62 },
        { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', targetPercent: 20, currentPercent: 22, currentPrice: 73 },
        { symbol: 'BTC', name: 'Bitcoin Reserve', targetPercent: 10, currentPercent: 10, currentPrice: 68000 },
        { symbol: 'HYSA', name: 'High Yield Cash Reserve', targetPercent: 10, currentPercent: 8, currentPrice: 1 }
      ]
    } as any
  },
  {
    id: 'demo-budget',
    planName: 'Master Household Budget',
    planType: 'budget',
    lastUpdated: new Date(),
    details: {
      useGlobalSettings: true,
      lineItems: [
        { id: 'b1', payorId: 'Joint', bill: 'Mortgage Payment', company: 'Chase', category: 'housing', monthlyAmount: 2850 },
        { id: 'b2', payorId: 'Joint', bill: 'Preschool & Childcare', company: 'Bright Horizons', category: 'childcare', monthlyAmount: 2200 },
        { id: 'b3', payorId: 'Joint', bill: 'Groceries & Household', company: 'Costco & HEB', category: 'groceries', monthlyAmount: 1400 },
        { id: 'b4', payorId: 'Alex', bill: 'Auto & Health Insurance', company: 'USAA', category: 'insurance', monthlyAmount: 650 },
        { id: 'b5', payorId: 'Joint', bill: 'Utilities & Fiber', company: 'Austin Energy', category: 'utilities', monthlyAmount: 380 },
        { id: 'b6', payorId: 'Sam', bill: 'Dining & Entertainment', company: 'Credit Card Float', category: 'dining', monthlyAmount: 950 }
      ]
    } as any
  }
];
