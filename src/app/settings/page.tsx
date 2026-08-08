"use client"

import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { usePlans } from '@/contexts/PlansContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlobalSettings } from '@/types/chart';
import { calculateTaxes } from '@/lib/taxes/engine';
import { SUPPORTED_STATES, FilingStatus } from '@/lib/taxes/brackets';

export default function SettingsPage() {
  const { settings, loading, error, updateSettings } = useSettings();
  const { plans } = usePlans();
  const [formData, setFormData] = useState<GlobalSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings && !formData) {
      setFormData(settings);
    }
  }, [settings, formData]);

  const handleSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    try {
      await updateSettings(formData);
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
    setIsSaving(false);
  };

  const handleUpdatePayor = (oldName: string, newName: string) => {
    if (!formData) return;
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        payors: prev.payors.map(p => p === oldName ? newName : p),
        incomes: prev.incomes.map(inc => inc.payorId === oldName ? { ...inc, payorId: newName } : inc)
      };
    });
  };

  const handleUpdateIncome = (payorId: string, amount: number) => {
    if (!formData) return;
    setFormData(prev => {
      if (!prev) return prev;
      const exists = prev.incomes.find(inc => inc.payorId === payorId);
      if (exists) {
        return {
          ...prev,
          incomes: prev.incomes.map(inc => inc.payorId === payorId ? { ...inc, amount } : inc)
        };
      } else {
        return {
          ...prev,
          incomes: [...prev.incomes, { payorId, amount }]
        };
      }
    });
  };

  const handleAddPayor = () => {
    if (!formData) return;
    const newName = `Person ${formData.payors.length + 1}`;
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        payors: [...prev.payors, newName],
        incomes: [...prev.incomes, { payorId: newName, amount: 0 }]
      };
    });
  };

  const handleRemovePayor = (payorName: string) => {
    if (!formData) return;
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        payors: prev.payors.filter(p => p !== payorName),
        incomes: prev.incomes.filter(inc => inc.payorId !== payorName)
      };
    });
  };

  if (loading || !formData) {
    return <main className="max-w-4xl mx-auto p-4"><p>Loading settings...</p></main>;
  }

  if (error) {
    return <main className="max-w-4xl mx-auto p-4"><p className="text-red-500">{error}</p></main>;
  }

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Global Settings</h1>
          <p className="text-muted-foreground mt-2">
            Set your default financial assumptions here. These will be inherited by all your new plans, 
            but you can override them on a per-plan basis.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Application Mode */}
        <Card className="md:col-span-2 border-indigo-200 shadow-sm bg-indigo-50/30">
          <CardHeader>
            <CardTitle>Application Mode</CardTitle>
            <CardDescription>Choose how you want to experience TopHat.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="holisticMode"
                checked={formData.holisticModeEnabled !== false}
                onChange={(e) => setFormData({ ...formData, holisticModeEnabled: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="holisticMode" className="text-base font-semibold cursor-pointer">
                  Enable Holistic Mode (Master Dashboard)
                </Label>
                <p className="text-sm text-muted-foreground">
                  If enabled, TopHat will tie all your active plans together into a unified, interconnected Master Dashboard. If disabled, you can use the individual planners in Classic Mode.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Economic Assumptions</CardTitle>
            <CardDescription>Default rates for markets and inflation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="returnRate">Expected Portfolio Return (%)</Label>
              <Input 
                id="returnRate" 
                type="number" 
                step="0.1"
                value={formData.returnRate * 100} 
                onChange={(e) => setFormData({ ...formData, returnRate: Number(e.target.value) / 100 })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inflationRate">Inflation Rate (%)</Label>
              <Input 
                id="inflationRate" 
                type="number" 
                step="0.1"
                value={formData.inflationRate * 100} 
                onChange={(e) => setFormData({ ...formData, inflationRate: Number(e.target.value) / 100 })} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retirement Assumptions</CardTitle>
            <CardDescription>Default age and withdrawal rules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentAge">Current Age</Label>
              <Input 
                id="currentAge" 
                type="number" 
                value={formData.currentAge} 
                onChange={(e) => setFormData({ ...formData, currentAge: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retirementAge">Target Retirement Age</Label>
              <Input 
                id="retirementAge" 
                type="number" 
                value={formData.retirementAge} 
                onChange={(e) => setFormData({ ...formData, retirementAge: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawalRate">Safe Withdrawal Rate (%)</Label>
              <Input 
                id="withdrawalRate" 
                type="number" 
                step="0.1"
                value={formData.withdrawalRate * 100} 
                onChange={(e) => setFormData({ ...formData, withdrawalRate: Number(e.target.value) / 100 })} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Tax Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Profile</CardTitle>
            <CardDescription>Used by the Tax Engine to calculate dynamic effective rates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filingStatus">Filing Status</Label>
              <select
                id="filingStatus"
                value={formData.filingStatus || 'Single'}
                onChange={(e) => setFormData({ ...formData, filingStatus: e.target.value as FilingStatus })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="Single">Single</option>
                <option value="MarriedJointly">Married Filing Jointly</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stateOfResidence">State of Residence</Label>
              <select
                id="stateOfResidence"
                value={formData.stateOfResidence || 'TX'}
                onChange={(e) => setFormData({ ...formData, stateOfResidence: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {SUPPORTED_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dependents">Dependents (Child Tax Credit)</Label>
              <Input 
                id="dependents" 
                type="number" 
                value={formData.dependents || 0} 
                onChange={(e) => setFormData({ ...formData, dependents: Number(e.target.value) })} 
              />
            </div>
            
            {(() => {
              const totalIncome = (formData.incomes || []).reduce((sum, inc) => sum + inc.amount, 0); // Already annual
              if (totalIncome === 0) return null;
              
              const taxResult = calculateTaxes(
                totalIncome, 
                formData.filingStatus || 'Single', 
                formData.stateOfResidence || 'TX', 
                formData.dependents || 0
              );
              
              return (
                <div className="mt-4 p-4 bg-slate-50 border rounded-md">
                  <Label className="text-slate-500">Calculated Effective Tax Rate</Label>
                  <div className="text-2xl font-bold text-slate-800">
                    {(taxResult.effectiveTaxRate * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Based on household annual income of ${totalIncome.toLocaleString()}</p>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Active Plans */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Active Master Plans</CardTitle>
            <CardDescription>Select which plans feed into your Master Dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Income Plan</Label>
              <select
                value={formData.activePlans?.incomePlanId || ''}
                onChange={(e) => setFormData({ ...formData, activePlans: { ...formData.activePlans, incomePlanId: e.target.value } })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">None</option>
                {plans.filter(p => p.planType === 'income').map(p => (
                  <option key={p.id} value={p.id}>{p.planName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Savings Plan</Label>
              <select
                value={formData.activePlans?.savingsPlanId || ''}
                onChange={(e) => setFormData({ ...formData, activePlans: { ...formData.activePlans, savingsPlanId: e.target.value } })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">None</option>
                {plans.filter(p => p.planType === 'savings').map(p => (
                  <option key={p.id} value={p.id}>{p.planName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>College Plans</Label>
              <div className="space-y-2 border rounded-md p-3 bg-background min-h-[40px]">
                {plans.filter(p => p.planType === 'college').map(p => (
                  <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.activePlans?.collegePlanIds?.includes(p.id) || false}
                      onChange={(e) => {
                        const currentIds = formData.activePlans?.collegePlanIds || [];
                        const newIds = e.target.checked 
                          ? [...currentIds, p.id] 
                          : currentIds.filter(id => id !== p.id);
                        setFormData({
                          ...formData,
                          activePlans: { ...formData.activePlans, collegePlanIds: newIds }
                        });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    {p.planName}
                  </label>
                ))}
                {plans.filter(p => p.planType === 'college').length === 0 && (
                  <span className="text-muted-foreground text-sm italic">None</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Budget Plan</Label>
              <select
                value={formData.activePlans?.budgetPlanId || ''}
                onChange={(e) => setFormData({ ...formData, activePlans: { ...formData.activePlans, budgetPlanId: e.target.value } })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">None</option>
                {plans.filter(p => p.planType === 'budget').map(p => (
                  <option key={p.id} value={p.id}>{p.planName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Portfolio Plan</Label>
              <select
                value={formData.activePlans?.portfolioPlanId || ''}
                onChange={(e) => setFormData({ ...formData, activePlans: { ...formData.activePlans, portfolioPlanId: e.target.value } })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">None</option>
                {plans.filter(p => p.planType === 'rebalance').map(p => (
                  <option key={p.id} value={p.id}>{p.planName}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle>Household & Incomes</CardTitle>
              <CardDescription>Manage the people in your household and their baseline annual income.</CardDescription>
            </div>
            <Button onClick={handleAddPayor} variant="outline" size="sm">Add Person</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.payors && formData.payors.length > 0 ? (
              <div className="space-y-4">
                {formData.payors.map((payorName, idx) => {
                  const incomeEntry = formData.incomes?.find(inc => inc.payorId === payorName);
                  const incomeAmount = incomeEntry ? incomeEntry.amount : 0;
                  return (
                    <div key={idx} className="flex flex-col sm:flex-row items-end gap-4 p-4 border rounded-md bg-slate-50">
                      <div className="space-y-2 flex-1 w-full">
                        <Label>Name / Identifier</Label>
                        <Input 
                          value={payorName} 
                          onChange={(e) => handleUpdatePayor(payorName, e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2 flex-1 w-full">
                        <Label>Annual Income ($)</Label>
                        <Input 
                          type="number"
                          value={incomeAmount} 
                          onChange={(e) => handleUpdateIncome(payorName, Number(e.target.value))} 
                        />
                      </div>
                      <Button 
                        variant="destructive" 
                        onClick={() => handleRemovePayor(payorName)}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No household members configured.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
