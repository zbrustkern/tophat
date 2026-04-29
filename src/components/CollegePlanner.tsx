import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CollegePlan } from '@/types/chart';
import { CollegeChartData } from '@/types/chart';
import { useCollegeCalculations } from '@/hooks/usePlanCalculations';
import { usePlanManagement } from '@/hooks/usePlanManagement';
import { CollegeChart } from "@/components/CollegeChart";
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

const defaultPlan: CollegePlan = {
  id: 'new',
  planName: 'New College Plan',
  planType: 'college',
  lastUpdated: new Date(),
  details: {
    calculationMode: 'goal',
    childAge: 0,
    collegeAge: 18,
    currentBalance: 0,
    returnRate: 0.07,
    targetAmount: 100000,
    monthlyContribution: 500,
  }
};

export default function CollegePlanner({ planId }: { planId: string | null }) {
  const { user } = useAuth();
  const router = useRouter();
  const [plan, setPlan] = useState<CollegePlan>(defaultPlan);
  const [chartData, setChartData] = useState<CollegeChartData[]>([]);
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);
  const { calculateCollegeData } = useCollegeCalculations();
  const { loading, error, savePlan } = usePlanManagement<CollegePlan>();
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true);
    const { name, value } = evt.target;
    let newValue: string | number = value;

    // Handle percentage fields
    if (["returnRate"].includes(name)) {
      newValue = parseFloat(value) / 100; // Convert from percentage to decimal
    } else if (name !== "planName" && name !== "calculationMode") {
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

  const handleModeChange = (mode: 'goal' | 'contribution') => {
    setIsDirty(true);
    setPlan(prev => ({
      ...prev,
      details: {
        ...prev.details,
        calculationMode: mode
      }
    }));
  };

  const updateChart = () => {
    setIsDirty(false);
    const result = calculateCollegeData(plan);
    setChartData(result.chartData);
    if (plan.details.calculationMode === 'goal') {
      setCalculatedValue(result.finalTargetAmount);
    } else {
      setCalculatedValue(result.calculatedMonthlyContribution);
    }
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
        router.push(`/college?plan=${savedPlan.id}`);
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
              College Savings Planner (529)
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium">
              Plan for your child's education
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-gray-50/50">
            <PlanNameField value={plan.planName} onChange={handleChange} />
            
            <div className="flex gap-2 mb-6">
              <Button
                variant={plan.details.calculationMode === 'goal' ? 'default' : 'secondary'}
                onClick={() => handleModeChange('goal')}
                type="button"
              >
                Calculate Final Balance
              </Button>
              <Button
                variant={plan.details.calculationMode === 'contribution' ? 'default' : 'secondary'}
                onClick={() => handleModeChange('contribution')}
                type="button"
              >
                Calculate Required Contribution
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <FormField
                label="Child's Current Age"
                name="childAge"
                value={plan.details.childAge}
                onChange={handleChange}
                placeholder="0"
              />
              <FormField
                label="Age at College"
                name="collegeAge"
                value={plan.details.collegeAge}
                onChange={handleChange}
                placeholder="18"
              />
              <FormField
                label="Current 529 Balance ($)"
                name="currentBalance"
                value={plan.details.currentBalance}
                onChange={handleChange}
                placeholder="0"
              />
              <FormField
                label="Expected Return (%)"
                name="returnRate"
                value={plan.details.returnRate}
                onChange={handleChange}
                placeholder="7"
                isPercentage
              />

              {plan.details.calculationMode === 'goal' ? (
                <FormField
                  label="Monthly Contribution ($)"
                  name="monthlyContribution"
                  value={plan.details.monthlyContribution}
                  onChange={handleChange}
                  placeholder="500"
                />
              ) : (
                <FormField
                  label="Target Amount ($)"
                  name="targetAmount"
                  value={plan.details.targetAmount}
                  onChange={handleChange}
                  placeholder="100000"
                />
              )}
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
              
              <div className="text-lg font-semibold text-center mx-4">
                {calculatedValue !== null && (
                  plan.details.calculationMode === 'goal' 
                    ? `Projected Final Balance: $${calculatedValue.toLocaleString()}`
                    : `Required Monthly Contribution: $${calculatedValue.toLocaleString()}`
                )}
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
              College Growth
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium">
              See how your education fund grows over time
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-gray-50/50">
            <CollegeChart chartData={chartData} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}