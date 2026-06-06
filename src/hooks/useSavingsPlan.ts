import { useState, useCallback } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { doc, setDoc, deleteDoc, collection, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { SavingsPlan } from '@/types/chart';
import { usePlans } from '@/contexts/PlansContext';

export function useSavingsPlan(initialPlanId: string | null = null) {
  const { plans, refreshPlans } = usePlans();
  const { user } = useAuth();

  const [plan, setPlan] = useState<SavingsPlan | null>(
    initialPlanId ? plans.find(p => p.id === initialPlanId) as SavingsPlan || null : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPlan = useCallback(async (newPlan: Omit<SavingsPlan, 'id' | 'lastUpdated'>) => {
    if (!user || !db) throw new Error("Must be logged in to create plans");
    setLoading(true);
    setError(null);

    try {
      const docRef = doc(collection(db, 'plans'));
      const planData = {
        planName: newPlan.planName,
        planType: 'savings',
        details: newPlan.details,
        userId: user.uid,
        lastUpdated: new Date()
      };
      
      await setDoc(docRef, planData);
      
      const createdPlan: SavingsPlan = { 
        ...newPlan, 
        id: docRef.id,
        lastUpdated: planData.lastUpdated
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
  }, [user]);

  const updatePlan = useCallback(async (planToUpdate: SavingsPlan) => {
    if (!user || !db) throw new Error("Must be logged in to update plans");
    setLoading(true);
    setError(null);
  
    try {
      const docRef = doc(db, 'plans', planToUpdate.id);
      const planData = {
        planName: planToUpdate.planName,
        planType: planToUpdate.planType,
        details: planToUpdate.details,
        userId: user.uid,
        lastUpdated: new Date()
      };

      await setDoc(docRef, planData, { merge: true });
      
      const updatedPlan = {
        ...planToUpdate,
        lastUpdated: planData.lastUpdated
      };
      setPlan(updatedPlan);
      return updatedPlan;
    } catch (error) {
      console.error("Error updating plan:", error);
      setError("Failed to update plan. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deletePlan = useCallback(async (planId: string) => {
    if (!user || !db) throw new Error("Must be logged in to delete plans");
    setLoading(true);
    setError(null);

    try {
      await deleteDoc(doc(db, 'plans', planId));
      setPlan(null);
    } catch (error) {
      console.error("Error deleting plan:", error);
      setError("Failed to delete plan. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const readPlan = useCallback(async (planId: string) => {
    if (!user || !db) throw new Error("Must be logged in to read plans");
    setLoading(true);
    setError(null);

    try {
      const docSnap = await getDoc(doc(db, 'plans', planId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        const planData: SavingsPlan = {
          id: docSnap.id,
          planName: data.planName,
          planType: data.planType,
          details: data.details,
          lastUpdated: data.lastUpdated?.toDate ? data.lastUpdated.toDate() : new Date()
        };
        setPlan(planData);
        return planData;
      } else {
        throw new Error("Plan not found");
      }
    } catch (error) {
      console.error("Error reading plan:", error);
      setError("Failed to read plan. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

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