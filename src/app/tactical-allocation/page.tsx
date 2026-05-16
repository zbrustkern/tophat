"use client"

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DeploymentDashboard from '@/components/DeploymentDashboard';

function TacticalAllocationContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  return <DeploymentDashboard planId={planId} />;
}

export default function TacticalAllocationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TacticalAllocationContent />
    </Suspense>
  );
}
