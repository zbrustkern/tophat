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