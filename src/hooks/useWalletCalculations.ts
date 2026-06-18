import { useMemo } from 'react';
import { MonthlySpend, Valuations, CARD_DATABASE, SpendCategory, CreditCard } from '@/types/optimization';

export interface WalletResult {
  totalYield: number;
  totalFees: number;
  netValue: number;
  categoryBreakdown: Record<SpendCategory, { spend: number; cardId: string; yield: number; name: string }>;
}

export function useWalletCalculations(
  monthlySpend: MonthlySpend,
  valuations: Valuations,
  currentWalletIds: Record<SpendCategory, string>,
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

  const calculate = (): WalletResult => {
    const categories: SpendCategory[] = ['groceries', 'gas', 'dining', 'travel', 'wholesale', 'other'];
    let totalYield = 0;
    const uniqueCards = new Set<string>();
    
    const breakdown = {} as Record<SpendCategory, { spend: number; cardId: string; yield: number; name: string }>;

    categories.forEach(cat => {
      const cardId = currentWalletIds[cat] || ALL_CARDS[0].id;
      const card = ALL_CARDS.find(c => c.id === cardId) || ALL_CARDS[0];
      uniqueCards.add(card.id);
      
      const annualSpend = (monthlySpend[cat] || 0) * 12;
      const catYield = annualSpend * getCardValuePerDollar(card, cat);
      totalYield += catYield;
      
      breakdown[cat] = {
        spend: annualSpend,
        cardId: card.id,
        name: card.name,
        yield: catYield
      };
    });

    let totalFees = 0;
    uniqueCards.forEach(id => {
      const card = ALL_CARDS.find(c => c.id === id);
      if (card) {
        totalFees += card.annualFee;
      }
    });

    return {
      totalYield,
      totalFees,
      netValue: totalYield - totalFees,
      categoryBreakdown: breakdown
    };
  };

  return { calculateWallet: calculate };
}
