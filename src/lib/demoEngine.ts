import { Plan, GlobalSettings } from '@/types/chart';

export const DEMO_SETTINGS: GlobalSettings = {
  taxRate: 0.28,
  returnRate: 0.08,
  withdrawalRate: 0.04,
  inflationRate: 0.025,
  currentAge: 34,
  retirementAge: 65,
  payors: ['Zeke', 'Natalie'],
  incomes: [
    { payorId: 'Zeke', amount: 165000 },
    { payorId: 'Natalie', amount: 135000 }
  ],
  activePlans: {
    incomePlanIds: ['demo-income-1'],
    savingsPlanIds: ['demo-savings-1'],
    portfolioPlanId: 'demo-portfolio-1',
    housePlanId: 'demo-house-1',
    collegePlanIds: ['demo-college-1'],
    budgetPlanId: 'demo-budget-1'
  }
};

export const DEMO_PLANS: Plan[] = [
  {
    id: 'demo-income-1',
    planName: 'Primary Dual Executive Income',
    planType: 'income',
    lastUpdated: new Date(),
    details: {
      income: 300000,
      raiseRate: 0.03,
      saveRate: 0.22,
      balance: 450000,
      taxRate: 0.28,
      returnRate: 0.08,
      autoEscalateSavings: true,
      escalationRate: 0.01,
      useGlobalSettings: true,
      payorId: 'Joint'
    }
  },
  {
    id: 'demo-portfolio-1',
    planName: 'Core Wealth & Tactical ETF Portfolio',
    planType: 'rebalance',
    lastUpdated: new Date(),
    details: {
      currentCash: 85000,
      currentEquity: 620000,
      targetAnnualReturn: 0.08,
      initialPrincipal: 500000,
      monthlyContribution: 2500,
      mockVix: 18.5,
      monthsElapsed: 12,
      taxType: 'taxable',
      portfolioPurpose: 'Core Wealth',
      assets: [
        { id: 'a1', symbol: 'VOO', type: 'equity', shares: 850, price: 480.50, targetAllocation: 0.50, riskTier: 'core' },
        { id: 'a2', symbol: 'QQQ', type: 'equity', shares: 320, price: 445.20, targetAllocation: 0.30, riskTier: 'growth' },
        { id: 'a3', symbol: 'BND', type: 'equity', shares: 1200, price: 72.30, targetAllocation: 0.15, riskTier: 'core' },
        { id: 'a4', symbol: 'VNQ', type: 'equity', shares: 450, price: 84.10, targetAllocation: 0.05, riskTier: 'speculative' }
      ]
    }
  },
  {
    id: 'demo-house-1',
    planName: 'Primary Residence (Austin Hills)',
    planType: 'house',
    lastUpdated: new Date(),
    details: {
      status: 'owned',
      currentValue: 950000,
      currentLoanBalance: 480000,
      interestRate: 0.0375,
      remainingTermMonths: 312,
      annualPropertyTaxRate: 0.018,
      annualHomeInsurance: 3200,
      annualMaintenance: 4500
    }
  },
  {
    id: 'demo-college-1',
    planName: '529 College Fund (Maya - Age 5)',
    planType: 'college',
    lastUpdated: new Date(),
    details: {
      calculationMode: 'goal',
      childAge: 5,
      collegeAge: 18,
      currentBalance: 65000,
      returnRate: 0.07,
      targetAmount: 180000,
      monthlyContribution: 850,
      useGlobalSettings: true
    }
  },
  {
    id: 'demo-budget-1',
    planName: 'Master Operating Budget',
    planType: 'budget',
    lastUpdated: new Date(),
    details: {
      lineItems: [
        { id: '1', bill: 'Electric & Water', company: 'Austin Energy', category: 'Utilities', monthlyAmount: 380, payorId: 'Joint' },
        { id: '2', bill: 'High-Speed Fiber', company: 'AT&T', category: 'Utilities', monthlyAmount: 90, payorId: 'Joint' },
        { id: '3', bill: 'Groceries & Dining', company: 'Whole Foods / Dining', category: 'Food & Dining', monthlyAmount: 1800, payorId: 'Joint' },
        { id: '4', bill: 'Health & Umbrella Ins', company: 'BlueCross / GEICO', category: 'Insurance', monthlyAmount: 650, payorId: 'Joint' },
        { id: '5', bill: 'Childcare & Lessons', company: 'Montessori', category: 'Kids & Pets', monthlyAmount: 1400, payorId: 'Joint' },
        { id: '6', bill: 'Discretionary / Travel', company: 'Chase Sapphire', category: 'Discretionary', monthlyAmount: 1200, payorId: 'Joint' }
      ],
      useGlobalSettings: true
    }
  }
];
