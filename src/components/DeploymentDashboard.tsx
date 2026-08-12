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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const linkedGoal = plans.find(p => {
    if (p.planType === 'savings' || p.planType === 'college' || p.planType === 'house') {
      return (p as any).details.linkedPortfolioId === plan.id;
    }
    return false;
  });

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
        <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/20 shadow-2xl rounded-sm">
          <CardHeader className="space-y-1 pb-4 border-b border-white/10">
            <CardTitle className="text-2xl font-display font-semibold uppercase tracking-widest text-deco-gold">
              Tactical Allocation Dashboard
            </CardTitle>
            <CardDescription className="text-muted-foreground font-light text-xs">
              Manage transitions from cash to equity using dynamic value-averaged risk parity.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <PlanNameField value={plan.planName} onChange={handleChange} />
            
            {linkedGoal && (
              <div className="mb-6 p-4 bg-slate-900/90 border border-deco-gold/40 rounded-sm text-deco-gold shadow-sm">
                <h4 className="font-display uppercase tracking-widest text-xs font-semibold flex items-center gap-2">
                  <span className="text-sm">🔗</span> Linked to Goal: {linkedGoal.planName}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground font-sans">
                  This portfolio is linked to your <strong className="text-white">{linkedGoal.planName}</strong> goal planner. 
                  Only input your current cash and asset holdings here. Target amounts and required contributions are managed automatically by your goal planner.
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-3">
                <h3 className="text-xs font-display uppercase tracking-widest text-muted-foreground mb-2 border-b border-white/10 pb-2">Global Parameters</h3>
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
                <label className="text-xs font-display uppercase tracking-widest text-muted-foreground">
                  Start Date <span className="text-[10px] font-normal text-muted-foreground">(Months elapsed computed automatically)</span>
                </label>
                <input 
                  type="date"
                  name="startDate"
                  value={plan.details.startDate || ""}
                  onChange={handleChange}
                  className="p-2 border border-white/20 rounded-sm bg-slate-950 text-white font-sans text-xs focus:border-deco-gold"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 border-t border-white/10 pt-4">
              <div className="col-span-1 md:col-span-3">
                <h3 className="text-xs font-display uppercase tracking-widest text-muted-foreground mb-2 border-b border-white/10 pb-2">Account Configuration</h3>
              </div>

              <FormField
                label="Institution (e.g. Schwab, Fidelity)"
                name="institution"
                value={plan.details.institution || ''}
                onChange={handleChange}
                placeholder="Institution Name"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-display uppercase tracking-widest text-muted-foreground">Tax Type</label>
                <Select value={plan.details.taxType || 'taxable'} onValueChange={(val) => handleSelectChange('taxType', val)}>
                  <SelectTrigger className="bg-slate-950 border-white/20 text-white text-xs">
                    <SelectValue placeholder="Select Tax Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/20 text-white">
                    <SelectItem value="taxable">Taxable Brokerage</SelectItem>
                    <SelectItem value="preTax">Pre-Tax (Traditional 401k/IRA)</SelectItem>
                    <SelectItem value="postTax">Post-Tax (Roth 401k/IRA)</SelectItem>
                    <SelectItem value="crypto">Crypto / Alternative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-display uppercase tracking-widest text-muted-foreground">Portfolio Purpose</label>
                <Select value={plan.details.portfolioPurpose || 'Core Wealth'} onValueChange={(val) => handleSelectChange('portfolioPurpose', val)}>
                  <SelectTrigger className="bg-slate-950 border-white/20 text-white text-xs">
                    <SelectValue placeholder="Select Purpose" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/20 text-white">
                    <SelectItem value="Core Wealth">Core Wealth (Retirement)</SelectItem>
                    <SelectItem value="Play Money">Play Money (Speculative)</SelectItem>
                    <SelectItem value="Cash Reserve">Cash Reserve (Liquidity)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <h3 className="text-xs font-display uppercase tracking-widest text-muted-foreground">Current Asset Holdings</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={refreshPrices} disabled={isRefreshing} className="flex items-center gap-1 text-xs border-deco-gold/40 text-deco-gold hover:bg-deco-gold/10 font-display uppercase tracking-wider">
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Live Prices
                  </Button>
                  <Button variant="outline" size="sm" onClick={addAsset} className="flex items-center gap-1 text-xs border-white/20 text-white hover:bg-white/10 font-display uppercase tracking-wider">
                    <Plus className="w-3.5 h-3.5" /> Add Asset
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Break out your current equity and cash. If you input assets here, they override the manual flat inputs below.</p>
              <div className="bg-slate-900/80 border border-white/10 rounded-sm p-3 mt-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-deco-gold">Note on Options:</span> Any options positions you open based on recommendations (like Cash-Secured Puts) will typically resolve before your next monthly rebalance. Next month, simply update your new Cash and Equity balances (based on whether the option expired or assigned) and let the model guide your next move.
                </p>
              </div>
              
              {plan.details.assets && plan.details.assets.length > 0 && (
                <div className="space-y-3">
                  {plan.details.assets.map((asset) => (
                    <div key={asset.id} className="grid grid-cols-7 gap-3 items-end bg-slate-900/90 p-3 rounded-sm border border-white/10 text-white">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Ticker</label>
                        <input type="text" value={asset.symbol} onChange={(e) => handleAssetChange(asset.id, 'symbol', e.target.value)} className="border border-white/20 p-2 rounded-sm text-xs bg-slate-950 text-white uppercase focus:border-deco-gold" placeholder="SPY" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Type</label>
                        <select value={asset.type} onChange={(e) => handleAssetChange(asset.id, 'type', e.target.value)} className="border border-white/20 p-2 rounded-sm text-xs bg-slate-950 text-white focus:border-deco-gold">
                          <option value="equity">Equity</option>
                          <option value="cash">Cash</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Price ($)</label>
                        <input type="number" value={asset.price} onChange={(e) => handleAssetChange(asset.id, 'price', Number(e.target.value))} className="border border-white/20 p-2 rounded-sm text-xs bg-slate-950 text-white focus:border-deco-gold" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Quantity</label>
                        <input type="number" value={asset.shares} onChange={(e) => handleAssetChange(asset.id, 'shares', Number(e.target.value))} className="border border-white/20 p-2 rounded-sm text-xs bg-slate-950 text-white focus:border-deco-gold" />
                      </div>
                      <div className="flex flex-col gap-1">
                        {asset.type === 'equity' && (
                          <>
                            <label className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Risk Tier</label>
                            <select 
                              value={asset.riskTier || 'core'} 
                              onChange={(e) => handleAssetChange(asset.id, 'riskTier', e.target.value)} 
                              className="border border-white/20 p-2 rounded-sm text-xs bg-slate-950 text-white focus:border-deco-gold"
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
                            <label className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Target % (Opt)</label>
                            <input 
                              type="number" 
                              value={asset.targetAllocation !== undefined && !isNaN(asset.targetAllocation) ? Math.round(asset.targetAllocation * 100) : ''} 
                              onChange={(e) => handleAssetChange(asset.id, 'targetAllocation', e.target.value ? Number(e.target.value) / 100 : NaN)} 
                              className="border border-white/20 p-2 rounded-sm text-xs bg-slate-950 text-white focus:border-deco-gold" 
                              placeholder="Auto"
                            />
                          </>
                        )}
                      </div>
                      <div className="flex items-center pb-1">
                        <Button variant="ghost" size="icon" onClick={() => removeAsset(asset.id)} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
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
          <CardFooter className="bg-slate-950/80 border-t border-white/10 py-4">
            <div className="flex w-full items-center justify-between">
              <Button 
                onClick={updateCalculations} 
                className={isDirty 
                  ? "bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest text-xs font-semibold" 
                  : "bg-slate-800 text-slate-300 font-display uppercase tracking-widest text-xs"
                }
              >
                {isDirty ? "Recalculate Model" : "Model Updated"}
              </Button>
              <div className="flex gap-2">
                <div className="flex flex-col items-end">
                  <Button 
                    onClick={handleSnapshot} 
                    disabled={isSnapshotting || isDirty || plan.id === 'new'} 
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 font-display uppercase tracking-wider text-xs flex items-center gap-2"
                  >
                    <Camera className={`w-3.5 h-3.5 ${isSnapshotting ? 'animate-pulse text-deco-gold' : ''}`} />
                    {isSnapshotting ? "Saving..." : "Save Daily Snapshot"}
                  </Button>
                </div>
                <div className="flex flex-col items-end">
                  <Button 
                    onClick={handleBackfill} 
                    disabled={isBackfilling || isDirty || plan.id === 'new' || !plan.details.startDate} 
                    variant="outline"
                    className="border-deco-gold/40 text-deco-gold hover:bg-deco-gold/10 font-display uppercase tracking-wider text-xs flex items-center gap-2"
                  >
                    <History className={`w-3.5 h-3.5 ${isBackfilling ? 'animate-spin' : ''}`} />
                    {isBackfilling ? "Fetching..." : "Backfill History"}
                  </Button>
                </div>
                <div className="flex flex-col items-end">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest text-xs font-semibold"
                  >
                    {saving ? "Saving..." : (plan.id === 'new' ? 'Save Plan' : 'Update Settings')}
                  </Button>
                </div>
              </div>
            </div>
            {error && <p className="text-rose-400 text-xs mt-2">{error}</p>}
          </CardFooter>
        </Card>
      </div>

      <div className="m-1">
        <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/20 shadow-2xl rounded-sm overflow-hidden relative">
          <div className={`absolute top-0 left-0 w-2 h-full ${results.investmentGap > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
          <CardHeader className="pl-6 border-b border-white/10">
            <CardTitle className="text-xl font-display font-semibold uppercase tracking-widest text-deco-gold">
              Risk Parity Triggers & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-6 space-y-6">
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Portfolio Value</p>
                  <p className="text-3xl font-bold text-white font-mono">${(results.computedCash + results.computedEquity).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-foreground mt-1">Cash: ${results.computedCash.toLocaleString()} | Equity: ${results.computedEquity.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">Target Equity Alloc. (VIX-Adjusted)</p>
                  <p className="text-3xl font-bold text-white font-mono">${(results.targetValue * (1 - results.targetCashPercentage)).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm text-deco-gold">({(100 - results.targetCashPercentage * 100).toFixed(0)}%)</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Current Equity: ${results.computedEquity.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">Equity Investment Gap</p>
                  <p className={`text-2xl font-bold font-mono ${results.investmentGap > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ${Math.abs(results.investmentGap).toLocaleString(undefined, { maximumFractionDigits: 2 })} {results.investmentGap > 0 ? '(Underweight)' : '(Overweight)'}
                  </p>
                </div>
              </div>

              <div className={`p-6 rounded-sm border ${results.investmentGap > 0 ? 'bg-rose-950/40 border-rose-500/30' : 'bg-emerald-950/40 border-emerald-500/30'}`}>
                <h3 className="text-xs font-display uppercase tracking-widest text-muted-foreground mb-1">Action Required</h3>
                <p className={`text-2xl font-display font-semibold uppercase tracking-wider mb-2 ${results.investmentGap > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                  {results.recommendation.action}
                </p>
                <div className="bg-slate-900/90 border border-white/10 px-4 py-2 rounded-sm mb-4">
                  <p className="font-mono text-xs font-semibold text-deco-gold">Strategy: {results.recommendation.strategy}</p>
                </div>
                <p className="text-white/90 text-xs font-sans">{results.recommendation.description}</p>
                
                {plan.details.mockVix > 25 && (
                  <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-sm text-xs font-medium flex items-center gap-2">
                    <span className="text-sm">⚠️</span> High Volatility Detected (VIX &gt; 25). Contribution scaled to ${results.adjustedContribution.toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <LiveOptionsScanner 
              availableCash={results.computedCash} 
              priorityAsset={results.priorityAsset}
              priorityGap={results.priorityGap}
            />

            <div className="border-t border-white/10 pt-6 mt-6">
              <h3 className="text-xs font-display uppercase tracking-widest text-deco-gold mb-2">Project Long-Term</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Ship this portfolio&apos;s current value and target return into a long-term projection plan.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto border-deco-gold/40 text-deco-gold hover:bg-deco-gold/10 text-xs font-display uppercase tracking-wider"
                  onClick={() => router.push(`/savings?balance=${results.computedCash + results.computedEquity}&returnRate=${plan.details.targetAnnualReturn}`)}
                >
                  Convert to Savings Plan
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 text-xs font-display uppercase tracking-wider"
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
