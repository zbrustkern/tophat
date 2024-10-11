"use client"

import { useAuth } from '@/contexts/AuthContext';
import { usePlans } from '@/contexts/PlansContext';
import { useEffect, useState } from "react"
import { SavingsChart } from "@/components/SavingsChart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useParams } from 'next/navigation';
import { useSavingsChart } from '@/hooks/useSavingsChart';
import { useSavingsPlan } from '@/hooks/useSavingsPlan';
import { SavingsPlan } from '@/types/chart';

export default function SavingsPlannerPage() {
  const { user } = useAuth();
  const { plans, refreshPlans } = usePlans();
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;

  const { plan, createPlan, updatePlan, updatePlanField } = useSavingsPlan(planId === 'new' ? null : planId);
  const { chartData, requiredSavings, calculateChartData } = useSavingsChart();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (planId === 'new') {
      updatePlanField('planName', 'New Savings Plan');
      updatePlanField('planType', 'savings');
      Object.entries({
        desiredIncome: 100000,
        currentAge: 30,
        retirementAge: 65,
        currentBalance: 100000,
        taxRate: 0.40,
        returnRate: 0.08,
      }).forEach(([key, value]) => updatePlanField(key, value));
      setLoading(false);
    } else {
      const existingPlan = plans.find(p => p.id === planId) as SavingsPlan | undefined;
      if (existingPlan) {
        updatePlanField('planName', existingPlan.planName);
        updatePlanField('planType', existingPlan.planType);
        Object.entries(existingPlan.details).forEach(([key, value]) => updatePlanField(key, value));
      }
      setLoading(false);
    }
  }, [planId, plans, updatePlanField]);

  useEffect(() => {
    if (plan) {
      calculateChartData(plan);
    }
  }, [plan, calculateChartData]);

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target;
    updatePlanField(name, value);
  };

  const handleSave = async () => {
    if (!user || !plan) return;
    
    try {
      if (planId === 'new') {
        const createdPlan = await createPlan(plan);
        await refreshPlans();
        router.push(`/dashboard/savings-planner/${createdPlan.id}`);
      } else {
        await updatePlan(plan);
        await refreshPlans();
        router.push('/dashboard/savings-planner');
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      // Handle error (e.g., show error message to user)
    }
  };

  if (loading) return <div>Loading plan data...</div>;
  if (!plan) return <div>No plan data available.</div>;

  return (
    <main className="flex flex-col p-4">
      <Card>
        <CardHeader>
          <CardTitle>{planId === 'new' ? 'Create New Savings Plan' : 'Edit Savings Plan'}</CardTitle>
          <CardDescription>Update your savings plan details</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <Label htmlFor="planName">Plan Name</Label>
              <Input id="planName" name="planName" value={plan.planName} onChange={handleChange} />
            </div>
            {Object.entries(plan.details).map(([key, value]) => (
              <div key={key}>
                <Label htmlFor={key}>{key.split(/(?=[A-Z])/).join(" ")}</Label>
                <Input
                  id={key}
                  name={key}
                  type="number"
                  value={value}
                  onChange={handleChange}
                />
              </div>
            ))}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={() => calculateChartData(plan)}>Update Projection</Button>
          <Button onClick={handleSave}>{planId === 'new' ? 'Create Plan' : 'Update Plan'}</Button>
        </CardFooter>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Savings Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <SavingsChart chartData={chartData} />
        </CardContent>
        <CardFooter>
          <p>Required Annual Savings: ${Math.round(requiredSavings).toLocaleString()}</p>
        </CardFooter>
      </Card>
    </main>
  );
}