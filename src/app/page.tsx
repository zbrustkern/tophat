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

type FirebaseTimestamp = {
  seconds: number;
  nanoseconds: number;
};

interface APIplan {
  id: string;
  planName: string;
  planType: PlanType;
  formData: any;
  lastUpdated: string | FirebaseTimestamp | null;
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

  const parseTimestamp = (timestamp: string | FirebaseTimestamp | null): Date => {
    try {
      if (!timestamp) {
        console.log('No timestamp provided, using current date');
        return new Date();
      }

      if (typeof timestamp === 'string') {
        console.log('Parsing string timestamp:', timestamp);
        return new Date(timestamp);
      }

      if ('seconds' in timestamp) {
        console.log('Converting Firebase timestamp:', timestamp);
        return new Date(timestamp.seconds * 1000);
      }

      console.log('Unknown timestamp format:', timestamp);
      return new Date();
    } catch (err) {
      console.error('Error parsing timestamp:', err);
      return new Date();
    }
  };

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
          const transformedPlans = data.plans.map(apiPlan => ({
            id: apiPlan.id,
            planName: apiPlan.planName,
            planType: apiPlan.planType,
            lastUpdated: parseTimestamp(apiPlan.lastUpdated),
            details: apiPlan.formData
          } as Plan));

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

  return (
      <main>
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
          // Responsive grid with proper spacing
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="h-full">
                <PlanPreview plan={plan} />
              </div>
            ))}
          </div>
        )}
    </main>
  );
}