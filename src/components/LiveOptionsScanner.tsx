import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFunctions, httpsCallable } from 'firebase/functions';

interface LiveOptionsScannerProps {
  availableCash: number;
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

export function LiveOptionsScanner({ availableCash }: LiveOptionsScannerProps) {
  const [symbol, setSymbol] = useState('SPY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ currentPrice: number, expirations: ExpirationData[] } | null>(null);

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
    
    // Filter options where Strike * 100 <= Available Cash
    const affordablePuts = expData.puts.filter(p => (p.strike * 100) <= availableCash);
    
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
        <p className="text-sm text-indigo-700">Find a Cash-Secured Put that strictly fits your ${availableCash.toLocaleString()} capital constraint.</p>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-end gap-4">
          <div className="space-y-2 flex-1">
            <Label>Underlying Ticker</Label>
            <Input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="e.g. SPY, QQQ, SPLG" />
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
                <p className="text-sm">Based on your absolute cash constraint of ${availableCash.toLocaleString()}, we recommend:</p>
                <div className="bg-white p-4 rounded border shadow-sm my-2 font-mono text-sm">
                  <p><strong>Action:</strong> Sell to Open 1 Contract</p>
                  <p><strong>Symbol:</strong> {recommendation.option.contractSymbol}</p>
                  <p><strong>Expiration:</strong> {recommendation.exp}</p>
                  <p><strong>Strike:</strong> ${recommendation.option.strike.toFixed(2)}</p>
                  <p><strong>Premium (Limit):</strong> ${(recommendation.option.lastPrice).toFixed(2)}</p>
                </div>
                <p className="text-sm text-slate-600">
                  This trade strictly caps your risk at <strong>${(recommendation.option.strike * 100).toLocaleString()}</strong> in cash-collateral, leaving you with ${ (availableCash - (recommendation.option.strike * 100)).toLocaleString() } in reserve. You will instantly collect <strong>${(recommendation.option.lastPrice * 100).toLocaleString()}</strong> in premium.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-amber-800 bg-amber-50 p-4 rounded border border-amber-200">
                <h4 className="font-bold flex items-center gap-2"><span>⚠️</span> Capital Constraint Exceeded</h4>
                <p className="text-sm">You only have ${availableCash.toLocaleString()} in cash. The lowest available strike for {symbol.toUpperCase()} requires more capital than you have, breaking risk parity rules.</p>
                <p className="text-sm font-medium mt-2">Suggestion: Switch to a lower-priced ETF like SPLG (for S&P 500) or QQQM (for Nasdaq) and scan again.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
