"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useWalletCalculations } from '@/hooks/useWalletCalculations';
import { useAirlineOptimization } from '@/hooks/useAirlineOptimization';
import { MonthlySpend, Valuations, CreditCard, SpendCategory, CARD_DATABASE, AIRLINE_TIERS } from '@/types/optimization';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function AirlineStatusPage() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // Wallet state (inherited)
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

  const [currentWalletIds, setCurrentWalletIds] = useState<Record<SpendCategory, string>>({
    groceries: 'amex-bcp',
    gas: 'amex-bcp',
    dining: 'chase-sapphire-reserve',
    travel: 'chase-sapphire-reserve',
    wholesale: 'citi-costco-visa',
    other: 'citi-double-cash'
  });

  // Airline Status Specific State
  const [targetAirline, setTargetAirline] = useState<'united' | 'american'>('united');
  const [targetCardId, setTargetCardId] = useState<string>('united-club-infinite');
  const [targetTierReq, setTargetTierReq] = useState<number>(8000); // Default to United Gold
  const [organicStatus, setOrganicStatus] = useState({ united: 3000, american: 0 });

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
        console.error("Failed to load profile:", e);
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
        targetCardId,
        targetTierReq,
        targetAirline,
        organicStatus
      }, { merge: true });
    } catch (e) {
      console.error("Failed to save profile:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const { calculateWallet } = useWalletCalculations(spend, valuations, currentWalletIds, customCards);
  const walletResult = calculateWallet();

  const { calculateAirline } = useAirlineOptimization(
    spend,
    valuations,
    organicStatus,
    targetAirline,
    targetTierReq,
    walletResult,
    targetCardId,
    customCards
  );

  const results = calculateAirline();
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8 mt-16 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Airline Status Optimizer</h1>
          <p className="text-slate-500 mt-2 text-lg">Calculate the true opportunity cost of chasing status.</p>
        </div>
        {user && (
          <Button onClick={saveProfile} disabled={isSaving || !hasLoaded} className="bg-slate-900 text-white shrink-0">
            {isSaving ? "Saving..." : "Save Airline Targets"}
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* INPUTS COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-t-4 border-t-purple-500">
            <CardHeader className="pb-2">
              <CardTitle>The Goal</CardTitle>
              <p className="text-xs text-slate-500">What airline status are you trying to hit?</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Target Airline</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={targetAirline === 'united' ? 'default' : 'outline'}
                    onClick={() => {
                      setTargetAirline('united');
                      setTargetCardId('united-club-infinite');
                      setTargetTierReq(8000);
                    }}
                    className="flex-1"
                  >United</Button>
                  <Button 
                    variant={targetAirline === 'american' ? 'default' : 'outline'}
                    onClick={() => {
                      setTargetAirline('american');
                      setTargetCardId('citi-aa-exec');
                      setTargetTierReq(75000);
                    }}
                    className="flex-1"
                  >American</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target Tier</Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={targetTierReq}
                  onChange={e => setTargetTierReq(Number(e.target.value))}
                >
                  {AIRLINE_TIERS[targetAirline].map(t => (
                    <option key={t.name} value={t.req}>{t.name} ({targetAirline === 'united' ? t.req + ' PQP' : t.req.toLocaleString() + ' LP'})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Expected Organic {targetAirline === 'united' ? 'PQP' : 'LP'} from flying</Label>
                  <span className="text-xs text-slate-400">Exclude card spend</span>
                </div>
                <Input 
                  type="number" 
                  value={organicStatus[targetAirline]} 
                  onChange={e => setOrganicStatus({...organicStatus, [targetAirline]: Number(e.target.value)})} 
                />
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label>Co-Branded Card to Evaluate</Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={targetCardId}
                  onChange={e => setTargetCardId(e.target.value)}
                >
                  {ALL_CARDS.filter(c => c.statusRules.airline === targetAirline).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-t-4 border-t-slate-500 bg-slate-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Wallet Data Imported</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 mb-4">
                This tool uses your saved spend and card valuations from your Wallet to calculate the opportunity cost.
              </p>
              <Link href="/wallet" className="text-sm text-blue-600 hover:underline">
                → Edit Wallet Profile
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* RESULTS COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-2 shadow-md">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-xl">Opportunity Cost Analysis</CardTitle>
              <p className="text-sm text-slate-500">The true cost of forcing spend onto the co-branded card to hit status.</p>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              
              {/* Top Level Summary */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 rounded-xl border">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Current Trajectory</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-2xl font-bold">{results.baselineTier || 'No Status'}</p>
                      <p className="text-sm text-slate-500">{results.baselinePoints.toLocaleString()} {targetAirline === 'united' ? 'PQP' : 'LP'}</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-green-700">{formatCurrency(results.baselineYield)}</p>
                      <p className="text-sm text-slate-500">Wallet Yield</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-purple-50 rounded-xl border border-purple-100">
                  <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wider mb-4">Optimized For Status</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-2xl font-bold text-purple-900">{results.newTier || 'No Status'}</p>
                      <p className="text-sm text-purple-600">{results.newPoints.toLocaleString()} {targetAirline === 'united' ? 'PQP' : 'LP'}</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-700">{formatCurrency(results.newYield)}</p>
                      <p className="text-sm text-purple-600">Sacrificed Yield</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* The Bottom Line */}
              <div className="p-6 rounded-xl text-center border-2 border-red-100 bg-red-50/50 shadow-inner">
                <p className="text-sm text-red-800 font-bold tracking-wide uppercase mb-2">The Opportunity Cost</p>
                <div className="flex flex-col items-center justify-center">
                  <p className="text-5xl font-black text-red-600">
                    {formatCurrency(results.opportunityCost)}
                  </p>
                  <p className="text-sm text-red-800 mt-2 max-w-md">
                    You would lose {formatCurrency(results.opportunityCost)} in rewards value by forcing spend onto the {targetAirline} card.
                  </p>
                </div>
              </div>

              {/* Action Plan */}
              {results.shifts.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-4 border-b pb-2">Required Spend Shifts</h4>
                  <div className="space-y-3">
                    {results.shifts.map(shift => (
                      <div key={shift.category} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded border">
                        <div>
                          <p className="font-medium capitalize text-slate-900">Shift {shift.category} Spend</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-700">{formatCurrency(shift.amountShifted)}</p>
                          <p className="text-xs text-slate-500">to Co-Branded Card</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
