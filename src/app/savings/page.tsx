"use client"

import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@/contexts/AuthContext';
import { SavingsChartData } from '@/types/chart';
import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { SavingsChart } from "@/components/SavingsChart"
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
  desiredIncome: number;
  currentAge: number;
  retirementAge: number;
  currentBalance: number;
  taxRate: number;
  returnRate: number;
}

const initialFormData: FormData = {
  planName: 'Untitled Plan',
  desiredIncome: 100000,
  currentAge: 30,
  retirementAge: 65,
  currentBalance: 100000,
  taxRate: 0.40,
  returnRate: 0.08,
};

export default function SavingsPlanner() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [chartData, setChartData] = useState<SavingsChartData>([]);
  const [requiredSavings, setRequiredSavings] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const generateFinancialData = useCallback((data: FormData): SavingsChartData => {
    const {
      desiredIncome,
      currentAge,
      retirementAge,
      currentBalance,
      taxRate,
      returnRate
    } = data;

    const years = retirementAge - currentAge;
    const chartData: SavingsChartData = [];
    let currentSavings = 0;
    let balance = currentBalance;

    // Calculate required savings
    const totalRequired = desiredIncome / (returnRate * (1 - taxRate));
    const yearlySavings = (totalRequired - currentBalance * Math.pow(1 + returnRate, years)) / 
                          ((Math.pow(1 + returnRate, years) - 1) / returnRate);

    setRequiredSavings(yearlySavings);

    for (let year = currentAge; year <= retirementAge; year++) {
      balance = balance * (1 + returnRate) + yearlySavings;
      currentSavings += yearlySavings;

      chartData.push({
        year: year,
        balance: Math.round(balance),
        savingsRate: Math.round(yearlySavings),
        totalSaved: Math.round(currentSavings),
        projectedIncome: Math.round(balance * returnRate * (1 - taxRate)),
      });
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
    
    if (name === "taxRate" || name === "returnRate") {
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
        planName: formData.planName || 'Untitled Savings Plan',
        planType: 'savings',
        formData: formData,
        requiredSavings
      };

      const result = await saveFunction(planData);
      const data = result.data as { success: boolean; planId?: string };
      
      if (data.success) {
        setSaveStatus('saved');
        if (!planId && data.planId) {
          // If this was a new plan, update URL with the new plan ID
          router.push(`/savings?plan=${data.planId}`);
        }
      }
    } catch (error) {
      console.error("Error saving savings plan:", error);
      setSaveStatus('error');
      alert(`Error saving plan: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
    return (
      <Suspense fallback={<div>Loading...</div>}>
      <main className="flex flex-col">
        <div className="m-1">
          <Card>
            <CardHeader className="flex gap-3">
              <CardTitle>Savings Planner</CardTitle>
              <CardDescription>Plan your savings for your desired retirement income</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p>Enter your details here...</p>
              <div className="flex w-full flex-wrap md:flex-nowrap md:mb-0 gap-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="desiredIncome">Desired Annual Income in Retirement ($)</Label>
                  <Input
                    required
                    type="number"
                    name="desiredIncome"
                    placeholder="100,000"
                    onChange={handleChange}
                  />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="currentBalance">Current Savings Balance ($)</Label>
                  <Input
                    required
                    type="number"
                    name="currentBalance"
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
                    placeholder="8%"
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="flex w-full flex-wrap md:flex-nowrap md:mb-0 gap-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="currentAge">Current Age</Label>
                  <Input
                    required
                    type="number"
                    name="currentAge"
                    placeholder="30"
                    onChange={handleChange}
                  />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="retirementAge">Desired Retirement Age</Label>
                  <Input
                    required
                    type="number"
                    name="retirementAge"
                    placeholder="65"
                    onChange={handleChange}
                  />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="taxRate">Expected Tax Rate in Retirement (%)</Label>
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
              <div className="flex w-full justify-between items-center">
                <Button onClick={() => calculateChartData()}>Calculate Required Savings</Button>
              <div>
                  <p>Required Annual Savings: ${Math.round(requiredSavings).toLocaleString()}</p>
                </div>
              </div>
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
              <SavingsChart chartData={chartData}/>
            </CardContent>
            <CardFooter>
              <div className="flex w-full justify-start">
                <div>
                  <Button onClick={handleSave}>Save my plan (coming soon)</Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
      </Suspense>
    )
};