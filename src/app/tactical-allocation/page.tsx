"use client"

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DeploymentDashboard from '@/components/DeploymentDashboard';

import { usePlanNavigation } from '@/hooks/usePlanNavigation';

function TacticalAllocationContent() {
  const { planId, isReady } = usePlanNavigation('rebalance', '/tactical-allocation');
  
  if (!isReady) return <div>Loading...</div>;
  
  return <DeploymentDashboard planId={planId} />;
}

export default function TacticalAllocationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TacticalAllocationContent />
    </Suspense>
  );
}
