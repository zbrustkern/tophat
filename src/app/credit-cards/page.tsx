"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCardOptimization } from '@/hooks/useCardOptimization';
import { MonthlySpend, Valuations, CreditCard } from '@/types/optimization';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CreditCardsPage() {
  const [targetAirline, setTargetAirline] = useState<'united' | 'american'>('united');
  
  const [spend, setSpend] = useState<MonthlySpend>({
    groceries: 800,
    gas: 200,
    dining: 500,
    travel: 1000,
    other: 2000
  });

  const [organicStatus, setOrganicStatus] = useState({ united: 3000, american: 0 });

  const [valuations, setValuations] = useState<Valuations>({
    mileValue: 0.012, // 1.2 cents
    urValue: 0.015,
    mrValue: 0.015,
    statusTiers: {
      united: { silver: 0, gold: 1000, platinum: 2500, '1K': 5000 },
      american: { gold: 500, platinum: 1500, pro: 3000, execPro: 6000 }
    }
  });

  const [customCards, setCustomCards] = useState<CreditCard[]>([]);
  const [newCard, setNewCard] = useState<Partial<CreditCard>>({
    name: 'My Custom Card',
    annualFee: 0,
    currency: 'CashBack',
    multipliers: { groceries: 1, gas: 1, dining: 1, travel: 1, other: 1 },
    statusRules: { type: 'NONE' }
  });

  const handleAddCustomCard = () => {
    if (!newCard.name) return;
    const card: CreditCard = {
      id: `custom-${Date.now()}`,
      name: newCard.name,
      annualFee: newCard.annualFee || 0,
      currency: newCard.currency as any || 'CashBack',
      multipliers: newCard.multipliers as any,
      statusRules: newCard.statusRules as any
    };
    setCustomCards([...customCards, card]);
    // Reset basic state
    setNewCard({
      ...newCard,
      name: 'New Card ' + (customCards.length + 1)
    });
  };

  const { maxValueRes, maxStatusRes, opportunityCost } = useCardOptimization(spend, valuations, organicStatus, targetAirline, customCards);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const chartData = [
    {
      name: 'Maximize Value Strategy',
      'Net Yield ($)': Math.round(maxValueRes.netYield),
      'Rewards Value ($)': Math.round(maxValueRes.annualCashValue),
      'Status Value ($)': Math.round(maxValueRes.statusValue),
      'Annual Fees ($)': Math.round(maxValueRes.annualFees),
    },
    {
      name: `Maximize ${targetAirline === 'united' ? 'United' : 'AA'} Status Strategy`,
      'Net Yield ($)': Math.round(maxStatusRes.netYield),
      'Rewards Value ($)': Math.round(maxStatusRes.annualCashValue),
      'Status Value ($)': Math.round(maxStatusRes.statusValue),
      'Annual Fees ($)': Math.round(maxStatusRes.annualFees),
    }
  ];

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8 mt-16 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Credit Card Portfolio Optimizer</h1>
        <p className="text-slate-500 mt-2 text-lg">Calculate the opportunity cost of chasing airline status on your credit cards.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* INPUTS COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spend Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(Object.keys(spend) as Array<keyof MonthlySpend>).map((cat) => (
                <div key={cat} className="space-y-2">
                  <Label className="capitalize">{cat}</Label>
                  <Input 
                    type="number" 
                    value={spend[cat]} 
                    onChange={e => setSpend({...spend, [cat]: Number(e.target.value)})}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organic Status Earned</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>United PQP (From Flying)</Label>
                <Input 
                  type="number" 
                  value={organicStatus.united} 
                  onChange={e => setOrganicStatus({...organicStatus, united: Number(e.target.value)})}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Currency Valuations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Value of 1 Airline Mile ($)</Label>
                <Input 
                  type="number" step="0.001"
                  value={valuations.mileValue} 
                  onChange={e => setValuations({...valuations, mileValue: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Value of 1 Chase UR Point ($)</Label>
                <Input 
                  type="number" step="0.001"
                  value={valuations.urValue} 
                  onChange={e => setValuations({...valuations, urValue: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Value of 1 Amex MR Point ($)</Label>
                <Input 
                  type="number" step="0.001"
                  value={valuations.mrValue} 
                  onChange={e => setValuations({...valuations, mrValue: Number(e.target.value)})}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Tier Valuations</CardTitle>
              <p className="text-xs text-slate-500">How much is this status intrinsically worth to you in dollars?</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {targetAirline === 'united' ? (
                <>
                  {Object.entries(valuations.statusTiers.united).map(([tier, val]) => (
                    <div key={tier} className="space-y-2">
                      <Label className="capitalize">United {tier} ($)</Label>
                      <Input 
                        type="number" 
                        value={val} 
                        onChange={e => setValuations({
                          ...valuations, 
                          statusTiers: {
                            ...valuations.statusTiers,
                            united: { ...valuations.statusTiers.united, [tier]: Number(e.target.value) }
                          }
                        })}
                      />
                    </div>
                  ))}
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-500">
            <CardHeader>
              <CardTitle>Custom Card Builder</CardTitle>
              <p className="text-xs text-slate-500">Add a custom card to test against the database.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Card Name</Label>
                <Input 
                  value={newCard.name} 
                  onChange={e => setNewCard({...newCard, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Annual Fee</Label>
                  <Input 
                    type="number"
                    value={newCard.annualFee} 
                    onChange={e => setNewCard({...newCard, annualFee: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newCard.currency}
                    onChange={e => setNewCard({...newCard, currency: e.target.value as any})}
                  >
                    <option value="CashBack">Cash Back (%)</option>
                    <option value="UR">Chase UR (x)</option>
                    <option value="MR">Amex MR (x)</option>
                    <option value="United Miles">United Miles (x)</option>
                    <option value="AA Miles">AA Miles (x)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <Label className="font-semibold block mb-2">Multipliers</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(['groceries', 'gas', 'dining', 'travel', 'other'] as const).map(cat => (
                    <div key={cat} className="flex items-center space-x-2">
                      <span className="w-16 capitalize">{cat}:</span>
                      <Input 
                        type="number" step="0.1" className="h-8 w-16"
                        value={newCard.multipliers?.[cat]} 
                        onChange={e => setNewCard({
                          ...newCard, 
                          multipliers: { ...newCard.multipliers!, [cat]: Number(e.target.value) }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <Button onClick={handleAddCustomCard} className="w-full mt-4 bg-amber-600 hover:bg-amber-700">Add Card to Optimizer</Button>
            </CardContent>
          </Card>
        </div>

        {/* OUTPUTS COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-t-4 border-t-blue-500 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Maximize Value Strategy</CardTitle>
                <p className="text-sm text-slate-500">Use the best card for every category.</p>
              </CardHeader>
              <CardContent>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-slate-800">{formatCurrency(maxValueRes.netYield)}</p>
                  <p className="text-sm text-slate-500">Annual Net Yield</p>
                </div>
                <div className="mt-6 space-y-2 text-sm">
                  <p><strong>Groceries:</strong> {maxValueRes.portfolio.groceries.name}</p>
                  <p><strong>Gas:</strong> {maxValueRes.portfolio.gas.name}</p>
                  <p><strong>Dining:</strong> {maxValueRes.portfolio.dining.name}</p>
                  <p><strong>Travel:</strong> {maxValueRes.portfolio.travel.name}</p>
                  <p><strong>Other:</strong> {maxValueRes.portfolio.other.name}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-purple-500 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Maximize Status Strategy</CardTitle>
                <p className="text-sm text-slate-500">Funnel all spend onto the {targetAirline} card.</p>
              </CardHeader>
              <CardContent>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-slate-800">{formatCurrency(maxStatusRes.netYield)}</p>
                  <p className="text-sm text-slate-500">Annual Net Yield</p>
                </div>
                <div className="mt-6 space-y-2 text-sm">
                  <p><strong>Status Reached:</strong> <span className="font-bold text-purple-600">{maxStatusRes.statusTierAchieved || 'None'}</span></p>
                  <p><strong>Total PQP:</strong> {maxStatusRes.statusPointsEarned}</p>
                  <p><strong>Card Used:</strong> {maxStatusRes.portfolio.other.name}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-50 border-none shadow-sm">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">The Verdict</h3>
              {opportunityCost > 0 ? (
                <p className="text-lg text-slate-600 leading-relaxed">
                  Chasing <strong>{maxStatusRes.statusTierAchieved || 'status'}</strong> on your credit card has an opportunity cost of <strong className="text-red-600 text-xl">{formatCurrency(opportunityCost)}</strong>. 
                  You are mathematically sacrificing {formatCurrency(opportunityCost)} in lost rewards and fees to acquire {maxStatusRes.statusTierAchieved || 'status'}. 
                  Unless you value {maxStatusRes.statusTierAchieved || 'that tier'} more than {formatCurrency(opportunityCost + maxStatusRes.statusValue)}, you should stick to the Maximize Value Strategy.
                </p>
              ) : (
                <p className="text-lg text-emerald-700 leading-relaxed">
                  <strong>The Status strategy wins!</strong> Even accounting for lost cash back opportunities, the subjective value you placed on earning {maxStatusRes.statusTierAchieved} status outweighs the lost rewards by {formatCurrency(Math.abs(opportunityCost))}.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Strategy Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => `$${val/1000}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="Rewards Value ($)" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="Status Value ($)" stackId="a" fill="#a855f7" />
                    <Bar dataKey="Annual Fees ($)" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
