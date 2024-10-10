"use client"

import { useState, useCallback } from "react"
import { ChartData } from '@/types/chart';
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { IncomeChart } from "@/components/IncomeChart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getFunctions, httpsCallable } from 'firebase/functions'

export default function NewIncomePlan() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    planName: '',
    income: 100000,
    raiseRate: 3,
    saveRate: 20,
    balance: 100000,
    taxRate: 40,
    returnRate: 8,
  })

  const [chartData, setChartData] = useState<ChartData>([]);

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'planName' ? value : Number(value)
    }))
  }

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault()
    if (!user) {
      alert("You must be logged in to create a plan")
      return
    }

    try {
      const functions = getFunctions()
      const createIncomePlan = httpsCallable(functions, 'create_income_plan')
      const result = await createIncomePlan({
        ...formData,
        raiseRate: formData.raiseRate / 100,
        saveRate: formData.saveRate / 100,
        taxRate: formData.taxRate / 100,
        returnRate: formData.returnRate / 100
      })
      
      console.log("Plan created:", result.data)
      router.push('/dashboard/income-planner')
    } catch (error) {
      console.error("Error creating plan:", error)
      alert("Failed to create plan. Please try again.")
    }
  }

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
  

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Income Plan</CardTitle>
        <CardDescription>Enter the details for your new income plan</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="planName">Plan Name</Label>
              <Input id="planName" name="planName" value={formData.planName} onChange={handleChange} />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="income">Annual Income</Label>
              <Input id="income" name="income" type="number" value={formData.income} onChange={handleChange} />
            </div>
            {/* Add more input fields for raiseRate, saveRate, balance, taxRate, returnRate */}
          </div>
          <Button type="submit" className="mt-4">Create Plan</Button>
        </form>
      </CardContent>
      <CardFooter>
        <IncomeChart chartData={chartData} />
      </CardFooter>
    </Card>
  )
}