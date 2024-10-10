"use client"

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from "react"
import { IncomeChart } from "@/components/IncomeChart"
import { SavingsChart } from "@/components/SavingsChart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  planName: string;
  lastUpdated: Date;
  type: 'income' | 'savings';
}

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    if (!user) return;

    const functions = getFunctions();
    const listIncomePlans = httpsCallable(functions, 'list_income_plans');
    const listSavingsPlans = httpsCallable(functions, 'list_savings_plans');

    try {
      const [incomeResult, savingsResult] = await Promise.all([
        listIncomePlans(),
        listSavingsPlans()
      ]);

      const incomePlans = (incomeResult.data as any).plans.map((plan: any) => ({ ...plan, type: 'income' as const }));
      const savingsPlans = (savingsResult.data as any).plans.map((plan: any) => ({ ...plan, type: 'savings' as const }));

      setPlans([...incomePlans, ...savingsPlans]);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handlePlanClick = (plan: Plan) => {
    if (plan.type === 'income') {
      router.push(`/dashboard/income-planner/${plan.id}`);
    } else {
      router.push(`/dashboard/savings-planner/${plan.id}`);
    }
  };

  if (loading) {
    return <div>Loading your plans...</div>;
  }

  return (
    <main className="flex flex-col p-4">
      <h1 className="text-2xl font-bold mb-4">Your Financial Plans</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => handlePlanClick(plan)}>
            <CardHeader>
              <CardTitle>{plan.planName}</CardTitle>
              <CardDescription>{plan.type.charAt(0).toUpperCase() + plan.type.slice(1)} Plan</CardDescription>
            </CardHeader>
            <CardContent>
              {plan.type === 'income' ? (
                <IncomeChart chartData={[]} /> // You'll need to fetch actual data for each plan
              ) : (
                <SavingsChart chartData={[]} /> // You'll need to fetch actual data for each plan
              )}
              <p className="mt-2 text-sm text-gray-500">Last updated: {new Date(plan.lastUpdated).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 flex justify-center space-x-4">
        <Button onClick={() => router.push('/income-planner/new')}>Create New Income Plan</Button>
        <Button onClick={() => router.push('/savings-planner/new')}>Create New Savings Plan</Button>
      </div>
    </main>
  );
}