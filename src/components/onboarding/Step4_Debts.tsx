"use client"

import React, { useState } from 'react';
import { useWizard } from './WizardProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Step4Debts() {
  const { state, addDebt, removeDebt, nextStep, prevStep } = useWizard();
  
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
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Liabilities & Debts</h2>
        <p className="text-indigo-200/80">Include mortgages, student loans, or credit cards to see your true net worth.</p>
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-md shadow-xl overflow-hidden">
        <div className="p-6 space-y-6">
          
          <div className="space-y-4">
            {state.debts.length === 0 && (
              <div className="text-center p-8 border border-dashed border-white/20 rounded-xl text-white/50">
                No debts added. You must be doing great!
              </div>
            )}
            {state.debts.map((debt) => (
              <div key={debt.id} className="flex items-center justify-between p-4 rounded-xl bg-white/10 border border-white/20">
                <div>
                  <div className="font-semibold text-white">{debt.name}</div>
                  <div className="text-sm text-white/60">{debt.type} • {Math.round(debt.rate * 100)}% APY</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xl font-bold text-rose-400">-${debt.balance.toLocaleString()}</div>
                  <div className="text-xs text-white/40">${debt.payment}/mo</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeDebt(debt.id)} className="text-rose-400 hover:text-rose-300 hover:bg-white/5 ml-4">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 rounded-xl bg-black/20 border border-white/5">
            <div className="md:col-span-3 space-y-2">
              <Label className="text-indigo-100">Debt Name</Label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                placeholder="e.g. Chase Sapphire"
              />
            </div>
            
            <div className="md:col-span-3 space-y-2">
              <Label className="text-indigo-100">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Student Loan">Student Loan</SelectItem>
                  <SelectItem value="Auto Loan">Auto Loan</SelectItem>
                  <SelectItem value="Personal Loan">Personal Loan</SelectItem>
                  <SelectItem value="Mortgage">Mortgage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-indigo-100">Balance</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
                <Input 
                  type="number"
                  value={balance} 
                  onChange={e => setBalance(e.target.value)}
                  className="pl-8 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-indigo-100">Monthly Pymt</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
                <Input 
                  type="number"
                  value={payment} 
                  onChange={e => setPayment(e.target.value)}
                  className="pl-8 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Button onClick={handleAdd} className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/10" disabled={!balance || !name || !payment}>
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
          >
            Continue to Budget <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
