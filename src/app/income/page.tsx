"use client"

import { Suspense } from 'react';
import IncomePlanner from '@/components/IncomePlanner';
import { usePlanNavigation } from '@/hooks/usePlanNavigation';

function IncomeContent() {
  const { planId, isReady } = usePlanNavigation('income', '/income');
  
  if (!isReady) return <div>Loading...</div>;
  
  return <IncomePlanner planId={planId} />;
}

export default function IncomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IncomeContent />
    </Suspense>
  );
}