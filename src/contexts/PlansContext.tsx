'use client'

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Plan } from '@/types/chart';

interface PlansContextType {
  plans: Plan[];
  loading: boolean;
  error: string | null;
  refreshPlans: () => Promise<void>;
}

const PlansContext = createContext<PlansContextType | undefined>(undefined);

export const PlansProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) {
      setPlans([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    
    const q = collection(db, 'users', user.uid, 'plans');
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedPlansPromises = snapshot.docs.map(async docSnapshot => {
        const data = docSnapshot.data();
        // Handle timestamps appropriately
        let lastUpdated = new Date();
        if (data.lastUpdated) {
          if (typeof data.lastUpdated.toDate === 'function') {
            lastUpdated = data.lastUpdated.toDate();
          } else if (typeof data.lastUpdated === 'string' || typeof data.lastUpdated === 'number') {
            lastUpdated = new Date(data.lastUpdated);
          }
        }

        let details = data.details || data.formData;
        
        // Lazy Migration for old Python backend schema
        if ((!details || Object.keys(details).length === 0) && data.planType) {
          try {
            const { getDoc, doc, setDoc } = await import('firebase/firestore');
            const detailsDoc = await getDoc(doc(db!, 'users', user.uid, 'plans', docSnapshot.id, 'details', 'main'));
            if (detailsDoc.exists()) {
              details = detailsDoc.data();
              // Save it to the main document so we don't need to migrate it again
              await setDoc(doc(db!, 'users', user.uid, 'plans', docSnapshot.id), { details }, { merge: true });
            }
          } catch (e) {
            console.error("Failed to migrate plan details for", docSnapshot.id, e);
          }
        }

        return {
          id: docSnapshot.id,
          planName: data.planName || 'Untitled Plan',
          planType: data.planType,
          lastUpdated,
          details: details || {}
        } as Plan;
      });
      
      const fetchedPlans = await Promise.all(fetchedPlansPromises);
      setPlans(fetchedPlans);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error subscribing to plans:", err);
      setError("Failed to load plans from database.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Dummy refresh function since onSnapshot is real-time
  const refreshPlans = async () => {};

  return (
    <PlansContext.Provider value={{ plans, loading, error, refreshPlans }}>
      {children}
    </PlansContext.Provider>
  );
};

export const usePlans = () => {
  const context = useContext(PlansContext);
  if (context === undefined) {
    throw new Error('usePlans must be used within a PlansProvider');
  }
  return context;
};