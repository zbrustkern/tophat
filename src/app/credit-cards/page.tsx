"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCardOptimization } from '@/hooks/useCardOptimization';
import { MonthlySpend, Valuations, CreditCard, SpendCategory, CARD_DATABASE, AIRLINE_TIERS } from '@/types/optimization';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function CreditCardsPage() {
  const { user } = useAuth();
  const [targetAirline, setTargetAirline] = useState<'united' | 'american'>('united');
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // Base State
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
    urValue: 0.015, // Realistic 1.5c
    mrValue: 0.013, // Realistic 1.3c
    statusTiers: {
      united: { silver: 0, gold: 1000, platinum: 2500, '1K': 5000 },
      american: { gold: 500, platinum: 1500, pro: 3000, execPro: 6000 }
    }
  });

  const [customCards, setCustomCards] = useState<CreditCard[]>([]);
  const ALL_CARDS = useMemo(() => [...CARD_DATABASE, ...customCards], [customCards]);

  // Wallet State
  const [currentWalletIds, setCurrentWalletIds] = useState<Record<SpendCategory, string>>({
    groceries: 'amex-bcp',
    gas: 'amex-bcp',
    dining: 'chase-sapphire-reserve',
    travel: 'chase-sapphire-reserve',
    other: 'citi-double-cash'
  });

  // Target State
  const [targetCardId, setTargetCardId] = useState<string>('united-club-infinite');
  const [targetTierReq, setTargetTierReq] = useState<number>(8000); // Default to United Gold

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
    setNewCard({ ...newCard, name: 'New Card ' + (customCards.length + 1) });
  };

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        if (!db) return;
        const docSnap = await getDoc(doc(db, 'wallets', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.spend) setSpend(data.spend);
          if (data.valuations) setValuations(data.valuations);
          if (data.currentWalletIds) setCurrentWalletIds(data.currentWalletIds);
          if (data.customCards) setCustomCards(data.customCards);
          if (data.targetCardId) setTargetCardId(data.targetCardId);
          if (data.targetTierReq) setTargetTierReq(data.targetTierReq);
          if (data.targetAirline) setTargetAirline(data.targetAirline);
          if (data.organicStatus) setOrganicStatus(data.organicStatus);
        }
      } catch (e) {
        console.error("Failed to load wallet profile:", e);
      } finally {
        setHasLoaded(true);
      }
    }
    loadProfile();
  }, [user]);

  const saveProfile = async () => {
    if (!user || !db) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'wallets', user.uid), {
        spend,
        valuations,
        currentWalletIds,
        customCards,
        targetCardId,
        targetTierReq,
        targetAirline,
        organicStatus
      });
    } catch (e) {
      console.error("Failed to save wallet profile:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const results = useCardOptimization(
    spend, 
    valuations, 
    organicStatus, 
    targetAirline, 
    targetTierReq,
    currentWalletIds, 
    targetCardId, 
    customCards
  );

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8 mt-16 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Airline Status Opportunity Cost Engine</h1>
          <p className="text-slate-500 mt-2 text-lg">Define your wallet. Evaluate a new card. See the true cost of hitting status.</p>
        </div>
        {user && (
          <Button onClick={saveProfile} disabled={isSaving || !hasLoaded} className="bg-slate-900 text-white shrink-0">
            {isSaving ? "Saving..." : "Save Profile to Account"}
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* INPUTS COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-t-4 border-t-indigo-500">
            <CardHeader className="pb-2">
              <CardTitle>1. My Baseline Wallet</CardTitle>
              <p className="text-xs text-slate-500">Assign your current cards to your spending categories.</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {(['groceries', 'gas', 'dining', 'travel', 'other'] as const).map((cat) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="capitalize text-sm font-semibold">{cat} Spend</Label>
                    <span className="text-xs text-slate-400">${spend[cat]}/mo</span>
                  </div>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={currentWalletIds[cat]}
                    onChange={e => setCurrentWalletIds({...currentWalletIds, [cat]: e.target.value})}
                  >
                    {ALL_CARDS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              ))}
              <div className="pt-4 border-t space-y-2 mt-4">
                <p className="text-sm font-medium">Edit Monthly Spend ($):</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['groceries', 'gas', 'dining', 'travel', 'other'] as const).map(cat => (
                    <div key={`edit-${cat}`} className="flex items-center gap-2">
                       <span className="text-xs w-16 capitalize">{cat}</span>
                       <Input type="number" className="h-8" value={spend[cat]} onChange={e => setSpend({...spend, [cat]: Number(e.target.value)})} />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-purple-500">
            <CardHeader className="pb-2">
              <CardTitle>2. The Goal</CardTitle>
              <p className="text-xs text-slate-500">What airline status are you trying to hit?</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Target Airline</Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={targetAirline}
                  onChange={e => {
                    setTargetAirline(e.target.value as any);
                    setTargetTierReq(AIRLINE_TIERS[e.target.value as 'united' | 'american'][0].req);
                  }}
                >
                  <option value="united">United Airlines (PQP)</option>
                  <option value="american">American Airlines (LP)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Target Tier</Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={targetTierReq}
                  onChange={e => setTargetTierReq(Number(e.target.value))}
                >
                  {AIRLINE_TIERS[targetAirline].map(t => (
                    <option key={t.name} value={t.req}>{t.name} ({t.req.toLocaleString()} {targetAirline === 'united' ? 'PQP' : 'LP'})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Organic Flight Spend (Annual {targetAirline === 'united' ? 'PQP' : 'LP'})</Label>
                <Input 
                  type="number" 
                  value={targetAirline === 'united' ? organicStatus.united : organicStatus.american} 
                  onChange={e => setOrganicStatus({
                    ...organicStatus, 
                    [targetAirline]: Number(e.target.value)
                  })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle>3. The New Card</CardTitle>
              <p className="text-xs text-slate-500">Which card are you evaluating to hit this status?</p>
            </CardHeader>
            <CardContent className="pt-4">
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={targetCardId}
                onChange={e => setTargetCardId(e.target.value)}
              >
                {ALL_CARDS.filter(c => c.statusRules.airline === targetAirline).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Realistic Valuations</CardTitle>
              <p className="text-xs text-slate-500">Adjust the value of points (in dollars). Set to realistic redemption values.</p>
            </CardHeader>
            <CardContent className="space-y-2 pt-2 text-sm">
              <div className="flex items-center justify-between">
                <Label>Airline Mile</Label>
                <Input type="number" step="0.001" className="h-8 w-24" value={valuations.mileValue} onChange={e => setValuations({...valuations, mileValue: Number(e.target.value)})} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Chase UR</Label>
                <Input type="number" step="0.001" className="h-8 w-24" value={valuations.urValue} onChange={e => setValuations({...valuations, urValue: Number(e.target.value)})} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Amex MR</Label>
                <Input type="number" step="0.001" className="h-8 w-24" value={valuations.mrValue} onChange={e => setValuations({...valuations, mrValue: Number(e.target.value)})} />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* OUTPUTS COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-2 bg-slate-50 border-b">
                <CardTitle className="text-lg">Baseline Wallet Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-3xl font-bold text-slate-800">{formatCurrency(results.baselineYield)}</p>
                <p className="text-sm text-slate-500 mb-4">Annual Rewards Value</p>
                <div className="text-sm space-y-1">
                  <p><strong>Baseline Tier:</strong> <span className="text-slate-700">{results.baselineTier || 'None'}</span></p>
                  <p><strong>Total Points:</strong> {results.baselinePoints.toLocaleString()}</p>
                  <p><strong>Total Fees:</strong> {formatCurrency(results.baselineFees)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 bg-slate-50 border-b">
                <CardTitle className="text-lg">New Wallet Simulation</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-3xl font-bold text-slate-800">{formatCurrency(results.newYield)}</p>
                <p className="text-sm text-slate-500 mb-4">New Rewards Value</p>
                <div className="text-sm space-y-1">
                  <p><strong>New Tier:</strong> <span className="text-purple-600 font-bold">{results.newTier || 'None'}</span></p>
                  <p><strong>Total Points:</strong> {results.newPoints.toLocaleString()}</p>
                  <p><strong>Total Fees:</strong> {formatCurrency(results.newFees)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-50 border-none shadow-sm">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">The Verdict</h3>
              
              {results.newPoints < targetTierReq ? (
                <div className="text-amber-700">
                  <p className="text-lg font-medium">You cannot hit the target tier.</p>
                  <p className="mt-2">Even if you shift 100% of your current spending to the {ALL_CARDS.find(c => c.id === targetCardId)?.name}, you will only reach {results.newPoints.toLocaleString()} points (short of the {targetTierReq.toLocaleString()} requirement).</p>
                  <p className="mt-2">You need more organic flight spend or higher overall monthly spend to reach this tier.</p>
                </div>
              ) : results.baselinePoints >= targetTierReq ? (
                 <div className="text-emerald-700">
                  <p className="text-lg font-medium">You are already hitting the target tier!</p>
                  <p className="mt-2">Your baseline wallet and organic flying is already enough to secure the {results.baselineTier} tier. You do not need to integrate a new card or shift any spend.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg text-slate-700 leading-relaxed">
                    To hit the target tier, it will cost you a net total of <strong className="text-red-600 text-xl">{formatCurrency(results.opportunityCost)}</strong> in lost rewards and additional annual fees.
                  </p>
                  <div className="bg-white p-4 rounded border mt-4">
                    <h4 className="font-semibold text-sm mb-3 text-slate-500 uppercase tracking-wider">Recommended Spend Shift (The Greedy Algorithm)</h4>
                    <p className="text-sm text-slate-600 mb-4">We mathematically sorted your spending categories to find the cheapest places to pull spend from, protecting your high-earning categories as much as possible.</p>
                    {results.shifts.length > 0 ? (
                      <ul className="space-y-2">
                        {results.shifts.map((s, i) => (
                          <li key={i} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
                            <span className="capitalize font-medium text-slate-800">Move {s.category} Spend</span>
                            <span className="text-slate-600">{formatCurrency(s.amountShifted)} / year</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm italic text-slate-500">Holding the new card&apos;s bonus points alone pushed you over the edge!</p>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-4 italic">
                    Are the intrinsic perks of the {results.newTier} tier worth spending {formatCurrency(results.opportunityCost)} to you? If yes, get the card. If no, stick to your baseline wallet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
