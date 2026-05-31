import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { IncomePlan } from '@/types/chart';
import { IncomeChartData } from '@/types/chart';
import { useIncomeCalculations } from '@/hooks/usePlanCalculations';
import { usePlanManagement } from '@/hooks/usePlanManagement';
import { usePlans } from '@/contexts/PlansContext';
import { IncomeChart } from "@/components/IncomeChart";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const defaultPlan: IncomePlan = {
  id: 'new',
  planName: 'New Income Plan',
  planType: 'income',
  lastUpdated: new Date(),
  details: {
    income: 100000,
    raiseRate: 0.03,
    saveRate: 0.20,
    balance: 100000,
    taxRate: 0.40,
    returnRate: 0.08,
    autoEscalateSavings: true,
    escalationRate: 0.01,
  }
};

export default function IncomePlanner({ 
  planId, 
  initialBalance, 
  initialReturnRate 
}: { 
  planId: string | null;
  initialBalance?: number;
  initialReturnRate?: number;
}) {
  const [isDirty, setIsDirty] = useState(false)
  const { user } = useAuth();
  const router = useRouter();
  const { plans } = usePlans();
  const [plan, setPlan] = useState<IncomePlan>(() => {
    if (planId) {
      const existing = plans.find(p => p.id === planId);
      if (existing && existing.planType === 'income') return existing as IncomePlan;
    }
    if (initialBalance !== undefined || initialReturnRate !== undefined) {
      return {
        ...defaultPlan,
        details: {
          ...defaultPlan.details,
          balance: initialBalance ?? defaultPlan.details.balance,
          returnRate: initialReturnRate ?? defaultPlan.details.returnRate,
        }
      }
    }
    return defaultPlan;
  });
  const [chartData, setChartData] = useState<IncomeChartData[]>([]);
  const { calculateIncomeData } = useIncomeCalculations();
  const { loading, error, savePlan } = usePlanManagement<IncomePlan>();

  useEffect(() => {
    if (planId && plans.length > 0) {
      const existing = plans.find(p => p.id === planId);
      if (existing && existing.planType === 'income') {
        setPlan(existing as IncomePlan);
        setChartData(calculateIncomeData(existing as IncomePlan));
      }
    }
  }, [planId, plans, calculateIncomeData]);

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true)
    const { name, value } = evt.target;
    let newValue: string | number = value;

    // Handle percentage fields
    if (["raiseRate", "saveRate", "taxRate", "returnRate", "escalationRate"].includes(name)) {
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

  const handleToggleChange = (checked: boolean) => {
    setIsDirty(true);
    setPlan(prev => ({
      ...prev,
      details: { ...prev.details, autoEscalateSavings: checked }
    }));
  };

  const updateChart = () => {
    setIsDirty(false)
    const data = calculateIncomeData(plan);
    setChartData(data);
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
        router.push(`/income?plan=${savedPlan.id}`);
      }
    } catch (error) {
      console.error("Error saving plan:", error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const percentageFields = ["raiseRate", "saveRate", "taxRate", "returnRate"];

  return (
    <main className="flex flex-col">
      <div className="m-1">
        <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-none">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Income Planner
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium">
              How are you preparing currently?
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-gray-50/50">
            <PlanNameField value={plan.planName} onChange={handleChange} />
            <div className="grid md:grid-cols-3 gap-4">
              <FormField
                label="Income in $/year"
                name="income"
                value={plan.details.income}
                onChange={handleChange}
                placeholder="100,000"
              />
              <FormField
                label="Starting Balance $"
                name="balance"
                value={plan.details.balance}
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
                label="Estimated Annual Raise (%)"
                name="raiseRate"
                value={plan.details.raiseRate}
                onChange={handleChange}
                placeholder="3"
                isPercentage
              />
              <FormField
                label="Annual Savings Rate (%)"
                name="saveRate"
                value={plan.details.saveRate}
                onChange={handleChange}
                placeholder="20"
                isPercentage
              />
              <FormField
                label="Blended Total Tax Rate (%)"
                name="taxRate"
                value={plan.details.taxRate}
                onChange={handleChange}
                placeholder="40"
                isPercentage
              />
            </div>
            
            <div className="mt-8 p-4 bg-white rounded-lg border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="text-base font-semibold text-gray-800">Auto-Escalate Savings (&quot;Save Your Raise&quot;)</Label>
                <p className="text-sm text-gray-500">Automatically increase your savings rate every year as your income grows.</p>
              </div>
              <div className="flex items-center gap-6">
                {(plan.details.autoEscalateSavings ?? true) && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="escalationRate" className="text-sm font-medium text-gray-700">Increase by</Label>
                    <div className="relative w-24">
                      <input
                        id="escalationRate"
                        name="escalationRate"
                        type="number"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-8"
                        value={((plan.details.escalationRate ?? 0.01) * 100).toFixed(1)}
                        onChange={handleChange}
                        step="0.5"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                )}
                <Switch 
                  checked={plan.details.autoEscalateSavings ?? true} 
                  onCheckedChange={handleToggleChange} 
                />
              </div>
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
              Income Expectations
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium">
              How much passive income are you set to earn?
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-gray-50/50">
            <IncomeChart chartData={chartData} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}