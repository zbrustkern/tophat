"use client"

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from "@/components/ui/button"
import { PlusCircle } from 'lucide-react';
import PlanPreview from '@/components/PlanPreview';
import { useRouter } from 'next/navigation';
import { Plan, PlanType } from '@/types/chart';
import { usePlanManagement } from '@/hooks/usePlanManagement';
import { usePlans } from '@/contexts/PlansContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type FirebaseTimestamp = {
  seconds: number;
  nanoseconds: number;
};

interface APIplan {
  id: string;
  planName: string;
  planType: PlanType;
  formData?: any;
  details?: any;
  lastUpdated: string | FirebaseTimestamp | null;
}

interface APIResponse {
  success: boolean;
  plans: APIplan[];
}

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const { plans, loading, error } = usePlans();
  const { deletePlan } = usePlanManagement<Plan>();

  const handleDelete = async (planId: string) => {
    try {
      await deletePlan(planId);
    } catch (err) {
      console.error('Failed to delete plan:', err);
    }
  };

  // Render the main dashboard layout
  return (
      <main data-version="1.1.3">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Your Financial Plans</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => router.push('/income')}
              className="w-full sm:w-auto justify-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Income Plan
            </Button>
            <Button 
              onClick={() => router.push('/savings')}
              className="w-full sm:w-auto justify-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Savings Plan
            </Button>
            <Button 
              onClick={() => router.push('/college')}
              className="w-full sm:w-auto justify-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New College Plan
            </Button>
            <Button 
              onClick={() => router.push('/tactical-allocation')}
              className="w-full sm:w-auto justify-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Tactical Allocation
            </Button>
            <Button 
              onClick={() => router.push('/budget')}
              className="w-full sm:w-auto justify-center"
              variant="secondary"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Budget Planner
            </Button>
          </div>
        </div>

        {/* Error Card */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Error</CardTitle>
              <CardDescription className="text-red-600">{error}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Loading and Empty States */}
        {loading ? (
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        ) : plans.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Plans Yet</CardTitle>
              <CardDescription>
                Create your first financial plan by clicking one of the buttons above.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="h-full">
                <PlanPreview plan={plan} onDelete={handleDelete} />
              </div>
            ))}
          </div>
        )}
    </main>
  );
}