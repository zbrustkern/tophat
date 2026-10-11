"use client"

import React, { useMemo, useState } from 'react';
import { useWizard } from './WizardProvider';
import { useWizardGenerator } from '@/hooks/useWizardGenerator';
import { useIncomeCalculations } from '@/hooks/usePlanCalculations';
import { IncomeChart } from '@/components/IncomeChart';
import { IncomePlan } from '@/types/chart';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, TrendingUp, DollarSign, Percent, Calendar, ShieldCheck, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function Step1Welcome() {
  const { state, updateState, nextStep } = useWizard();
  const { generateAndSave } = useWizardGenerator();
  const { calculateIncomeData } = useIncomeCalculations();
  const router = useRouter();
  const [isLaunching, setIsLaunching] = useState(false);

  // Live 25-year projection calculation based on core inputs
  const previewPlan = useMemo<IncomePlan>(() => {
    return {
      id: 'preview',
      planName: 'Primary Income',
      planType: 'income',
      lastUpdated: new Date(),
      details: {
        income: state.primaryIncome || 100000,
        raiseRate: state.raiseRate ?? 0.03,
        saveRate: state.savingsRate ?? 0.15,
        balance: state.startingBalance ?? 25000,
        taxRate: 0.24,
        returnRate: 0.07,
        useGlobalSettings: false,
        taxType: 'preTax',
        autoEscalateSavings: state.autoEscalate,
        escalationRate: 0.01,
        withdrawalRate: 0.04
      }
    };
  }, [
    state.primaryIncome,
    state.raiseRate,
    state.savingsRate,
    state.startingBalance,
    state.autoEscalate
  ]);

  const chartData = useMemo(() => {
    return calculateIncomeData(previewPlan);
  }, [calculateIncomeData, previewPlan]);

  // Projected metrics at year 25
  const finalMetric = chartData[chartData.length - 1];
  const finalBalance = finalMetric ? finalMetric.balance : 0;
  const finalPassiveIncome = finalMetric ? finalMetric.conservativeIncome : 0;

  const handleLaunchDashboard = async () => {
    setIsLaunching(true);
    try {
      await generateAndSave();
      router.push('/dashboard');
    } catch (err) {
      console.error('Launch failed, routing to processing step:', err);
      updateState({ currentStep: 7 });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-deco-gold/10 border border-deco-gold/30 text-deco-gold text-xs font-display uppercase tracking-widest">
          <Sparkles className="h-3.5 w-3.5" /> 30-Second Fast-Track Setup
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-semibold uppercase tracking-widest text-deco-gold">
          Tophat Wealth Engine
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto font-light">
          Input your core financials to immediately preview your 25-year compounding wealth and passive income trajectory.
        </p>
      </div>

      <Card className="bg-card/70 border-deco-gold/30 backdrop-blur-md shadow-2xl rounded-sm">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Core 3 Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Household Income */}
            <div className="space-y-1.5 p-3 rounded-sm bg-slate-950/60 border border-white/10">
              <Label className="text-[11px] uppercase font-display tracking-widest text-muted-foreground flex items-center justify-between">
                <span>Annual Household Income</span>
                <DollarSign className="h-3.5 w-3.5 text-deco-gold" />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  value={state.primaryIncome || ''}
                  onChange={e => updateState({ primaryIncome: parseInt(e.target.value) || 0 })}
                  className="pl-7 bg-slate-900 border-white/20 text-white placeholder:text-slate-500 h-11 text-base font-sans focus:border-deco-gold"
                  placeholder="100,000"
                />
              </div>
            </div>

            {/* Current Invested Balance */}
            <div className="space-y-1.5 p-3 rounded-sm bg-slate-950/60 border border-white/10">
              <Label className="text-[11px] uppercase font-display tracking-widest text-muted-foreground flex items-center justify-between">
                <span>Current Invested Balance</span>
                <TrendingUp className="h-3.5 w-3.5 text-deco-gold" />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  value={state.startingBalance || ''}
                  onChange={e => updateState({ startingBalance: parseInt(e.target.value) || 0 })}
                  className="pl-7 bg-slate-900 border-white/20 text-white placeholder:text-slate-500 h-11 text-base font-sans focus:border-deco-gold"
                  placeholder="25,000"
                />
              </div>
            </div>

            {/* Savings Rate */}
            <div className="space-y-1.5 p-3 rounded-sm bg-slate-950/60 border border-white/10">
              <Label className="text-[11px] uppercase font-display tracking-widest text-muted-foreground flex items-center justify-between">
                <span>Savings Rate (%)</span>
                <Percent className="h-3.5 w-3.5 text-deco-gold" />
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={Math.round(state.savingsRate * 100) || ''}
                  onChange={e => updateState({ savingsRate: (parseFloat(e.target.value) || 0) / 100 })}
                  className="pr-7 bg-slate-900 border-white/20 text-white placeholder:text-slate-500 h-11 text-base font-sans focus:border-deco-gold"
                  placeholder="15"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>
          </div>

          {/* Age & Auto-Escalate Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 items-center">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase font-display tracking-widest text-muted-foreground">Current Age</Label>
              <Input
                type="number"
                value={state.age || ''}
                onChange={e => updateState({ age: parseInt(e.target.value) || 0 })}
                className="bg-slate-900 border-white/20 text-white h-10 text-sm focus:border-deco-gold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase font-display tracking-widest text-muted-foreground">Retirement Age</Label>
              <Input
                type="number"
                value={state.retirementAge || ''}
                onChange={e => updateState({ retirementAge: parseInt(e.target.value) || 0 })}
                className="bg-slate-900 border-white/20 text-white h-10 text-sm focus:border-deco-gold"
              />
            </div>

            {/* Save Your Raise Toggle */}
            <div className="sm:pt-5">
              <button
                type="button"
                onClick={() => updateState({ autoEscalate: !state.autoEscalate })}
                className={`w-full flex items-center justify-between p-2.5 rounded-sm border transition-all text-left ${
                  state.autoEscalate
                    ? 'bg-deco-gold/15 border-deco-gold/40 text-foreground'
                    : 'bg-slate-950/40 border-white/10 text-muted-foreground hover:border-white/20'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold flex items-center gap-1.5 text-deco-gold">
                    <Sparkles className="h-3.5 w-3.5" /> Save Your Raise
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {state.autoEscalate ? '+1%/yr savings auto-boost ON' : 'Auto-escalation paused'}
                  </div>
                </div>
                <div className={`h-5 w-5 rounded-sm flex items-center justify-center border transition-colors ${
                  state.autoEscalate
                    ? 'bg-deco-gold border-deco-gold text-slate-950'
                    : 'border-white/30 bg-transparent'
                }`}>
                  {state.autoEscalate && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
              </button>
            </div>
          </div>

          {/* Live Interactive Chart Preview */}
          <div className="pt-2 border-t border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-deco-gold flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" /> 25-Year Trajectory Preview
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Interactive real-time model (7% annual returns, 3% raises)
                </span>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div className="p-2 rounded-sm bg-slate-950/80 border border-white/10">
                  <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">Year 25 Balance</span>
                  <span className="text-sm font-bold text-deco-gold font-sans">
                    ${Math.round(finalBalance).toLocaleString()}
                  </span>
                </div>
                <div className="p-2 rounded-sm bg-slate-950/80 border border-white/10">
                  <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">Passive Income (4%)</span>
                  <span className="text-sm font-bold text-sky-400 font-sans">
                    ${Math.round(finalPassiveIncome).toLocaleString()}/yr
                  </span>
                </div>
              </div>
            </div>

            <div className="h-[260px] w-full bg-slate-950/50 p-2 sm:p-4 rounded-sm border border-white/10">
              <IncomeChart chartData={chartData} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={nextStep}
              className="w-full sm:w-auto border-white/20 hover:border-deco-gold/50 text-muted-foreground hover:text-white font-display uppercase tracking-wider text-xs px-6 py-6"
            >
              Customize With Modular Power-Ups →
            </Button>

            <Button
              type="button"
              onClick={handleLaunchDashboard}
              disabled={isLaunching}
              size="lg"
              className="w-full sm:w-auto bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest font-semibold px-8 py-6 text-xs rounded-sm shadow-xl shadow-deco-gold/20"
            >
              {isLaunching ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Generating Master Plan...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Launch Master Dashboard <ArrowRight className="h-4 w-4 ml-1" />
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
