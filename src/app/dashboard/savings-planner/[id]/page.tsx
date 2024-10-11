'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSavingsPlan } from '@/hooks/useSavingsPlan';
import { useSavingsChart } from '@/hooks/useSavingsChart';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SavingsChart } from "@/components/SavingsChart"

export default function SavingsPlanPage() {
  const { id } = useParams();
  const { plan, loading, error, updatePlan, updatePlanField } = useSavingsPlan(id as string);
  const { chartData, requiredSavings, calculateChartData } = useSavingsChart();

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

    if (name === "taxRate" || name === "returnRate") {
      newValue = parseFloat(value); // Keep as percentage
    } else if (name !== "planName") {
      newValue = Number(value);
    }

    updatePlanField(name, newValue);
  };

  const handleSave = async () => {
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
    <main className="flex flex-col">
      <h1>{plan.planName}</h1>
      <div className="m-1">
        <Label htmlFor="planName">Plan Name</Label>
        <Input
          id="planName"
          name="planName"
          value={plan.planName}
          onChange={handleChange}
        />
        <Label htmlFor="desiredIncome">Desired Annual Income in Retirement ($)</Label>
        <Input
          id="desiredIncome"
          name="desiredIncome"
          type="number"
          value={plan.details.desiredIncome}
          onChange={handleChange}
        />
        <Label htmlFor="currentBalance">Current Savings Balance ($)</Label>
        <Input
          id="currentBalance"
          name="currentBalance"
          type="number"
          value={plan.details.currentBalance}
          onChange={handleChange}
        />
        <Label htmlFor="returnRate">Estimated Long Term Average Portfolio Return (%)</Label>
        <Input
          id="returnRate"
          name="returnRate"
          type="number"
          value={plan.details.returnRate}
          onChange={handleChange}
        />
        <Label htmlFor="currentAge">Current Age</Label>
        <Input
          id="currentAge"
          name="currentAge"
          type="number"
          value={plan.details.currentAge}
          onChange={handleChange}
        />
        <Label htmlFor="retirementAge">Desired Retirement Age</Label>
        <Input
          id="retirementAge"
          name="retirementAge"
          type="number"
          value={plan.details.retirementAge}
          onChange={handleChange}
        />
        <Label htmlFor="taxRate">Expected Tax Rate in Retirement (%)</Label>
        <Input
          id="taxRate"
          name="taxRate"
          type="number"
          value={plan.details.taxRate}
          onChange={handleChange}
        />
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
      <div>
        <p>Required Annual Savings: ${Math.round(requiredSavings).toLocaleString()}</p>
      </div>
      <div className="m-1">
        <SavingsChart chartData={chartData} />
      </div>
    </main>
  );
}