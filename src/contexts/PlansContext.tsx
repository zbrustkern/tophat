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
    
    // We assume the user creates plans and saves them to 'plans' collection with 'userId'
    const q = query(collection(db, 'plans'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPlans = snapshot.docs.map(doc => {
        const data = doc.data();
        // Handle timestamps appropriately
        let lastUpdated = new Date();
        if (data.lastUpdated) {
          if (typeof data.lastUpdated.toDate === 'function') {
            lastUpdated = data.lastUpdated.toDate();
          } else if (typeof data.lastUpdated === 'string' || typeof data.lastUpdated === 'number') {
            lastUpdated = new Date(data.lastUpdated);
          }
        }

        return {
          id: doc.id,
          planName: data.planName,
          planType: data.planType,
          lastUpdated,
          details: data.details || data.formData || {}
        } as Plan;
      });
      
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