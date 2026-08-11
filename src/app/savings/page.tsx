"use client"

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SavingsPlanner from '@/components/SavingsPlanner';

import { usePlanNavigation } from '@/hooks/usePlanNavigation';

function SavingsContent() {
  const searchParams = useSearchParams();
  const { planId, isReady } = usePlanNavigation('savings', '/savings');
  
  const balance = searchParams.get('balance') ? Number(searchParams.get('balance')) : undefined;
  const returnRate = searchParams.get('returnRate') ? Number(searchParams.get('returnRate')) : undefined;
  
  if (!isReady) return <div>Loading...</div>;
  
  return <SavingsPlanner planId={planId} initialBalance={balance} initialReturnRate={returnRate} />;
}

export default function SavingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SavingsContent />
    </Suspense>
  );
}