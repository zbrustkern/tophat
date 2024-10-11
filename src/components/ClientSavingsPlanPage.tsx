'use client';

import { useEffect, useState } from "react"
import { SavingsChart } from "@/components/SavingsChart"
import { useSavingsPlan } from '@/hooks/useSavingsPlan';
import { useSavingsChart } from '@/hooks/useSavingsChart';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SavingsPlan } from '@/types/chart';
import { usePlans } from '@/contexts/PlansContext';

export default function ClientSavingsPlanPage() {
    const { plans } = usePlans();
    const [plan, setPlan] = useState<SavingsPlan | null>(null);
    const { loading, error, updatePlan, createPlan } = useSavingsPlan();
    const { chartData, requiredSavings, calculateChartData } = useSavingsChart();

    useEffect(() => {
        const savingsPlans = plans.filter(p => p.planType === 'savings') as SavingsPlan[];
        if (savingsPlans.length > 0) {
            setPlan(savingsPlans[0]);
        } else {
            createNewPlan();
        }
    }, [plans]);

    useEffect(() => {
        if (plan) {
            calculateChartData(plan);
        }
    }, [plan, calculateChartData]);

    const createNewPlan = () => {
        const newPlan: SavingsPlan = {
            id: 'new',
            planName: 'New Savings Plan',
            planType: 'savings',
            lastUpdated: new Date(),
            details: {
                desiredIncome: 0,
                currentAge: 30,
                retirementAge: 65,
                currentBalance: 0,
                taxRate: 0,
                returnRate: 0
            }
        };
        setPlan(newPlan);
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = evt.target;
        let newValue: string | number = value;

        if (name === "taxRate" || name === "returnRate") {
            newValue = parseFloat(value);
        } else if (name !== "planName") {
            newValue = Number(value);
        }

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
          const savedPlan = plan.id === 'new' ? await createPlan(plan) : await updatePlan(plan);
          setPlan(savedPlan);
          calculateChartData(savedPlan);
          // Optionally, show a success message
      } catch (error) {
          console.error("Error saving plan:", error);
          // Optionally, show an error message
      }
  };

  const savingsPlans = plans.filter(p => p.planType === 'savings') as SavingsPlan[];

  return (
    <main className="flex flex-col p-4">
    <select onChange={(e) => {
        const selectedPlan = savingsPlans.find(p => p.id === e.target.value);
        if (selectedPlan) setPlan(selectedPlan);
    }}>
        {savingsPlans.map(p => (
            <option key={p.id} value={p.id}>{p.planName}</option>
        ))}
    </select>
    <Button onClick={createNewPlan}>Create New Plan</Button>
    {plan && (
        <>
          <Card>
              <CardHeader>
                  <CardTitle>{plan.id === 'new' ? 'Create New Savings Plan' : 'Edit Savings Plan'}</CardTitle>
                  <CardDescription>Update your savings plan details</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                    <div>
                        <Label htmlFor="planName">Plan Name</Label>
                        <Input
                            id="planName"
                            name="planName"
                            value={plan.planName}
                            onChange={handleChange}
                            placeholder="Enter plan name"
                        />
                    </div>
                    <div>
                        <Label htmlFor="desiredIncome">Desired Annual Income in Retirement ($)</Label>
                        <Input
                            id="desiredIncome"
                            name="desiredIncome"
                            type="number"
                            value={plan.details.desiredIncome}
                            onChange={handleChange}
                            placeholder="e.g., 80000"
                        />
                    </div>
                    <div>
                        <Label htmlFor="currentAge">Current Age</Label>
                        <Input
                            id="currentAge"
                            name="currentAge"
                            type="number"
                            value={plan.details.currentAge}
                            onChange={handleChange}
                            placeholder="e.g., 30"
                        />
                    </div>
                    <div>
                        <Label htmlFor="retirementAge">Desired Retirement Age</Label>
                        <Input
                            id="retirementAge"
                            name="retirementAge"
                            type="number"
                            value={plan.details.retirementAge}
                            onChange={handleChange}
                            placeholder="e.g., 65"
                        />
                    </div>
                    <div>
                        <Label htmlFor="currentBalance">Current Savings Balance ($)</Label>
                        <Input
                            id="currentBalance"
                            name="currentBalance"
                            type="number"
                            value={plan.details.currentBalance}
                            onChange={handleChange}
                            placeholder="e.g., 50000"
                        />
                    </div>
                    <div>
                        <Label htmlFor="taxRate">Expected Tax Rate in Retirement (%)</Label>
                        <Input
                            id="taxRate"
                            name="taxRate"
                            type="number"
                            value={plan.details.taxRate}
                            onChange={handleChange}
                            placeholder="e.g., 20"
                            step="0.1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="returnRate">Expected Investment Return Rate (%)</Label>
                        <Input
                            id="returnRate"
                            name="returnRate"
                            type="number"
                            value={plan.details.returnRate}
                            onChange={handleChange}
                            placeholder="e.g., 7"
                            step="0.1"
                        />
                    </div>
                </form>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSave}>{plan.id === 'new' ? 'Create Plan' : 'Update Plan'}</Button>
                </CardFooter>
              </Card>
              <Card className="mt-4">
                  <CardHeader>
                      <CardTitle>Savings Projection</CardTitle>
                      <CardDescription>Required Annual Savings: ${Math.round(requiredSavings).toLocaleString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <SavingsChart chartData={chartData} />
                  </CardContent>
            </Card>
      </>
      )}
    </main>
  );
}