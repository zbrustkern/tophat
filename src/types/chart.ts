// chart.ts
export type ChartDataPoint = {
  year: number;
  income: number;
  takeHome: number;
  raiseRate: number;
  saveRate: number;
  taxRate: number;
  netContribution: number;
  portfolioReturn: number;
  balance: number;
  capitalIncome: number;
  conservativeIncome: number;
};

export type ChartData = ChartDataPoint[];

// savingsChart.ts
export type SavingsChartDataPoint = {
  year: number;
  balance: number;
  savingsRate: number;
  totalSaved: number;
  projectedIncome: number;
};

export type SavingsChartData = SavingsChartDataPoint[];

// Add this new type for form data
export type IncomePlanFormData = {
  planName: string;
  income: number;
  raiseRate: number;
  saveRate: number;
  balance: number;
  taxRate: number;
  returnRate: number;
};