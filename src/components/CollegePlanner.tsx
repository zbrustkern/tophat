import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CollegePlan } from '@/types/chart';
import { CollegeChartData } from '@/types/chart';
import { useCollegeCalculations } from '@/hooks/usePlanCalculations';
import { usePlanManagement } from '@/hooks/usePlanManagement';
import { usePlans } from '@/contexts/PlansContext';
import { useSettings } from '@/contexts/SettingsContext';
import { CollegeChart } from "@/components/CollegeChart";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormField, PlanNameField } from "@/components/PlanFormElements";
import { PlanSelector } from "@/components/PlanSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    useGlobalSettings: true
  }
};

export default function CollegePlanner({ planId }: { planId: string | null }) {
  const { user } = useAuth();
  const router = useRouter();
  const { plans } = usePlans();
  const { settings } = useSettings();
  const [plan, setPlan] = useState<CollegePlan>(() => {
    if (planId) {
      const existing = plans.find(p => p.id === planId);
      if (existing && existing.planType === 'college') return existing as CollegePlan;
    }
    return defaultPlan;
  });
  const [chartData, setChartData] = useState<CollegeChartData[]>([]);
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);
  const { calculateCollegeData } = useCollegeCalculations();
  const { loading, error, savePlan } = usePlanManagement<CollegePlan>();
  const [isDirty, setIsDirty] = useState(false);
  const [hydratedPlanId, setHydratedPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (planId && planId !== hydratedPlanId && plans.length > 0) {
      const existing = plans.find(p => p.id === planId);
      if (existing && existing.planType === 'college') {
        setPlan(existing as CollegePlan);
        const result = calculateCollegeData(existing as CollegePlan, settings, plans);
        setChartData(result.chartData);
        if (existing.details.calculationMode === 'goal') {
          setCalculatedValue(result.finalTargetAmount);
        } else {
          setCalculatedValue(result.calculatedMonthlyContribution);
        }
        setHydratedPlanId(planId);
      }
    }
  }, [planId, plans, calculateCollegeData, hydratedPlanId]);

  const effectiveDetails = {
    ...plan.details,
    ...(plan.details.useGlobalSettings !== false && settings ? {
      returnRate: settings.returnRate,
    } : {})
  };

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true);
    const { name, value } = evt.target;
    let newValue: string | number = value;

    // Handle percentage fields
    if (["returnRate"].includes(name)) {
      newValue = parseFloat(value) / 100; // Convert from percentage to decimal
    } else if (name !== "planName" && name !== "calculationMode" && name !== "linkedPortfolioIds") {
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

  const handleSelectChange = (name: string, value: string) => {
    setIsDirty(true);
    setPlan(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [name]: value
      }
    }));
  };

  const handlePortfolioToggle = (portfolioId: string) => {
    setIsDirty(true);
    setPlan(prev => {
      const currentIds = prev.details.linkedPortfolioIds || [];
      const newIds = currentIds.includes(portfolioId) 
        ? currentIds.filter(id => id !== portfolioId)
        : [...currentIds, portfolioId];
      return {
        ...prev,
        details: { ...prev.details, linkedPortfolioIds: newIds }
      };
    });
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

  const handleGlobalToggleChange = (checked: boolean) => {
    setIsDirty(true);
    setPlan(prev => ({
      ...prev,
      details: { ...prev.details, useGlobalSettings: checked }
    }));
  };

  const updateChart = () => {
    setIsDirty(false);
    const result = calculateCollegeData({ ...plan, details: effectiveDetails }, settings, plans);
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
      <PlanSelector planType="college" currentPlanId={planId || null} basePath="/college" />
      <div className="m-1">
        <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/20 shadow-2xl rounded-sm">
          <CardHeader className="space-y-1 pb-4 border-b border-white/10">
            <CardTitle className="text-2xl font-display font-semibold uppercase tracking-widest text-deco-gold">
              College Savings Planner (529)
            </CardTitle>
            <CardDescription className="text-muted-foreground font-light text-xs">
              Plan for your child&apos;s education
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <PlanNameField value={plan.planName} onChange={handleChange} />
            
            <div className="flex gap-2 mb-6">
              <Button
                onClick={() => handleModeChange('goal')}
                type="button"
                className={plan.details.calculationMode === 'goal' ? "bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase text-xs font-semibold" : "bg-slate-800 text-white font-display uppercase text-xs"}
              >
                Calculate Final Balance
              </Button>
              <Button
                onClick={() => handleModeChange('contribution')}
                type="button"
                className={plan.details.calculationMode === 'contribution' ? "bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase text-xs font-semibold" : "bg-slate-800 text-white font-display uppercase text-xs"}
              >
                Calculate Required Contribution
              </Button>
            </div>

            <div className="mb-6 p-4 bg-slate-900/90 rounded-sm border border-deco-gold/30 shadow-sm flex items-center justify-between">
              <div>
                <Label className="text-xs font-display uppercase tracking-widest text-deco-gold">Use Global Settings</Label>
                <p className="text-xs text-muted-foreground">Sync Expected Return Rate with your global defaults.</p>
              </div>
              <Switch 
                checked={plan.details.useGlobalSettings !== false} 
                onCheckedChange={handleGlobalToggleChange} 
              />
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
                value={effectiveDetails.returnRate}
                onChange={handleChange}
                placeholder="7"
                isPercentage
                disabled={plan.details.useGlobalSettings !== false}
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

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-display uppercase tracking-widest text-muted-foreground">Linked Portfolios</Label>
                <div className="flex flex-col gap-1.5 p-3 border border-white/20 rounded-sm bg-slate-950 max-h-40 overflow-y-auto">
                  {plans.filter(p => p.planType === 'rebalance').length === 0 && (
                    <span className="text-xs text-muted-foreground italic">No portfolios available.</span>
                  )}
                  {plans.filter(p => p.planType === 'rebalance').map(p => {
                    const isChecked = (plan.details.linkedPortfolioIds || []).includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-white/5 p-1 rounded text-white">
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => handlePortfolioToggle(p.id)}
                          className="rounded border-white/20 bg-slate-900 w-4 h-4 text-deco-gold focus:ring-deco-gold"
                        />
                        <span className="font-medium text-white">{p.planName}</span>
                        {(p as any).details?.institution && <span className="text-xs text-muted-foreground">({(p as any).details.institution})</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-950/80 border-t border-white/10 py-4">
            <div className="flex w-full items-center justify-between">
              <Button 
                onClick={updateChart} 
                className={isDirty ? "bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest text-xs font-semibold" : "bg-slate-800 text-slate-300 font-display uppercase tracking-widest text-xs"}
              >
                {isDirty ? "Recalculate" : "Calculate"}
              </Button>
              
              <div className="text-sm font-display uppercase tracking-wider text-deco-gold font-semibold text-center mx-4">
                {calculatedValue !== null && (
                  plan.details.calculationMode === 'goal' 
                    ? `Projected Final Balance: $${calculatedValue.toLocaleString()}`
                    : `Required Monthly Contribution: $${calculatedValue.toLocaleString()}`
                )}
              </div>

              <Button onClick={handleSave} disabled={loading} className="bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest text-xs font-semibold">
                {plan.id === 'new' ? 'Save Plan' : 'Update Plan'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="m-1">
        <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/20 shadow-2xl rounded-sm">
          <CardHeader className="flex gap-3 border-b border-white/10">
            <CardTitle className="text-2xl font-display font-semibold uppercase tracking-widest text-deco-gold">
              College Growth
            </CardTitle>
            <CardDescription className="text-muted-foreground font-light text-xs">
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