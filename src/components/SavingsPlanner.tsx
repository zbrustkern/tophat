import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SavingsPlan } from '@/types/chart';
import { SavingsChartData } from '@/types/chart';
import { useSavingsCalculations } from '@/hooks/usePlanCalculations';
import { usePlanManagement } from '@/hooks/usePlanManagement';
import { SavingsChart } from "@/components/SavingsChart";
import { Button } from "@/components/ui/button";
import { FormField, PlanNameField } from "@/components/PlanFormElements";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const defaultPlan: SavingsPlan = {
  id: 'new',
  planName: 'New Savings Plan',
  planType: 'savings',
  lastUpdated: new Date(),
  details: {
    desiredIncome: 100000,
    currentAge: 30,
    retirementAge: 65,
    currentBalance: 100000,
    taxRate: 0.40,
    returnRate: 0.08,
  }
};

export default function SavingsPlanner({ planId }: { planId: string | null }) {
  const { user } = useAuth();
  const router = useRouter();
  const [plan, setPlan] = useState<SavingsPlan>(defaultPlan);
  const [chartData, setChartData] = useState<SavingsChartData[]>([]);
  const [requiredSavings, setRequiredSavings] = useState(0);
  const { calculateSavingsData } = useSavingsCalculations();
  const { loading, error, savePlan } = usePlanManagement<SavingsPlan>();
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true);
    const { name, value } = evt.target;
    let newValue: string | number = value;

    // Handle percentage fields
    if (["taxRate", "returnRate"].includes(name)) {
      newValue = parseFloat(value) / 100; // Convert from percentage to decimal
    } else if (name !== "planName") {
      newValue = Number(value);
    }

    setPlan(prev => ({
      ...prev,
      ...(name === "planName" 
        ? { planName: value }
        : { details: { ...prev.details, [name]: newValue } }
      )
    }));
  };

  const updateChart = () => {
    setIsDirty(false)
    const { chartData: newChartData, requiredSavings: newRequiredSavings } = calculateSavingsData(plan);
    setChartData(newChartData);
    setRequiredSavings(newRequiredSavings);
  };

  const handleSave = async () => {
    if (!user) {
      alert("Please sign in to save your plan");
      return;
    }

    try {
      const savedPlan = await savePlan(plan);
      setPlan(savedPlan);
      if (plan.id === 'new') {
        router.push(`/savings?plan=${savedPlan.id}`);
      }
    } catch (error) {
      console.error("Error saving plan:", error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <main className="flex flex-col">
      <div className="m-1">
        <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-none">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Savings Planner
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium">
              Plan your path to retirement
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-gray-50/50">
            <PlanNameField value={plan.planName} onChange={handleChange} />
            <div className="grid md:grid-cols-3 gap-4">
              <FormField
                label="Desired Annual Income ($)"
                name="desiredIncome"
                value={plan.details.desiredIncome}
                onChange={handleChange}
                placeholder="100,000"
              />
              <FormField
                label="Current Balance ($)"
                name="currentBalance"
                value={plan.details.currentBalance}
                onChange={handleChange}
                placeholder="25,000"
              />
              <FormField
                label="Estimated Portfolio Return (%)"
                name="returnRate"
                value={plan.details.returnRate}
                onChange={handleChange}
                placeholder="8"
                isPercentage
              />
              <FormField
                label="Current Age"
                name="currentAge"
                value={plan.details.currentAge}
                onChange={handleChange}
                placeholder="30"
              />
              <FormField
                label="Retirement Age"
                name="retirementAge"
                value={plan.details.retirementAge}
                onChange={handleChange}
                placeholder="65"
              />
              <FormField
                label="Expected Tax Rate (%)"
                name="taxRate"
                value={plan.details.taxRate}
                onChange={handleChange}
                placeholder="40"
                isPercentage
              />
            </div>
          </CardContent>
          <CardFooter className="bg-white border-t py-4">
            <div className="flex w-full items-center justify-between">
            <Button 
                onClick={updateChart} 
                variant={isDirty ? "default" : "secondary"}
                >
                {isDirty ? "Recalculate" : "Calculate"}
            </Button>
              <div className="text-lg font-semibold">
                Required Annual Savings: ${Math.round(requiredSavings).toLocaleString()}
              </div>
              <Button onClick={handleSave} disabled={loading}>
                {plan.id === 'new' ? 'Save Plan' : 'Update Plan'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="m-1">
        <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-none">
          <CardHeader className="flex gap-3">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Savings Expectations
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium">
              How much do you need to save to reach your income goals?
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-gray-50/50">
            <SavingsChart chartData={chartData} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}