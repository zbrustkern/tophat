import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePlans } from '@/contexts/PlansContext';

/**
 * Hook to manage routing for planner pages.
 * Defaults to the first saved plan of the specified type if no planId is in the URL.
 * Redirects to ?plan=new if there are no saved plans of that type.
 * @param planType The type of plan (e.g. 'savings', 'income', 'college', etc.)
 * @param basePath The base route path (e.g. '/savings', '/tactical-allocation')
 * @returns The resolved plan ID, or null if creating a new plan or still loading.
 */
export function usePlanNavigation(planType: string, basePath: string) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { plans, loading } = usePlans();
  
  const rawPlanId = searchParams.get('plan');
  const [resolvedPlanId, setResolvedPlanId] = useState<string | null>(rawPlanId === 'new' ? null : rawPlanId);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!rawPlanId) {
      // Find all plans of the requested type
      const typePlans = plans.filter(p => p.planType === planType);
      
      if (typePlans.length > 0) {
        // Auto-select the first plan
        router.replace(`${basePath}?plan=${typePlans[0].id}`);
      } else {
        // No plans exist, route to new plan state
        router.replace(`${basePath}?plan=new`);
      }
    } else {
      setResolvedPlanId(rawPlanId === 'new' ? null : rawPlanId);
      setIsReady(true);
    }
  }, [loading, rawPlanId, plans, router, planType, basePath]);

  return { planId: resolvedPlanId, isReady };
}
