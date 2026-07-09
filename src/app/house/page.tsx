"use client"

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import HousePlanner from '@/components/HousePlanner';

import { usePlanNavigation } from '@/hooks/usePlanNavigation';

function HouseContent() {
  const { planId, isReady } = usePlanNavigation('house', '/house');
  
  if (!isReady) return <div>Loading...</div>;
  
  return (
    <div className="p-4 md:p-8 space-y-6">
      <HousePlanner planId={planId} />
    </div>
  );
}

export default function HousePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HouseContent />
    </Suspense>
  );
}
