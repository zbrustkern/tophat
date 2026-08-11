// types/optimization.ts

export type SpendCategory = 'groceries' | 'gas' | 'dining' | 'travel' | 'wholesale' | 'other';

export interface MonthlySpend {
  groceries: number;
  gas: number;
  dining: number;
  travel: number;
  wholesale: number;
  other: number;
}

export interface Valuations {
  mileValue: number; // e.g. 0.012 for 1.2 cents
  urValue: number; // e.g. 0.015 for 1.5 cents
  mrValue: number; // e.g. 0.015 for 1.5 cents
  statusTiers: {
    united: { silver: number; gold: number; platinum: number; '1K': number };
    american: { gold: number; platinum: number; pro: number; execPro: number };
  };
}

export interface StatusRules {
  type: 'PQP' | 'LP' | 'NONE';
  airline?: 'united' | 'american';
  earnRate?: number; // e.g., 15 means 1 point per $15
  annualCap?: number; // e.g., 28000. 0 means uncapped
  holdingBonus?: number; // e.g., 1500
  thresholdBonuses?: { threshold: number; bonus: number }[]; // e.g., AA's 50k -> 10k
}

export interface CreditCard {
  id: string;
  name: string;
  annualFee: number;
  currency: 'United Miles' | 'AA Miles' | 'UR' | 'MR' | 'CashBack';
  multipliers: Record<SpendCategory, number>; // e.g., { groceries: 6, ... }
  statusRules: StatusRules;
}

// Hardcoded Database

export const CARD_DATABASE: CreditCard[] = [
  {
    id: 'united-club-infinite',
    name: 'United Club Infinite',
    annualFee: 525,
    currency: 'United Miles',
    multipliers: { groceries: 1, gas: 1, dining: 2, travel: 4, wholesale: 1, other: 1 },
    statusRules: { type: 'PQP', airline: 'united', earnRate: 15, annualCap: 28000, holdingBonus: 1500 }
  },
  {
    id: 'citi-aa-exec',
    name: 'Citi AAdvantage Executive',
    annualFee: 595,
    currency: 'AA Miles',
    multipliers: { groceries: 1, gas: 1, dining: 1, travel: 4, wholesale: 1, other: 1 },
    statusRules: { 
      type: 'LP', 
      airline: 'american', 
      earnRate: 1, 
      annualCap: 0, 
      holdingBonus: 0,
      thresholdBonuses: [
        { threshold: 50000, bonus: 10000 },
        { threshold: 90000, bonus: 10000 }
      ]
    }
  },
  {
    id: 'amex-bcp',
    name: 'Amex Blue Cash Preferred',
    annualFee: 95,
    currency: 'CashBack',
    multipliers: { groceries: 6, gas: 3, dining: 1, travel: 1, wholesale: 1, other: 1 },
    statusRules: { type: 'NONE' }
  },
  {
    id: 'citi-double-cash',
    name: 'Citi Double Cash',
    annualFee: 0,
    currency: 'CashBack',
    multipliers: { groceries: 2, gas: 2, dining: 2, travel: 2, wholesale: 2, other: 2 },
    statusRules: { type: 'NONE' }
  },
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    annualFee: 550,
    currency: 'UR',
    multipliers: { groceries: 1, gas: 1, dining: 3, travel: 3, wholesale: 1, other: 1 },
    statusRules: { type: 'NONE' }
  },
  {
    id: 'citi-costco-visa',
    name: 'Costco Anywhere Visa',
    annualFee: 0,
    currency: 'CashBack',
    multipliers: { groceries: 1, gas: 4, dining: 3, travel: 3, wholesale: 2, other: 1 },
    statusRules: { type: 'NONE' }
  }
];

export const AIRLINE_TIERS = {
  united: [
    { name: 'Silver', req: 4000 },
    { name: 'Gold', req: 8000 },
    { name: 'Platinum', req: 12000 },
    { name: '1K', req: 18000 }
  ],
  american: [
    { name: 'Gold', req: 40000 },
    { name: 'Platinum', req: 75000 },
    { name: 'Pro', req: 125000 },
    { name: 'Exec Pro', req: 200000 }
  ]
};
