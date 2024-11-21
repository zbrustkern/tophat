"use client"

import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@/contexts/AuthContext';
import { SavingsChartData } from '@/types/chart';
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

export default function SavingsPlanner() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
      desiredIncome: 100000,
      currentAge: 30,
      retirementAge: 65,
      currentBalance: 100000,
      taxRate: 0.40,
      returnRate: 0.08,
    });
    const [chartData, setChartData] = useState<SavingsChartData>([]);
    const [requiredSavings, setRequiredSavings] = useState(0);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const generateFinancialData = useCallback((
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

  const calculateChartData = useCallback(() => {
    const newChartData = generateFinancialData(
      Number(formData.desiredIncome),
      Number(formData.currentAge),
      Number(formData.retirementAge),
      Number(formData.currentBalance),
      formData.taxRate,
      formData.returnRate
    );
    setChartData(newChartData);
  }, [formData, generateFinancialData]);

  useEffect(() => {
    calculateChartData();
  }, [calculateChartData]);

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.name === "taxRate" || evt.target.name === "returnRate"
      ? parseFloat(evt.target.value) * 0.01
      : evt.target.value;
    setFormData({...formData, [evt.target.name]: value });
  }

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
          formData,
          requiredSavings
        });
        console.log(result.data);
        setSaveStatus('saved');
      } catch (error) {
        console.error("Error saving savings plan:", error);
        setSaveStatus('error');
        alert(`Error saving plan: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
  
    return (
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
                <Button onClick={calculateChartData}>Calculate Required Savings</Button>
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
    )
};