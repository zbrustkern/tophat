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
        <h1 className="text-4xl sm:text-5xl font-display font-semibold uppercase tracking-widest text-deco-gold">
          Welcome to Tophat
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto font-light">
          Let&apos;s build your holistic financial plan. We&apos;ll ask a few questions about your income, assets, debts, and goals to generate a complete projection of your future wealth.
        </p>
      </div>

      <Card className="bg-card/60 border-deco-gold/30 backdrop-blur-md shadow-2xl rounded-sm">
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-display tracking-widest text-muted-foreground">Current Age</Label>
              <Input 
                type="number" 
                value={state.age || ''} 
                onChange={e => updateState({ age: parseInt(e.target.value) || 0 })}
                className="bg-slate-900 border-white/20 text-white placeholder:text-slate-500 h-12 text-base font-sans focus:border-deco-gold focus:ring-1 focus:ring-deco-gold"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase font-display tracking-widest text-muted-foreground">Retirement Age</Label>
              <Input 
                type="number" 
                value={state.retirementAge || ''} 
                onChange={e => updateState({ retirementAge: parseInt(e.target.value) || 0 })}
                className="bg-slate-900 border-white/20 text-white placeholder:text-slate-500 h-12 text-base font-sans focus:border-deco-gold focus:ring-1 focus:ring-deco-gold"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs uppercase font-display tracking-widest text-muted-foreground">Investment Risk Tolerance</Label>
              <Select 
                value={state.riskTolerance} 
                onValueChange={(val: any) => updateState({ riskTolerance: val })}
              >
                <SelectTrigger className="bg-slate-900 border-white/20 text-white h-12 text-base font-sans focus:border-deco-gold">
                  <SelectValue placeholder="Select risk tolerance" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/20 text-white">
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
              className="bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest font-semibold px-8 py-6 text-sm rounded-sm shadow-lg shadow-deco-gold/20"
            >
              Let&apos;s Go <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
