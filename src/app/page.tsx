"use client"

import { ChartData } from '@/types/chart';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from "react"
import { SavingsChartData } from '@/types/chart';
import { IncomeChart } from "@/components/IncomeChart"
import { SavingsChart } from "@/components/SavingsChart"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Home() {

  const { user } = useAuth();

  const [formData, setFormData] = useState({
    income: 100000,
    raiseRate: 0.03,
    saveRate: 0.20,
    balance: 100000,
    taxRate: 0.40,
    returnRate: 0.08,
  });
  const [chartData, setChartData] = useState<ChartData>([]);
  const [savingsChartData, setSavingsChartData] = useState<SavingsChartData>([]);

  const generateFinancialData = useCallback((
    initialIncome: number, 
    initialRaise: number, 
    initialSavingsRate: number, 
    taxRate: number, 
    portfolioReturn: number, 
    initialBalance: number, 
    years = 25
  ) => {
    const data = [];
    let currentIncome = initialIncome;
    let currentRaise = initialRaise;
    let currentSavingsRate = initialSavingsRate;
    let currentBalance = initialBalance;

    for (let year = 2024; year < 2024 + years; year++) {
      const takeHome = (currentIncome * (1 - currentSavingsRate)) * (1 - taxRate);
      const netContribution = currentSavingsRate * currentIncome;
      const portfolioGrowth = currentBalance * portfolioReturn;
      currentBalance = currentBalance * (1 + portfolioReturn) + netContribution;
      const capitalIncome = currentBalance * portfolioReturn;
      const conservativeIncome = currentBalance * .04; // Conservative income at 4%

      data.push({
        year: year,
        income: Math.round(currentIncome),
        takeHome: Math.round(takeHome),
        raiseRate: currentRaise,
        saveRate: currentSavingsRate,
        taxRate: taxRate,
        netContribution: Math.round(netContribution),
        portfolioReturn: portfolioReturn,
        balance: Math.round(currentBalance),
        capitalIncome: Math.round(capitalIncome),
        conservativeIncome: Math.round(conservativeIncome)
      });

      // Update for next year
      currentIncome *= (1 + currentRaise);
      currentSavingsRate = Math.min(currentSavingsRate + 0.01, 1); // Cap at 100%
      // currentRaise = Math.max(currentRaise - 0.001, 0); // Decrease raise by 0.1% each year, minimum 0%
    }

    return data;
  }, []);

  const calculateChartData = useCallback(() => {
    const newChartData = generateFinancialData(
      formData.income,
      formData.raiseRate,
      formData.saveRate,
      formData.taxRate,
      formData.returnRate,
      formData.balance
    );
    setChartData(newChartData);
  }, [formData, generateFinancialData]);

  useEffect(() => {
    calculateChartData();
  }, [calculateChartData]);

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    if ((evt.target.name === "raiseRate") || (evt.target.name === "saveRate") || (evt.target.name === "taxRate") || (evt.target.name === "returnRate")) {
        setFormData({...formData, [evt.target.name]: parseFloat(evt.target.value) * 0.01 })
    }
    else {
    setFormData({...formData, [evt.target.name]: evt.target.value })
    }
    console.log(formData)
  }

  const generateSavingsFinancialData = useCallback((
    desiredIncome: number,
    currentAge: number,
    retirementAge: number,
    currentBalance: number,
    taxRate: number,
    returnRate: number,
  ): SavingsChartData => {
    const years = retirementAge - currentAge;
    const data: SavingsChartData = [];
    let currentSavings = 0;
    let balance = currentBalance;

    // Calculate required savings
    const totalRequired = desiredIncome / (returnRate * (1 - taxRate));
    const yearlySavings = (totalRequired - currentBalance * Math.pow(1 + returnRate, years)) / 
                          ((Math.pow(1 + returnRate, years) - 1) / returnRate);

    for (let year = currentAge; year <= retirementAge; year++) {
      balance = balance * (1 + returnRate) + yearlySavings;
      currentSavings += yearlySavings;

      data.push({
        year: year,
        balance: Math.round(balance),
        savingsRate: Math.round(yearlySavings),
        totalSaved: Math.round(currentSavings),
        projectedIncome: Math.round(balance * returnRate * (1 - taxRate)),
      });
    }

    return data;
  }, []);

  const calculateSavingsChartData = useCallback(() => {
    const newSavingsChartData = generateSavingsFinancialData(
      Number('150000'),
      Number('30'),
      Number('65'),
      Number('100000'),
      .4,
      .08
    );
    setSavingsChartData(newSavingsChartData);
  }, [generateSavingsFinancialData]);

  useEffect(() => {
    calculateSavingsChartData();
  }, [calculateSavingsChartData]);

  return (
    <main className="flex flex-col">
      <div className="m-1">
      </div>
      <div className="m-1">
      <Card>
          <CardHeader className="flex gap-3">
            <CardTitle>Income Expectations</CardTitle>
            <CardDescription>How much passive income are you set to earn?</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <IncomeChart chartData={chartData}/>
          </CardContent>
          <CardFooter>
          </CardFooter>
        </Card>
      </div>

      <div className="m-1">
        <Card>
          <CardHeader className="flex gap-3">
            <CardTitle>Savings Projections</CardTitle>
            <CardDescription>Your path to your desired retirement income</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <SavingsChart chartData={savingsChartData}/>
          </CardContent>
          <CardFooter>
          </CardFooter>
        </Card>
      </div>

    </main>
);
}