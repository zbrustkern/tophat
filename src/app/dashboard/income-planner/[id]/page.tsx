"use client"

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from "react"
import { IncomeChart } from "@/components/IncomeChart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useRouter, useParams } from 'next/navigation';
import { ChartData } from '@/types/chart';

export default function IncomePlannerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;

  const [formData, setFormData] = useState({
    planName: '',
    income: 100000,
    raiseRate: 3,
    saveRate: 20,
    balance: 100000,
    taxRate: 40,
    returnRate: 8,
  });

  const [chartData, setChartData] = useState<ChartData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const functions = getFunctions();
    const readIncomePlan = httpsCallable(functions, 'read_income_plan');

    try {
      const result = await readIncomePlan({ planId });
      const planData = (result.data as any).plan;
      setFormData({
        ...planData,
        raiseRate: planData.raiseRate * 100,
        saveRate: planData.saveRate * 100,
        taxRate: planData.taxRate * 100,
        returnRate: planData.returnRate * 100
      });
    } catch (error) {
      console.error("Error fetching plan data:", error);
      setError("Failed to load plan data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, planId]);

  useEffect(() => {
    if (planId && planId !== 'new') {
      fetchPlanData();
    } else {
      setLoading(false);
    }
  }, [planId, fetchPlanData]);

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'planName' ? value : Number(value)
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const functions = getFunctions();
    const updateIncomePlan = httpsCallable(functions, 'update_income_plan');

    try {
      const result = await updateIncomePlan({ 
        planId, 
        ...formData,
        raiseRate: formData.raiseRate / 100,
        saveRate: formData.saveRate / 100,
        taxRate: formData.taxRate / 100,
        returnRate: formData.returnRate / 100
      });
      console.log("Plan updated:", result.data);
      router.push('/dashboard'); // Redirect to dashboard after saving
    } catch (error) {
      console.error("Error updating plan:", error);
      setError("Failed to update plan. Please try again.");
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
      currentSavingsRate = Math.min(currentSavingsRate + 0.01, 0.75); // Cap at 75%
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

  useEffect(() => {
    calculateChartData();
  }, [calculateChartData]);

  if (loading) {
    return <div>Loading plan data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <main className="flex flex-col p-4">
      <Card>
        <CardHeader>
          <CardTitle>Edit Income Plan</CardTitle>
          <CardDescription>Update your income plan details</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <Label htmlFor="planName">Plan Name</Label>
              <Input id="planName" name="planName" value={formData.planName} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="income">Annual Income</Label>
              <Input id="income" name="income" type="number" value={formData.income} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="raiseRate">Annual Raise Rate (%)</Label>
              <Input id="raiseRate" name="raiseRate" type="number" value={formData.raiseRate} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="saveRate">Savings Rate (%)</Label>
              <Input id="saveRate" name="saveRate" type="number" value={formData.saveRate} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="balance">Current Balance</Label>
              <Input id="balance" name="balance" type="number" value={formData.balance} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input id="taxRate" name="taxRate" type="number" value={formData.taxRate} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="returnRate">Expected Return Rate (%)</Label>
              <Input id="returnRate" name="returnRate" type="number" value={formData.returnRate} onChange={handleChange} />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={calculateChartData}>Update Projection</Button>
          <Button onClick={handleSave}>Update Plan</Button>
        </CardFooter>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Income Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeChart chartData={chartData} />
        </CardContent>
      </Card>
    </main>
  );
}