import { useState, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { IncomePlan } from '@/types/chart';
import { usePlans } from '@/contexts/PlansContext';

export function useIncomePlan(initialPlanId: string | null = null) {
  const { plans, refreshPlans } = usePlans();
  const [plan, setPlan] = useState<IncomePlan | null>(
    initialPlanId ? plans.find(p => p.id === initialPlanId) as IncomePlan || null : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPlan = useCallback(async (newPlan: Omit<IncomePlan, 'id' | 'lastUpdated'>) => {
    setLoading(true);
    setError(null);

    const functions = getFunctions();
    const createPlanFunction = httpsCallable(functions, 'create_plan');

    try {
      const result = await createPlanFunction({
        planName: newPlan.planName,
        planType: 'income',
        details: newPlan.details
      });
      await refreshPlans();
      const createdPlan: IncomePlan = { 
        ...newPlan, 
        id: (result.data as any).planId,
        lastUpdated: new Date()
      };
      setPlan(createdPlan);
      return createdPlan;
    } catch (error) {
      console.error("Error creating plan:", error);
      setError("Failed to create plan. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [refreshPlans]);

  const updatePlan = useCallback(async (planToUpdate: IncomePlan) => {
    setLoading(true);
    setError(null);

    const functions = getFunctions();
    const updatePlanFunction = httpsCallable(functions, 'update_plan');

    try {
      await updatePlanFunction({
        planId: planToUpdate.id,
        planName: planToUpdate.planName,
        planType: 'income',
        details: planToUpdate.details
      });
      await refreshPlans();
      setPlan(planToUpdate);
    } catch (error) {
      console.error("Error updating plan:", error);
      setError("Failed to update plan. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [refreshPlans]);

  const updatePlanField = useCallback((name: string, value: string | number) => {
    setPlan(prev => {
      if (!prev) return null;
      
      if (name === 'planName') {
        return { ...prev, planName: value as string };
      } else if (name in prev.details) {
        return {
          ...prev,
          details: {
            ...prev.details,
            [name]: typeof prev.details[name as keyof typeof prev.details] === 'number' ? Number(value) : value
          }
        };
      }
      return prev;
    });
  }, []);

  return { plan, loading, error, createPlan, updatePlan, updatePlanField };
}