"use client"

import { useMemo } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { usePlans } from "@/contexts/PlansContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useMasterCalculations } from "@/hooks/useMasterCalculations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { ArrowRight, TrendingUp, DollarSign, PieChart as PieIcon } from 'lucide-react';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value}`;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { plans } = usePlans();
  const { settings } = useSettings();
  const { calculateMasterData } = useMasterCalculations();

  const masterData = useMemo(() => {
    if (!settings || !plans.length) return null;
    return calculateMasterData(plans, settings);
  }, [plans, settings, calculateMasterData]);

  if (!settings?.activePlans) {
    return (
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to your Master Dashboard</CardTitle>
            <CardDescription className="text-lg mt-2">
              To view your holistic financial picture, you need to set your &quot;Active Plans&quot; in Global Settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/settings')} size="lg" className="mt-4">
              Configure Global Settings <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!masterData) {
    return <main className="p-8">Loading dashboard...</main>;
  }

  const { waterfall, totalAssets, allocations, trajectory } = masterData;

  const grossM = waterfall.grossIncome / 12;
  const taxesM = waterfall.taxes / 12;
  const expensesM = waterfall.annualCoreBudget / 12;
  const savingsM = (waterfall.preTaxSavings + waterfall.postTaxSavings) / 12;
  const surplusM = waterfall.netCashFlow / 12;

  const cashFlowData: any[] = [
    { name: 'Income', blank: 0, value: grossM, fill: '#10b981' },
    { name: 'Taxes', blank: grossM - taxesM, value: taxesM, fill: '#ef4444' },
    { name: 'Expenses', blank: grossM - taxesM - expensesM, value: expensesM, fill: '#f59e0b' },
    { name: 'Savings', blank: Math.max(0, grossM - taxesM - expensesM - savingsM), value: savingsM, fill: '#0ea5e9' }
  ];

  if (surplusM > 0) {
    cashFlowData.push({ name: 'Surplus', blank: 0, value: surplusM, fill: '#8b5cf6' });
  }

  return (
    <main className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Master Dashboard</h1>
          <p className="text-slate-500 mt-1">Your complete financial picture, aggregated from your active plans.</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-sky-50 to-white border-sky-100 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-sky-100 text-sky-600 rounded-lg">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Liquid Assets</p>
              <h2 className="text-3xl font-bold text-slate-800">${Math.round(totalAssets).toLocaleString()}</h2>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Annual Savings Rate</p>
              <h2 className="text-3xl font-bold text-slate-800">
                {waterfall.grossIncome > 0 
                  ? Math.round(((waterfall.preTaxSavings + waterfall.postTaxSavings) / waterfall.grossIncome) * 100) 
                  : 0}%
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
              <PieIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Annual Net Cash Flow</p>
              <h2 className="text-3xl font-bold text-slate-800">${Math.round(waterfall.netCashFlow).toLocaleString()}</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Option 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Net Worth Trajectory (Spans 2 columns) */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Net Worth Trajectory</CardTitle>
            <CardDescription>Projected growth of your combined asset accounts over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trajectory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSav" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorCol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="age" tickFormatter={(val) => `Age ${val}`} stroke="#64748b" fontSize={12} />
                  <YAxis tickFormatter={formatCurrency} stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    formatter={(value: number) => `$${Math.round(value).toLocaleString()}`}
                    labelFormatter={(label) => `Age ${label}`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="savingsBalance" name="Retirement" stackId="1" stroke="#0ea5e9" fill="url(#colorSav)" />
                  <Area type="monotone" dataKey="collegeBalance" name="College" stackId="1" stroke="#8b5cf6" fill="url(#colorCol)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 flex flex-col">
          {/* Current Asset Allocation */}
          <Card className="flex-1 shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle>Asset Allocation</CardTitle>
              <CardDescription>Current balance distribution.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[250px]">
              {allocations.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocations}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {allocations.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${Math.round(value).toLocaleString()}`} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  No assets tracked yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cash Flow Summary */}
          <Card className="flex-1 shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle>Monthly Cash Flow</CardTitle>
              <CardDescription>Income vs Destinations</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatCurrency} fontSize={12} />
                  <Tooltip formatter={(value: number) => `$${Math.round(value).toLocaleString()}`} cursor={{fill: 'transparent'}} />
                  
                  <Bar dataKey="blank" stackId="a" fill="transparent" />
                  <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]}>
                    {cashFlowData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

      </div>
    </main>
  );
}
