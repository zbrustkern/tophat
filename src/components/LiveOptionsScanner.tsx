import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Asset } from '@/types/chart';

interface LiveOptionsScannerProps {
  availableCash: number;
  priorityAsset?: Asset | null;
  priorityGap?: number;
}

interface OptionData {
  contractSymbol: string;
  strike: number;
  lastPrice: number;
  impliedVolatility: number;
  inTheMoney: boolean;
}

interface ExpirationData {
  expiration: string;
  puts: OptionData[];
}

export function LiveOptionsScanner({ availableCash, priorityAsset, priorityGap }: LiveOptionsScannerProps) {
  const [symbol, setSymbol] = useState('SPY');
  const [maxCapitalToDeploy, setMaxCapitalToDeploy] = useState<number>(10000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ currentPrice: number, expirations: ExpirationData[] } | null>(null);

  useEffect(() => {
    if (priorityAsset?.symbol) {
      setSymbol(priorityAsset.symbol.toUpperCase());
    }
  }, [priorityAsset]);

  useEffect(() => {
    if (priorityGap && priorityGap > 0) {
      // Suggest a max capital chunk based on the gap, but don't let it exceed available cash or user preference
      // 10000 is a good default "slug"
      setMaxCapitalToDeploy(Math.floor(Math.min(priorityGap, availableCash, 10000)));
    } else {
      setMaxCapitalToDeploy(Math.floor(Math.min(availableCash, 10000)));
    }
  }, [priorityGap, availableCash]);

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const functions = getFunctions();
      const fetchOptionChain = httpsCallable(functions, 'fetch_option_chain');
      const result = await fetchOptionChain({ symbol: symbol.toUpperCase() });
      const resData = result.data as any;
      if (resData && resData.success) {
        setData({
          currentPrice: resData.currentPrice,
          expirations: resData.expirations
        });
      } else {
        setError(resData?.message || "Failed to fetch options.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Find recommendations based on cash
  let recommendation: { option: OptionData, exp: string } | null = null;
  
  if (data && data.expirations && data.expirations.length > 0) {
    // Look at the closest expiration or 30 DTE if available (we just take the second or third if available, or first)
    // The backend returns the first 3 expirations. Let's just pick the last one (furthest DTE).
    const expData = data.expirations[data.expirations.length - 1];
    
    // Filter options where Strike * 100 <= maxCapitalToDeploy AND Yield > 5%
    const affordablePuts = expData.puts.filter(p => {
      if ((p.strike * 100) > maxCapitalToDeploy) return false;
      const dte = Math.max(1, (new Date(expData.expiration).getTime() - Date.now()) / (1000 * 3600 * 24));
      const annualizedYield = (p.lastPrice / p.strike) * (365 / dte);
      if (annualizedYield < 0.05) return false; // 5% minimum
      return true;
    });
    
    if (affordablePuts.length > 0) {
      // Sort by strike descending to get the one closest to the money that we can afford
      affordablePuts.sort((a, b) => b.strike - a.strike);
      
      // We also want to ensure it's out of the money
      const otmPuts = affordablePuts.filter(p => !p.inTheMoney);
      
      if (otmPuts.length > 0) {
        recommendation = { option: otmPuts[0], exp: expData.expiration };
      } else {
        recommendation = { option: affordablePuts[0], exp: expData.expiration };
      }
    }
  }

  return (
    <Card className="mt-6 border-indigo-200 shadow-sm">
      <CardHeader className="bg-indigo-50 border-b border-indigo-100 rounded-t-xl">
        <CardTitle className="text-lg text-indigo-900 flex items-center gap-2">
          <span>🎯</span> Live Options Scanner
        </CardTitle>
        <p className="text-sm text-indigo-700">Find a Cash-Secured Put that mathematically fits your desired capital deployment chunk while yielding &gt;5% annualized.</p>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-end gap-4">
          <div className="space-y-2 flex-1">
            <Label>Target Ticker</Label>
            <Input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="e.g. SPY, QQQ, ARKK" />
          </div>
          <div className="space-y-2 flex-1">
            <Label>Max Capital to Deploy ($)</Label>
            <Input type="number" value={maxCapitalToDeploy} onChange={e => setMaxCapitalToDeploy(Number(e.target.value))} />
          </div>
          <Button onClick={handleScan} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
            {loading ? "Scanning..." : "Scan Options"}
          </Button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {data && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
            <p className="text-sm text-slate-500 mb-4">Current Price of {symbol.toUpperCase()}: <strong>${data.currentPrice?.toFixed(2)}</strong></p>
            
            {recommendation ? (
              <div className="space-y-2">
                <h4 className="font-bold text-emerald-700">✅ Recommended Trade Found</h4>
                <p className="text-sm">Based on your max capital limit of ${maxCapitalToDeploy.toLocaleString()} and minimum 5% yield, we recommend:</p>
                <div className="bg-white p-4 rounded border shadow-sm my-2 font-mono text-sm">
                  <p><strong>Action:</strong> Sell to Open 1 Contract</p>
                  <p><strong>Symbol:</strong> {recommendation.option.contractSymbol}</p>
                  <p><strong>Expiration:</strong> {recommendation.exp}</p>
                  <p><strong>Strike:</strong> ${recommendation.option.strike.toFixed(2)}</p>
                  <p><strong>Premium (Limit):</strong> ${(recommendation.option.lastPrice).toFixed(2)}</p>
                  <p><strong>Annualized Yield:</strong> {((recommendation.option.lastPrice / recommendation.option.strike) * (365 / Math.max(1, (new Date(recommendation.exp).getTime() - Date.now()) / (1000 * 3600 * 24))) * 100).toFixed(1)}%</p>
                </div>
                <p className="text-sm text-slate-600">
                  This trade strictly caps your risk at <strong>${(recommendation.option.strike * 100).toLocaleString()}</strong> in cash-collateral (well within your ${maxCapitalToDeploy.toLocaleString()} limit), leaving you with ${ (availableCash - (recommendation.option.strike * 100)).toLocaleString() } in reserve. You will instantly collect <strong>${(recommendation.option.lastPrice * 100).toLocaleString()}</strong> in premium.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-amber-800 bg-amber-50 p-4 rounded border border-amber-200">
                <h4 className="font-bold flex items-center gap-2"><span>⚠️</span> No Suitable Trades Found</h4>
                <p className="text-sm">We couldn&apos;t find a Put option for {symbol.toUpperCase()} that fits under your ${maxCapitalToDeploy.toLocaleString()} capital limit while also meeting the &gt;5% annualized yield requirement.</p>
                <p className="text-sm font-medium mt-2">Suggestion: Increase your max capital limit if you want to deploy more, or switch to a lower-priced ETF (like SPLG instead of SPY) and scan again.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
