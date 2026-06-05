import { useState, useMemo } from 'react';
import { MonthlySpend, Valuations, CARD_DATABASE, AIRLINE_TIERS, SpendCategory, CreditCard } from '@/types/optimization';

export interface OptimizationResult {
  portfolio: Record<SpendCategory, CreditCard>;
  annualCashValue: number;
  annualFees: number;
  statusAirline: 'united' | 'american' | null;
  statusPointsEarned: number;
  statusTierAchieved: string | null;
  statusValue: number;
  netYield: number;
}

export function useCardOptimization(
  monthlySpend: MonthlySpend,
  valuations: Valuations,
  organicStatusPoints: { united: number; american: number },
  targetAirline: 'united' | 'american',
  customCards: CreditCard[] = []
) {
  
  const calculatePortfolioYield = (portfolio: Record<SpendCategory, CreditCard>, ALL_CARDS: CreditCard[]): OptimizationResult => {
    let annualCashValue = 0;
    const uniqueCards = new Set<string>();
    
    // Tracking status points
    let unitedPQP = organicStatusPoints.united;
    let americanLP = organicStatusPoints.american;

    // We process annually
    const categories: SpendCategory[] = ['groceries', 'gas', 'dining', 'travel', 'other'];
    
    categories.forEach(cat => {
      const card = portfolio[cat];
      uniqueCards.add(card.id);
      
      const annualSpend = monthlySpend[cat] * 12;
      const pointsEarned = annualSpend * card.multipliers[cat];
      
      // Convert points to cash using specific fungible lambda
      let cashValue = 0;
      if (card.currency === 'CashBack') {
        cashValue = pointsEarned / 100;
      } else if (card.currency === 'UR') {
        cashValue = pointsEarned * valuations.urValue;
      } else if (card.currency === 'MR') {
        cashValue = pointsEarned * valuations.mrValue;
      } else {
        cashValue = pointsEarned * valuations.mileValue;
      }
      annualCashValue += cashValue;
      
      // Status rules
      if (card.statusRules.type === 'PQP' && card.statusRules.airline === 'united') {
        const rate = card.statusRules.earnRate || 15;
        let pqp = Math.floor(annualSpend / rate);
        unitedPQP += pqp;
      }
      
      if (card.statusRules.type === 'LP' && card.statusRules.airline === 'american') {
        const rate = card.statusRules.earnRate || 1;
        americanLP += Math.floor(annualSpend / rate);
      }
    });

    // Add holding bonuses for unique cards
    Array.from(uniqueCards).forEach(cardId => {
      const card = ALL_CARDS.find(c => c.id === cardId);
      if (card?.statusRules.holdingBonus && card.statusRules.airline === 'united') {
        unitedPQP += card.statusRules.holdingBonus;
      }
      // Add AA threshold bonuses
      if (card?.statusRules.airline === 'american' && card.statusRules.thresholdBonuses) {
        card.statusRules.thresholdBonuses.forEach(b => {
          if (americanLP >= b.threshold) {
            americanLP += b.bonus;
          }
        });
      }
    });

    const annualFees = Array.from(uniqueCards).reduce((sum, cardId) => {
      const card = ALL_CARDS.find(c => c.id === cardId);
      return sum + (card?.annualFee || 0);
    }, 0);

    // Determine target airline tier
    let statusPointsEarned = 0;
    let statusTierAchieved: string | null = null;
    let statusValue = 0;
    
    if (targetAirline === 'united') {
      statusPointsEarned = unitedPQP;
      const tiers = AIRLINE_TIERS.united;
      for (let i = tiers.length - 1; i >= 0; i--) {
        if (unitedPQP >= tiers[i].req) {
          statusTierAchieved = tiers[i].name;
          // @ts-ignore
          statusValue = valuations.statusTiers.united[tiers[i].name.toLowerCase().replace(' ', '')] || 0;
          if (tiers[i].name === '1K') statusValue = valuations.statusTiers.united['1K'];
          break;
        }
      }
    } else {
      statusPointsEarned = americanLP;
      const tiers = AIRLINE_TIERS.american;
      for (let i = tiers.length - 1; i >= 0; i--) {
        if (americanLP >= tiers[i].req) {
          statusTierAchieved = tiers[i].name;
          // @ts-ignore
          statusValue = valuations.statusTiers.american[tiers[i].name.toLowerCase().replace(' ', '')] || 0;
          if (tiers[i].name === 'Exec Pro') statusValue = valuations.statusTiers.american['execPro'];
          break;
        }
      }
    }

    const netYield = annualCashValue + statusValue - annualFees;

    return {
      portfolio,
      annualCashValue,
      annualFees,
      statusAirline: targetAirline,
      statusPointsEarned,
      statusTierAchieved,
      statusValue,
      netYield
    };
  };

  const ALL_CARDS = useMemo(() => [...CARD_DATABASE, ...customCards], [customCards]);

  // Build the Maximize Value Portfolio
  const getMaxValuePortfolio = () => {
    const categories: SpendCategory[] = ['groceries', 'gas', 'dining', 'travel', 'other'];
    const p: any = {};
    categories.forEach(cat => {
      // Find card with highest return for this category
      let bestCard = ALL_CARDS[0];
      let bestReturn = -1;
      ALL_CARDS.forEach(card => {
        let val = 0;
        if (card.currency === 'CashBack') val = card.multipliers[cat] / 100;
        else if (card.currency === 'UR') val = card.multipliers[cat] * valuations.urValue;
        else if (card.currency === 'MR') val = card.multipliers[cat] * valuations.mrValue;
        else val = card.multipliers[cat] * valuations.mileValue;

        if (val > bestReturn) {
          bestReturn = val;
          bestCard = card;
        }
      });
      p[cat] = bestCard;
    });
    return calculatePortfolioYield(p, ALL_CARDS);
  };

  // Build the Target Status Portfolio
  const getTargetStatusPortfolio = () => {
    const categories: SpendCategory[] = ['groceries', 'gas', 'dining', 'travel', 'other'];
    const p: any = {};
    const airlineCard = ALL_CARDS.find(c => c.statusRules.airline === targetAirline);
    
    categories.forEach(cat => {
      if (airlineCard) {
        // Put all spend on the airline card to maximize status
        p[cat] = airlineCard;
      } else {
        p[cat] = ALL_CARDS[0];
      }
    });
    return calculatePortfolioYield(p, ALL_CARDS);
  };

  const maxValueRes = useMemo(() => getMaxValuePortfolio(), [monthlySpend, valuations, organicStatusPoints, targetAirline, ALL_CARDS]);
  const maxStatusRes = useMemo(() => getTargetStatusPortfolio(), [monthlySpend, valuations, organicStatusPoints, targetAirline, ALL_CARDS]);

  return {
    maxValueRes,
    maxStatusRes,
    opportunityCost: maxValueRes.netYield - maxStatusRes.netYield
  };
}
