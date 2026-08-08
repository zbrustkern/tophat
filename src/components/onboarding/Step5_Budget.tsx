"use client"

import React from 'react';
import { useWizard } from './WizardProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function Step5Budget() {
  const { state, updateState, nextStep, prevStep } = useWizard();

  const handleUpdate = (field: keyof typeof state.budget, value: string) => {
    updateState({
      budget: { ...state.budget, [field]: parseInt(value) || 0 }
    });
  };

  const total = state.budget.housing + state.budget.living + state.budget.discretionary;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Monthly Budget</h2>
        <p className="text-indigo-200/80">Give us a rough estimate of your monthly spending. You can refine this line-by-line later.</p>
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-md shadow-xl overflow-hidden">
        <div className="p-6 md:p-10 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              </div>
              <Label className="text-indigo-100 text-center block text-lg">Housing & Utilities</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-xl">$</span>
                <Input 
                  type="number"
                  value={state.budget.housing || ''} 
                  onChange={e => handleUpdate('housing', e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-14 text-xl text-center"
                  placeholder="2500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              </div>
              <Label className="text-indigo-100 text-center block text-lg">Living (Food, Auto)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-xl">$</span>
                <Input 
                  type="number"
                  value={state.budget.living || ''} 
                  onChange={e => handleUpdate('living', e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-14 text-xl text-center"
                  placeholder="1500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <Label className="text-indigo-100 text-center block text-lg">Discretionary (Fun)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-xl">$</span>
                <Input 
                  type="number"
                  value={state.budget.discretionary || ''} 
                  onChange={e => handleUpdate('discretionary', e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-14 text-xl text-center"
                  placeholder="800"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-8 text-center border-t border-white/10">
            <div className="text-sm text-indigo-200 uppercase tracking-wider mb-2 font-semibold">Total Monthly Spend</div>
            <div className="text-5xl font-bold text-white">${total.toLocaleString()}</div>
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
            Continue to Goals <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
