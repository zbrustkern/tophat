"use client"

import React, { useState } from 'react';
import { useWizard } from './WizardProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Step6Goals() {
  const { state, addGoal, removeGoal, nextStep, prevStep } = useWizard();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'college' | 'house' | 'income_stream'>('house');
  const [target, setTarget] = useState('');
  const [timeline, setTimeline] = useState('');

  const handleAdd = () => {
    if (!name || !target) return;
    addGoal({
      name,
      type,
      targetAmount: parseInt(target),
      timelineYears: parseInt(timeline) || 10,
      linkedAssetIds: []
    });
    setName('');
    setTarget('');
    setTimeline('');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Future Goals</h2>
        <p className="text-indigo-200/80">What are you saving for? We&apos;ll create dedicated sub-plans for these.</p>
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-md shadow-xl overflow-hidden">
        <div className="p-6 space-y-6">
          
          <div className="space-y-4">
            {state.goals.length === 0 && (
              <div className="text-center p-8 border border-dashed border-white/20 rounded-xl text-white/50">
                No specific goals yet. Add one to see it integrated into your master plan.
              </div>
            )}
            {state.goals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between p-4 rounded-xl bg-white/10 border border-white/20">
                <div>
                  <div className="font-semibold text-white">{goal.name}</div>
                  <div className="text-sm text-white/60 capitalize">{goal.type.replace('_', ' ')}</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xl font-bold text-emerald-400">${goal.targetAmount?.toLocaleString()}</div>
                  <div className="text-xs text-white/40">in {goal.timelineYears} years</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeGoal(goal.id)} className="text-rose-400 hover:text-rose-300 hover:bg-white/5 ml-4">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 rounded-xl bg-black/20 border border-white/5">
            <div className="md:col-span-3 space-y-2">
              <Label className="text-indigo-100">Goal Name</Label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                placeholder="e.g. Dream Home"
              />
            </div>
            
            <div className="md:col-span-3 space-y-2">
              <Label className="text-indigo-100">Type</Label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="house">House Purchase</SelectItem>
                  <SelectItem value="college">College Fund</SelectItem>
                  <SelectItem value="income_stream">Target Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-indigo-100">Target Amt</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
                <Input 
                  type="number"
                  value={target} 
                  onChange={e => setTarget(e.target.value)}
                  className="pl-8 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-indigo-100">Years Away</Label>
              <Input 
                type="number"
                value={timeline} 
                onChange={e => setTimeline(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                placeholder="5"
              />
            </div>

            <div className="md:col-span-2">
              <Button onClick={handleAdd} className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/10" disabled={!target || !name}>
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
            Review & Generate <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
