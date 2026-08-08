"use client"

import React from 'react';
import { useWizard } from './WizardProvider';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export default function Step1Welcome() {
  const { state, updateState, nextStep } = useWizard();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
          Welcome to TopHat
        </h1>
        <p className="text-lg text-indigo-200/80 max-w-xl mx-auto">
          Let&apos;s build your holistic financial plan. We&apos;ll ask a few questions about your income, assets, debts, and goals to generate a complete projection of your future wealth.
        </p>
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-md shadow-2xl">
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-indigo-100">Current Age</Label>
              <Input 
                type="number" 
                value={state.age || ''} 
                onChange={e => updateState({ age: parseInt(e.target.value) || 0 })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-indigo-100">Retirement Age</Label>
              <Input 
                type="number" 
                value={state.retirementAge || ''} 
                onChange={e => updateState({ retirementAge: parseInt(e.target.value) || 0 })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 text-lg"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-indigo-100">Investment Risk Tolerance</Label>
              <Select 
                value={state.riskTolerance} 
                onValueChange={(val: any) => updateState({ riskTolerance: val })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-12 text-lg">
                  <SelectValue placeholder="Select risk tolerance" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="conservative">Conservative (Focus on preservation, lower return)</SelectItem>
                  <SelectItem value="moderate">Moderate (Balanced growth and stability)</SelectItem>
                  <SelectItem value="aggressive">Aggressive (Focus on maximum growth, higher volatility)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <Button 
              onClick={nextStep} 
              size="lg" 
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 text-lg rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)]"
            >
              Let&apos;s Go <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
