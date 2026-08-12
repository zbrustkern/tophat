"use client"

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePlans } from "@/contexts/PlansContext";
import { useSettings } from "@/contexts/SettingsContext";
import { BudgetPlan, BudgetLineItem } from '@/types/chart';
import { usePlanManagement } from '@/hooks/usePlanManagement';
import { useBudgetCalculations } from '@/hooks/useBudgetCalculations';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlanNameField } from "@/components/PlanFormElements";
import { PlanSelector } from "@/components/PlanSelector";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

const BUDGET_CATEGORIES = [
  { value: "housing", label: "Housing" },
  { value: "utilities", label: "Utilities" },
  { value: "childcare", label: "Childcare" },
  { value: "insurance", label: "Insurance" },
  { value: "groceries", label: "Groceries (Wallet)" },
  { value: "gas", label: "Gas (Wallet)" },
  { value: "dining", label: "Dining (Wallet)" },
  { value: "travel", label: "Travel (Wallet)" },
  { value: "wholesale", label: "Wholesale (Wallet)" },
  { value: "other", label: "Other" }
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultPlan: BudgetPlan = {
  id: 'new',
  planName: 'Household Budget',
  planType: 'budget',
  lastUpdated: new Date(),
  details: {
    useGlobalSettings: true,
    lineItems: [
      { id: generateId(), payorId: 'Joint', bill: 'Mortgage/Rent', company: '', category: 'House', monthlyAmount: 2000 },
      { id: generateId(), payorId: 'Joint', bill: 'Groceries', company: '', category: 'Food', monthlyAmount: 800 },
    ]
  }
};

export default function BudgetPlanner({ planId }: { planId?: string | null }) {
  const { user } = useAuth();
  const { plans } = usePlans();
  const { settings } = useSettings();
  const router = useRouter();
  
  const [plan, setPlan] = useState<BudgetPlan>(() => {
    if (planId && planId !== 'new') {
      const existing = plans.find(p => p.id === planId);
      if (existing) return existing as BudgetPlan;
    } else if (!planId) {
      const existing = plans.find(p => p.planType === 'budget');
      if (existing) return existing as BudgetPlan;
    }
    return defaultPlan;
  });

  const [hydratedPlanId, setHydratedPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (planId && planId !== hydratedPlanId && plans.length > 0) {
      const existing = plans.find(p => p.id === planId);
      if (existing && existing.planType === 'budget') {
        setPlan(existing as BudgetPlan);
        setHydratedPlanId(planId);
      }
    }
  }, [planId, plans, hydratedPlanId]);

  const { loading, savePlan } = usePlanManagement<BudgetPlan>();
  const { calculateBudgetData } = useBudgetCalculations();
  const [isDirty, setIsDirty] = useState(false);
  const [activePayorView, setActivePayorView] = useState<string>('All');

  useEffect(() => {
    if (plans.length > 0) {
      const existing = plans.find(p => p.planType === 'budget');
      if (existing && plan.id === 'new') {
        setPlan(existing as BudgetPlan);
      }
    }
  }, [plans, plan.id]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true);
    setPlan(prev => ({ ...prev, planName: e.target.value }));
  };

  const handleGlobalToggleChange = (checked: boolean) => {
    setIsDirty(true);
    setPlan(prev => ({
      ...prev,
      details: { ...prev.details, useGlobalSettings: checked }
    }));
  };

  const addLineItem = () => {
    setIsDirty(true);
    setPlan(prev => ({
      ...prev,
      details: {
        ...prev.details,
        lineItems: [
          ...prev.details.lineItems,
          { id: generateId(), payorId: settings?.payors?.[0] || 'Joint', bill: '', company: '', category: '', monthlyAmount: 0 }
        ]
      }
    }));
  };

  const updateLineItem = (id: string, field: keyof BudgetLineItem, value: string | number) => {
    setIsDirty(true);
    setPlan(prev => ({
      ...prev,
      details: {
        ...prev.details,
        lineItems: prev.details.lineItems.map(item => 
          item.id === id ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const removeLineItem = (id: string) => {
    setIsDirty(true);
    setPlan(prev => ({
      ...prev,
      details: {
        ...prev.details,
        lineItems: prev.details.lineItems.filter(item => item.id !== id)
      }
    }));
  };

  const handleSave = async () => {
    if (!user) {
      alert("Please sign in to save your budget");
      return;
    }
    try {
      const savedPlan = await savePlan(plan);
      setPlan(savedPlan);
      setIsDirty(false);
      if (plan.id === 'new') {
        router.push(`/budget?plan=${savedPlan.id}`);
      }
    } catch (error) {
      console.error("Error saving budget:", error);
    }
  };

  // Perform calculations
  const payors = settings?.payors || ['Joint'];
  const data = calculateBudgetData(plan, settings, plans, activePayorView);

  return (
    <div className="space-y-6">
      <PlanSelector planType="budget" currentPlanId={planId || null} basePath="/budget" />
      <div className="flex flex-col lg:flex-row gap-6">
      {/* Waterfall Summary Graphic */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/10 pb-3">
          <h3 className="text-sm font-display font-semibold uppercase tracking-widest text-deco-gold">Monthly Cash Flow Waterfall</h3>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-display uppercase tracking-widest text-muted-foreground whitespace-nowrap">View Cash Flow By:</Label>
            <select
              value={activePayorView}
              onChange={(e) => setActivePayorView(e.target.value)}
              className="h-8 rounded-sm border border-white/20 bg-slate-950 text-white px-2 py-1 text-xs focus:outline-none focus:border-deco-gold"
            >
              <option value="All">Household / All</option>
              {payors.map(p => (
                <option key={p} value={p}>{p} Only</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Gross */}
          <div className="bg-slate-900/90 border border-white/10 rounded-sm p-3 flex flex-col justify-center items-center text-center">
            <div className="text-[10px] text-muted-foreground font-display uppercase tracking-widest mb-1">Gross Income</div>
            <div className="text-sm font-bold font-mono text-white">${Math.round(data.waterfall.grossIncome / 12).toLocaleString()}</div>
          </div>

          {/* Pre-tax */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-sm p-3 flex flex-col justify-center items-center text-center">
            <div className="text-[10px] text-amber-400 font-display uppercase tracking-widest mb-1">Pre-Tax Savings</div>
            <div className="text-sm font-bold font-mono text-amber-300">-${Math.round(data.waterfall.preTaxSavings / 12).toLocaleString()}</div>
          </div>

          {/* Taxes */}
          <div className="bg-slate-900/90 border border-rose-500/30 rounded-sm p-3 flex flex-col justify-center items-center text-center">
            <div className="text-[10px] text-rose-400 font-display uppercase tracking-widest mb-1">Taxes</div>
            <div className="text-sm font-bold font-mono text-rose-300">-${Math.round(data.waterfall.taxes / 12).toLocaleString()}</div>
          </div>

          {/* Take Home */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-sm p-3 flex flex-col justify-center items-center text-center">
            <div className="text-[10px] text-emerald-400 font-display uppercase tracking-widest mb-1">Take Home</div>
            <div className="text-sm font-bold font-mono text-emerald-300">${Math.round(data.waterfall.takeHome / 12).toLocaleString()}</div>
          </div>

          {/* Core Budget */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-sm p-3 flex flex-col justify-center items-center text-center">
            <div className="text-[10px] text-amber-400 font-display uppercase tracking-widest mb-1">Core Budget</div>
            <div className="text-sm font-bold font-mono text-amber-300">-${Math.round(data.waterfall.annualCoreBudget / 12).toLocaleString()}</div>
          </div>

          {/* Post-tax Savings */}
          <div className="bg-slate-900/90 border border-sky-500/30 rounded-sm p-3 flex flex-col justify-center items-center text-center">
            <div className="text-[10px] text-sky-400 font-display uppercase tracking-widest mb-1">Post-Tax Savings</div>
            <div className="text-sm font-bold font-mono text-sky-300">-${Math.round(data.waterfall.postTaxSavings / 12).toLocaleString()}</div>
          </div>

          {/* Net */}
          <div className={`border rounded-sm p-3 flex flex-col justify-center items-center text-center ${
            data.waterfall.netCashFlow >= 0 
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' 
              : 'bg-rose-950/60 border-rose-500/40 text-rose-400'
          }`}>
            <div className="text-[10px] font-display uppercase tracking-widest mb-1">Net Cash Flow</div>
            <div className="text-sm font-bold font-mono">${Math.round(data.waterfall.netCashFlow / 12).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Float Maximization & Liquidity Buffer Card */}
      {data.floatMetrics && (
        <Card className="border-deco-gold/30 bg-card/60 backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-display uppercase tracking-widest text-deco-gold">
                  Float Maximization & Cash Buffer
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Optimize credit card 30-day interest-free grace periods by holding operating cash in a High-Yield Savings Account (HYSA).
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/wallet')}
                className="text-xs border-deco-gold/40 text-deco-gold hover:bg-deco-gold/10"
              >
                Configure Wallet ↗
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-3 rounded-sm bg-white/5 border border-white/10">
                <span className="text-xs text-muted-foreground uppercase font-display tracking-wider block">Card-Eligible Monthly Spend</span>
                <span className="text-xl font-bold text-foreground">${Math.round(data.floatMetrics.eligibleFloatMonthlySpend).toLocaleString()}/mo</span>
              </div>
              <div className="p-3 rounded-sm bg-white/5 border border-white/10">
                <span className="text-xs text-muted-foreground uppercase font-display tracking-wider block">30-Day Retained HYSA Buffer</span>
                <span className="text-xl font-bold text-deco-gold">${Math.round(data.floatMetrics.retainedFloatBuffer).toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-sm bg-white/5 border border-white/10">
                <span className="text-xs text-muted-foreground uppercase font-display tracking-wider block">Annual Passive Yield (5% HYSA)</span>
                <span className="text-xl font-bold text-emerald-400">+${Math.round(data.floatMetrics.annualFloatYield).toLocaleString()}/yr</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* The Main Budget Grid */}
      <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/20 shadow-2xl rounded-sm">
        <CardHeader className="flex flex-row justify-between items-center border-b border-white/10 pb-4">
          <div>
            <CardTitle className="text-2xl font-display font-semibold uppercase tracking-widest text-deco-gold">Monthly Budget</CardTitle>
            <CardDescription className="text-muted-foreground font-light text-xs">Track your fixed and variable monthly expenses.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <PlanNameField value={plan.planName} onChange={handleNameChange} />
          
          <div className="p-4 bg-slate-900/90 rounded-sm border border-deco-gold/30 flex items-center justify-between">
            <div>
              <Label className="text-xs font-display uppercase tracking-widest text-deco-gold">Sync Global Incomes</Label>
              <p className="text-xs text-muted-foreground">Pull your household income configurations from Global Settings to calculate cash flow.</p>
            </div>
            <Switch 
              checked={plan.details.useGlobalSettings !== false} 
              onCheckedChange={handleGlobalToggleChange} 
            />
          </div>

          <div className="space-y-3 mt-4">
            {/* Header Row (Hidden on mobile) */}
            <div className="hidden md:grid grid-cols-[110px_1fr_1fr_140px_130px_40px] gap-3 px-2 pb-2 text-xs font-display uppercase tracking-widest text-muted-foreground border-b border-white/10">
              <div>Who Pays?</div>
              <div>Bill / Expense</div>
              <div>Company (Optional)</div>
              <div>Category</div>
              <div>Monthly Amount</div>
              <div className="w-10"></div>
            </div>

            {/* Line Items */}
            {plan.details.lineItems.map((item) => {
              const isExcluded = activePayorView !== 'All' && item.payorId !== activePayorView;
              return (
              <div key={item.id} className={`grid grid-cols-1 md:grid-cols-[110px_1fr_1fr_140px_130px_40px] gap-3 p-3 md:p-0 md:bg-transparent bg-slate-900/80 border md:border-0 border-white/10 rounded-sm items-center transition-opacity duration-300 ${isExcluded ? 'opacity-40 grayscale' : ''}`}>
                
                {/* Payor */}
                <div className="flex flex-col md:block">
                  <span className="md:hidden text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">Who Pays?</span>
                  <select
                    value={item.payorId}
                    onChange={(e) => updateLineItem(item.id, 'payorId', e.target.value)}
                    className="h-10 w-full rounded-sm border border-white/20 bg-slate-950 text-white px-2 py-2 text-xs font-sans focus:border-deco-gold"
                  >
                    {payors.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    {!payors.includes(item.payorId) && <option value={item.payorId}>{item.payorId}</option>}
                  </select>
                </div>

                {/* Bill */}
                <div className="flex flex-col md:block">
                  <span className="md:hidden text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">Bill / Expense</span>
                  <Input 
                    value={item.bill} 
                    onChange={(e) => updateLineItem(item.id, 'bill', e.target.value)} 
                    placeholder="e.g. Mortgage" 
                    className="bg-slate-950 border-white/20 text-white font-sans text-xs focus:border-deco-gold"
                  />
                </div>

                {/* Company */}
                <div className="flex flex-col md:block">
                  <span className="md:hidden text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">Company</span>
                  <Input 
                    value={item.company} 
                    onChange={(e) => updateLineItem(item.id, 'company', e.target.value)} 
                    placeholder="e.g. Chase" 
                    className="bg-slate-950 border-white/20 text-white font-sans text-xs focus:border-deco-gold"
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col md:block">
                  <span className="md:hidden text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">Category</span>
                  <select
                    value={item.category}
                    onChange={(e) => updateLineItem(item.id, 'category', e.target.value)}
                    className="h-10 w-full rounded-sm border border-white/20 bg-slate-950 text-white px-2 py-2 text-xs font-sans focus:border-deco-gold"
                  >
                    <option value="" disabled>Select Category...</option>
                    {BUDGET_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="flex flex-col md:block">
                  <span className="md:hidden text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">Monthly Amount ($)</span>
                  <Input 
                    type="number"
                    value={item.monthlyAmount || ''} 
                    onChange={(e) => updateLineItem(item.id, 'monthlyAmount', Number(e.target.value))} 
                    placeholder="0" 
                    className="bg-slate-950 border-white/20 text-white font-mono text-xs focus:border-deco-gold"
                  />
                </div>

                {/* Remove */}
                <div className="flex justify-end md:block mt-2 md:mt-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeLineItem(item.id)}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )})}

            {/* Auto-Injected Line Items */}
            {data.injectedLineItems && data.injectedLineItems.length > 0 && (
              <>
                <div className="my-6 border-t border-white/10" />
                <h4 className="text-xs font-display uppercase tracking-widest text-deco-gold mb-2 px-2">Auto-Synced from Active Plans</h4>
                {data.injectedLineItems.map((item) => {
                  const isExcluded = activePayorView !== 'All' && item.payorId !== activePayorView;
                  if (isExcluded) return null;
                  
                  return (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-[110px_1fr_1fr_140px_130px_40px] gap-3 p-3 md:p-0 md:bg-transparent bg-slate-900/50 border md:border-0 border-white/10 rounded-sm items-center opacity-70 cursor-not-allowed">
                      <div className="flex flex-col md:block">
                        <span className="md:hidden text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">Who Pays?</span>
                        <Input value={item.payorId} disabled className="bg-slate-900 border-white/10 text-muted-foreground text-xs" />
                      </div>
                      <div className="flex flex-col md:block">
                        <span className="md:hidden text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">Bill / Expense</span>
                        <Input value={item.bill} disabled className="bg-slate-900 border-white/10 text-muted-foreground text-xs" />
                      </div>
                      <div className="flex flex-col md:block">
                        <span className="md:hidden text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">Company</span>
                        <Input value="Auto-Linked" disabled className="bg-slate-900 border-white/10 text-muted-foreground italic text-xs" />
                      </div>
                      <div className="flex flex-col md:block">
                        <span className="md:hidden text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">Category</span>
                        <Input value={item.category} disabled className="bg-slate-900 border-white/10 text-muted-foreground text-xs" />
                      </div>
                      <div className="flex flex-col md:block">
                        <span className="md:hidden text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">Monthly Amount ($)</span>
                        <Input value={Math.round(item.monthlyAmount)} disabled className="bg-slate-900 border-white/10 text-white font-mono text-xs" />
                      </div>
                      <div className="w-10"></div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <Button onClick={addLineItem} className="w-full mt-4 border border-dashed border-white/20 bg-slate-900/60 hover:bg-slate-900 text-deco-gold font-display uppercase tracking-widest text-xs">
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>

        </CardContent>
        <CardFooter className="bg-slate-950/80 border-t border-white/10 py-4 justify-between">
          <span className="text-xs font-display uppercase tracking-widest text-muted-foreground">
            {isDirty ? "Unsaved changes" : "All changes saved"}
          </span>
          <Button onClick={handleSave} disabled={loading || !isDirty} className="bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest text-xs font-semibold">
            {loading ? "Saving..." : "Save Budget"}
          </Button>
        </CardFooter>
      </Card>
      </div>
    </div>
  );
}
