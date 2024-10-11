'use client';

import { useEffect, useState } from "react"
import { IncomeChart } from "@/components/IncomeChart"
import { useIncomePlan } from '@/hooks/useIncomePlan';
import { useIncomeChart } from '@/hooks/useIncomeChart';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { IncomePlan } from '@/types/chart';

export default function ClientIncomePlanPage({ id }: { id: string }) {
    const [plan, setPlan] = useState<IncomePlan | null>(null);
    const { loading, error, updatePlan, updatePlanField, readPlan } = useIncomePlan();
    const { chartData, calculateChartData } = useIncomeChart();
  
    useEffect(() => {
      const fetchPlan = async () => {
        if (id && id !== 'new') {
          const fetchedPlan = await readPlan(id);
          setPlan(fetchedPlan);
        } else {
          // Initialize a new plan
          setPlan({
            id: 'new',
            planName: 'New Income Plan',
            planType: 'income',
            lastUpdated: new Date(),
            details: {
              income: 0,
              raiseRate: 0,
              saveRate: 0,
              balance: 0,
              taxRate: 0,
              returnRate: 0
            }
          });
        }
      };
      fetchPlan();
    }, [id, readPlan]);
  
    useEffect(() => {
      if (plan) {
        calculateChartData(plan);
      }
    }, [plan, calculateChartData]);
  
    if (loading) return <p>Loading plan...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!plan) return <p>Plan not found</p>;
  
    const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = evt.target;
      let newValue: string | number = value;
  
      if (name === "raiseRate" || name === "saveRate" || name === "taxRate" || name === "returnRate") {
        newValue = parseFloat(value); // Keep as percentage
      } else if (name !== "planName") {
        newValue = Number(value);
      }
  
      updatePlanField(name, newValue);
      setPlan(prev => {
        if (!prev) return null;
        if (name === "planName") {
          return { ...prev, planName: value as string };
        } else {
          return {
            ...prev,
            details: { ...prev.details, [name]: newValue as number }
          };
        }
      });
    };
  
    const handleSave = async () => {
      if (!plan) return;
      try {
        await updatePlan(plan);
        calculateChartData(plan);
        // Optionally, show a success message
      } catch (error) {
        console.error("Error saving plan:", error);
        // Optionally, show an error message
      }
    };
  
    return (
        <main className="flex flex-col p-4">
        <Card>
          <CardHeader>
            <CardTitle>{id === 'new' ? 'Create New Income Plan' : 'Edit Income Plan'}</CardTitle>
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
            <Button onClick={handleSave}>{id === 'new' ? 'Create Plan' : 'Update Plan'}</Button>
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