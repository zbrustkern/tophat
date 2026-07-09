"use client"

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CollegePlanner from '@/components/CollegePlanner';

import { usePlanNavigation } from '@/hooks/usePlanNavigation';

function CollegeContent() {
  const { planId, isReady } = usePlanNavigation('college', '/college');
  
  if (!isReady) return <div>Loading...</div>;
  
  return <CollegePlanner planId={planId} />;
}

export default function CollegePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CollegeContent />
    </Suspense>
  );
}