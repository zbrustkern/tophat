import { GlobalSettings, Plan, HousePlan, CollegePlan } from '@/types/chart';

export interface AllocationRecommendation {
  id: string;
  name: string;
  category: 'Retirement' | 'Education' | 'Debt' | 'Wealth' | 'Liquidity' | 'Health';
  amount: number;
  score: number;
  reason: string;
}

export function calculateOptimalAllocation(
  netCashFlow: number, 
  globalSettings: GlobalSettings | null, 
  plans: Plan[],
  goalDeficits: { plan: Plan, required: number }[] = []
): AllocationRecommendation[] {
  const recommendations: AllocationRecommendation[] = [];
  let remainingSurplus = Math.max(0, netCashFlow);

  if (remainingSurplus <= 0) {
    return recommendations;
  }

  // Determine Marginal Tax Bracket
  const marginalTaxRate = globalSettings?.taxRate || 0.24;

  // Potential Destinations
  const destinations: { id: string, name: string, category: any, score: number, reason: string, maxCapacity: number }[] = [];

  // 1. HSA (Health Savings Account) - Ultimate Tax Advantage
  destinations.push({
    id: 'hsa',
    name: 'Health Savings Account (HSA)',
    category: 'Health',
    score: 98,
    reason: 'Triple tax-advantaged. The most efficient investment vehicle available.',
    maxCapacity: 4150 / 12 // Individual limit approximation
  });

  // 2. Pre-Tax Retirement (401k/IRA)
  destinations.push({
    id: 'pre-tax-ret',
    name: 'Pre-Tax Retirement (401k/IRA)',
    category: 'Retirement',
    score: 85 + (marginalTaxRate * 50), // Scales with tax rate
    reason: `Immediate ${Math.round(marginalTaxRate * 100)}% tax shield on contributions.`,
    maxCapacity: 23000 / 12 // 401k limit approximation
  });

  // 3. Dynamic College Savings Goals
  const collegeGoals = goalDeficits.filter(g => g.plan.planType === 'college' && g.required > 0);
  collegeGoals.forEach(g => {
    destinations.push({
      id: `college-${g.plan.id}`,
      name: `College Savings: ${g.plan.planName}`,
      category: 'Education',
      score: 80,
      reason: 'Tax-free growth for qualified education expenses. Calculated deficit.',
      maxCapacity: g.required
    });
  });

  // Dynamic Savings Goals
  const savingsGoals = goalDeficits.filter(g => g.plan.planType === 'savings' && g.required > 0);
  savingsGoals.forEach(g => {
    // If it's a pre-tax income stream goal, it might be equivalent to 401k
    const isPreTax = (g.plan.details as any).taxType === 'preTax';
    const isRetirement = (g.plan.details as any).goalType === 'income_stream';
    destinations.push({
      id: `savings-${g.plan.id}`,
      name: `Goal: ${g.plan.planName}`,
      category: isRetirement ? 'Retirement' : 'Wealth',
      score: isPreTax ? 85 + (marginalTaxRate * 50) : 75,
      reason: isPreTax ? `Immediate ${Math.round(marginalTaxRate * 100)}% tax shield.` : `Targeted savings for ${g.plan.planName}.`,
      maxCapacity: g.required / 12 // `requiredSavings` is yearly, divide by 12 for monthly capacity
    });
  });

  // 4. Mortgage Paydown
  const housePlans = plans.filter(p => p.planType === 'house') as HousePlan[];
  housePlans.forEach(hp => {
    const rate = hp.details.interestRate || 0.05;
    if (rate >= 0.06) {
      destinations.push({
        id: `mortgage-${hp.id}`,
        name: `Mortgage Paydown (${hp.planName})`,
        category: 'Debt',
        score: rate * 1000, // E.g., 6% = 60 score. 8% = 80 score.
        reason: `Guaranteed risk-free return of ${Math.round(rate * 100)}% by eliminating interest.`,
        maxCapacity: Infinity
      });
    }
  });

  // 5. Taxable Brokerage (Baseline Wealth Engine)
  destinations.push({
    id: 'taxable-brokerage',
    name: 'Taxable Brokerage',
    category: 'Wealth',
    score: 70,
    reason: 'Highly liquid baseline wealth accumulation. Subject to capital gains tax.',
    maxCapacity: Infinity
  });

  // Sort by Score Descending
  destinations.sort((a, b) => b.score - a.score);

  // Allocate the surplus down the waterfall
  for (const dest of destinations) {
    if (remainingSurplus <= 0) break;

    const allocAmount = Math.min(remainingSurplus, dest.maxCapacity);
    
    recommendations.push({
      id: dest.id,
      name: dest.name,
      category: dest.category,
      score: Math.round(dest.score),
      reason: dest.reason,
      amount: allocAmount
    });

    remainingSurplus -= allocAmount;
  }

  return recommendations;
}
