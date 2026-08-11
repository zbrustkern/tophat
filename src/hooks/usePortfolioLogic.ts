import { RebalancePlan, Asset } from '@/types/chart';

export interface PortfolioCalculations {
  targetValue: number; // Deprecated rigid target, returning actual for chart continuity
  investmentGap: number; // This will now represent total equity gap
  recommendation: {
    action: string;
    strategy: string;
    description: string;
  };
  adjustedContribution: number;
  computedCash: number;
  computedEquity: number;
  computedMonths: number;
  targetCashPercentage: number;
  priorityAsset: Asset | null;
  priorityGap: number;
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

    // Macro Allocation: VIX-driven Cash vs Equity Target
    // Formula: Target Cash % = 0.40 - ((VIX - 15) * 0.02). Bounded 5% to 40%.
    let targetCashPercentage = 0.40 - ((mockVix - 15) * 0.02);
    if (targetCashPercentage < 0.05) targetCashPercentage = 0.05;
    if (targetCashPercentage > 0.40) targetCashPercentage = 0.40;
    
    const targetEquityPercentage = 1 - targetCashPercentage;
    const targetEquityValue = actualPortfolioValue * targetEquityPercentage;
    
    // Total Equity Gap
    const investmentGap = targetEquityValue - computedEquity;

    // Micro Allocation: Asset-level VIX routing
    const equityAssets = assets.filter(a => a.type === 'equity');
    let driftMsg = '';
    let priorityAsset: Asset | null = null;
    let priorityGap = 0;

    if (equityAssets.length > 0) {
      // Determine baseline buckets based on VIX
      let coreTarget = 0.6; let growthTarget = 0.25; let specTarget = 0.15;
      if (mockVix < 15) { coreTarget = 0.7; growthTarget = 0.2; specTarget = 0.1; }
      else if (mockVix > 25) { coreTarget = 0.4; growthTarget = 0.35; specTarget = 0.25; }
      else if (mockVix > 20) { coreTarget = 0.5; growthTarget = 0.3; specTarget = 0.2; }

      const cores = equityAssets.filter(a => (a.riskTier || 'core') === 'core');
      const growths = equityAssets.filter(a => a.riskTier === 'growth');
      const specs = equityAssets.filter(a => a.riskTier === 'speculative');

      let totalCoreT = cores.length > 0 ? coreTarget : 0;
      let totalGrowthT = growths.length > 0 ? growthTarget : 0;
      let totalSpecT = specs.length > 0 ? specTarget : 0;
      const sumT = totalCoreT + totalGrowthT + totalSpecT || 1;

      totalCoreT /= sumT;
      totalGrowthT /= sumT;
      totalSpecT /= sumT;

      let maxBuyGap = -Infinity;
      let maxSellGap = -Infinity; // For negative gaps
      let maxBuyAsset: Asset | null = null;
      let maxSellAsset: Asset | null = null;

      for (const a of equityAssets) {
        const tier = a.riskTier || 'core';
        let computedPct = 0;
        if (tier === 'core') computedPct = totalCoreT / cores.length;
        if (tier === 'growth') computedPct = totalGrowthT / growths.length;
        if (tier === 'speculative') computedPct = totalSpecT / specs.length;

        const finalPct = typeof a.targetAllocation === 'number' && !isNaN(a.targetAllocation) 
          ? a.targetAllocation 
          : computedPct;

        // Note: if user uses manual allocations, we don't strict normalize here, 
        // we just apply the percentage to the target equity bucket.
        const targetAssetDollarValue = targetEquityValue * finalPct;
        const currentDollarValue = a.shares * a.price;
        const gap = targetAssetDollarValue - currentDollarValue; // Positive = need to buy
        
        if (gap > maxBuyGap) {
          maxBuyGap = gap;
          maxBuyAsset = a;
        }
        // gap < 0 means we have too much, need to sell
        const sellGap = -gap;
        if (sellGap > maxSellGap) {
          maxSellGap = sellGap;
          maxSellAsset = a;
        }
      }

      if (investmentGap > 0 && maxBuyAsset && maxBuyGap > 0) {
        priorityAsset = maxBuyAsset;
        priorityGap = maxBuyGap;
        const tier = maxBuyAsset.riskTier || 'core';
        driftMsg = ` **Sub-Allocation Alert:** Deploy cash into **${maxBuyAsset.symbol.toUpperCase()}** (${tier}). It is currently $${Math.round(maxBuyGap).toLocaleString()} under its VIX-adjusted target weight.`;
      } else if (investmentGap < 0 && maxSellAsset && maxSellGap > 0) {
        priorityAsset = maxSellAsset;
        priorityGap = maxSellGap;
        const tier = maxSellAsset.riskTier || 'core';
        driftMsg = ` **Sub-Allocation Alert:** Trim **${maxSellAsset.symbol.toUpperCase()}** (${tier}). It is currently $${Math.round(maxSellGap).toLocaleString()} over its VIX-adjusted target weight.`;
      }
    }

    // Recommendation Engine
    let adjustedContribution = monthlyContribution;
    if (mockVix > 25) adjustedContribution = monthlyContribution * 1.5; 

    const vixMsg = `VIX is ${mockVix}, putting your Target Cash Allocation at ${Math.round(targetCashPercentage * 100)}%.`;

    let recommendation = {
      action: "Hold / Accumulate Cash",
      strategy: "No Action",
      description: `Portfolio is well balanced. ${vixMsg}`
    };

    // If equity gap is small relative to portfolio (< 1% of portfolio)
    const gapPercentage = Math.abs(investmentGap) / (actualPortfolioValue || 1);

    if (gapPercentage <= 0.01) {
      recommendation = {
        action: "Hold / Accumulate Cash",
        strategy: "No Action",
        description: `Portfolio is tracking perfectly to its Volatility-Targeted allocation (within 1% deadband). ${vixMsg}`
      };
    } else if (investmentGap > 0) {
      recommendation = {
        action: "Deploy Cash (Buy Dip)",
        strategy: "Index Funds / CSPs",
        description: `You are under-invested in equities based on current volatility. ${driftMsg} Alternatively, use the Live Options Scanner to sell a Cash-Secured Put on the priority asset without locking up your entire reserve. You are $${investmentGap.toFixed(2)} under equity target. ${vixMsg}`
      };
    } else if (investmentGap < 0) {
      recommendation = {
        action: "Risk Off (Build Cash)",
        strategy: "Covered Calls / Trims",
        description: `You are over-allocated to equities based on current market complacency. ${driftMsg} Trim overweight equities to build cash, or sell Covered Calls. You are $${Math.abs(investmentGap).toFixed(2)} over equity target. ${vixMsg}`
      };
    }

    return {
      targetValue: actualPortfolioValue, // Deprecated rigid target, returning actual for chart continuity
      investmentGap,
      recommendation,
      adjustedContribution,
      computedCash,
      computedEquity,
      computedMonths,
      targetCashPercentage,
      priorityAsset,
      priorityGap
    };
  };

  return { calculateRebalanceData };
}
