"use client"

import React, { useState } from 'react';
import { useWizard } from './WizardProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Plus, Trash2, Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Step4Debts() {
  const { state, addDebt, removeDebt, nextStep, prevStep, updateState } = useWizard();
  
  const [name, setName] = useState('');
  const [type, setType] = useState('Credit Card');
  const [balance, setBalance] = useState('');
  const [rate, setRate] = useState('');
  const [payment, setPayment] = useState('');

  const handleAdd = () => {
    if (!balance || !name || !payment) return;
    addDebt({
      name,
      type,
      balance: parseInt(balance),
      rate: parseFloat(rate) / 100 || 0,
      payment: parseInt(payment)
    });
    setName('');
    setBalance('');
    setRate('');
    setPayment('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-w-3xl mx-auto">
      {/* Header and Value Gate Badge */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-deco-gold/10 border border-deco-gold/30 text-deco-gold text-xs font-display uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" /> Value Gate: Factor liabilities into net worth and optimize payoff velocity.
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
        <h2 className="text-3xl sm:text-4xl font-display font-semibold uppercase tracking-widest text-deco-gold">Liabilities & Debts</h2>
        <p className="text-sm text-muted-foreground">Include mortgages, student loans, or credit cards to see your true net worth.</p>
      </div>

      <Card className="bg-card/70 border-deco-gold/30 backdrop-blur-md shadow-xl overflow-hidden rounded-sm">
        <div className="p-6 space-y-6">
          
          <div className="space-y-3">
            {state.debts.length === 0 && (
              <div className="text-center p-6 border border-dashed border-white/20 rounded-sm text-xs text-muted-foreground">
                No debts added. You can skip ahead or add loans below.
              </div>
            )}
            {state.debts.map((debt) => (
              <div key={debt.id} className="flex items-center justify-between p-4 rounded-sm bg-white/5 border border-white/10">
                <div>
                  <div className="font-semibold text-white font-display uppercase tracking-wider text-sm">{debt.name}</div>
                  <div className="text-xs text-muted-foreground">{debt.type} • {Math.round(debt.rate * 100)}% APY</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <div className="text-xl font-bold text-rose-400">-${debt.balance.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">${debt.payment}/mo</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeDebt(debt.id)} className="text-rose-400 hover:text-rose-300 hover:bg-white/5">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 rounded-sm bg-slate-900 border border-white/10">
            <div className="md:col-span-3 space-y-1.5">
              <Label className="text-[11px] uppercase font-display tracking-widest text-muted-foreground">Debt Name</Label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="bg-slate-950 border-white/20 text-white placeholder:text-slate-500 text-sm"
                placeholder="e.g. Chase Sapphire"
              />
            </div>
            
            <div className="md:col-span-3 space-y-1.5">
              <Label className="text-[11px] uppercase font-display tracking-widest text-muted-foreground">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-slate-950 border-white/20 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/20 text-white">
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Student Loan">Student Loan</SelectItem>
                  <SelectItem value="Auto Loan">Auto Loan</SelectItem>
                  <SelectItem value="Personal Loan">Personal Loan</SelectItem>
                  <SelectItem value="Mortgage">Mortgage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-[11px] uppercase font-display tracking-widest text-muted-foreground">Balance</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input 
                  type="number"
                  value={balance} 
                  onChange={e => setBalance(e.target.value)}
                  className="pl-7 bg-slate-950 border-white/20 text-white placeholder:text-slate-500 text-sm"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-[11px] uppercase font-display tracking-widest text-muted-foreground">Monthly Pymt</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input 
                  type="number"
                  value={payment} 
                  onChange={e => setPayment(e.target.value)}
                  className="pl-7 bg-slate-950 border-white/20 text-white placeholder:text-slate-500 text-sm"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Button onClick={handleAdd} className="w-full bg-deco-gold/20 hover:bg-deco-gold/30 text-deco-gold border border-deco-gold/40 text-xs font-display uppercase tracking-wider" disabled={!balance || !name || !payment}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
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
              Continue to Budget <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
