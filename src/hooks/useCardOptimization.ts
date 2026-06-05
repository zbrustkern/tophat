import { useMemo } from 'react';
import { MonthlySpend, Valuations, CARD_DATABASE, AIRLINE_TIERS, SpendCategory, CreditCard } from '@/types/optimization';

export interface OptimizationResult {
  baselineYield: number;
  baselinePoints: number;
  baselineTier: string | null;
  baselineFees: number;

  newYield: number;
  newPoints: number;
  newTier: string | null;
  newFees: number;

  opportunityCost: number;
  shifts: { category: SpendCategory; amountShifted: number }[];
  statusGap: number;
}

export function useCardOptimization(
  monthlySpend: MonthlySpend,
  valuations: Valuations,
  organicStatusPoints: { united: number; american: number },
  targetAirline: 'united' | 'american',
  targetTierReq: number,
  currentWalletIds: Record<SpendCategory, string>,
  targetCardId: string | null,
  customCards: CreditCard[] = []
) {
  const ALL_CARDS = useMemo(() => [...CARD_DATABASE, ...customCards], [customCards]);
  
  const getCardValuePerDollar = (card: CreditCard, category: SpendCategory) => {
    let val = 0;
    if (card.currency === 'CashBack') val = card.multipliers[category] / 100;
    else if (card.currency === 'UR') val = card.multipliers[category] * valuations.urValue;
    else if (card.currency === 'MR') val = card.multipliers[category] * valuations.mrValue;
    else val = card.multipliers[category] * valuations.mileValue;
    return val;
  };

  const getTierFromPoints = (points: number, airline: 'united' | 'american') => {
    const tiers = AIRLINE_TIERS[airline];
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (points >= tiers[i].req) {
        return tiers[i].name;
      }
    }
    return null;
  };

  const calculate = (): OptimizationResult => {
    const categories: SpendCategory[] = ['groceries', 'gas', 'dining', 'travel', 'other'];
    const currentWallet = categories.reduce((acc, cat) => {
      acc[cat] = ALL_CARDS.find(c => c.id === currentWalletIds[cat]) || ALL_CARDS[0];
      return acc;
    }, {} as Record<SpendCategory, CreditCard>);

    let baselineYield = 0;
    let baselinePoints = targetAirline === 'united' ? organicStatusPoints.united : organicStatusPoints.american;
    const baselineUniqueCards = new Set<string>();

    // Baseline calculation
    categories.forEach(cat => {
      const card = currentWallet[cat];
      baselineUniqueCards.add(card.id);
      const annualSpend = monthlySpend[cat] * 12;
      baselineYield += annualSpend * getCardValuePerDollar(card, cat);

      if (card.statusRules.airline === targetAirline) {
        if (card.statusRules.type === 'PQP' && targetAirline === 'united') {
          baselinePoints += Math.floor(annualSpend / (card.statusRules.earnRate || 15));
        } else if (card.statusRules.type === 'LP' && targetAirline === 'american') {
          baselinePoints += Math.floor(annualSpend / (card.statusRules.earnRate || 1));
        }
      }
    });

    let baselineFees = 0;
    baselineUniqueCards.forEach(id => {
      const card = ALL_CARDS.find(c => c.id === id);
      if (card) {
        baselineFees += card.annualFee;
        if (card.statusRules.airline === targetAirline && card.statusRules.holdingBonus) {
          baselinePoints += card.statusRules.holdingBonus;
        }
      }
    });

    const baselineTier = getTierFromPoints(baselinePoints, targetAirline);
    const targetCard = ALL_CARDS.find(c => c.id === targetCardId);

    // If no target card or it doesn't earn for the target airline, just return baseline
    if (!targetCard || targetCard.statusRules.airline !== targetAirline) {
      return {
        baselineYield, baselinePoints, baselineTier, baselineFees,
        newYield: baselineYield, newPoints: baselinePoints, newTier: baselineTier, newFees: baselineFees,
        opportunityCost: 0, shifts: [], statusGap: 0
      };
    }

    // Now calculate the gap
    let newPoints = baselinePoints;
    let newFees = baselineFees;
    if (!baselineUniqueCards.has(targetCard.id)) {
      newFees += targetCard.annualFee;
      if (targetCard.statusRules.holdingBonus) {
        newPoints += targetCard.statusRules.holdingBonus;
      }
    }

    const statusGap = Math.max(0, targetTierReq - newPoints);
    let pointsNeeded = statusGap;
    let newYield = baselineYield;
    const shifts: { category: SpendCategory; amountShifted: number }[] = [];

    if (pointsNeeded > 0) {
      // Calculate opportunity cost per category
      const shiftCandidates = categories.map(cat => {
        const currentCard = currentWallet[cat];
        if (currentCard.id === targetCard.id) return null; // Already using target card

        const currentVal = getCardValuePerDollar(currentCard, cat);
        const targetVal = getCardValuePerDollar(targetCard, cat);
        const oppCostPerDollar = currentVal - targetVal; // Positive means we lose value

        // How many points per dollar does the target card earn?
        let pointsPerDollar = 0;
        if (targetCard.statusRules.type === 'PQP') pointsPerDollar = 1 / (targetCard.statusRules.earnRate || 15);
        if (targetCard.statusRules.type === 'LP') pointsPerDollar = 1 / (targetCard.statusRules.earnRate || 1);

        // How many points per dollar was the CURRENT card earning? (We lose these if we shift!)
        let lostPointsPerDollar = 0;
        if (currentCard.statusRules.airline === targetAirline) {
           if (currentCard.statusRules.type === 'PQP') lostPointsPerDollar = 1 / (currentCard.statusRules.earnRate || 15);
           if (currentCard.statusRules.type === 'LP') lostPointsPerDollar = 1 / (currentCard.statusRules.earnRate || 1);
        }

        const netPointsPerDollar = pointsPerDollar - lostPointsPerDollar;

        return {
          category: cat,
          annualSpend: monthlySpend[cat] * 12,
          oppCostPerDollar,
          netPointsPerDollar
        };
      }).filter(c => c !== null && c.netPointsPerDollar > 0) as any[];

      // Sort by opportunity cost per point (lowest cost first)
      shiftCandidates.sort((a, b) => (a.oppCostPerDollar / a.netPointsPerDollar) - (b.oppCostPerDollar / b.netPointsPerDollar));

      for (const candidate of shiftCandidates) {
        if (pointsNeeded <= 0) break;

        const maxPointsPossible = candidate.annualSpend * candidate.netPointsPerDollar;
        const pointsToTake = Math.min(pointsNeeded, maxPointsPossible);
        const dollarsToShift = pointsToTake / candidate.netPointsPerDollar;

        shifts.push({ category: candidate.category, amountShifted: dollarsToShift });
        
        newYield -= (dollarsToShift * candidate.oppCostPerDollar);
        newPoints += pointsToTake;
        pointsNeeded -= pointsToTake;
      }
    }

    return {
      baselineYield,
      baselinePoints,
      baselineTier,
      baselineFees,
      newYield,
      newPoints: Math.floor(newPoints),
      newTier: getTierFromPoints(newPoints, targetAirline),
      newFees,
      opportunityCost: baselineYield - newYield + (newFees - baselineFees),
      shifts,
      statusGap
    };
  };

  const result = useMemo(() => calculate(), [monthlySpend, valuations, organicStatusPoints, targetAirline, targetTierReq, currentWalletIds, targetCardId, ALL_CARDS]);

  return result;
}
