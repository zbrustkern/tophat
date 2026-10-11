"use client"

import React, { useState } from 'react';
import { useWizard, WizardHolding } from './WizardProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Plus, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';

export default function Step3Assets() {
  const { state, addAsset, removeAsset, nextStep, prevStep, updateState } = useWizard();
  
  const [name, setName] = useState('Fidelity 401k');
  const [type, setType] = useState('401k');
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  
  // Holding form
  const [holdings, setHoldings] = useState<WizardHolding[]>([]);
  const [hTicker, setHTicker] = useState('VOO');
  const [hShares, setHShares] = useState('');
  const [hPrice, setHPrice] = useState('');
  const [hRisk, setHRisk] = useState<'core' | 'growth' | 'speculative' | 'cash'>('core');

  const handleAddHolding = () => {
    if (!hTicker || !hShares || !hPrice) return;
    setHoldings([...holdings, {
      id: uuidv4(),
      ticker: hTicker,
      shares: parseFloat(hShares),
      price: parseFloat(hPrice),
      riskTier: hRisk
    }]);
    setHTicker('');
    setHShares('');
    setHPrice('');
  };

  const handleRemoveHolding = (id: string) => {
    setHoldings(holdings.filter(h => h.id !== id));
  };

  const handleAddAccount = () => {
    if (!name || (!isPlaceholder && holdings.length === 0)) return;
    addAsset({
      name,
      type,
      isPlaceholder,
      holdings: isPlaceholder ? [] : [...holdings]
    });
    setName('');
    setIsPlaceholder(false);
    setHoldings([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-w-3xl mx-auto">
      {/* Header and Value Gate Badge */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-deco-gold/10 border border-deco-gold/30 text-deco-gold text-xs font-display uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" /> Value Gate: Link physical accounts and model ticker-level risk tiers.
        </div>
        <Button
          variant="ghost"
          onClick={() => updateState({ currentStep: 7 })}
          className="text-xs text-deco-gold hover:text-deco-brass uppercase font-display tracking-wider"
        >
          Skip to Dashboard →
        </Button>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-3xl sm:text-4xl font-display font-semibold uppercase tracking-widest text-deco-gold">Current Assets</h2>
        <p className="text-sm text-muted-foreground">List your existing bank and investment accounts and their holdings.</p>
      </div>

      <Card className="bg-card/70 border-deco-gold/30 backdrop-blur-md shadow-xl overflow-hidden rounded-sm">
        <div className="p-6 space-y-6">
          
          <div className="space-y-4">
            {state.assets.map((asset) => {
              const totalBalance = asset.holdings.reduce((sum, h) => sum + (h.shares * h.price), 0);
              return (
                <div key={asset.id} className="flex flex-col p-4 rounded-xl bg-white/10 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">
                        {asset.name} 
                        {asset.isPlaceholder && <span className="text-xs text-white/50 ml-2 px-2 py-0.5 rounded bg-black/30 uppercase tracking-wider">Setup Later</span>}
                      </div>
                      <div className="text-sm text-white/60">{asset.type}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-bold text-sky-400">
                        {asset.isPlaceholder ? 'TBD' : `$${totalBalance.toLocaleString()}`}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeAsset(asset.id)} className="text-rose-400 hover:text-rose-300 hover:bg-white/5">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  
                  {asset.holdings.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                      {asset.holdings.map(h => (
                        <div key={h.id} className="flex justify-between text-sm text-white/80">
                          <span>{h.ticker} ({h.shares} shs)</span>
                          <span className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 uppercase">{h.riskTier}</span>
                            <span>${(h.shares * h.price).toLocaleString()}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-6 rounded-xl bg-black/20 border border-white/5 space-y-6">
            <h3 className="text-lg font-semibold text-white">Add New Account</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-indigo-100">Account Name</Label>
                <Input 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                  placeholder="e.g. Fidelity IRA"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-indigo-100">Account Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="Checking">Checking</SelectItem>
                    <SelectItem value="Savings">Savings</SelectItem>
                    <SelectItem value="401k">401(k)</SelectItem>
                    <SelectItem value="IRA">IRA / Roth IRA</SelectItem>
                    <SelectItem value="Brokerage">Taxable Brokerage</SelectItem>
                    <SelectItem value="HSA">HSA</SelectItem>
                    <SelectItem value="Crypto">Crypto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="placeholder"
                checked={isPlaceholder}
                onChange={e => setIsPlaceholder(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-indigo-500 w-4 h-4"
              />
              <Label htmlFor="placeholder" className="text-indigo-200 cursor-pointer">I will set up the holdings and balance later</Label>
            </div>

            {!isPlaceholder && (
              <div className="pt-4 border-t border-white/10 space-y-4">
                <h4 className="text-sm font-medium text-white/70">Holdings inside this account</h4>
                
                {holdings.length > 0 && (
                  <div className="space-y-2">
                    {holdings.map(h => (
                      <div key={h.id} className="flex justify-between items-center bg-white/5 p-2 rounded px-4">
                        <div className="text-sm text-white">{h.ticker} - {h.shares} shares @ ${h.price}</div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-white/50 uppercase">{h.riskTier}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveHolding(h.id)} className="h-6 w-6 p-0 text-rose-400 hover:text-rose-300">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                  <div className="col-span-2 md:col-span-1 space-y-1">
                    <Label className="text-xs text-white/50">Ticker/Name</Label>
                    <Input value={hTicker} onChange={e => setHTicker(e.target.value)} placeholder="VOO" className="h-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-white/50">Shares</Label>
                    <Input type="number" value={hShares} onChange={e => setHShares(e.target.value)} placeholder="100" className="h-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-white/50">Price ($)</Label>
                    <Input type="number" value={hPrice} onChange={e => setHPrice(e.target.value)} placeholder="450" className="h-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 text-sm" />
                  </div>
                  <div className="col-span-2 md:col-span-1 space-y-1">
                    <Label className="text-xs text-white/50">Risk Tier</Label>
                    <Select value={hRisk} onValueChange={(v: any) => setHRisk(v)}>
                      <SelectTrigger className="h-9 bg-slate-800 border-slate-700 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="core">Core</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="speculative">Speculative</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <Button onClick={handleAddHolding} disabled={!hTicker || !hShares || !hPrice} size="sm" className="w-full h-9 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleAddAccount} className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/10" disabled={!name || (!isPlaceholder && holdings.length === 0)}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Save Account
            </Button>
          </div>

        </div>
        
        <div className="p-6 bg-black/40 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={prevStep} className="text-white hover:bg-white/10 font-display uppercase tracking-wider text-xs">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => updateState({ currentStep: 7 })}
              className="border-white/20 hover:border-deco-gold/50 text-muted-foreground hover:text-white font-display uppercase tracking-wider text-xs"
            >
              Skip to Dashboard
            </Button>
            <Button 
              onClick={nextStep} 
              className="bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest text-xs font-semibold px-8 py-6 rounded-sm shadow-lg shadow-deco-gold/20"
            >
              Continue to Debts <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
