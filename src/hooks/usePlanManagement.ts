import { useState, useCallback } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { doc, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@/contexts/AuthContext';
import { Plan } from '@/types/chart';

export function usePlanManagement<T extends Plan>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const savePlan = useCallback(async (plan: T): Promise<T> => {
    if (!user || !db) throw new Error("Must be logged in to save plans");
    setLoading(true);
    setError(null);

    try {
      const isNew = plan.id === 'new';
      const docRef = isNew ? doc(collection(db, 'plans')) : doc(db, 'plans', plan.id);
      
      const planData = {
        planName: plan.planName,
        planType: plan.planType,
        details: plan.details,
        userId: user.uid,
        lastUpdated: new Date()
      };

      await setDoc(docRef, planData, { merge: true });
      
      return {
        ...plan,
        id: docRef.id,
        lastUpdated: planData.lastUpdated
      } as T;
    } catch (err) {
      console.error("Save Error: ", err);
      const message = err instanceof Error ? err.message : 'Failed to save plan';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deletePlan = useCallback(async (planId: string): Promise<void> => {
    if (!user || !db) throw new Error("Must be logged in to delete plans");
    setLoading(true);
    setError(null);

    try {
      await deleteDoc(doc(db, 'plans', planId));
    } catch (err) {
      console.error("Delete Error: ", err);
      const message = err instanceof Error ? err.message : 'Failed to delete plan';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const takeSnapshot = useCallback(async (planId: string): Promise<void> => {
    // We keep snapshotting in a cloud function if it handles complex copying logic
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