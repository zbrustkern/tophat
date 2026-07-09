"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePlans } from '@/contexts/PlansContext';
import { RebalancePlan, Asset } from '@/types/chart';
import { usePortfolioLogic } from '@/hooks/usePortfolioLogic';
import { usePlanManagement } from '@/hooks/usePlanManagement';
import { Button } from "@/components/ui/button";
import { PlanSelector } from "@/components/PlanSelector";
import { FormField, PlanNameField } from "@/components/PlanFormElements";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2, Plus, RefreshCw, Camera, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from '@/lib/firebase/firestore';
import { HistoryTracker } from "./HistoryTracker";
import { LiveOptionsScanner } from "./LiveOptionsScanner";
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
  const { loading: saving, error, savePlan, takeSnapshot } = usePlanManagement<RebalancePlan>();
  const { toast } = useToast();
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);
  
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
  const [hydratedPlanId, setHydratedPlanId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshPrices = async () => {
    if (!plan.details.assets || plan.details.assets.length === 0) return;
    
    setIsRefreshing(true);
    setIsDirty(true);
    
    try {
      const functions = getFunctions();
      const fetchQuote = httpsCallable(functions, 'fetch_quote');
      
      const vixPromise = fetchQuote({ symbol: '^VIX' }).catch(e => {
        console.error('Failed to fetch VIX', e);
        return null;
      });

      const updatedAssets = await Promise.all(
        plan.details.assets.map(async (asset) => {
          if (asset.type !== 'equity' || !asset.symbol) return asset;
          
          try {
            const result = await fetchQuote({ symbol: asset.symbol });
            const data = result.data as { success: boolean; price?: number };
            
            if (data && data.success && typeof data.price === 'number') {
              return { ...asset, price: data.price };
            }
          } catch (e) {
            console.error(`Failed to fetch price for ${asset.symbol}`, e);
          }
          return asset;
        })
      );
      
      const vixResult = await vixPromise;
      const vixData = vixResult?.data as { success: boolean; price?: number } | undefined;
      const newVix = (vixData && vixData.success && typeof vixData.price === 'number') 
        ? vixData.price 
        : plan.details.mockVix;
      
      setPlan(prev => ({
        ...prev,
        details: { ...prev.details, assets: updatedAssets, mockVix: newVix }
      }));
    } finally {
      setIsRefreshing(false);
      toast({ title: "Prices Refreshed", description: "Live market prices & VIX have been applied." });
    }
  };

  useEffect(() => {
    if (planId && planId !== hydratedPlanId && plans.length > 0) {
      const existing = plans.find(p => p.id === planId);
      if (existing && existing.planType === 'rebalance') {
        setPlan(existing as RebalancePlan);
        setResults(calculateRebalanceData(existing as RebalancePlan));
        setHydratedPlanId(planId);
      }
    }
  }, [planId, plans, calculateRebalanceData, hydratedPlanId]);

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
      toast({ title: "Authentication Required", description: "Please sign in to save your plan.", variant: "destructive" });
      return;
    }
    try {
      const savedPlan = await savePlan(plan);
      setPlan(savedPlan);
      setIsDirty(false);
      toast({ title: "Plan Saved", description: "Your changes have been saved successfully." });
      if (plan.id === 'new') {
        router.push(`/tactical-allocation?plan=${savedPlan.id}`);
      }
    } catch (e) {
      console.error("Failed to save:", e);
      toast({ title: "Error", description: "Failed to save plan.", variant: "destructive" });
    }
  };

  const handleSnapshot = async () => {
    if (!plan.id || plan.id === 'new') {
      toast({ title: "Error", description: "You must save the plan before taking a snapshot.", variant: "destructive" });
      return;
    }
    setIsSnapshotting(true);
    try {
      if (takeSnapshot) {
        await takeSnapshot(plan.id);
        toast({ title: "Snapshot Saved", description: "Your portfolio history has been permanently recorded for today." });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to save snapshot.", variant: "destructive" });
    } finally {
      setIsSnapshotting(false);
    }
  };

  const handleBackfill = async () => {
    if (!user || !plan.id || plan.id === 'new') return;
    if (!plan.details.startDate) {
      toast({ title: "Start Date Required", description: "You must set a Start Date to backfill history.", variant: "destructive" });
      return;
    }

    const symbols = plan.details.assets?.filter(a => a.type === 'equity' && a.symbol).map(a => a.symbol) || [];
    if (symbols.length === 0) {
      toast({ title: "No Equities", description: "You need at least one equity asset with a ticker to backfill prices.", variant: "destructive" });
      return;
    }

    setIsBackfilling(true);
    try {
      const functions = getFunctions();
      const fetchHistoricalPrices = httpsCallable(functions, 'fetch_historical_prices');
      
      toast({ title: "Fetching Data...", description: "Downloading historical month-end prices from Yahoo Finance." });
      
      const res = await fetchHistoricalPrices({ symbols, startDate: plan.details.startDate });
      const data = res.data as { success: boolean, prices?: Record<string, Record<string, number>>, message?: string };
      
      if (!data.success || !data.prices) {
        throw new Error(data.message || "Failed to fetch prices");
      }

      let snapshotsCreated = 0;
      const { doc, setDoc } = await import('firebase/firestore');
      
      for (const [dateStr, priceMap] of Object.entries(data.prices)) {
        const backfillDetails = JSON.parse(JSON.stringify(plan.details));
        
        for (const asset of backfillDetails.assets) {
          if (asset.type === 'equity' && asset.symbol && priceMap[asset.symbol]) {
            asset.price = priceMap[asset.symbol];
          }
        }
        
        backfillDetails.mockVix = 15;
        
        const historyRef = doc(db!, `users/${user.uid}/plans/${plan.id}/history`, dateStr);
        await setDoc(historyRef, {
          timestamp: new Date(dateStr),
          planType: plan.planType,
          details: backfillDetails
        });
        snapshotsCreated++;
      }
      
      toast({ title: "Backfill Complete", description: `Successfully generated ${snapshotsCreated} historical snapshots.` });
      setTimeout(() => window.location.reload(), 1500);

    } catch (e) {
      console.error(e);
      toast({ title: "Backfill Failed", description: String(e), variant: "destructive" });
    } finally {
      setIsBackfilling(false);
    }
  };

  if (planId && planId !== 'new' && hydratedPlanId !== planId) {
    return (
      <main className="flex flex-col gap-6 animate-pulse">
        <div className="m-1">
          <Card className="bg-white shadow-sm border-none p-6">
            <div className="h-8 w-64 bg-slate-200 rounded mb-4"></div>
            <div className="h-4 w-96 bg-slate-200 rounded mb-8"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 bg-slate-100 rounded"></div>
              <div className="h-20 bg-slate-100 rounded"></div>
              <div className="h-20 bg-slate-100 rounded"></div>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6">
      <PlanSelector planType="rebalance" currentPlanId={planId || null} basePath="/tactical-allocation" />
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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={refreshPrices} disabled={isRefreshing} className="flex items-center gap-1 text-teal-600 border-teal-200 hover:bg-teal-50">
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Live Prices
                  </Button>
                  <Button variant="outline" size="sm" onClick={addAsset} className="flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Asset
                  </Button>
                </div>
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
                    <div key={asset.id} className="grid grid-cols-7 gap-3 items-end bg-white p-3 rounded shadow-sm border">
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
                      <div className="flex flex-col gap-1">
                        {asset.type === 'equity' && (
                          <>
                            <label className="text-xs font-semibold text-gray-600">Risk Tier</label>
                            <select 
                              value={asset.riskTier || 'core'} 
                              onChange={(e) => handleAssetChange(asset.id, 'riskTier', e.target.value)} 
                              className="border p-2 rounded text-sm bg-white"
                            >
                              <option value="core">Core</option>
                              <option value="growth">Growth</option>
                              <option value="speculative">Speculative</option>
                            </select>
                          </>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {asset.type === 'equity' && (
                          <>
                            <label className="text-xs font-semibold text-gray-600">Target % (Opt)</label>
                            <input 
                              type="number" 
                              value={asset.targetAllocation !== undefined && !isNaN(asset.targetAllocation) ? Math.round(asset.targetAllocation * 100) : ''} 
                              onChange={(e) => handleAssetChange(asset.id, 'targetAllocation', e.target.value ? Number(e.target.value) / 100 : NaN)} 
                              className="border p-2 rounded text-sm" 
                              placeholder="Auto"
                            />
                          </>
                        )}
                      </div>
                      <div className="flex items-center pb-1">
                        <Button variant="ghost" size="icon" onClick={() => removeAsset(asset.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {(() => {
                    const totalEquityAlloc = plan.details.assets.filter(a => a.type === 'equity').reduce((sum, a) => sum + (a.targetAllocation || 0), 0);
                    if (totalEquityAlloc > 0 && Math.abs(totalEquityAlloc - 1.0) > 0.01) {
                      return (
                        <div className="text-xs text-red-500 font-semibold mt-1">
                          Warning: Equity Target Allocations sum to {Math.round(totalEquityAlloc * 100)}% (should be 100%).
                        </div>
                      );
                    }
                    return null;
                  })()}
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
              <div className="flex gap-2">
                <div className="flex flex-col items-end">
                  <Button 
                    onClick={handleSnapshot} 
                    disabled={isSnapshotting || isDirty || plan.id === 'new'} 
                    variant="outline"
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
                  >
                    <Camera className={`w-4 h-4 ${isSnapshotting ? 'animate-pulse' : ''}`} />
                    {isSnapshotting ? "Saving..." : "Save Daily Snapshot"}
                  </Button>
                  <span className="text-[10px] text-gray-400 mt-1">Creates a chart data point</span>
                </div>
                <div className="flex flex-col items-end">
                  <Button 
                    onClick={handleBackfill} 
                    disabled={isBackfilling || isDirty || plan.id === 'new' || !plan.details.startDate} 
                    variant="outline"
                    title="Automatically assumes your current cash/shares were held at the historical date, using historical Yahoo Finance prices."
                    className="border-amber-200 text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                  >
                    <History className={`w-4 h-4 ${isBackfilling ? 'animate-spin' : ''}`} />
                    {isBackfilling ? "Fetching..." : "Backfill History"}
                  </Button>
                  <span className="text-[10px] text-gray-400 mt-1 cursor-help" title="Automatically assumes your current cash/shares were held at the historical date, using historical Yahoo Finance prices.">Auto-generates chart via Yahoo</span>
                </div>
                <div className="flex flex-col items-end">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : (plan.id === 'new' ? 'Save Plan' : 'Update Settings')}
                  </Button>
                  <span className="text-[10px] text-gray-400 mt-1">Saves settings & assets</span>
                </div>
              </div>
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
                  <p className="text-sm text-gray-500 font-medium">Total Portfolio Value</p>
                  <p className="text-3xl font-bold text-gray-800">${(results.computedCash + results.computedEquity).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p className="text-xs text-gray-400 mt-1">Cash: ${results.computedCash.toLocaleString()} | Equity: ${results.computedEquity.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Target Equity Alloc. (VIX-Adjusted)</p>
                  <p className="text-3xl font-bold text-gray-800">${(results.targetValue * (1 - results.targetCashPercentage)).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-lg text-gray-500">({(100 - results.targetCashPercentage * 100).toFixed(0)}%)</span></p>
                  <p className="text-xs text-gray-400 mt-1">Current Equity: ${results.computedEquity.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Equity Investment Gap</p>
                  <p className={`text-2xl font-bold ${results.investmentGap > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    ${Math.abs(results.investmentGap).toLocaleString(undefined, { maximumFractionDigits: 2 })} {results.investmentGap > 0 ? '(Underweight)' : '(Overweight)'}
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

            <LiveOptionsScanner 
              availableCash={results.computedCash} 
              priorityAsset={results.priorityAsset}
              priorityGap={results.priorityGap}
            />

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

      <HistoryTracker planId={plan.id} />
    </main>
  );
}
