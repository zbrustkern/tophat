"use client"

import { useState, useEffect } from "react";
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

export default function BudgetPlanner() {
  const { user } = useAuth();
  const { plans } = usePlans();
  const { settings } = useSettings();
  
  const [plan, setPlan] = useState<BudgetPlan>(() => {
    const existing = plans.find(p => p.planType === 'budget');
    if (existing) return existing as BudgetPlan;
    return defaultPlan;
  });

  const { loading, savePlan } = usePlanManagement<BudgetPlan>();
  const { calculateBudgetData } = useBudgetCalculations();
  const [isDirty, setIsDirty] = useState(false);

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
    } catch (error) {
      console.error("Error saving budget:", error);
    }
  };

  // Perform calculations
  const data = calculateBudgetData(plan, settings);
  const payors = settings?.payors || ['Joint'];

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-sky-50 border-sky-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sky-900 text-lg">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-sky-700">${data.totalIncome.toLocaleString()}</div>
            <p className="text-sm text-sky-600 mt-1">From Global Settings</p>
          </CardContent>
        </Card>
        
        <Card className="bg-rose-50 border-rose-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-rose-900 text-lg">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-700">${data.totalExpenses.toLocaleString()}</div>
            <p className="text-sm text-rose-600 mt-1">Across all payors</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-900 text-lg">Net Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">${data.totalDiscretionary.toLocaleString()}</div>
            <p className="text-sm text-emerald-600 mt-1">Discretionary remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Payor Breakdown */}
      {plan.details.useGlobalSettings !== false && payors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Breakdown by Payor</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {payors.map(payor => {
              const inc = data.incomesByPayor[payor] || 0;
              const exp = data.expensesByPayor[payor] || 0;
              const disc = data.discretionaryByPayor[payor] || 0;
              return (
                <div key={payor} className="p-3 border rounded-lg bg-slate-50">
                  <div className="font-bold text-slate-800 mb-2">{payor}</div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Income</span>
                    <span className="font-medium">${inc.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Expenses</span>
                    <span className="font-medium text-rose-600">-${exp.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t mt-2">
                    <span className="text-slate-700">Net</span>
                    <span className={disc >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      ${disc.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

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
            {plan.details.lineItems.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_1fr_1fr_auto] gap-3 p-3 md:p-0 md:bg-transparent bg-slate-50 border md:border-0 rounded-lg md:rounded-none items-center">
                
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
                  <Input 
                    value={item.category} 
                    onChange={(e) => updateLineItem(item.id, 'category', e.target.value)} 
                    placeholder="e.g. Housing" 
                  />
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
            ))}
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
  );
}
