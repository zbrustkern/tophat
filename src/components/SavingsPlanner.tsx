import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePlans } from "@/contexts/PlansContext";
import { useSettings } from "@/contexts/SettingsContext";
import { SavingsPlan } from '@/types/chart';
import { SavingsChartData } from '@/types/chart';
import { useSavingsCalculations } from '@/hooks/usePlanCalculations';
import { usePlanManagement } from '@/hooks/usePlanManagement';
import { SavingsChart } from "@/components/SavingsChart";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, PlanNameField } from "@/components/PlanFormElements";
import { PlanSelector } from "@/components/PlanSelector";
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
    goalType: 'income_stream',
    desiredIncome: 100000,
    currentAge: 30,
    retirementAge: 65,
    targetAmount: 50000,
    timelineYears: 5,
    currentBalance: 100000,
    taxRate: 0.40,
    taxType: 'preTax',
    futureTaxRateScenario: 'current',
    returnRate: 0.08,
    withdrawalRate: 0.04,
    useGlobalSettings: true
  }
};

export default function SavingsPlanner({ 
  planId, 
  initialBalance, 
  initialReturnRate 
}: { 
  planId: string | null;
  initialBalance?: number;
  initialReturnRate?: number;
}) {
  const { user } = useAuth();
  const { plans } = usePlans();
  const { settings } = useSettings();
  const router = useRouter();
  const [plan, setPlan] = useState<SavingsPlan>(() => {
    if (planId) {
      const existing = plans.find(p => p.id === planId);
      if (existing && existing.planType === 'savings') return existing as SavingsPlan;
    }
    if (initialBalance !== undefined || initialReturnRate !== undefined) {
      return {
        ...defaultPlan,
        details: {
          ...defaultPlan.details,
          currentBalance: initialBalance ?? defaultPlan.details.currentBalance,
          returnRate: initialReturnRate ?? defaultPlan.details.returnRate,
        }
      }
    }
    return defaultPlan;
  });
  const [chartData, setChartData] = useState<SavingsChartData[]>([]);
  const [requiredSavings, setRequiredSavings] = useState(0);
  const { calculateSavingsData } = useSavingsCalculations();
  const { loading, error, savePlan } = usePlanManagement<SavingsPlan>();
  const [isDirty, setIsDirty] = useState(false);
  const [hydratedPlanId, setHydratedPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (planId && planId !== hydratedPlanId && plans.length > 0) {
      const existing = plans.find(p => p.id === planId);
      if (existing && existing.planType === 'savings') {
        setPlan(existing as SavingsPlan);
        const { chartData: newChartData, requiredSavings: newRequiredSavings } = calculateSavingsData(existing as SavingsPlan, settings, plans);
        setChartData(newChartData);
        setRequiredSavings(newRequiredSavings);
        setHydratedPlanId(planId);
      }
    }
  }, [planId, plans, calculateSavingsData, hydratedPlanId]);

  const effectiveDetails = {
    ...plan.details,
    ...(plan.details.useGlobalSettings !== false && settings ? {
      taxRate: settings.taxRate,
      returnRate: settings.returnRate,
      withdrawalRate: settings.withdrawalRate,
      currentAge: settings.currentAge,
      retirementAge: settings.retirementAge,
    } : {})
  };

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true);
    const { name, value } = evt.target;
    let newValue: string | number = value;

    // Handle percentage fields
    if (["taxRate", "returnRate", "withdrawalRate"].includes(name)) {
      newValue = parseFloat(value) / 100; // Convert from percentage to decimal
    } else if (!["planName", "goalType", "taxType", "futureTaxRateScenario", "linkedPortfolioIds"].includes(name)) {
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
      details: { ...prev.details, [name]: value }
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

  const handleGlobalToggleChange = (checked: boolean) => {
    setIsDirty(true);
    setPlan(prev => ({
      ...prev,
      details: { ...prev.details, useGlobalSettings: checked }
    }));
  };

  const updateChart = () => {
    setIsDirty(false)
    const { chartData: newChartData, requiredSavings: newRequiredSavings } = calculateSavingsData({ ...plan, details: effectiveDetails }, settings, plans);
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
      <PlanSelector planType="savings" currentPlanId={planId || null} basePath="/savings" />
      <div className="m-1">
        <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/20 shadow-2xl rounded-sm">
          <CardHeader className="space-y-1 pb-4 border-b border-white/10">
            <CardTitle className="text-2xl font-display font-semibold uppercase tracking-widest text-deco-gold">
              Savings Planner
            </CardTitle>
            <CardDescription className="text-muted-foreground font-light text-xs">
              Plan for a retirement income stream or a specific savings target.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <PlanNameField value={plan.planName} onChange={handleChange} />
            
            <div className="mb-6 p-4 bg-slate-900/90 rounded-sm border border-deco-gold/30 shadow-sm flex items-center justify-between">
              <div>
                <Label className="text-xs font-display uppercase tracking-widest text-deco-gold">Use Global Settings</Label>
                <p className="text-xs text-muted-foreground">Sync Ages, Tax Rate, Return Rate, and Withdrawal Rate with your defaults.</p>
              </div>
              <Switch 
                checked={plan.details.useGlobalSettings !== false} 
                onCheckedChange={handleGlobalToggleChange} 
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium text-gray-700">Goal Type</Label>
                <Select value={plan.details.goalType || 'income_stream'} onValueChange={(val) => handleSelectChange('goalType', val)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select Goal Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income_stream">Income Stream (Retirement)</SelectItem>
                    <SelectItem value="target_amount">Target Amount (Down Payment, Car)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium text-gray-700">Tax Treatment</Label>
                <Select value={plan.details.taxType || 'preTax'} onValueChange={(val) => handleSelectChange('taxType', val)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select Tax Treatment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preTax">Pre-Tax (e.g. Traditional 401k/IRA)</SelectItem>
                    <SelectItem value="postTax">Post-Tax (e.g. Roth, Standard Brokerage, Cash)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {plan.details.goalType === 'income_stream' && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium text-gray-700">Future Tax Rate Scenario</Label>
                  <Select value={plan.details.futureTaxRateScenario || 'current'} onValueChange={(val) => handleSelectChange('futureTaxRateScenario', val)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select Scenario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current Rate (Expected)</SelectItem>
                      <SelectItem value="higher">Higher Taxes (+10%)</SelectItem>
                      <SelectItem value="lower">Lower Taxes (-10%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

            <div className="grid md:grid-cols-3 gap-4">
              {plan.details.goalType === 'income_stream' ? (
                <>
                  <FormField label="Desired Annual Income ($)" name="desiredIncome" value={plan.details.desiredIncome ?? 0} onChange={handleChange} placeholder="100000" />
                  <FormField label="Current Age" name="currentAge" value={effectiveDetails.currentAge ?? 0} onChange={handleChange} placeholder="30" disabled={plan.details.useGlobalSettings !== false} />
                  <FormField label="Retirement Age" name="retirementAge" value={effectiveDetails.retirementAge ?? 0} onChange={handleChange} placeholder="65" disabled={plan.details.useGlobalSettings !== false} />
                  <FormField label="Safe Withdrawal Rate (%)" name="withdrawalRate" value={effectiveDetails.withdrawalRate ?? 0.04} onChange={handleChange} placeholder="4" isPercentage disabled={plan.details.useGlobalSettings !== false} />
                </>
              ) : (
                <>
                  <FormField label="Target Amount ($)" name="targetAmount" value={plan.details.targetAmount ?? 0} onChange={handleChange} placeholder="50000" />
                  <FormField label="Timeline (Years)" name="timelineYears" value={plan.details.timelineYears ?? 0} onChange={handleChange} placeholder="5" />
                </>
              )}
              
              <FormField label="Current Balance ($)" name="currentBalance" value={plan.details.currentBalance ?? 0} onChange={handleChange} placeholder="25000" />
              <FormField label="Estimated Portfolio Return (%)" name="returnRate" value={effectiveDetails.returnRate ?? 0} onChange={handleChange} placeholder="8" isPercentage disabled={plan.details.useGlobalSettings !== false} />
              <FormField label="Expected Tax Rate (%)" name="taxRate" value={effectiveDetails.taxRate ?? 0} onChange={handleChange} placeholder="40" isPercentage disabled={plan.details.useGlobalSettings !== false} />
            </div>
            
            {plan.details.goalType === 'income_stream' && (
              <div className="mt-6 p-4 bg-slate-900/90 rounded-sm border border-white/10 text-xs text-muted-foreground leading-relaxed shadow-sm">
                <h4 className="font-display uppercase tracking-widest text-xs text-deco-gold mb-1 flex items-center gap-1.5">
                  💡 About the Safe Withdrawal Rate (SWR)
                </h4>
                <p className="mb-2">
                  The SWR determines what percentage of your retirement portfolio is withdrawn annually to support your desired income.
                </p>
                <ul className="list-disc list-inside space-y-1 text-white/80">
                  <li>
                    <strong className="text-white">The 4% Rule:</strong> A 4% safe withdrawal rate is the industry standard (based on the Trinity Study) designed to prevent you from depleting your portfolio over a 30-year retirement.
                  </li>
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-slate-950/80 border-t border-white/10 py-4">
            <div className="flex w-full items-center justify-between">
              <Button 
                onClick={updateChart} 
                className={isDirty ? "bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest text-xs font-semibold" : "bg-slate-800 text-slate-300 font-display uppercase tracking-widest text-xs"}
              >
                {isDirty ? "Recalculate" : "Calculate"}
              </Button>
              <div className="text-sm font-display uppercase tracking-wider text-deco-gold font-semibold">
                Required Annual Savings: ${Math.round(requiredSavings).toLocaleString()}
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
              Savings Expectations
            </CardTitle>
            <CardDescription className="text-muted-foreground font-light text-xs">
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