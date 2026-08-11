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
      <div className="m-1 animate-pulse">
        <Card className="bg-white shadow-sm border-none p-6">
          <div className="h-6 w-48 bg-slate-200 rounded mb-6"></div>
          <div className="h-64 w-full bg-slate-100 rounded"></div>
        </Card>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="m-1">
        <Card className="bg-white shadow-sm border-none">
          <CardContent className="p-8 text-center text-slate-500">
            No history recorded yet. Take a snapshot to see your progress!
          </CardContent>
        </Card>
      </div>
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
    <div className="m-1 mt-6">
      <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-none">
        <CardHeader className="pl-6 border-b pb-4 mb-4">
          <CardTitle className="text-xl font-bold text-gray-800">
            Portfolio History & Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="pl-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  tickFormatter={(val) => `$${(val / 1000)}k`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  width={80}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), undefined]}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '8px' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                />
                <Line 
                  type="monotone" 
                  dataKey="Target Value" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Target Trendline"
                />
                <Line 
                  type="monotone" 
                  dataKey="Actual Value" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  activeDot={{ r: 8, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                  name="Actual Value"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
