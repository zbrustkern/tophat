"use client"

import { getFunctions, httpsCallable } from 'firebase/functions';
import { ChartData } from '@/types/chart';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
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

interface FormData {
  planName: string;
  income: number;
  raiseRate: number;
  saveRate: number;
  balance: number;
  taxRate: number;
  returnRate: number;
}

const initialFormData: FormData = {
  planName: 'Untitled Plan',
  income: 100000,
  raiseRate: 0.03,
  saveRate: 0.20,
  balance: 100000,
  taxRate: 0.40,
  returnRate: 0.08,
};

export default function IncomePlanner() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [chartData, setChartData] = useState<ChartData>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const generateFinancialData = useCallback((data: FormData) => {
    const {
      income: initialIncome,
      raiseRate: initialRaise,
      saveRate: initialSavingsRate,
      taxRate,
      returnRate: portfolioReturn,
      balance: initialBalance
    } = data;

    const years = 25;
    const chartData = [];
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

      chartData.push({
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
      currentSavingsRate = Math.min(currentSavingsRate + 0.01, 1);
    }

    return chartData;
  }, []);

  const calculateChartData = useCallback((data: FormData = formData) => {
    const newChartData = generateFinancialData(data);
    setChartData(newChartData);
  }, [formData, generateFinancialData]);

  useEffect(() => {
    const loadPlan = async () => {
      if (!user || !planId) return;

      try {
        const functions = getFunctions();
        const readPlan = httpsCallable(functions, 'read_plan');
        const result = await readPlan({ planId });
        const data = result.data as { success: boolean; plan: { formData: FormData } };
        
        if (data.success && data.plan.formData) {
          setFormData(data.plan.formData);
          calculateChartData(data.plan.formData);
        }
      } catch (error) {
        console.error('Error loading plan:', error);
        alert('Failed to load plan. Please try again.');
      }
    };

    loadPlan();
  }, [user, planId, calculateChartData]);

  useEffect(() => {
    calculateChartData();
  }, [calculateChartData]);

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target;
    let newValue: string | number;
    
    if (name === "raiseRate" || name === "saveRate" || name === "taxRate" || name === "returnRate") {
      newValue = parseFloat(value) * 0.01;
    } else if (name === "planName") {
      newValue = value;
    } else {
      newValue = Number(value);
    }
    
    setFormData(prev => ({...prev, [name]: newValue }));
  };

  const handleSave = async () => {
    if (!user) {
      alert("Please sign in to save your plan");
      return;
    }
  
    setSaveStatus('saving');
    try {
      const functions = getFunctions();
      const saveFn = planId ? 'update_plan' : 'create_plan';
      const saveFunction = httpsCallable(functions, saveFn);
      
      const planData = {
        planId,
        planName: formData.planName || 'Untitled Income Plan',
        planType: 'income',
        formData: formData,
      };

      const result = await saveFunction(planData);
      const data = result.data as { success: boolean; planId?: string };
      
      if (data.success) {
        setSaveStatus('saved');
        if (!planId && data.planId) {
          router.push(`/income?plan=${data.planId}`);
        }
      }
    } catch (error) {
      console.error("Error saving income plan:", error);
      setSaveStatus('error');
      alert(`Error saving plan: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
    <main className="flex flex-col">
      <div className="m-1">
        <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-none">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Income Planner
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium">How are you preparing currently?</CardDescription>
          </CardHeader>
          <CardContent className="bg-gray-50/50">
            <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
              <Label htmlFor="planName">Plan Name</Label>
              <Input
                required
                type="text"
                name="planName"
                value={formData.planName}
                onChange={handleChange}
              />
            </div>
            <div className="flex w-full flex-wrap md:flex-nowrap md:mb-0 gap-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="income">Income in $/year</Label>
                <Input
                  required
                  type="number"
                  name="income"
                  value={formData.income}
                  placeholder="100,000"
                  onChange={handleChange}
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="balance">Starting Balance $</Label>
                <Input
                  required
                  type="number"
                  name="balance"
                  value={formData.balance}
                  placeholder="25,000"
                  onChange={handleChange}
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="returnRate">Estimated Long Term Average Portfolio Return (%)</Label>
                <Input
                  required
                  type="number"
                  name="returnRate"
                  value={formData.returnRate * 100}
                  placeholder="8"
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="flex w-full flex-wrap md:flex-nowrap md:mb-0 gap-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="raiseRate">Estimated Annual Raise (%)</Label>
                <Input
                  required
                  type="number"
                  name="raiseRate"
                  value={formData.raiseRate * 100}
                  placeholder="3"
                  onChange={handleChange}
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="saveRate">Annual Savings Rate (%)</Label>
                <Input
                  required
                  type="number"
                  name="saveRate"
                  value={formData.saveRate * 100}
                  placeholder="20"
                  onChange={handleChange}
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="taxRate">Blended Total Tax Rate (%)</Label>
                <Input
                  required
                  type="number"
                  name="taxRate"
                  value={formData.taxRate * 100}
                  placeholder="40"
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-white border-t py-4">
            <div className="flex w-full items-center">
              <Button onClick={() => calculateChartData()}>Show me my $$</Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      <div className="m-1">
        <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-none">
          <CardHeader className="flex gap-3">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Income Expectations
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium">
              How much passive income are you set to earn?
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-gray-50/50">
            <IncomeChart chartData={chartData}/>
          </CardContent>
          <CardFooter className="bg-white border-t py-4">
            <Button onClick={handleSave}>
              {planId ? 'Update plan' : 'Save new plan'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
    </Suspense>
  );
}