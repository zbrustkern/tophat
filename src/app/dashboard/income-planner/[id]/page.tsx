'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useIncomePlan } from '@/hooks/useIncomePlan';
import { useIncomeChart } from '@/hooks/useIncomeChart';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IncomeChart } from "@/components/IncomeChart"

export default function IncomePlanPage() {
  const { id } = useParams();
  const { plan, loading, error, updatePlan, updatePlanField } = useIncomePlan(id as string);
  const { chartData, calculateChartData } = useIncomeChart();

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
        <Label htmlFor="income">Income in $/year</Label>
        <Input
          id="income"
          name="income"
          type="number"
          value={plan.details.income}
          onChange={handleChange}
        />
        <Label htmlFor="balance">Starting Balance $</Label>
        <Input
          id="balance"
          name="balance"
          type="number"
          value={plan.details.balance}
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
        <Label htmlFor="raiseRate">Estimated Annual Raise (%)</Label>
        <Input
          id="raiseRate"
          name="raiseRate"
          type="number"
          value={plan.details.raiseRate}
          onChange={handleChange}
        />
        <Label htmlFor="saveRate">Annual Savings Rate (%)</Label>
        <Input
          id="saveRate"
          name="saveRate"
          type="number"
          value={plan.details.saveRate}
          onChange={handleChange}
        />
        <Label htmlFor="taxRate">Blended Total Tax Rate (%)</Label>
        <Input
          id="taxRate"
          name="taxRate"
          type="number"
          value={plan.details.taxRate}
          onChange={handleChange}
        />
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
      <div className="m-1">
        <IncomeChart chartData={chartData} />
      </div>
    </main>
  );
}