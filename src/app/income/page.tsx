"use client"

import { getFunctions, httpsCallable } from 'firebase/functions';
import { ChartData } from '@/types/chart';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from "react"
import { IncomeChart } from "@/components/IncomeChart"
import { Button } from "@/components/ui/button"
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [planId, setPlanId] = useState<string | null>(null);

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
  }

  const handleSave = async () => {
    if (!user) {
      alert("Please sign in to save your plan");
      return;
    }
  
    setSaveStatus('saving');
    try {
      const functions = getFunctions();
      const createPlan = httpsCallable(functions, 'create_plan');
      
      const result = await createPlan({
        planName: 'Income Plan',
        planType: 'income',
        formData: formData,
      });
      
      const data = result.data as { success: boolean; planId: string };
      if (data.success) {
        setPlanId(data.planId);
        setSaveStatus('saved');
      }
    } catch (error) {
      console.error("Error saving income plan:", error);
      setSaveStatus('error');
      alert(`Error saving plan: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <main className="flex flex-col">
      <div className="m-1">
      <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-none">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Income Planner</CardTitle>
            <CardDescription className="text-gray-500 font-medium">How are you preparing currently?</CardDescription>
          </CardHeader>
          <CardContent className="bg-gray-50/50">
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
          <CardFooter className="bg-white border-t py-4">
            <div className="flex w-full items-center">
              <Button onClick={calculateChartData}>Show me my $$</Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      <div className="m-1">
      <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-none">
          <CardHeader className="flex gap-3">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Income Expectations</CardTitle>
            <CardDescription className="text-gray-500 font-medium">How much passive income are you set to earn?</CardDescription>
          </CardHeader>
          <CardContent className="bg-gray-50/50">
            <IncomeChart chartData={chartData}/>
          </CardContent>
          <CardFooter className="bg-white border-t py-4">
            <Button onClick={handleSave}>Save my plan (coming soon)</Button>
          </CardFooter>
        </Card>
      </div>
    </main>
);
}