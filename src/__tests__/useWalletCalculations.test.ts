import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWalletCalculations } from '../hooks/useWalletCalculations';
import { MonthlySpend, Valuations, SpendCategory, CreditCard } from '../types/optimization';

describe('useWalletCalculations', () => {
  const mockSpend: MonthlySpend = {
    groceries: 1000,
    gas: 100,
    dining: 500,
    travel: 1000,
    wholesale: 500,
    other: 1000
  };

  const mockValuations: Valuations = {
    mileValue: 0.012,
    urValue: 0.015,
    mrValue: 0.013,
    statusTiers: {
      united: { silver: 0, gold: 1000, platinum: 2500, '1K': 5000 },
      american: { gold: 500, platinum: 1500, pro: 3000, execPro: 6000 }
    }
  };

  const mockWalletIds: Record<SpendCategory, string> = {
    groceries: 'amex-bcp', // 6% cashback
    gas: 'citi-costco-visa', // 4% cashback
    dining: 'chase-sapphire-reserve', // 3x UR (4.5%)
    travel: 'chase-sapphire-reserve', // 3x UR (4.5%)
    wholesale: 'citi-costco-visa', // 2% cashback
    other: 'citi-double-cash' // 2% cashback
  };

  it('calculates the total yield correctly for a mixed wallet', () => {
    const { result: hook } = renderHook(() => useWalletCalculations(mockSpend, mockValuations, mockWalletIds, []));
    const result = hook.current.calculateWallet();

    // Groceries: $1000 * 12 = $12000. Amex BCP = 6% -> $720
    expect(result.categoryBreakdown.groceries.yield).toBe(720);

    // Gas: $100 * 12 = $1200. Costco = 4% -> $48
    expect(result.categoryBreakdown.gas.yield).toBe(48);

    // Dining: $500 * 12 = $6000. CSR = 3x UR @ 1.5c = 4.5% -> $270
    expect(result.categoryBreakdown.dining.yield).toBe(270);

    // Travel: $1000 * 12 = $12000. CSR = 3x UR @ 1.5c = 4.5% -> $540
    expect(result.categoryBreakdown.travel.yield).toBe(540);

    // Wholesale: $500 * 12 = $6000. Costco = 2% -> $120
    expect(result.categoryBreakdown.wholesale.yield).toBe(120);

    // Other: $1000 * 12 = $12000. Double Cash = 2% -> $240
    expect(result.categoryBreakdown.other.yield).toBe(240);

    // Total Yield = 720 + 48 + 270 + 540 + 120 + 240 = 1938
    expect(result.totalYield).toBeCloseTo(1938);

    // Fees: Amex BCP (95) + Costco (0) + CSR (550) + Double Cash (0) = 645
    expect(result.totalFees).toBe(645);
    expect(result.netValue).toBe(1938 - 645);
  });
});
