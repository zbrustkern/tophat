"use client"

import { getFunctions, httpsCallable } from 'firebase/functions';
import { useRouter, useParams } from 'next/navigation'
import { ChartData, IncomePlanFormData } from '@/types/chart';
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

const initialFormData = {
  planName: '',
  income: 100000,
  raiseRate: 3,
  saveRate: 20,
  balance: 100000,
  taxRate: 40,
  returnRate: 8,
}

export default function IncomePlannerPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState(initialFormData);
  const [chartData, setChartData] = useState<ChartData>([]);
  const [isNewPlan, setIsNewPlan] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loading, setLoading] = useState(true);
  const planId = params.id as string;

  useEffect(() => {
    if (planId && planId !== 'new') {
      setIsNewPlan(false)
      fetchPlanData()
    } else {
      setIsNewPlan(true)
      setFormData(initialFormData)
      setLoading(false)
    }
  }, [planId])

  const fetchPlanData = async () => {
    if (!user) return;

    try {
      const functions = getFunctions();
      const readIncomePlan = httpsCallable(functions, 'read_income_plan');
      const result = await readIncomePlan({ planId });
      const planData = (result.data as any).plan;
      setFormData({
        ...planData,
        raiseRate: planData.raiseRate * 100,
        saveRate: planData.saveRate * 100,
        taxRate: planData.taxRate * 100,
        returnRate: planData.returnRate * 100
      });
      calculateChartData();
    } catch (error) {
      console.error("Error fetching plan data:", error);
      alert("Failed to load plan data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
      formData.raiseRate / 100,
      formData.saveRate / 100,
      formData.taxRate / 100,
      formData.returnRate / 100,
      formData.balance
    );
    setChartData(newChartData);
  }, [formData, generateFinancialData]);

  const handleCalculate = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    calculateChartData();
  }, [calculateChartData]);


  useEffect(() => {
    calculateChartData();
  }, [calculateChartData]);

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'planName' ? value : Number(value)
    }));
  }

  const handleSave = async () => {
    if (!user) {
      alert("Please sign in to save your plan");
      return;
    }
  
    setSaveStatus('saving');
    try {
      const functions = getFunctions();
      const savePlanFunction = isNewPlan ? 'create_income_plan' : 'update_income_plan';
      const saveIncomePlan = httpsCallable(functions, savePlanFunction);
      const result = await saveIncomePlan({
        planId: isNewPlan ? null : planId,
        ...formData,
        raiseRate: formData.raiseRate / 100,
        saveRate: formData.saveRate / 100,
        taxRate: formData.taxRate / 100,
        returnRate: formData.returnRate / 100
      });
      console.log(result.data);
      setSaveStatus('saved');
      if (isNewPlan) {
        router.push(`/dashboard/income-planner/${(result.data as any).planId}`);
      }
    } catch (error) {
      console.error("Error saving income plan:", error);
      setSaveStatus('error');
      alert(`Error saving plan: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData)
    setChartData([])
    setIsNewPlan(true)
    router.push('/dashboard/income-planner/new')
  }

  if (loading) {
    return <div>Loading plan data...</div>;
  }


  
  return (
    <main className="flex flex-col">
      <Card>
        <CardHeader>
          <CardTitle>{isNewPlan ? 'Create New Income Plan' : 'Edit Income Plan'}</CardTitle>
          <CardDescription>Plan your future income</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="planName">Plan Name</Label>
              <Input
                required
                type="text"
                name="planName"
                value={formData.planName}
                onChange={handleChange}
              />
            </div>
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
            </form>
        </CardContent>
        <CardFooter className="flex justify-between">
        <Button onClick={handleCalculate}>Update Projection</Button>
        <Button onClick={handleSave}>{isNewPlan ? 'Create Plan' : 'Update Plan'}</Button>
        {!isNewPlan && <Button onClick={handleReset}>Create New Plan</Button>}
      </CardFooter>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Income Projection</CardTitle>
          <CardDescription>Your projected income and savings over time</CardDescription>
        </CardHeader>
        <CardContent>
          <IncomeChart chartData={chartData}/>
        </CardContent>
      </Card>
    </main>
  );
}