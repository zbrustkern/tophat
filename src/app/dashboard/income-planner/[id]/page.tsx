"use client"

import { useAuth } from '@/contexts/AuthContext';
import { usePlans } from '@/contexts/PlansContext';
import { useEffect, useState } from "react"
import { IncomeChart } from "@/components/IncomeChart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useParams } from 'next/navigation';
import { useIncomeChart } from '@/hooks/useIncomeChart';
import { useIncomePlan } from '@/hooks/useIncomePlan';
import { IncomePlan } from '@/types/chart';

export default function IncomePlannerPage() {
    const { user } = useAuth();
    const { plans, refreshPlans } = usePlans();
    const router = useRouter();
    const params = useParams();
    const planId = params.id as string;
  
    const { plan, createPlan, updatePlan, updatePlanField } = useIncomePlan(planId === 'new' ? null : planId);
    const { chartData, calculateChartData } = useIncomeChart();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (planId === 'new') {
        updatePlanField('planName', 'New Income Plan');
        updatePlanField('planType', 'income');
        Object.entries({
          income: 100000,
          raiseRate: 3,
          saveRate: 20,
          balance: 100000,
          taxRate: 40,
          returnRate: 8,
        }).forEach(([key, value]) => updatePlanField(key, value));
        setLoading(false);
      } else {
        const existingPlan = plans.find(p => p.id === planId) as IncomePlan | undefined;
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
          router.push(`/dashboard/income-planner/${createdPlan.id}`);
        } else {
          await updatePlan(plan);
          await refreshPlans();
          router.push('/dashboard/income-planner');
        }
      } catch (error) {
        console.error("Error saving plan:", error);
        // Handle error (e.g., show error message to user)
      }
    };

  if (loading) {
    return <div>Loading plan data...</div>;
  }

  if (!plan) {
    return <div>No plan data available.</div>;
  }

  return (
    <main className="flex flex-col p-4">
      <Card>
        <CardHeader>
          <CardTitle>{planId === 'new' ? 'Create New Income Plan' : 'Edit Income Plan'}</CardTitle>
          <CardDescription>Update your income plan details</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <Label htmlFor="planName">Plan Name</Label>
              <Input id="planName" name="planName" value={plan.planName} onChange={handleChange} />
            </div>
            {Object.entries(plan.details).map(([key, value]) => (
              <div key={key}>
                <Label htmlFor={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
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
          <CardTitle>Income Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeChart chartData={chartData} />
        </CardContent>
      </Card>
    </main>
  );
}