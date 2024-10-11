"use client"

import { usePlans } from '@/contexts/PlansContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link';
import { PlanType } from '@/types/chart';

const PLAN_TYPES: PlanType[] = ['income', 'savings'];

const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  income: 'Income',
  savings: 'Savings',
  house: 'House',
  car: 'Car',
  college: 'College',
  debt: 'Debt'
};

export default function Dashboard() {
  const { plans, loading, error } = usePlans();

  if (loading) {
    return <div>Loading plans...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Financial Plans</h1>
      <div className="mb-4 flex space-x-2">
        {PLAN_TYPES.map((planType) => (
          <Link key={planType} href={`/dashboard/${planType}-planner/new`}>
            <Button>Create New {PLAN_TYPE_LABELS[planType]} Plan</Button>
          </Link>
        ))}
      </div>
      {PLAN_TYPES.map((planType) => (
        <div key={planType}>
          <h2 className="text-xl font-semibold mt-6 mb-2">{PLAN_TYPE_LABELS[planType]} Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans
              .filter((plan) => plan.planType === planType)
              .map((plan) => (
                <Link key={plan.id} href={`/dashboard/${plan.planType}-planner/${plan.id}`}>
                  <Card>
                    <CardHeader>
                      <CardTitle>{plan.planName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Type: {PLAN_TYPE_LABELS[plan.planType]}</p>
                      <p>Last Updated: {new Date(plan.lastUpdated).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      ))}
    </main>
  );
}