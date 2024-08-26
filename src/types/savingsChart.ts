export type SavingsChartDataPoint = {
    year: number;
    balance: number;
    savingsRate: number;
    totalSaved: number;
    projectedIncome: number;
  };
  
  export type SavingsChartData = SavingsChartDataPoint[];