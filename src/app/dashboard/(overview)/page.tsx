"use client"

import { ChartData } from '@/types/chart';
import { useState, useEffect, useCallback } from "react"
import { IncomeChart } from "@/components/IncomeChart"
import { Button, } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Home() {
  
  const newForm = {
    income: 100000,
    raiseRate: .03,
    saveRate: .20,
    balance: 100000,
    taxRate: .40,
    returnRate: .08,
}

  const [formData, setFormData] = useState(newForm);
  const [chartData, setChartData] = useState<ChartData>([]);

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

  return (
    <main className="flex flex-col">
      <div className="m-1">
        <Card>
          <CardHeader className="flex gap-3">
            <CardTitle>Income Planner</CardTitle>
            <CardDescription>How are you preparing currently?</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p>Enter your details here...</p>
            <div className="flex w-full flex-wrap md:flex-nowrap md:mb-0 gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="income">Income in $/year</Label>
              <Input
                required
                type="number"
                name="income"
                placeholder="100,000"
                onChange={handleChange}
                />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="income">Starting Balance $</Label>
              <Input
                required
                type="number"
                name="balance"
                placeholder="25,000"
                onChange={handleChange}
                />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="income">Estimated Long Term Average Portfolio Return (%)</Label>
              <Input
                required
                type="number"
                name="returnRate"
                placeholder="8%"
                onChange={handleChange}
                />
            </div>
            </div>
            <div className="flex w-full flex-wrap md:flex-nowrap md:mb-0 gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="income">Estimated Annual Raise (%)</Label>
              <Input
                required
                type="number"
                name="raiseRate"
                placeholder="3%"
                onChange={handleChange}
                />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="income">Annual Savings Rate (%)</Label>
              <Input
                required
                type="number"
                name="saveRate"
                placeholder="20%"
                onChange={handleChange}
                />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="income">Blended Total Tax Rate (%)</Label>
              <Input
                required
                type="number"
                name="taxRate"
                placeholder="40%"
                onChange={handleChange}
                />
            </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex w-full justify-start">
              <div>
              <Button onClick={calculateChartData}>Show me my $$</Button>
              </div>
            </div>
          </CardFooter>
        </Card>
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
          <div className="flex w-full justify-start">
              <div>
              <Button>Save my plan (coming soon)</Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
);
}
