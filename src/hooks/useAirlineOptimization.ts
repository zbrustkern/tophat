import { useMemo } from 'react';
import { Valuations, CARD_DATABASE, AIRLINE_TIERS, SpendCategory, CreditCard, MonthlySpend } from '@/types/optimization';
import { WalletResult } from './useWalletCalculations';

export interface AirlineOptimizationResult {
  baselineYield: number;
  baselinePoints: number;
  baselineTier: string | null;

  newYield: number;
  newPoints: number;
  newTier: string | null;

  opportunityCost: number;
  statusGap: number;
  shifts: { category: SpendCategory; amountShifted: number }[];
}

export function useAirlineOptimization(
  monthlySpend: MonthlySpend,
  valuations: Valuations,
  organicStatusPoints: { united: number; american: number },
  targetAirline: 'united' | 'american',
  targetTierReq: number,
  walletResult: WalletResult,
  targetCardId: string | null,
  customCards: CreditCard[] = []
) {
  const ALL_CARDS = useMemo(() => [...CARD_DATABASE, ...customCards], [customCards]);

  const getTierFromPoints = (points: number, airline: 'united' | 'american') => {
    const tiers = AIRLINE_TIERS[airline];
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (points >= tiers[i].req) {
        return tiers[i].name;
      }
    }
    return null;
  };

  const getCardValuePerDollar = (card: CreditCard, category: SpendCategory) => {
    let val = 0;
    if (card.currency === 'CashBack') val = card.multipliers[category] / 100;
    else if (card.currency === 'UR') val = card.multipliers[category] * valuations.urValue;
    else if (card.currency === 'MR') val = card.multipliers[category] * valuations.mrValue;
    else val = card.multipliers[category] * valuations.mileValue;
    return val;
  };

  const calculate = (): AirlineOptimizationResult => {
    const categories: SpendCategory[] = ['groceries', 'gas', 'dining', 'travel', 'wholesale', 'other'];

    let baselinePoints = targetAirline === 'united' ? organicStatusPoints.united : organicStatusPoints.american;

    // Add baseline points from the current wallet
    categories.forEach(cat => {
      const breakdown = walletResult.categoryBreakdown[cat];
      const card = ALL_CARDS.find(c => c.id === breakdown.cardId) || ALL_CARDS[0];
      const annualSpend = breakdown.spend;

      if (card.statusRules.airline === targetAirline) {
        if (card.statusRules.type === 'PQP' && targetAirline === 'united') {
          baselinePoints += Math.floor(annualSpend / (card.statusRules.earnRate || 15));
        } else if (card.statusRules.type === 'LP' && targetAirline === 'american') {
          baselinePoints += Math.floor(annualSpend / (card.statusRules.earnRate || 1));
        }
      }
    });

    const baselineTier = getTierFromPoints(baselinePoints, targetAirline);
    const targetCard = ALL_CARDS.find(c => c.id === targetCardId);

    if (!targetCard || targetCard.statusRules.airline !== targetAirline) {
      return {
        baselineYield: walletResult.totalYield,
        baselinePoints,
        baselineTier,
        newYield: walletResult.totalYield,
        newPoints: baselinePoints,
        newTier: baselineTier,
        opportunityCost: 0,
        statusGap: Math.max(0, targetTierReq - baselinePoints),
        shifts: []
      };
    }

    let newPoints = baselinePoints;
    let newYield = walletResult.totalYield;
    const shifts: { category: SpendCategory; amountShifted: number }[] = [];

    // Prioritize categories where the target card is relatively better
    const orderedCategories = [...categories].sort((a, b) => {
      const currentA = walletResult.categoryBreakdown[a];
      const currentB = walletResult.categoryBreakdown[b];
      const targetA = getCardValuePerDollar(targetCard, a);
      const targetB = getCardValuePerDollar(targetCard, b);
      const baselineRateA = currentA.spend > 0 ? currentA.yield / currentA.spend : 0;
      const baselineRateB = currentB.spend > 0 ? currentB.yield / currentB.spend : 0;
      
      const deltaA = baselineRateA - targetA;
      const deltaB = baselineRateB - targetB;
      return deltaA - deltaB; 
    });

    for (const cat of orderedCategories) {
      if (newPoints >= targetTierReq) break;
      const annualSpend = walletResult.categoryBreakdown[cat].spend;
      if (annualSpend === 0) continue;

      const baselineYieldForCat = walletResult.categoryBreakdown[cat].yield;
      const targetYieldForCat = annualSpend * getCardValuePerDollar(targetCard, cat);
      
      const yieldDiff = baselineYieldForCat - targetYieldForCat;
      
      let pointsGained = 0;
      if (targetCard.statusRules.type === 'PQP' && targetAirline === 'united') {
        pointsGained = Math.floor(annualSpend / (targetCard.statusRules.earnRate || 15));
      } else if (targetCard.statusRules.type === 'LP' && targetAirline === 'american') {
        pointsGained = Math.floor(annualSpend / (targetCard.statusRules.earnRate || 1));
      }

      newYield -= yieldDiff;
      newPoints += pointsGained;
      shifts.push({ category: cat, amountShifted: annualSpend });
    }

    const opportunityCost = walletResult.totalYield - newYield;
    const newTier = getTierFromPoints(newPoints, targetAirline);
    const statusGap = Math.max(0, targetTierReq - newPoints);

    return {
      baselineYield: walletResult.totalYield,
      baselinePoints,
      baselineTier,
      newYield,
      newPoints,
      newTier,
      opportunityCost,
      statusGap,
      shifts
    };
  };

  return { calculateAirline: calculate };
}
