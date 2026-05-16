"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePlans } from '@/contexts/PlansContext';
import { RebalancePlan, Asset } from '@/types/chart';
import { usePortfolioLogic } from '@/hooks/usePortfolioLogic';
import { usePlanManagement } from '@/hooks/usePlanManagement';
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
import { Trash2, Plus } from "lucide-react";

const defaultPlan: RebalancePlan = {
  id: 'new',
  planName: 'Tactical Allocation Plan',
  planType: 'rebalance',
  lastUpdated: new Date(),
  details: {
    currentCash: 50000,
    currentEquity: 100000,
    targetAnnualReturn: 0.08,
    initialPrincipal: 100000,
    monthlyContribution: 2000,
    mockVix: 15,
    monthsElapsed: 12,
    startDate: new Date().toISOString().split('T')[0],
    assets: []
  }
};

export default function DeploymentDashboard({ planId }: { planId?: string | null }) {
  const { user } = useAuth();
  const router = useRouter();
  const { plans } = usePlans();
  const { loading: saving, error, savePlan } = usePlanManagement<RebalancePlan>();
  
  const [plan, setPlan] = useState<RebalancePlan>(() => {
    if (planId) {
      const existing = plans.find(p => p.id === planId);
      if (existing && existing.planType === 'rebalance') return existing as RebalancePlan;
    }
    return defaultPlan;
  });

  const { calculateRebalanceData } = usePortfolioLogic();
  const [isDirty, setIsDirty] = useState(false);
  const [results, setResults] = useState(calculateRebalanceData(plan));

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true);
    const { name, value } = evt.target;
    let newValue: string | number = value;

    if (["targetAnnualReturn"].includes(name)) {
      newValue = parseFloat(value) / 100;
    } else if (name === "startDate") {
      newValue = value; // string
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

  const handleAssetChange = (id: string, field: keyof Asset, value: string | number) => {
    setIsDirty(true);
    setPlan(prev => {
      const newAssets = [...(prev.details.assets || [])];
      const idx = newAssets.findIndex(a => a.id === id);
      if (idx !== -1) {
        newAssets[idx] = { ...newAssets[idx], [field]: value };
      }
      return { ...prev, details: { ...prev.details, assets: newAssets } };
    });
  };

  const addAsset = () => {
    setIsDirty(true);
    setPlan(prev => {
      const newAsset: Asset = { id: Math.random().toString(36).substr(2, 9), symbol: '', type: 'equity', price: 0, shares: 0 };
      return { ...prev, details: { ...prev.details, assets: [...(prev.details.assets || []), newAsset] } };
    });
  };

  const removeAsset = (id: string) => {
    setIsDirty(true);
    setPlan(prev => {
      return { ...prev, details: { ...prev.details, assets: (prev.details.assets || []).filter(a => a.id !== id) } };
    });
  };

  const updateCalculations = () => {
    setIsDirty(false);
    setResults(calculateRebalanceData(plan));
  };

  const handleSave = async () => {
    if (!user) {
      alert("Please sign in to save your plan");
      return;
    }
    try {
      const savedPlan = await savePlan(plan);
      setPlan(savedPlan);
      setIsDirty(false);
      if (plan.id === 'new') {
        router.push(`/tactical-allocation?plan=${savedPlan.id}`);
      }
    } catch (e) {
      console.error("Failed to save:", e);
    }
  };

  return (
    <main className="flex flex-col gap-6">
      <div className="m-1">
        <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-none">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Tactical Allocation Dashboard
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium">
              Manage transitions from cash to equity using dynamic value-averaged risk parity.
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-gray-50/50 space-y-6">
            <PlanNameField value={plan.planName} onChange={handleChange} />
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-3">
                <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-2">Global Parameters</h3>
              </div>

              <FormField
                label="Monthly Contribution ($)"
                name="monthlyContribution"
                value={plan.details.monthlyContribution}
                onChange={handleChange}
                placeholder="2000"
              />
              <FormField
                label="Target Annual Return (%) - e.g. 10% for S&P 500"
                name="targetAnnualReturn"
                value={plan.details.targetAnnualReturn}
                onChange={handleChange}
                placeholder="10"
                isPercentage
              />
              <FormField
                label="Today's VIX Index (^VIX) or VIXY ETF"
                name="mockVix"
                value={plan.details.mockVix}
                onChange={handleChange}
                placeholder="15"
              />
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">
                  Start Date <span className="text-xs font-normal text-slate-500">(Months elapsed computed automatically)</span>
                </label>
                <input 
                  type="date"
                  name="startDate"
                  value={plan.details.startDate || ""}
                  onChange={handleChange}
                  className="p-2 border rounded-md"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end border-b pb-2">
                <h3 className="text-lg font-semibold text-gray-700">Current Asset Holdings</h3>
                <Button variant="outline" size="sm" onClick={addAsset} className="flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Asset
                </Button>
              </div>
              <p className="text-sm text-gray-500">Break out your current equity and cash. If you input assets here, they override the manual flat inputs below.</p>
              <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mt-2">
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Note on Options:</span> Any options positions you open based on recommendations (like Cash-Secured Puts) will typically resolve before your next monthly rebalance. Next month, simply update your new Cash and Equity balances (based on whether the option expired or assigned) and let the model guide your next move.
                </p>
              </div>
              
              {plan.details.assets && plan.details.assets.length > 0 && (
                <div className="space-y-3">
                  {plan.details.assets.map((asset) => (
                    <div key={asset.id} className="grid grid-cols-5 gap-3 items-end bg-white p-3 rounded shadow-sm border">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-600">Ticker</label>
                        <input type="text" value={asset.symbol} onChange={(e) => handleAssetChange(asset.id, 'symbol', e.target.value)} className="border p-2 rounded text-sm uppercase" placeholder="SPY" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-600">Type</label>
                        <select value={asset.type} onChange={(e) => handleAssetChange(asset.id, 'type', e.target.value)} className="border p-2 rounded text-sm bg-white">
                          <option value="equity">Equity</option>
                          <option value="cash">Cash</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-600">Price ($)</label>
                        <input type="number" value={asset.price} onChange={(e) => handleAssetChange(asset.id, 'price', Number(e.target.value))} className="border p-2 rounded text-sm" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-600">Quantity</label>
                        <input type="number" value={asset.shares} onChange={(e) => handleAssetChange(asset.id, 'shares', Number(e.target.value))} className="border p-2 rounded text-sm" />
                      </div>
                      <div className="flex items-center pb-1">
                        <Button variant="ghost" size="icon" onClick={() => removeAsset(asset.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(!plan.details.assets || plan.details.assets.length === 0) && (
                <div className="grid md:grid-cols-2 gap-4 mt-4 bg-gray-100 p-4 rounded-lg border-dashed border-2">
                  <FormField
                    label="Current Cash ($) - Flat Input"
                    name="currentCash"
                    value={plan.details.currentCash}
                    onChange={handleChange}
                    placeholder="50000"
                  />
                  <FormField
                    label="Current Equity ($) - Flat Input"
                    name="currentEquity"
                    value={plan.details.currentEquity}
                    onChange={handleChange}
                    placeholder="100000"
                  />
                </div>
              )}
            </div>

          </CardContent>
          <CardFooter className="bg-white border-t py-4">
            <div className="flex w-full items-center justify-between">
              <Button 
                onClick={updateCalculations} 
                variant={isDirty ? "default" : "secondary"}
                className={isDirty ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
              >
                {isDirty ? "Recalculate Model" : "Model Updated"}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : (plan.id === 'new' ? 'Save Plan' : 'Update Plan')}
              </Button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </CardFooter>
        </Card>
      </div>

      <div className="m-1">
        <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-none overflow-hidden relative">
          <div className={`absolute top-0 left-0 w-2 h-full ${results.investmentGap > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
          <CardHeader className="pl-6">
            <CardTitle className="text-xl font-bold text-gray-800">
              Risk Parity Triggers & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-6 space-y-6">
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Target Value ($V_t$) at {results.computedMonths} months</p>
                  <p className="text-3xl font-bold text-gray-800">${results.targetValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Actual Portfolio Value ($A_t$)</p>
                  <p className="text-3xl font-bold text-gray-800">${(results.computedCash + results.computedEquity).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p className="text-xs text-gray-400 mt-1">Cash: ${results.computedCash.toLocaleString()} | Equity: ${results.computedEquity.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Investment Gap</p>
                  <p className={`text-2xl font-bold ${results.investmentGap > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    ${Math.abs(results.investmentGap).toLocaleString(undefined, { maximumFractionDigits: 2 })} {results.investmentGap > 0 ? '(Underperforming)' : '(Overperforming)'}
                  </p>
                </div>
              </div>

              <div className={`p-6 rounded-xl border ${results.investmentGap > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-1 text-gray-500">Action Required</h3>
                <p className={`text-2xl font-bold mb-2 ${results.investmentGap > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                  {results.recommendation.action}
                </p>
                <div className="bg-white/60 px-4 py-2 rounded-lg mb-4">
                  <p className="font-mono text-sm font-semibold text-gray-800">Strategy: {results.recommendation.strategy}</p>
                </div>
                <p className="text-gray-700 text-sm">{results.recommendation.description}</p>
                
                {plan.details.mockVix > 25 && (
                  <div className="mt-4 p-3 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium flex items-center gap-2">
                    <span className="text-xl">⚠️</span> High Volatility Detected (VIX &gt; 25). Contribution scaled to ${results.adjustedContribution.toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Project Long-Term</h3>
              <p className="text-sm text-gray-500 mb-4">
                Ship this portfolio&apos;s current value and target return into a long-term projection plan.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto border-blue-200 hover:bg-blue-50 text-blue-700"
                  onClick={() => router.push(`/savings?balance=${results.computedCash + results.computedEquity}&returnRate=${plan.details.targetAnnualReturn}`)}
                >
                  Convert to Savings Plan
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto border-purple-200 hover:bg-purple-50 text-purple-700"
                  onClick={() => router.push(`/income?balance=${results.computedCash + results.computedEquity}&returnRate=${plan.details.targetAnnualReturn}`)}
                >
                  Convert to Income Plan
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </main>
  );
}
