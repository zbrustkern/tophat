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
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2">
          <h3 className="text-lg font-semibold text-slate-700">Monthly Cash Flow Waterfall</h3>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold text-slate-500 whitespace-nowrap">View Cash Flow By:</Label>
            <select
              value={activePayorView}
              onChange={(e) => setActivePayorView(e.target.value)}
              className="h-8 rounded-md border border-input bg-white px-2 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="All">Household / All</option>
              {payors.map(p => (
                <option key={p} value={p}>{p} Only</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {/* Gross */}
          <Card className="bg-sky-50 border-sky-200 flex flex-col justify-center items-center text-center p-4">
            <div className="text-[10px] text-sky-600 font-bold uppercase tracking-wider mb-1">Gross Income</div>
            <div className="text-lg font-bold text-sky-700">${Math.round(data.waterfall.grossIncome / 12).toLocaleString()}</div>
          </Card>

          {/* Pre-tax */}
          <Card className="bg-amber-50 border-amber-200 flex flex-col justify-center items-center text-center p-4 relative">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold hidden lg:block">-</div>
            <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Pre-Tax Savings</div>
            <div className="text-lg font-bold text-amber-700">${Math.round(data.waterfall.preTaxSavings / 12).toLocaleString()}</div>
          </Card>

          {/* Taxes */}
          <Card className="bg-rose-50 border-rose-200 flex flex-col justify-center items-center text-center p-4 relative">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold hidden lg:block">-</div>
            <div className="text-[10px] text-rose-600 font-bold uppercase tracking-wider mb-1">Taxes</div>
            <div className="text-lg font-bold text-rose-700">${Math.round(data.waterfall.taxes / 12).toLocaleString()}</div>
          </Card>

          {/* Take Home */}
          <Card className="bg-emerald-50 border-emerald-200 flex flex-col justify-center items-center text-center p-4 relative shadow-sm">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold hidden lg:block">=</div>
            <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Take Home</div>
            <div className="text-lg font-bold text-emerald-700">${Math.round(data.waterfall.takeHome / 12).toLocaleString()}</div>
          </Card>

          {/* Core Budget */}
          <Card className="bg-orange-50 border-orange-200 flex flex-col justify-center items-center text-center p-4 relative">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold hidden lg:block">-</div>
            <div className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mb-1">Core Budget</div>
            <div className="text-lg font-bold text-orange-700">${Math.round(data.waterfall.annualCoreBudget / 12).toLocaleString()}</div>
          </Card>

          {/* Post-tax Savings */}
          <Card className="bg-indigo-50 border-indigo-200 flex flex-col justify-center items-center text-center p-4 relative">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold hidden lg:block">-</div>
            <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-1">Post-Tax Savings</div>
            <div className="text-lg font-bold text-indigo-700">${Math.round(data.waterfall.postTaxSavings / 12).toLocaleString()}</div>
          </Card>

          {/* Net */}
          <Card className="bg-violet-100 border-violet-300 flex flex-col justify-center items-center text-center p-4 relative shadow-md scale-105 z-10">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold hidden lg:block">=</div>
            <div className="text-[10px] text-violet-700 font-bold uppercase tracking-wider mb-1">Net Cash Flow</div>
            <div className="text-xl font-bold text-violet-900">${Math.round(data.waterfall.netCashFlow / 12).toLocaleString()}</div>
          </Card>
        </div>
      </div>

      {/* The Main Budget Grid */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-800">Monthly Budget</CardTitle>
            <CardDescription>Track your fixed and variable monthly expenses.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <PlanNameField value={plan.planName} onChange={handleNameChange} />
          
          <div className="p-4 bg-sky-50 rounded-lg border border-sky-100 flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold text-sky-900">Sync Global Incomes</Label>
              <p className="text-sm text-sky-700">Pull your household income configurations from Global Settings to calculate cash flow.</p>
            </div>
            <Switch 
              checked={plan.details.useGlobalSettings !== false} 
              onCheckedChange={handleGlobalToggleChange} 
            />
          </div>

          <div className="space-y-3 mt-4">
            {/* Header Row (Hidden on mobile) */}
            <div className="hidden md:grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_auto] gap-3 px-2 pb-2 text-sm font-semibold text-slate-500 border-b">
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
              <div key={item.id} className={`grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_1fr_1fr_auto] gap-3 p-3 md:p-0 md:bg-transparent bg-slate-50 border md:border-0 rounded-lg md:rounded-none items-center transition-opacity duration-300 ${isExcluded ? 'opacity-40 grayscale' : ''}`}>
                
                {/* Payor */}
                <div className="flex flex-col md:block">
                  <span className="md:hidden text-xs font-semibold text-slate-500 mb-1">Who Pays?</span>
                  <select
                    value={item.payorId}
                    onChange={(e) => updateLineItem(item.id, 'payorId', e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {payors.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    {!payors.includes(item.payorId) && <option value={item.payorId}>{item.payorId}</option>}
                  </select>
                </div>

                {/* Bill */}
                <div className="flex flex-col md:block">
                  <span className="md:hidden text-xs font-semibold text-slate-500 mb-1">Bill / Expense</span>
                  <Input 
                    value={item.bill} 
                    onChange={(e) => updateLineItem(item.id, 'bill', e.target.value)} 
                    placeholder="e.g. Mortgage" 
                  />
                </div>

                {/* Company */}
                <div className="flex flex-col md:block">
                  <span className="md:hidden text-xs font-semibold text-slate-500 mb-1">Company</span>
                  <Input 
                    value={item.company} 
                    onChange={(e) => updateLineItem(item.id, 'company', e.target.value)} 
                    placeholder="e.g. Chase" 
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col md:block">
                  <span className="md:hidden text-xs font-semibold text-slate-500 mb-1">Category</span>
                  <select
                    value={item.category}
                    onChange={(e) => updateLineItem(item.id, 'category', e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="" disabled>Select Category...</option>
                    {BUDGET_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="flex flex-col md:block">
                  <span className="md:hidden text-xs font-semibold text-slate-500 mb-1">Monthly Amount ($)</span>
                  <Input 
                    type="number"
                    value={item.monthlyAmount || ''} 
                    onChange={(e) => updateLineItem(item.id, 'monthlyAmount', Number(e.target.value))} 
                    placeholder="0" 
                  />
                </div>

                {/* Remove */}
                <div className="flex justify-end md:block mt-2 md:mt-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeLineItem(item.id)}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )})}

            {/* Auto-Injected Line Items */}
            {data.injectedLineItems && data.injectedLineItems.length > 0 && (
              <>
                <div className="my-6 border-t border-slate-200" />
                <h4 className="text-sm font-semibold text-slate-500 mb-2 px-2">Auto-Synced from Active Plans</h4>
                {data.injectedLineItems.map((item) => {
                  const isExcluded = activePayorView !== 'All' && item.payorId !== activePayorView;
                  if (isExcluded) return null;
                  
                  return (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_1fr_1fr_auto] gap-3 p-3 md:p-0 md:bg-transparent bg-slate-50 border md:border-0 rounded-lg md:rounded-none items-center opacity-70 cursor-not-allowed">
                      <div className="flex flex-col md:block">
                        <span className="md:hidden text-xs font-semibold text-slate-500 mb-1">Who Pays?</span>
                        <Input value={item.payorId} disabled className="bg-slate-100 font-medium text-slate-500" />
                      </div>
                      <div className="flex flex-col md:block">
                        <span className="md:hidden text-xs font-semibold text-slate-500 mb-1">Bill / Expense</span>
                        <Input value={item.bill} disabled className="bg-slate-100 font-medium text-slate-500" />
                      </div>
                      <div className="flex flex-col md:block">
                        <span className="md:hidden text-xs font-semibold text-slate-500 mb-1">Company</span>
                        <Input value="Auto-Linked" disabled className="bg-slate-100 italic text-slate-400" />
                      </div>
                      <div className="flex flex-col md:block">
                        <span className="md:hidden text-xs font-semibold text-slate-500 mb-1">Category</span>
                        <Input value={item.category} disabled className="bg-slate-100 font-medium text-slate-500" />
                      </div>
                      <div className="flex flex-col md:block">
                        <span className="md:hidden text-xs font-semibold text-slate-500 mb-1">Monthly Amount ($)</span>
                        <Input value={Math.round(item.monthlyAmount)} disabled className="bg-slate-100 font-bold text-slate-600" />
                      </div>
                      <div className="w-10"></div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <Button onClick={addLineItem} variant="secondary" className="w-full mt-4 border-dashed border-2 bg-transparent hover:bg-slate-50">
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>

        </CardContent>
        <CardFooter className="bg-slate-50 border-t py-4 justify-between">
          <span className="text-sm text-slate-500">
            {isDirty ? "Unsaved changes" : "All changes saved"}
          </span>
          <Button onClick={handleSave} disabled={loading || !isDirty}>
            {loading ? "Saving..." : "Save Budget"}
          </Button>
        </CardFooter>
      </Card>
      </div>
    </div>
  );
}
