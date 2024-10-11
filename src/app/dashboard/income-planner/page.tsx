"use client"

import { useAuth } from '@/contexts/AuthContext';
import { usePlans } from '@/contexts/PlansContext';
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getFunctions, httpsCallable } from 'firebase/functions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IncomePlan } from '@/types/chart';

export default function IncomePlannerPage() {
  const { user } = useAuth();
  const { plans, loading, error, refreshPlans } = usePlans();
  const router = useRouter();
  const [createError, setCreateError] = useState<string | null>(null);

  const incomePlans = plans.filter(plan => plan.planType === 'income') as IncomePlan[];

  const handleCreateNewPlan = async () => {
    try {
      const functions = getFunctions();
      const createPlan = httpsCallable(functions, 'create_plan');
      const result = await createPlan({
        planName: 'New Income Plan',
        planType: 'income',
        details: {
          income: 100000,
          raiseRate: 3,
          saveRate: 20,
          balance: 100000,
          taxRate: 40,
          returnRate: 8,
        }
      });
      const newPlanId = (result.data as any).planId;
      await refreshPlans();  // Refresh the plans in context
      router.push(`/dashboard/income-planner/${newPlanId}`);
    } catch (error) {
      console.error("Error creating new plan:", error);
      setCreateError("Failed to create new plan. Please try again.");
    }
  };

  if (loading) {
    return <div>Loading plans...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Income Planner</h1>
      <Button onClick={handleCreateNewPlan} className="mb-4">Create New Income Plan</Button>
      {createError && <div className="text-red-500 mb-4">{createError}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {incomePlans.map((plan) => (
          <Link key={plan.id} href={`/dashboard/income-planner/${plan.id}`}>
            <Card>
              <CardHeader>
                <CardTitle>{plan.planName}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Last Updated: {new Date(plan.lastUpdated).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}