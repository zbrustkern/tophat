"use client"

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import HousePlanner from '@/components/HousePlanner';

function HouseContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  
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
