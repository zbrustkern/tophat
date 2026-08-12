"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { collection, query, orderBy, getDocs } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolioLogic } from '@/hooks/usePortfolioLogic';
import { RebalancePlan } from '@/types/chart';

interface HistoryTrackerProps {
  planId: string;
}

export function HistoryTracker({ planId }: HistoryTrackerProps) {
  const { user } = useAuth();
  const { calculateRebalanceData } = usePortfolioLogic();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!user || !planId || planId === 'new') {
        setLoading(false);
        return;
      }
      
      try {
        if (!db) {
          setLoading(false);
          return;
        }
        const historyRef = collection(db, `users/${user.uid}/plans/${planId}/history`);
        const q = query(historyRef, orderBy('timestamp', 'asc'));
        const snapshot = await getDocs(q);
        
        const chartData = snapshot.docs.map(doc => {
          const docData = doc.data();
          const details = docData.details;
          
          // Create a mock plan to feed into our engine
          const mockPlan: RebalancePlan = {
            id: planId,
            planName: 'History Snapshot',
            planType: 'rebalance',
            lastUpdated: new Date(),
            details: details
          };
          
          const results = calculateRebalanceData(mockPlan);
          
          return {
            date: doc.id,
            "Actual Value": results.computedCash + results.computedEquity,
            "Target Value": results.targetValue,
          };
        });
        
        setData(chartData);
      } catch (e) {
        console.error("Failed to fetch history:", e);
      } finally {
        setLoading(false);
      }
    }
    
    fetchHistory();
  }, [user, planId, calculateRebalanceData]);

  if (loading) {
    return (
      <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/20 p-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded mb-4"></div>
        <div className="h-64 bg-slate-800/50 rounded"></div>
      </Card>
    );
  }

  if (data.length < 2) {
    return (
      <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/20 p-6">
        <h3 className="text-xs font-display uppercase tracking-widest text-deco-gold mb-1">Portfolio History & Performance Tracking</h3>
        <p className="text-xs text-muted-foreground">
          Take daily snapshots or click <strong>Backfill History</strong> above to automatically generate a rich historical chart of your portfolio&apos;s growth.
        </p>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/20 shadow-2xl rounded-sm">
      <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/10 pb-4">
        <div>
          <CardTitle className="text-xl font-display font-semibold uppercase tracking-widest text-deco-gold">
            Historical Performance & Value Trajectory
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                tickFormatter={(val) => `$${(val / 1000)}k`}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                width={80}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), undefined]}
                labelStyle={{ color: '#C5A059', fontWeight: 'bold', marginBottom: '4px' }}
                contentStyle={{ backgroundColor: '#0F172A', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                wrapperStyle={{ color: '#FFFFFF' }}
              />
              <Line 
                type="monotone" 
                dataKey="Actual Value" 
                stroke="#C5A059" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#C5A059' }}
                activeDot={{ r: 7 }}
              />
              <Line 
                type="monotone" 
                dataKey="Target Value" 
                stroke="#38BDF8" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
