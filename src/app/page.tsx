"use client"

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from "@/components/ui/button"
import { PlusCircle } from 'lucide-react';
import PlanPreview from '@/components/PlanPreview';
import { useRouter } from 'next/navigation';
import { Plan, PlanType } from '@/types/chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface APIplan {
  id: string;
  planName: string;
  planType: PlanType;
  formData: any;
  lastUpdated: string | null; // Backend now sends ISO string or null
}

interface APIResponse {
  success: boolean;
  plans: APIplan[];
}

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
      if (!user) {
        setPlans([]);
        setLoading(false);
        return;
      }

      try {
        const functions = getFunctions();
        const listPlans = httpsCallable(functions, 'list_plans');
        const result = await listPlans();
        const data = result.data as APIResponse;
        
        if (data.success) {
          const transformedPlans = data.plans.map(apiPlan => {
            let lastUpdated: Date;
            
            // Handle the lastUpdated field with better error checking
            try {
              if (!apiPlan.lastUpdated) {
                // If no lastUpdated provided, use current date
                lastUpdated = new Date();
              } else {
                // Since we're now sending ISO string from backend
                lastUpdated = new Date(apiPlan.lastUpdated);
              }
            } catch (err) {
              console.error('Error parsing date:', err);
              lastUpdated = new Date(); // Fallback to current date if parsing fails
            }
          
            return {
              id: apiPlan.id,
              planName: apiPlan.planName,
              planType: apiPlan.planType,
              lastUpdated,
              details: apiPlan.formData
            } as Plan;
          });
          setPlans(transformedPlans);
        }
      } catch (err) {
        console.error('Error loading plans:', err);
        setError('Failed to load plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, [user]);

  // Rest of the component stays the same...

  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Financial Plans</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/income')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Income Plan
          </Button>
          <Button onClick={() => router.push('/savings')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Savings Plan
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {plans.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Plans Yet</CardTitle>
            <CardDescription>
              Create your first financial plan by clicking one of the buttons above.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <PlanPreview key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </main>
  );
}