"use client"

import React, { useState } from 'react';
import { useWizard } from './WizardProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function Step2Income() {
  const { state, addIncome, removeIncome, nextStep, prevStep } = useWizard();
  const [source, setSource] = useState('Primary Salary');
  const [amount, setAmount] = useState('');
  const [growth, setGrowth] = useState('3');

  const handleAdd = () => {
    if (!amount) return;
    addIncome({
      source,
      amount: parseInt(amount),
      expectedGrowth: parseFloat(growth) / 100
    });
    setSource('Secondary Income');
    setAmount('');
    setGrowth('2');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Income Sources</h2>
        <p className="text-indigo-200/80">Add your salaries, side hustles, and any other regular pre-tax income streams.</p>
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-md shadow-xl overflow-hidden">
        <div className="p-6 space-y-6">
          
          <div className="space-y-4">
            {state.incomes.map((inc) => (
              <div key={inc.id} className="flex items-center justify-between p-4 rounded-xl bg-white/10 border border-white/20">
                <div>
                  <div className="font-semibold text-white">{inc.source}</div>
                  <div className="text-sm text-white/60">Expected Growth: {Math.round(inc.expectedGrowth * 100)}%</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xl font-bold text-emerald-400">${inc.amount.toLocaleString()}</div>
                  <Button variant="ghost" size="icon" onClick={() => removeIncome(inc.id)} className="text-rose-400 hover:text-rose-300 hover:bg-white/5">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 rounded-xl bg-black/20 border border-white/5">
            <div className="md:col-span-4 space-y-2">
              <Label className="text-indigo-100">Source Name</Label>
              <Input 
                value={source} 
                onChange={e => setSource(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <div className="md:col-span-4 space-y-2">
              <Label className="text-indigo-100">Annual Gross Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
                <Input 
                  type="number"
                  value={amount} 
                  onChange={e => setAmount(e.target.value)}
                  className="pl-8 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  placeholder="100000"
                />
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-indigo-100">Annual Growth</Label>
              <div className="relative">
                <Input 
                  type="number"
                  value={growth} 
                  onChange={e => setGrowth(e.target.value)}
                  className="pr-8 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50">%</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleAdd} className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/10" disabled={!amount}>
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
          </div>

        </div>
        
        <div className="p-6 bg-black/40 border-t border-white/10 flex justify-between">
          <Button variant="ghost" onClick={prevStep} className="text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button 
            onClick={nextStep} 
            className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full px-8 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
            disabled={state.incomes.length === 0}
          >
            Continue to Assets <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
