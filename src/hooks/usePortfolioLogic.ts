import { RebalancePlan } from '@/types/chart';

export interface PortfolioCalculations {
  targetValue: number;
  investmentGap: number;
  recommendation: {
    action: string;
    strategy: string;
    description: string;
  };
  adjustedContribution: number;
  computedCash: number;
  computedEquity: number;
  computedMonths: number;
}

export function usePortfolioLogic() {
  const calculateRebalanceData = (plan: RebalancePlan): PortfolioCalculations => {
    const {
      currentCash: fallbackCash,
      currentEquity: fallbackEquity,
      targetAnnualReturn,
      initialPrincipal,
      monthlyContribution,
      mockVix,
      monthsElapsed: fallbackMonths,
      startDate,
      assets = []
    } = plan.details;

    // Time calculations
    let computedMonths = fallbackMonths;
    if (startDate) {
      const start = new Date(startDate);
      const now = new Date();
      // approximate months difference
      const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      computedMonths = diffMonths > 0 ? diffMonths : 0;
    }

    // Asset aggregations
    let computedCash = fallbackCash;
    let computedEquity = fallbackEquity;
    if (assets.length > 0) {
      computedCash = assets.filter(a => a.type === 'cash').reduce((sum, a) => sum + (a.price * a.shares), 0);
      computedEquity = assets.filter(a => a.type === 'equity').reduce((sum, a) => sum + (a.price * a.shares), 0);
    }

    const actualPortfolioValue = computedCash + computedEquity;

    let activeInitialPrincipal = initialPrincipal;
    if (computedMonths === 0) {
      activeInitialPrincipal = actualPortfolioValue;
    }

    // 1. Calculate Target Value (V_t)
    const monthlyRate = targetAnnualReturn; 
    const rM = monthlyRate / 12;
    
    const fvPrincipal = activeInitialPrincipal * Math.pow(1 + rM, computedMonths);
    const fvContributions = monthlyContribution * ((Math.pow(1 + rM, computedMonths) - 1) / (rM || 1));
    
    const targetValue = rM === 0 
      ? activeInitialPrincipal + (monthlyContribution * computedMonths) 
      : fvPrincipal + fvContributions;

    // 2. The Investment Gap
    const investmentGap = targetValue - actualPortfolioValue;

    // 3. Volatility Overlay (VIX)
    let adjustedContribution = monthlyContribution;
    if (mockVix > 25) {
      adjustedContribution = monthlyContribution * 1.5; 
    }

    // VIX Recommendation string
    const vixMsg = `With VIX at ${mockVix}, what's today's price of SPY or the index directly? Consider checking index prices to inform your next trade.`;

    // 4. Asset Drift Calculation (Sub-Allocation)
    let driftMsg = '';
    const equityAssets = assets.filter(a => a.type === 'equity' && typeof a.targetAllocation === 'number');
    
    if (investmentGap > 0 && equityAssets.length > 0) {
      const targetEquityValue = computedEquity + investmentGap;
      let maxDriftAsset: any = null;
      let maxDriftValue = -Infinity;

      equityAssets.forEach(asset => {
        const targetDollarValue = targetEquityValue * (asset.targetAllocation || 0);
        const currentValue = asset.shares * asset.price;
        const drift = targetDollarValue - currentValue;
        
        if (drift > maxDriftValue) {
          maxDriftValue = drift;
          maxDriftAsset = asset;
        }
      });

      if (maxDriftAsset && maxDriftValue > 0) {
        driftMsg = ` **Sub-Allocation Alert:** To deploy your cash gap, explicitly buy **$${Math.round(maxDriftValue).toLocaleString()} of ${maxDriftAsset.symbol.toUpperCase()}**. This is your most underweight asset and buying it will force mean-regression to your target sub-allocation.`;
      }
    }

    // 5. Risk Parity Triggers
    let recommendation = {
      action: "Hold",
      strategy: "No Action",
      description: `Portfolio is perfectly balanced. ${vixMsg}`
    };

    const gapPercentage = targetValue === 0 ? 0 : investmentGap / targetValue;

    if (Math.abs(gapPercentage) <= 0.01 || computedMonths === 0) {
      recommendation = {
        action: "Hold / Drift",
        strategy: "No Action",
        description: `Portfolio is tracking perfectly (within 1% deadband). ${vixMsg}`
      };
    } else if (investmentGap > 0) {
      recommendation = {
        action: "Accelerated Entry",
        strategy: "Index Funds / CSPs",
        description: `Deploy excess cash into core index funds to capture the dip.${driftMsg} Alternatively, use the Live Options Scanner below to find a Cash-Secured Put that mathematically fits your available cash ($${computedCash.toLocaleString()}) without breaking risk parity. You are under target by $${investmentGap.toFixed(2)}. ${vixMsg}`
      };
    } else if (investmentGap < 0) {
      recommendation = {
        action: "Risk Off / Trim",
        strategy: "Covered Calls / Treasuries",
        description: `You are significantly ahead of target. Trim overweight equities and allocate to short-term treasuries (e.g., SGOV, BIL). Alternatively, sell Covered Calls targeting 30-45 DTE at a 10-20 Delta strike to harvest premium safely. You are over target by $${Math.abs(investmentGap).toFixed(2)}. ${vixMsg}`
      };
    }

    return {
      targetValue,
      investmentGap,
      recommendation,
      adjustedContribution,
      computedCash,
      computedEquity,
      computedMonths
    };
  };

  return { calculateRebalanceData };
}
