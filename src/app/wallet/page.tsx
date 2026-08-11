"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useWalletCalculations } from '@/hooks/useWalletCalculations';
import { MonthlySpend, Valuations, CreditCard, SpendCategory, CARD_DATABASE } from '@/types/optimization';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function WalletPage() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // Base State
  const [spend, setSpend] = useState<MonthlySpend>({
    groceries: 800,
    gas: 200,
    dining: 500,
    travel: 1000,
    wholesale: 400,
    other: 2000
  });

  const [valuations, setValuations] = useState<Valuations>({
    mileValue: 0.012, 
    urValue: 0.015, 
    mrValue: 0.013, 
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
    wholesale: 'citi-costco-visa',
    other: 'citi-double-cash'
  });

  const [newCard, setNewCard] = useState<Partial<CreditCard>>({
    name: 'My Custom Card',
    annualFee: 0,
    currency: 'CashBack',
    multipliers: { groceries: 1, gas: 1, dining: 1, travel: 1, wholesale: 1, other: 1 },
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
      // Use merge: true so we don't overwrite Airline Status data that might be saved here
      await setDoc(doc(db, 'wallets', user.uid), {
        spend,
        valuations,
        currentWalletIds,
        customCards,
      }, { merge: true });
    } catch (e) {
      console.error("Failed to save wallet profile:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const { calculateWallet } = useWalletCalculations(
    spend, 
    valuations, 
    currentWalletIds, 
    customCards
  );

  const results = calculateWallet();

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8 mt-16 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Wallet</h1>
          <p className="text-slate-500 mt-2 text-lg">Optimize your everyday spend across your credit cards.</p>
        </div>
        {user && (
          <Button onClick={saveProfile} disabled={isSaving || !hasLoaded} className="bg-slate-900 text-white shrink-0">
            {isSaving ? "Saving..." : "Save Wallet Profile"}
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* INPUTS COLUMN */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-t-4 border-t-indigo-500">
            <CardHeader className="pb-2">
              <CardTitle>1. Monthly Spend</CardTitle>
              <p className="text-xs text-slate-500">What do you spend in a typical month?</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                {(['groceries', 'gas', 'dining', 'travel', 'wholesale', 'other'] as const).map(cat => (
                  <div key={`edit-${cat}`} className="flex items-center gap-2">
                      <Label className="w-20 capitalize">{cat}</Label>
                      <Input type="number" className="h-8" value={spend[cat] || 0} onChange={e => setSpend({...spend, [cat]: Number(e.target.value)})} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-green-500">
            <CardHeader className="pb-2">
              <CardTitle>2. My Cards</CardTitle>
              <p className="text-xs text-slate-500">Assign the best card for each category.</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {(['groceries', 'gas', 'dining', 'travel', 'wholesale', 'other'] as const).map((cat) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="capitalize text-sm font-semibold">{cat} Card</Label>
                  </div>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={currentWalletIds[cat] || ''}
                    onChange={e => setCurrentWalletIds({...currentWalletIds, [cat]: e.target.value})}
                  >
                    {ALL_CARDS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-slate-500">
            <CardHeader className="pb-2">
              <CardTitle>3. Valuations</CardTitle>
              <p className="text-xs text-slate-500">How much do you value points (in cents)?</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Airline Miles</Label>
                <Input type="number" step="0.001" className="h-8 text-xs" value={valuations.mileValue} onChange={e => setValuations({...valuations, mileValue: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Chase UR</Label>
                <Input type="number" step="0.001" className="h-8 text-xs" value={valuations.urValue} onChange={e => setValuations({...valuations, urValue: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Amex MR</Label>
                <Input type="number" step="0.001" className="h-8 text-xs" value={valuations.mrValue} onChange={e => setValuations({...valuations, mrValue: Number(e.target.value)})} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RESULTS COLUMN */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-2 border-indigo-100 shadow-md">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-xl">Wallet Optimization Results</CardTitle>
              <p className="text-sm text-slate-500">Your total annual yield based on your spend and card assignments.</p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-sm text-green-700 font-medium mb-1">Gross Annual Rewards</p>
                  <p className="text-3xl font-bold text-green-900">{formatCurrency(results.totalYield)}</p>
                </div>
                <div className="p-4 bg-slate-100 rounded-lg text-center">
                  <p className="text-sm text-slate-600 font-medium mb-1">Total Annual Fees</p>
                  <p className="text-3xl font-bold text-slate-800">{formatCurrency(results.totalFees)}</p>
                </div>
              </div>
              
              <div className="p-6 bg-indigo-50 rounded-xl text-center shadow-inner border border-indigo-100">
                <p className="text-sm text-indigo-700 font-bold tracking-wide uppercase mb-2">Net Value</p>
                <p className="text-5xl font-black text-indigo-900 drop-shadow-sm">
                  {formatCurrency(results.netValue)}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-4 border-b pb-2">Yield by Category</h4>
                <div className="space-y-3">
                  {(Object.keys(results.categoryBreakdown) as SpendCategory[]).map(cat => {
                    const data = results.categoryBreakdown[cat];
                    if (data.spend === 0) return null;
                    return (
                      <div key={`res-${cat}`} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded border">
                        <div>
                          <p className="font-medium capitalize text-slate-900">{cat}</p>
                          <p className="text-xs text-slate-500">{data.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-700">{formatCurrency(data.yield)}/yr</p>
                          <p className="text-xs text-slate-400">on {formatCurrency(data.spend)} spend</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
