export type DisasterType = 'recession' | 'dotcom' | 'hyperinflation' | 'stagnation';

export interface MarketShock {
  yearOffset: number; // 0 = first year of disaster, 1 = second year, etc.
  returnModifier: number; // e.g. -0.40 for a 40% drop
  inflationModifier?: number; // e.g. 0.10 for 10% inflation
}

export interface DisasterProfile {
  id: DisasterType;
  name: string;
  description: string;
  duration: number; // Total years affected
  shocks: MarketShock[];
  historicalContext: string;
}

export const DISASTERS: Record<DisasterType, DisasterProfile> = {
  recession: {
    id: 'recession',
    name: 'The Great Recession',
    description: 'A massive housing bubble bursts leading to a severe global economic downturn.',
    duration: 3,
    historicalContext: 'Between 2007-2009, the S&P 500 lost over 50% of its value from peak to trough. Real estate plummeted and unemployment spiked to 10%.',
    shocks: [
      { yearOffset: 0, returnModifier: -0.38 }, // 2008 drop
      { yearOffset: 1, returnModifier: 0.23 },  // 2009 rebound
      { yearOffset: 2, returnModifier: 0.12 }   // 2010 stabilization
    ]
  },
  dotcom: {
    id: 'dotcom',
    name: 'Dot Com Crash',
    description: 'Tech bubble bursts resulting in three consecutive years of negative returns.',
    duration: 3,
    historicalContext: 'From 2000-2002, the NASDAQ fell 78% and the S&P 500 fell for three straight years (-9%, -11%, -22%), a rare occurrence.',
    shocks: [
      { yearOffset: 0, returnModifier: -0.09 },
      { yearOffset: 1, returnModifier: -0.11 },
      { yearOffset: 2, returnModifier: -0.22 }
    ]
  },
  hyperinflation: {
    id: 'hyperinflation',
    name: '1970s Stagflation',
    description: 'High inflation eats away purchasing power while market returns stagnate.',
    duration: 5,
    historicalContext: 'In the 1970s, inflation averaged nearly 7% per year, peaking over 13%, drastically reducing the real value of cash and fixed income.',
    shocks: [
      { yearOffset: 0, returnModifier: -0.14, inflationModifier: 0.11 },
      { yearOffset: 1, returnModifier: 0.26, inflationModifier: 0.09 },
      { yearOffset: 2, returnModifier: 0.10, inflationModifier: 0.05 },
      { yearOffset: 3, returnModifier: -0.07, inflationModifier: 0.07 },
      { yearOffset: 4, returnModifier: 0.01, inflationModifier: 0.11 }
    ]
  },
  stagnation: {
    id: 'stagnation',
    name: 'Lost Decade',
    description: 'A prolonged period of zero real growth.',
    duration: 10,
    historicalContext: 'Similar to Japan\'s 1990s or the US market from 2000-2010, the stock market produces a 0% real return over 10 years.',
    shocks: Array.from({ length: 10 }, (_, i) => ({
      yearOffset: i,
      returnModifier: 0.0, // 0% returns
      inflationModifier: 0.03
    }))
  }
};
