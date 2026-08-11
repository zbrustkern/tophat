"use client"

import React from 'react';
import { useWizard } from './WizardProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function Step5Budget() {
  const { state, updateState, nextStep, prevStep } = useWizard();

  const handleUpdate = (field: keyof typeof state.budget, value: string) => {
    updateState({
      budget: { ...state.budget, [field]: parseInt(value) || 0 }
    });
  };

  const baseHousing = state.debts.filter(d => d.type === 'Mortgage').reduce((sum, d) => sum + d.payment, 0);
  const baseAuto = state.debts.filter(d => d.type === 'Auto Loan').reduce((sum, d) => sum + d.payment, 0);

  const total = 
    baseHousing + state.budget.housing + 
    state.budget.utilities + 
    baseAuto + state.budget.auto + 
    state.budget.food + 
    state.budget.insurance + 
    state.budget.kids + 
    state.budget.discretionary;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-display font-semibold uppercase tracking-widest text-deco-gold">Monthly Budget</h2>
        <p className="text-base text-muted-foreground max-w-xl mx-auto font-light">
          Give us a rough estimate of your monthly spending across these categories. Mortgage and auto loan payments have been pre-filled from your debts.
        </p>
      </div>

      <Card className="bg-card/60 border-deco-gold/30 backdrop-blur-md shadow-xl overflow-hidden rounded-sm">
        <div className="p-6 md:p-10 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="space-y-4">
              <Label className="text-muted-foreground text-center block text-xs font-display uppercase tracking-widest">Housing (Extra)</Label>
              {baseHousing > 0 && <div className="text-center text-xs text-deco-gold font-semibold">Base Mortgage: ${baseHousing}/mo</div>}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
                <Input 
                  type="number"
                  value={state.budget.housing || ''} 
                  onChange={e => handleUpdate('housing', e.target.value)}
                  className="pl-10 bg-slate-900 border-white/20 text-white placeholder:text-slate-500 h-14 text-lg text-center font-sans focus:border-deco-gold"
                  placeholder="HOA, Maintenance"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-muted-foreground text-center block text-xs font-display uppercase tracking-widest">Utilities</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
                <Input 
                  type="number"
                  value={state.budget.utilities || ''} 
                  onChange={e => handleUpdate('utilities', e.target.value)}
                  className="pl-10 bg-slate-900 border-white/20 text-white placeholder:text-slate-500 h-14 text-lg text-center font-sans focus:border-deco-gold"
                  placeholder="Electric, Water, Internet"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-muted-foreground text-center block text-xs font-display uppercase tracking-widest">Auto (Extra)</Label>
              {baseAuto > 0 && <div className="text-center text-xs text-deco-gold font-semibold">Base Loan: ${baseAuto}/mo</div>}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
                <Input 
                  type="number"
                  value={state.budget.auto || ''} 
                  onChange={e => handleUpdate('auto', e.target.value)}
                  className="pl-10 bg-slate-900 border-white/20 text-white placeholder:text-slate-500 h-14 text-lg text-center font-sans focus:border-deco-gold"
                  placeholder="Gas, Tolls, Maint"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-muted-foreground text-center block text-xs font-display uppercase tracking-widest">Food & Dining</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
                <Input 
                  type="number"
                  value={state.budget.food || ''} 
                  onChange={e => handleUpdate('food', e.target.value)}
                  className="pl-10 bg-slate-900 border-white/20 text-white placeholder:text-slate-500 h-14 text-lg text-center font-sans focus:border-deco-gold"
                  placeholder="Groceries, Restaurants"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-muted-foreground text-center block text-xs font-display uppercase tracking-widest">Insurance & Healthcare</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
                <Input 
                  type="number"
                  value={state.budget.insurance || ''} 
                  onChange={e => handleUpdate('insurance', e.target.value)}
                  className="pl-10 bg-slate-900 border-white/20 text-white placeholder:text-slate-500 h-14 text-lg text-center font-sans focus:border-deco-gold"
                  placeholder="Health, Life, Home"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-muted-foreground text-center block text-xs font-display uppercase tracking-widest">Kids & Pets (Other)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
                <Input 
                  type="number"
                  value={state.budget.kids || ''} 
                  onChange={e => handleUpdate('kids', e.target.value)}
                  className="pl-10 bg-slate-900 border-white/20 text-white placeholder:text-slate-500 h-14 text-lg text-center font-sans focus:border-deco-gold"
                  placeholder="Daycare, Vet, Supplies"
                />
              </div>
            </div>

            <div className="space-y-4 lg:col-span-3 max-w-sm mx-auto w-full">
              <Label className="text-muted-foreground text-center block text-xs font-display uppercase tracking-widest">Discretionary (Fun)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
                <Input 
                  type="number"
                  value={state.budget.discretionary || ''} 
                  onChange={e => handleUpdate('discretionary', e.target.value)}
                  className="pl-10 bg-slate-900 border-white/20 text-white placeholder:text-slate-500 h-14 text-lg text-center font-sans focus:border-deco-gold"
                  placeholder="Shopping, Travel, Hobbies"
                />
              </div>
            </div>

          </div>
          
          <div className="pt-8 text-center border-t border-white/10">
            <div className="text-xs text-muted-foreground uppercase font-display tracking-widest mb-2 font-semibold">Total Monthly Spend</div>
            <div className="text-5xl font-bold text-deco-gold">${total.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="p-6 bg-black/40 border-t border-white/10 flex justify-between">
          <Button variant="ghost" onClick={prevStep} className="text-white hover:bg-white/10 font-display uppercase tracking-wider text-xs">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button 
            onClick={nextStep} 
            className="bg-deco-gold hover:bg-deco-brass text-slate-950 rounded-sm font-display uppercase tracking-widest text-xs font-semibold px-8 py-6 shadow-lg shadow-deco-gold/20"
          >
            Continue to Goals <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
