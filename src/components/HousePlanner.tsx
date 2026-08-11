"use client"

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePlans } from "@/contexts/PlansContext";
import { useSettings } from "@/contexts/SettingsContext";
import { HousePlan, HouseDetails } from '@/types/chart';
import { useHouseCalculations, HouseChartData } from '@/hooks/useHouseCalculations';
import { usePlanManagement } from '@/hooks/usePlanManagement';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormField, PlanNameField } from "@/components/PlanFormElements";
import { PlanSelector } from "@/components/PlanSelector";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPropertyTaxRateForState } from '@/lib/taxes/propertyTaxes';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const defaultPlan: HousePlan = {
  id: 'new',
  planName: 'Home Plan',
  planType: 'house',
  lastUpdated: new Date(),
  details: {
    status: 'owned',
    currentValue: 500000,
    currentLoanBalance: 400000,
    interestRate: 0.05,
    remainingTermMonths: 360,
    annualHomeInsurance: 1500,
    annualMaintenance: 2000,
    appreciationRate: 0.03,
    state: 'IL',
    annualPropertyTaxRate: 0.0208,
    useAdvancedPropertyTax: false,
    assessmentRatio: 0.3333,
    homesteadExemption: 8000,
    localTaxRate: 0.06
  }
};

export default function HousePlanner({ planId }: { planId: string | null }) {
  const [isDirty, setIsDirty] = useState(false);
  const { user } = useAuth();
  const { plans } = usePlans();
  const { settings } = useSettings();
  const router = useRouter();

  const [plan, setPlan] = useState<HousePlan>(() => {
    if (planId) {
      const existing = plans.find(p => p.id === planId);
      if (existing && existing.planType === 'house') return existing as HousePlan;
    }
    return defaultPlan;
  });

  const [chartData, setChartData] = useState<HouseChartData[]>([]);
  const { calculateHouseData } = useHouseCalculations();
  const { loading, error, savePlan } = usePlanManagement<HousePlan>();

  useEffect(() => {
    if (planId && plans.length > 0) {
      const existing = plans.find(p => p.id === planId);
      if (existing && existing.planType === 'house') {
        setPlan(existing as HousePlan);
        setChartData(calculateHouseData(existing as HousePlan, settings));
      }
    }
  }, [planId, plans, settings]);

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setIsDirty(true);
    const { name, value } = evt.target;
    let newValue: string | number = value;

    if (["expectedMortgageRate", "interestRate", "annualPropertyTaxRate", "appreciationRate", "refinanceRate"].includes(name)) {
      newValue = parseFloat(value) / 100;
      if (isNaN(newValue)) newValue = 0;
    } else if (name !== "planName" && name !== "status" && name !== "state") {
      newValue = Number(value);
    }

    setPlan(prev => {
      const newPlan = {
        ...prev,
        ...(name === "planName"
          ? { planName: value }
          : { details: { ...prev.details, [name]: newValue } })
      };

      // Auto-update tax rate if state changes
      if (name === 'state' && typeof newValue === 'string' && newValue.length === 2) {
        newPlan.details.annualPropertyTaxRate = getPropertyTaxRateForState(newValue);
      }

      return newPlan;
    });
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

  const updateChart = () => {
    setIsDirty(false);
    setChartData(calculateHouseData(plan, settings));
  };

  const handleSave = async () => {
    if (!user) {
      alert("Please sign in to save your plan");
      return;
    }
    try {
      const savedPlan = await savePlan(plan);
      setPlan(savedPlan);
      updateChart();
      if (plan.id === 'new') {
        router.push(`/house?plan=${savedPlan.id}`);
      }
    } catch (error) {
      console.error("Error saving plan:", error);
    }
  };

  return (
    <main className="flex flex-col gap-6">
      <PlanSelector planType="house" currentPlanId={planId || null} basePath="/house" />
      <Card className="bg-white shadow-lg border-none">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
            Real Estate Planner
          </CardTitle>
          <CardDescription>
            Manage your mortgage and home equity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlanNameField value={plan.planName} onChange={handleChange} />

          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <FormField label="Current Home Value ($)" name="currentValue" value={plan.details.currentValue ?? 0} onChange={handleChange} placeholder="600000" />
            <FormField label="Current Loan Balance ($)" name="currentLoanBalance" value={plan.details.currentLoanBalance ?? 0} onChange={handleChange} placeholder="400000" />
            <FormField label="Interest Rate (%)" name="interestRate" value={plan.details.interestRate ?? 0} onChange={handleChange} isPercentage placeholder="5" />
            <FormField label="Remaining Term (Months)" name="remainingTermMonths" value={plan.details.remainingTermMonths ?? 0} onChange={handleChange} placeholder="360" />
            <FormField label="Annual Home Insurance ($)" name="annualHomeInsurance" value={plan.details.annualHomeInsurance ?? 0} onChange={handleChange} placeholder="1500" />
            <FormField label="Annual Maintenance ($)" name="annualMaintenance" value={plan.details.annualMaintenance ?? 0} onChange={handleChange} placeholder="2000" />

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-gray-700">State</Label>
              <input
                type="text"
                name="state"
                maxLength={2}
                value={plan.details.state || ''}
                onChange={handleChange}
                placeholder="e.g. IL"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            
            <FormField label="Annual Appreciation (%)" name="appreciationRate" value={plan.details.appreciationRate ?? 0.03} onChange={handleChange} isPercentage placeholder="3" />
            
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-gray-700">Linked Portfolios</Label>
              <div className="flex flex-col gap-1.5 p-3 border rounded-md bg-white max-h-40 overflow-y-auto">
                {plans.filter(p => p.planType === 'rebalance').length === 0 && (
                  <span className="text-xs text-slate-500 italic">No portfolios available.</span>
                )}
                {plans.filter(p => p.planType === 'rebalance').map(p => {
                  const isChecked = (plan.details.linkedPortfolioIds || []).includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => handlePortfolioToggle(p.id)}
                        className="rounded border-slate-300 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-slate-700">{p.planName}</span>
                      {(p as any).details?.institution && <span className="text-xs text-slate-400">({(p as any).details.institution})</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex flex-row items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Property Tax Configuration</h3>
              <div className="flex items-center space-x-2">
                <Switch
                  id="advanced-tax"
                  checked={plan.details.useAdvancedPropertyTax || false}
                  onCheckedChange={(checked) => {
                    setPlan(p => ({ ...p, details: { ...p.details, useAdvancedPropertyTax: checked } }));
                    setIsDirty(true);
                  }}
                />
                <Label htmlFor="advanced-tax" className="font-medium text-slate-700 cursor-pointer">Advanced (e.g. IL EAV) Mode</Label>
              </div>
            </div>
            
            {plan.details.useAdvancedPropertyTax ? (
              <div className="grid md:grid-cols-3 gap-6">
                <FormField label="Assessment Ratio (e.g., 33.33%)" name="assessmentRatio" value={plan.details.assessmentRatio ?? 0.3333} onChange={handleChange} isPercentage placeholder="33.33" />
                <FormField label="Homestead Exemption ($)" name="homesteadExemption" value={plan.details.homesteadExemption ?? 8000} onChange={handleChange} placeholder="8000" />
                <FormField label="Local Tax Rate (%)" name="localTaxRate" value={plan.details.localTaxRate ?? 0.06} onChange={handleChange} isPercentage placeholder="6.5" />
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                <FormField label="Annual Property Tax Rate (%)" name="annualPropertyTaxRate" value={plan.details.annualPropertyTaxRate ?? 0} onChange={handleChange} isPercentage placeholder="2.08" />
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Scenario Analysis</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <FormField label="Extra Monthly Principal ($)" name="extraMonthlyPayment" value={plan.details.extraMonthlyPayment ?? 0} onChange={handleChange} placeholder="200" />
              <FormField label="Refinance Rate (%)" name="refinanceRate" value={plan.details.refinanceRate ?? 0} onChange={handleChange} isPercentage placeholder="4.5" />
              <FormField label="Refinance Term (Months)" name="refinanceTermMonths" value={plan.details.refinanceTermMonths ?? 0} onChange={handleChange} placeholder="360" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t py-4 justify-between">
          <Button onClick={updateChart} variant={isDirty ? "default" : "secondary"}>
            {isDirty ? "Calculate" : "Recalculate"}
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-teal-600 hover:bg-teal-700">
            {plan.id === 'new' ? 'Save Plan' : 'Update Plan'}
          </Button>
        </CardFooter>
      </Card>

      {chartData.length > 0 && (
        <Card className="bg-white shadow-lg border-none">
          <CardHeader>
            <CardTitle>Amortization & Value</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorScenario" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottomRight', offset: 0 }} />
                <YAxis tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, {maximumFractionDigits:0})}`} />
                <Legend />
                
                  <Area type="monotone" name="Home Value" dataKey="homeValue" stroke="#94a3b8" fillOpacity={1} fill="url(#colorTarget)" />
                  <Area type="monotone" name="Base Loan Balance" dataKey="principalBalance" stroke="#0d9488" fillOpacity={1} fill="url(#colorPrimary)" />
                  {((plan.details.extraMonthlyPayment && plan.details.extraMonthlyPayment > 0) || plan.details.refinanceRate) && (
                    <Area type="monotone" name="Scenario Loan Balance" dataKey="scenarioPrincipalBalance" stroke="#eab308" fillOpacity={1} fill="url(#colorScenario)" />
                  )}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
