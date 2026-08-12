import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePlans } from "@/contexts/PlansContext";
import { useSettings } from "@/contexts/SettingsContext";
import { IncomePlan } from '@/types/chart';
import { IncomeChartData } from '@/types/chart';
import { useIncomeCalculations } from '@/hooks/usePlanCalculations';
import { usePlanManagement } from '@/hooks/usePlanManagement';
import { IncomeChart } from "@/components/IncomeChart";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormField, PlanNameField } from "@/components/PlanFormElements";
import { PlanSelector } from "@/components/PlanSelector";
import { DISASTERS, DisasterType } from "@/lib/simulators/disasters";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

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
    saveAmount: 20000,
    useGlobalSettings: true,
    employerMatchLimit: 0,
    employerMatchRate: 0
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
  const { plans } = usePlans();
  const { settings } = useSettings();
  const router = useRouter();
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
  const [hydratedPlanId, setHydratedPlanId] = useState<string | null>(null);
  
  // Scenario Analysis State
  const [comparisonPlanId, setComparisonPlanId] = useState<string>('none');
  const [comparisonChartData, setComparisonChartData] = useState<IncomeChartData[]>([]);

  useEffect(() => {
    if (planId && planId !== hydratedPlanId && plans.length > 0) {
      const existing = plans.find(p => p.id === planId);
      if (existing && existing.planType === 'income') {
        setPlan(existing as IncomePlan);
        setChartData(calculateIncomeData(existing as IncomePlan));
        setHydratedPlanId(planId);
      }
    }
  }, [planId, plans, calculateIncomeData, hydratedPlanId]);

  const effectiveDetails = {
    ...plan.details,
    ...(plan.details.useGlobalSettings !== false && settings ? {
      taxRate: settings.taxRate,
      returnRate: settings.returnRate,
      withdrawalRate: settings.withdrawalRate,
    } : {})
  };

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setIsDirty(true)
    const { name, value } = evt.target;
    let newValue: string | number = value;

    // Handle percentage fields
    if (["raiseRate", "saveRate", "taxRate", "returnRate", "escalationRate", "employerMatchLimit", "employerMatchRate"].includes(name)) {
      newValue = parseFloat(value) / 100; // Convert from percentage to decimal
    } else if (name !== "planName" && name !== "saveMode") {
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

  const handleGlobalToggleChange = (checked: boolean) => {
    setIsDirty(true);
    setPlan(prev => ({
      ...prev,
      details: { ...prev.details, useGlobalSettings: checked }
    }));
  };

  const handleDisasterChange = (field: string, value: any) => {
    setIsDirty(true);
    setPlan(prev => ({
      ...prev,
      details: {
        ...prev.details,
        disasterConfig: {
          ...prev.details.disasterConfig,
          active: prev.details.disasterConfig?.active || false,
          type: prev.details.disasterConfig?.type || 'recession',
          startYear: prev.details.disasterConfig?.startYear || 'random',
          [field]: value
        }
      }
    }));
  };

  const updateChart = () => {
    setIsDirty(false)
    const data = calculateIncomeData({ ...plan, details: effectiveDetails });
    setChartData(data);
    
    // Scenario Analysis logic
    if (comparisonPlanId !== 'none') {
      const compPlan = plans.find(p => p.id === comparisonPlanId);
      if (compPlan && compPlan.planType === 'income') {
        // If the comparison plan uses global settings, compute its effective details too
        const compEffectiveDetails = {
          ...(compPlan as IncomePlan).details,
          ...((compPlan as IncomePlan).details.useGlobalSettings !== false && settings ? {
            taxRate: settings.taxRate,
            returnRate: settings.returnRate,
            withdrawalRate: settings.withdrawalRate,
          } : {})
        };
        const compData = calculateIncomeData({ ...(compPlan as IncomePlan), details: compEffectiveDetails });
        setComparisonChartData(compData);
      }
    } else {
      setComparisonChartData([]);
    }
  };

  // Helper for Delta Board
  const getDelta = (yearIndex: number) => {
    if (chartData.length > yearIndex && comparisonChartData.length > yearIndex) {
      const primary = chartData[yearIndex];
      const secondary = comparisonChartData[yearIndex];
      return {
        balanceDiff: primary.balance - secondary.balance,
        incomeDiff: primary.conservativeIncome - secondary.conservativeIncome
      };
    }
    return null;
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

  return (
    <main className="flex flex-col space-y-6">
      <PlanSelector planType="income" currentPlanId={planId || null} basePath="/income" />
      <div className="m-1">
        <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/20 shadow-2xl rounded-sm">
          <CardHeader className="space-y-1 pb-4 border-b border-white/10">
            <CardTitle className="text-2xl font-display font-semibold uppercase tracking-widest text-deco-gold">
              Income Planner
            </CardTitle>
            <CardDescription className="text-muted-foreground font-light text-sm">
              How are you preparing currently?
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <PlanNameField value={plan.planName} onChange={handleChange} />
            
            <div className="mb-6 p-4 bg-slate-900/80 rounded-sm border border-deco-gold/30 shadow-sm flex items-center justify-between">
              <div>
                <Label className="text-sm font-display uppercase tracking-widest text-deco-gold">Use Global Settings</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Sync Tax Rate, Return Rate, and Withdrawal Rate with your global defaults.</p>
              </div>
              <Switch 
                checked={plan.details.useGlobalSettings !== false} 
                onCheckedChange={handleGlobalToggleChange} 
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="payorId" className="text-sm font-medium text-gray-700">Who earns this?</Label>
                <select
                  id="payorId"
                  name="payorId"
                  value={plan.details.payorId || 'Joint'}
                  onChange={(e) => {
                    setIsDirty(true);
                    setPlan(prev => ({
                      ...prev,
                      details: { ...prev.details, payorId: e.target.value }
                    }));
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-200"
                >
                  <option value="Joint">Joint / All</option>
                  {settings?.payors?.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
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
                value={effectiveDetails.returnRate}
                onChange={handleChange}
                placeholder="8"
                isPercentage
                disabled={plan.details.useGlobalSettings !== false}
              />
              <FormField
                label="Safe Withdrawal Rate (%)"
                name="withdrawalRate"
                value={effectiveDetails.withdrawalRate ?? 0.04}
                onChange={handleChange}
                placeholder="4"
                isPercentage
                disabled={plan.details.useGlobalSettings !== false}
              />
              <FormField
                label="Estimated Annual Raise (%)"
                name="raiseRate"
                value={plan.details.raiseRate}
                onChange={handleChange}
                placeholder="3"
                isPercentage
              />
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="saveMode" className="text-sm font-medium text-gray-700">Savings Type</Label>
                <select
                  id="saveMode"
                  name="saveMode"
                  value={plan.details.saveMode ?? 'rate'}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-200"
                >
                  <option value="rate">Percentage of Income</option>
                  <option value="fixed">Fixed Dollar Amount</option>
                </select>
              </div>
              {(plan.details.saveMode ?? 'rate') === 'rate' ? (
                <FormField
                  label="Annual Savings Rate (%)"
                  name="saveRate"
                  value={plan.details.saveRate}
                  onChange={handleChange}
                  placeholder="20"
                  isPercentage
                />
              ) : (
                <FormField
                  label="Annual Savings Amount ($)"
                  name="saveAmount"
                  value={plan.details.saveAmount ?? 20000}
                  onChange={handleChange}
                  placeholder="20,000"
                />
              )}
              <FormField
                label="Blended Total Tax Rate (%)"
                name="taxRate"
                value={effectiveDetails.taxRate}
                onChange={handleChange}
                placeholder="40"
                isPercentage
                disabled={plan.details.useGlobalSettings !== false}
              />
              <FormField
                label="Employer Match up to (%)"
                name="employerMatchLimit"
                value={plan.details.employerMatchLimit ?? 0}
                onChange={handleChange}
                placeholder="5"
                isPercentage
              />
              <FormField
                label="Employer Match Rate (%)"
                name="employerMatchRate"
                value={plan.details.employerMatchRate ?? 0}
                onChange={handleChange}
                placeholder="100"
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

            {/* Disaster Simulator */}
            <div className="mt-6 p-4 bg-rose-50 rounded-lg border border-rose-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-semibold text-rose-900">Stress Test: Disaster Simulator</Label>
                  <p className="text-sm text-rose-700">Simulate a severe macroeconomic shock to see if your plan survives.</p>
                </div>
                <Switch 
                  checked={plan.details.disasterConfig?.active ?? false} 
                  onCheckedChange={(checked) => handleDisasterChange('active', checked)} 
                />
              </div>
              
              {plan.details.disasterConfig?.active && (
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-rose-800">Event Type</Label>
                    <select
                      value={plan.details.disasterConfig.type || 'recession'}
                      onChange={(e) => handleDisasterChange('type', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background border-rose-200"
                    >
                      {Object.values(DISASTERS).map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    {plan.details.disasterConfig.type && (
                      <p className="text-xs text-rose-600 mt-1 italic">
                        {DISASTERS[plan.details.disasterConfig.type as DisasterType]?.historicalContext}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-rose-800">Start Year</Label>
                    <select
                      value={plan.details.disasterConfig.startYear || 'random'}
                      onChange={(e) => handleDisasterChange('startYear', e.target.value === 'random' ? 'random' : Number(e.target.value))}
                      className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background border-rose-200"
                    >
                      <option value="random">Random (Surprise Me!)</option>
                      <option value="0">Year 1 (Immediate)</option>
                      <option value="5">Year 5</option>
                      <option value="10">Year 10</option>
                      <option value="20">Year 20 (Just before retirement)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-slate-950/80 border-t border-white/10 py-4">
            <div className="flex w-full items-center justify-between">
              <Button 
                onClick={updateChart} 
                className={isDirty ? "bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest text-xs font-semibold" : "bg-slate-800 text-slate-300 font-display uppercase text-xs"}
              >
                {isDirty ? "Recalculate" : "Calculate"}
              </Button>
              <Button onClick={handleSave} disabled={loading} className="bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest text-xs font-semibold">
                {plan.id === 'new' ? 'Save Plan' : 'Update Plan'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="m-1">
        <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/20 shadow-2xl rounded-sm">
          <CardHeader className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center border-b border-white/10">
            <div>
              <CardTitle className="text-2xl font-display font-semibold uppercase tracking-widest text-deco-gold">
                Income Expectations
              </CardTitle>
              <CardDescription className="text-muted-foreground font-light text-xs mt-1">
                How much passive income are you set to earn?
              </CardDescription>
            </div>
            
            {/* Scenario Analysis Dropdown */}
            <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-sm border border-white/10">
              <Label htmlFor="comparePlan" className="text-xs font-display uppercase tracking-widest text-muted-foreground whitespace-nowrap">Compare to:</Label>
              <select
                id="comparePlan"
                value={comparisonPlanId}
                onChange={(e) => {
                  setComparisonPlanId(e.target.value);
                  setIsDirty(true);
                }}
                className="h-8 rounded-sm border border-white/20 bg-slate-950 text-white px-2 py-1 text-xs focus:outline-none focus:border-deco-gold"
              >
                <option value="none">None</option>
                {plans
                  .filter(p => p.planType === 'income' && p.id !== plan.id)
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.planName}</option>
                  ))
                }
              </select>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col gap-6">
            <IncomeChart 
              chartData={chartData} 
              secondaryChartData={comparisonChartData.length > 0 ? comparisonChartData : undefined}
            />

            {/* Delta Board */}
            {comparisonChartData.length > 0 && chartData.length > 0 && (
              <div className="bg-slate-900/90 p-4 rounded-sm border border-white/10">
                <h3 className="text-xs font-display uppercase tracking-widest text-deco-gold mb-4 text-center">Scenario Comparison (Primary vs Comparison)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[10, 20, 30, 40].map(yearsOut => {
                    // yearIndex is the number of years from start. The first index is year 0, so year 10 is index 10.
                    const delta = getDelta(yearsOut);
                    if (!delta) return null;
                    const balanceIsPositive = delta.balanceDiff >= 0;
                    const incomeIsPositive = delta.incomeDiff >= 0;

                    return (
                      <div key={yearsOut} className="bg-slate-50 p-3 rounded border text-center">
                        <div className="text-sm font-bold text-slate-500 mb-2">Year {yearsOut}</div>
                        <div className="flex flex-col gap-1">
                          <div className={`text-sm font-semibold ${balanceIsPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            Balance: {balanceIsPositive ? '+' : ''}${Math.round(delta.balanceDiff).toLocaleString()}
                          </div>
                          <div className={`text-sm font-semibold ${incomeIsPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            Income: {incomeIsPositive ? '+' : ''}${Math.round(delta.incomeDiff).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}