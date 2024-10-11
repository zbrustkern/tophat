import { useState, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { SavingsPlan } from '@/types/chart';
import { usePlans } from '@/contexts/PlansContext';

export function useSavingsPlan(initialPlanId: string | null = null) {
  const { plans, refreshPlans } = usePlans();
  const [plan, setPlan] = useState<SavingsPlan | null>(
    initialPlanId ? plans.find(p => p.id === initialPlanId) as SavingsPlan || null : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPlan = useCallback(async (newPlan: Omit<SavingsPlan, 'id' | 'lastUpdated'>) => {
    setLoading(true);
    setError(null);

    const functions = getFunctions();
    const createPlanFunction = httpsCallable(functions, 'create_plan');

    try {
      const result = await createPlanFunction({
        planName: newPlan.planName,
        planType: 'savings',
        details: newPlan.details
      });
      await refreshPlans();
      const createdPlan: SavingsPlan = { 
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

  
const updatePlan = useCallback(async (planToUpdate: SavingsPlan) => {
    setLoading(true);
    setError(null);
  
    const functions = getFunctions();
    const updatePlanFunction = httpsCallable(functions, 'update_plan');
  
    try {
      await updatePlanFunction({
        planId: planToUpdate.id,
        planName: planToUpdate.planName,
        planType: planToUpdate.planType,
        details: planToUpdate.details
      });
      await refreshPlans();
      setPlan(planToUpdate);
      return planToUpdate;  // Explicitly return the updated plan
    } catch (error) {
      console.error("Error updating plan:", error);
      setError("Failed to update plan. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [refreshPlans]);

  const deletePlan = useCallback(async (planId: string) => {
    setLoading(true);
    setError(null);

    const functions = getFunctions();
    const deletePlanFunction = httpsCallable(functions, 'delete_plan');

    try {
      await deletePlanFunction({ planId });
      await refreshPlans();
      setPlan(null);
    } catch (error) {
      console.error("Error deleting plan:", error);
      setError("Failed to delete plan. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [refreshPlans]);

  const readPlan = useCallback(async (planId: string) => {
    setLoading(true);
    setError(null);

    const functions = getFunctions();
    const readPlanFunction = httpsCallable(functions, 'read_plan');

    try {
      const result = await readPlanFunction({ planId });
      const planData = (result.data as any).plan as SavingsPlan;
      setPlan(planData);
      return planData;
    } catch (error) {
      console.error("Error reading plan:", error);
      setError("Failed to read plan. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

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

  return { plan, loading, error, createPlan, updatePlan, deletePlan, readPlan, updatePlanField };
}