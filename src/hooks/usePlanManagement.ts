import { useState, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Plan } from '@/types/chart';

export function usePlanManagement<T extends Plan>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savePlan = useCallback(async (plan: T): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions();
      const saveFn = plan.id === 'new' ? 'create_plan' : 'update_plan';
      const saveFunction = httpsCallable(functions, saveFn);
      
      const result = await saveFunction({
        planId: plan.id === 'new' ? undefined : plan.id,
        planName: plan.planName,
        planType: plan.planType,
        details: plan.details
      });

      const data = result.data as { success: boolean; planId?: string };
      if (!data.success) throw new Error('Failed to save plan');
      
      return {
        ...plan,
        id: data.planId || plan.id,
        lastUpdated: new Date()
      } as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save plan';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePlan = useCallback(async (planId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions();
      const deleteFunction = httpsCallable(functions, 'delete_plan');
      
      const result = await deleteFunction({ planId });
      const data = result.data as { success: boolean };
      
      if (!data.success) throw new Error('Failed to delete plan');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete plan';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const takeSnapshot = useCallback(async (planId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const functions = getFunctions();
      const snapshotFunction = httpsCallable(functions, 'take_snapshot');
      const result = await snapshotFunction({ planId });
      const data = result.data as { success: boolean };
      if (!data.success) throw new Error('Failed to take snapshot');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to take snapshot';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    savePlan,
    deletePlan,
    takeSnapshot
  };
}