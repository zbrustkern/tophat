"use client"

import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@/contexts/AuthContext';
import { SavingsChartData } from '@/types/savingsChart';
import { useState, useEffect, useCallback } from "react"
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

interface Plan {
    id: string;
    planName: string;
    formData: any;
    requiredSavings: number;
  }

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
}

export default function SavingsPlanner() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
    const [formData, setFormData] = useState(initialFormData);
    const [chartData, setChartData] = useState<SavingsChartData>([]);
    const [requiredSavings, setRequiredSavings] = useState(0);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [loadStatus, setLoadStatus] = useState<'loading' | 'loaded' | 'error'>('loading');


    const generateFinancialData = useCallback((formData: typeof initialFormData): SavingsChartData => {
        const {
            desiredIncome,
            currentAge,
            retirementAge,
            currentBalance,
            taxRate,
            returnRate
        } = formData;

        const years = retirementAge - currentAge;
        const data: SavingsChartData = [];
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

    const calculateChartData = useCallback((data: typeof initialFormData = formData) => {
        const newChartData = generateFinancialData(data);
        setChartData(newChartData);
    }, [formData, generateFinancialData]);

    const handleCalculateClick = useCallback(() => {
        calculateChartData();
    }, [calculateChartData]);

    useEffect(() => {
        calculateChartData();
    }, [calculateChartData]);

    const loadPlans = useCallback(async () => {
        if (!user) return;

        setLoadStatus('loading');
        try {
            const functions = getFunctions();
            const listSavingsPlans = httpsCallable(functions, 'list_savings_plans');
            const result = await listSavingsPlans();
            const plansData = result.data as { success: boolean, plans: Plan[] };

            if (plansData.success) {
                setPlans(plansData.plans);
                if (plansData.plans.length > 0) {
                    const firstPlan = plansData.plans[0];
                    setCurrentPlanId(firstPlan.id);
                    loadPlanData(firstPlan);
                }
            }
            setLoadStatus('loaded');
        } catch (error) {
            console.error("Error loading savings plans:", error);
            setLoadStatus('error');
        }
    }, [user]);

    const loadPlanData = useCallback((plan: Plan) => {
        if (plan && plan.formData) {
            setFormData(plan.formData);
            setRequiredSavings(plan.requiredSavings);
            calculateChartData(plan.formData);
        }
    }, [calculateChartData]);

    useEffect(() => {
        if (user) {
            loadPlans();
        } else {
            setLoadStatus('loaded');
            setFormData(initialFormData);
            setRequiredSavings(0);
            setChartData([]);
        }
    }, [user, loadPlans]);

    const handlePlanChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedPlan = plans.find(plan => plan.id === e.target.value);
        if (selectedPlan) {
            setCurrentPlanId(selectedPlan.id);
            loadPlanData(selectedPlan);
        }
    }, [plans, loadPlanData]);

    const handleSave = async () => {
        if (!user) {
            alert("Please sign in to save your plan");
            return;
        }

        setSaveStatus('saving');
        try {
            const functions = getFunctions();
            const saveSavingsPlan = httpsCallable(functions, 'save_savings_plan');
            const result = await saveSavingsPlan({ 
                planId: currentPlanId,
                planName: formData.planName || 'Untitled Plan',
                formData,
                requiredSavings
            });
            const saveResult = result.data as { success: boolean, planId: string };
            if (saveResult.success) {
                if (!currentPlanId) {
                    setCurrentPlanId(saveResult.planId);
                    setPlans([...plans, { id: saveResult.planId, planName: formData.planName || 'Untitled Plan', formData, requiredSavings }]);
                } else {
                    setPlans(plans.map(plan => 
                        plan.id === currentPlanId 
                            ? { ...plan, planName: formData.planName || 'Untitled Plan', formData, requiredSavings }
                            : plan
                    ));
                }
                setSaveStatus('saved');
            }
        } catch (error) {
            console.error("Error saving savings plan:", error);
            setSaveStatus('error');
            alert(`Error saving plan: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    

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
    
        setFormData(prevData => ({...prevData, [name]: newValue }));
    };

  return (
    <main className="flex flex-col">
        {loadStatus === 'loading' ? (
            <p>Loading your saved plans...</p>
        ) : (
            <>
                <div>
                    <Label htmlFor="planSelect">Select Plan:</Label>
                    <select
                        id="planSelect"
                        value={currentPlanId || ''}
                        onChange={handlePlanChange}
                    >
                        {plans.map(plan => (
                            <option key={plan.id} value={plan.id}>{plan.planName}</option>
                        ))}
                    </select>
                    <Button onClick={() => {
                        setCurrentPlanId(null);
                        setFormData(initialFormData);
                        setRequiredSavings(0);
                        setChartData([]);
                    }}>Create New Plan</Button>
                </div>
      <div className="m-1">
        <Card>
          <CardHeader className="flex gap-3">
            <CardTitle>Savings Planner</CardTitle>
            <CardDescription>Plan your savings for your desired retirement income</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
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
            <div className="flex w-full flex-wrap md:flex-nowrap md:mb-0 gap-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="desiredIncome">Desired Annual Income in Retirement ($)</Label>
                <Input
                  required
                  type="number"
                  name="desiredIncome"
                  value={formData.desiredIncome}
                  onChange={handleChange}
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="currentBalance">Current Savings Balance ($)</Label>
                <Input
                  required
                  type="number"
                  name="currentBalance"
                  value={formData.currentBalance}
                  onChange={handleChange}
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="returnRate">Estimated Long Term Average Portfolio Return (%)</Label>
                <Input
                  required
                  type="number"
                  name="returnRate"
                  value={formData.returnRate}
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
                  value={formData.currentAge}
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
                  value={formData.retirementAge}
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
                  value={formData.taxRate}
                  placeholder="40%"
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex w-full justify-between items-center">
              <Button onClick={handleCalculateClick}>Calculate Required Savings</Button>
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
                <Button onClick={handleSave}>Save my plan</Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
      </>
        )}
    </main>
  );
}