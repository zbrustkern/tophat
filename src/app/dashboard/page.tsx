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
import { NextDollarRecommendations } from "@/components/NextDollarRecommendations";
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { ArrowRight, TrendingUp, DollarSign, PieChart as PieIcon, Settings as SettingsIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ['#D4AF37', '#C5A059', '#F9E596', '#7D6A33', '#B89745'];

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value}`;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { plans } = usePlans();
  const { settings, updateSettings } = useSettings();
  const { calculateMasterData } = useMasterCalculations();

  const incomePlans = useMemo(() => plans.filter(p => p.planType === 'income'), [plans]);

  const masterData = useMemo(() => {
    if (!settings || !plans.length) return null;
    return calculateMasterData(plans, settings);
  }, [plans, settings, calculateMasterData]);

  const handleScenarioChange = async (incomePlanId: string) => {
    if (!settings) return;
    await updateSettings({
      ...settings,
      activePlans: {
        ...settings.activePlans,
        incomePlanIds: [incomePlanId]
      }
    });
  };

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

  const bottomOfExpenses = grossM - taxesM - expensesM;

  const cashFlowData: any[] = [
    { name: 'Income', value: [0, grossM], fill: '#D4AF37' },
    { name: 'Taxes', value: [grossM - taxesM, grossM], fill: '#7D6A33' },
    { name: 'Expenses', value: [bottomOfExpenses, grossM - taxesM], fill: '#C5A059' },
    { name: 'Savings', value: [Math.max(0, bottomOfExpenses - savingsM), bottomOfExpenses], fill: '#F9E596' }
  ];

  if (surplusM > 0) {
    cashFlowData.push({ name: 'Surplus', value: [0, surplusM], fill: '#B89745' });
  }

  return (
    <main className="max-w-7xl mx-auto space-y-6 bg-deco-pattern min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display uppercase tracking-widest text-deco-gold">Master Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your complete financial picture, aggregated from your active plans.</p>
        </div>
        
        {/* Scenario Tester UI */}
        <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-sm border border-white/10 shadow-sm backdrop-blur-md">
          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Active Scenario:</span>
          <Select 
            value={settings?.activePlans?.incomePlanIds?.[0] || ''} 
            onValueChange={handleScenarioChange}
          >
            <SelectTrigger className="w-[200px] h-8 text-sm">
              <SelectValue placeholder="Select Income Plan" />
            </SelectTrigger>
            <SelectContent>
              {incomePlans.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>{plan.planName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => router.push('/settings')} className="h-8 w-8 text-slate-400 hover:text-slate-600">
            <SettingsIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card onClick={() => router.push('/tactical-allocation')} className="bg-card hover:bg-white/5 border-deco-gold/20 cursor-pointer transition-all">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-deco-gold/10 text-deco-gold rounded-sm border border-deco-gold/30">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-display uppercase tracking-widest text-muted-foreground">Total Net Worth</p>
              <h2 className="text-3xl font-bold text-foreground">${Math.round(totalAssets).toLocaleString()}</h2>
            </div>
          </CardContent>
        </Card>
        
        <Card onClick={() => router.push('/budget')} className="bg-card hover:bg-white/5 border-deco-gold/20 cursor-pointer transition-all">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-deco-gold/10 text-deco-gold rounded-sm border border-deco-gold/30">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-display uppercase tracking-widest text-muted-foreground">Annual Savings Rate</p>
              <h2 className="text-3xl font-bold text-foreground">
                {waterfall.grossIncome > 0 
                  ? Math.round(((waterfall.preTaxSavings + waterfall.postTaxSavings) / waterfall.grossIncome) * 100) 
                  : 0}%
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card onClick={() => router.push('/tactical-allocation')} className="bg-card hover:bg-white/5 border-deco-gold/20 cursor-pointer transition-all">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-deco-gold/10 text-deco-gold rounded-sm border border-deco-gold/30">
              <PieIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-display uppercase tracking-widest text-muted-foreground">Annual Net Cash Flow</p>
              <h2 className="text-3xl font-bold text-foreground">${Math.round(waterfall.netCashFlow).toLocaleString()}</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Option 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Net Worth Trajectory (Spans 2 columns) */}
        <Card onClick={() => router.push('/tactical-allocation')} className="lg:col-span-2 shadow-sm cursor-pointer hover:shadow-md transition-all">
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
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorCol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F9E596" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#F9E596" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="age" tickFormatter={(val) => `Age ${val}`} stroke="#888" fontSize={12} />
                  <YAxis tickFormatter={formatCurrency} stroke="#888" fontSize={12} />
                  <Tooltip 
                    formatter={(value: number) => `$${Math.round(value).toLocaleString()}`}
                    labelFormatter={(label) => `Age ${label}`}
                    contentStyle={{ borderRadius: '0.125rem', border: '1px solid #D4AF37', backgroundColor: '#0A0A0A', color: '#fff' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="savingsBalance" name="Retirement" stackId="1" stroke="#D4AF37" fill="url(#colorSav)" />
                  <Area type="monotone" dataKey="collegeBalance" name="College" stackId="1" stroke="#F9E596" fill="url(#colorCol)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 flex flex-col">
          {/* Current Asset Allocation */}
          <Card onClick={() => router.push('/tactical-allocation')} className="flex-1 shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-all">
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
                    <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
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
          <Card onClick={() => router.push('/budget')} className="flex-1 shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-all">
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
                  
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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

      <div className="mt-8">
        <NextDollarRecommendations netCashFlow={waterfall.netCashFlow} globalSettings={settings} plans={plans} />
      </div>
    </main>
  );
}
