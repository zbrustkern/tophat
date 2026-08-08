"use client"

import React, { useState } from 'react';
import { useWizard, WizardAsset } from './WizardProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Step3Assets() {
  const { state, addAsset, removeAsset, nextStep, prevStep } = useWizard();
  
  const [name, setName] = useState('Fidelity 401k');
  const [type, setType] = useState('401k');
  const [balance, setBalance] = useState('');
  const [purpose, setPurpose] = useState<'Core' | 'Play Money' | 'Cash Reserve'>('Core');

  const handleAdd = () => {
    if (!balance || !name) return;
    addAsset({
      name,
      type,
      balance: parseInt(balance),
      purpose
    });
    setName('');
    setBalance('');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Current Assets</h2>
        <p className="text-indigo-200/80">List your existing bank and investment accounts.</p>
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-md shadow-xl overflow-hidden">
        <div className="p-6 space-y-6">
          
          <div className="space-y-4">
            {state.assets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between p-4 rounded-xl bg-white/10 border border-white/20">
                <div>
                  <div className="font-semibold text-white">{asset.name} <span className="text-xs text-white/50 ml-2 px-2 py-0.5 rounded bg-black/30 uppercase tracking-wider">{asset.purpose}</span></div>
                  <div className="text-sm text-white/60">{asset.type}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xl font-bold text-sky-400">${asset.balance.toLocaleString()}</div>
                  <Button variant="ghost" size="icon" onClick={() => removeAsset(asset.id)} className="text-rose-400 hover:text-rose-300 hover:bg-white/5">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 rounded-xl bg-black/20 border border-white/5">
            <div className="md:col-span-3 space-y-2">
              <Label className="text-indigo-100">Account Name</Label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            
            <div className="md:col-span-3 space-y-2">
              <Label className="text-indigo-100">Account Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
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

            <div className="md:col-span-2 space-y-2">
              <Label className="text-indigo-100">Purpose</Label>
              <Select value={purpose} onValueChange={(v: any) => setPurpose(v)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="Core">Core</SelectItem>
                  <SelectItem value="Play Money">Play Money</SelectItem>
                  <SelectItem value="Cash Reserve">Cash Reserve</SelectItem>
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
                  className="pl-8 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Button onClick={handleAdd} className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/10" disabled={!balance || !name}>
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
            Continue to Debts <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
